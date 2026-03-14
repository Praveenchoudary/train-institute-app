const router = require('express').Router();
const { query }        = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// GET /api/students  (admin)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    let where = `WHERE u.role='student'`;
    if (search) {
      params.push(`%${search}%`);
      where += ` AND (u.first_name ILIKE $1 OR u.last_name ILIKE $1 OR u.email ILIKE $1 OR s.enrollment_number ILIKE $1)`;
    }
    params.push(parseInt(limit), offset);
    const { rows } = await query(`
      SELECT u.id,u.first_name,u.last_name,u.email,u.phone,u.is_active,u.created_at,
             s.id AS student_id,s.enrollment_number,s.date_of_birth,
             COUNT(DISTINCT e.id)::int AS courses_enrolled
      FROM users u
      JOIN students s ON s.user_id=u.id
      LEFT JOIN enrollments e ON e.student_id=s.id AND e.status='active'
      ${where}
      GROUP BY u.id,s.id
      ORDER BY u.created_at DESC
      LIMIT $${params.length-1} OFFSET $${params.length}
    `, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/students/:id  (admin)
router.get('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT u.id,u.first_name,u.last_name,u.email,u.phone,u.is_active,
             s.enrollment_number,s.date_of_birth,
             json_agg(json_build_object('course_id',c.id,'title',c.title,'status',e.status,'grade',e.grade)) AS enrollments
      FROM users u
      JOIN students s ON s.user_id=u.id
      LEFT JOIN enrollments e ON e.student_id=s.id
      LEFT JOIN courses c     ON c.id=e.course_id
      WHERE u.id=$1
      GROUP BY u.id,s.id
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Student not found.' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/students/profile  (authenticated student)
router.put('/profile', authenticate, async (req, res) => {
  const { firstName, lastName, phone, dateOfBirth } = req.body;
  try {
    await query(`UPDATE users SET first_name=$1,last_name=$2,phone=$3,updated_at=NOW() WHERE id=$4`,
      [firstName, lastName, phone, req.user.id]);
    if (dateOfBirth)
      await query(`UPDATE students SET date_of_birth=$1 WHERE user_id=$2`, [dateOfBirth, req.user.id]);
    res.json({ message: 'Profile updated.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

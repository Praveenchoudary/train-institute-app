const router = require('express').Router();
const { query }        = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// GET /api/admin/dashboard
router.get('/dashboard', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [students, courses, enrollments, revenue] = await Promise.all([
      query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER(WHERE is_active)::int AS active FROM users WHERE role='student'`),
      query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER(WHERE is_active)::int AS active FROM courses`),
      query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER(WHERE status='active')::int AS active FROM enrollments`),
      query(`SELECT COALESCE(SUM(c.price),0)::numeric AS total FROM enrollments e JOIN courses c ON c.id=e.course_id WHERE e.status!='cancelled'`),
    ]);
    const recent = await query(`
      SELECT u.first_name,u.last_name,c.title AS course_title,e.enrolled_at
      FROM enrollments e
      JOIN students s ON s.id=e.student_id JOIN users u ON u.id=s.user_id
      JOIN courses c  ON c.id=e.course_id
      ORDER BY e.enrolled_at DESC LIMIT 10
    `);
    const popular = await query(`
      SELECT c.id,c.title,c.max_students,COUNT(e.id)::int AS enrollment_count
      FROM courses c
      LEFT JOIN enrollments e ON e.course_id=c.id AND e.status='active'
      WHERE c.is_active=true
      GROUP BY c.id ORDER BY enrollment_count DESC LIMIT 5
    `);
    res.json({
      stats: { students: students.rows[0], courses: courses.rows[0],
               enrollments: enrollments.rows[0], revenue: revenue.rows[0] },
      recentEnrollments: recent.rows,
      popularCourses:    popular.rows,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/admin/users/:id/toggle
router.put('/users/:id/toggle', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { rows } = await query(
      `UPDATE users SET is_active=NOT is_active,updated_at=NOW() WHERE id=$1 RETURNING id,email,is_active`,
      [req.params.id]
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/admin/enrollments/:id/grade
router.put('/enrollments/:id/grade', authenticate, authorize('admin', 'instructor'), async (req, res) => {
  try {
    const { rows } = await query(
      `UPDATE enrollments SET grade=$1,status='completed',updated_at=NOW() WHERE id=$2 RETURNING *`,
      [req.body.grade, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

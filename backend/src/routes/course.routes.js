const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { query }        = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// GET /api/courses  (public — no auth needed)
router.get('/', async (req, res) => {
  try {
    const { search, level, page = 1, limit = 12 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    let where = 'WHERE c.is_active = true';

    if (search) {
      params.push(`%${search}%`);
      where += ` AND (c.title ILIKE $${params.length} OR c.description ILIKE $${params.length})`;
    }
    if (level && level !== 'All') {
      params.push(level);
      where += ` AND c.level = $${params.length}`;
    }

    const countRes = await query(`SELECT COUNT(*) FROM courses c ${where}`, params);
    const total    = parseInt(countRes.rows[0].count);

    params.push(parseInt(limit), offset);
    const { rows } = await query(`
      SELECT c.id, c.title, c.description, c.price, c.max_students, c.level,
             c.start_date, c.end_date, c.duration_hours, c.thumbnail_url,
             cat.name AS category_name,
             u.first_name||' '||u.last_name AS instructor_name,
             COUNT(DISTINCT e.id)::int AS enrolled_count
      FROM courses c
      LEFT JOIN categories cat ON cat.id = c.category_id
      LEFT JOIN users u        ON u.id   = c.instructor_id
      LEFT JOIN enrollments e  ON e.course_id = c.id AND e.status = 'active'
      ${where}
      GROUP BY c.id, cat.name, u.first_name, u.last_name
      ORDER BY c.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    res.json({ courses: rows, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/courses/:id  (public)
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT c.*, cat.name AS category_name,
             u.first_name||' '||u.last_name AS instructor_name,
             COUNT(DISTINCT e.id)::int AS enrolled_count
      FROM courses c
      LEFT JOIN categories cat ON cat.id = c.category_id
      LEFT JOIN users u        ON u.id   = c.instructor_id
      LEFT JOIN enrollments e  ON e.course_id = c.id AND e.status='active'
      WHERE c.id=$1
      GROUP BY c.id, cat.name, u.first_name, u.last_name
    `, [req.params.id]);

    if (!rows.length) return res.status(404).json({ error: 'Course not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/courses  (admin only)
router.post('/', authenticate, authorize('admin', 'instructor'), [
  body('title').trim().notEmpty(),
  body('description').trim().notEmpty(),
  body('price').isFloat({ min: 0 }),
  body('maxStudents').isInt({ min: 1 }),
  body('startDate').isISO8601(),
  body('endDate').isISO8601(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, description, price, maxStudents, startDate, endDate,
          categoryId, duration, level, syllabus, prerequisites } = req.body;
  try {
    const { rows } = await query(`
      INSERT INTO courses(title,description,price,max_students,start_date,end_date,
                          category_id,instructor_id,duration_hours,level,syllabus,prerequisites)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *
    `, [title, description, price, maxStudents, startDate, endDate,
        categoryId || null, req.user.id, duration || null,
        level || 'beginner', syllabus || null, prerequisites || null]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/courses/:id  (admin only)
router.put('/:id', authenticate, authorize('admin', 'instructor'), async (req, res) => {
  const { title, description, price, maxStudents, startDate, endDate,
          level, duration, isActive, syllabus, prerequisites } = req.body;
  try {
    const { rows } = await query(`
      UPDATE courses SET title=$1,description=$2,price=$3,max_students=$4,
        start_date=$5,end_date=$6,level=$7,duration_hours=$8,is_active=$9,
        syllabus=$10,prerequisites=$11,updated_at=NOW()
      WHERE id=$12 RETURNING *
    `, [title, description, price, maxStudents, startDate, endDate,
        level, duration, isActive ?? true, syllabus, prerequisites, req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Course not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/courses/:id  (admin only — soft delete)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    await query('UPDATE courses SET is_active=false WHERE id=$1', [req.params.id]);
    res.json({ message: 'Course deactivated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/courses/:id/students  (admin/instructor)
router.get('/:id/students', authenticate, authorize('admin', 'instructor'), async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT u.first_name,u.last_name,u.email,s.enrollment_number,
             e.enrolled_at,e.status,e.grade,e.progress
      FROM enrollments e
      JOIN students s ON s.id=e.student_id
      JOIN users u    ON u.id=s.user_id
      WHERE e.course_id=$1
      ORDER BY e.enrolled_at DESC
    `, [req.params.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

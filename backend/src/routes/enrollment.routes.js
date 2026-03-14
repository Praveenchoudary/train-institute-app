// enrollment.routes.js
const router = require('express').Router();
const { query }        = require('../config/database');
const { authenticate } = require('../middleware/auth.middleware');

// POST /api/enrollments
router.post('/', authenticate, async (req, res) => {
  const { courseId } = req.body;
  try {
    const sRes = await query('SELECT id FROM students WHERE user_id=$1', [req.user.id]);
    if (!sRes.rows.length) return res.status(404).json({ error: 'Student profile not found.' });
    const studentId = sRes.rows[0].id;

    const cRes = await query(`
      SELECT c.*, COUNT(e.id)::int AS enrolled_count
      FROM courses c
      LEFT JOIN enrollments e ON e.course_id=c.id AND e.status='active'
      WHERE c.id=$1 GROUP BY c.id
    `, [courseId]);
    const course = cRes.rows[0];
    if (!course)           return res.status(404).json({ error: 'Course not found.' });
    if (!course.is_active) return res.status(400).json({ error: 'Course is not available.' });
    if (course.enrolled_count >= course.max_students)
      return res.status(400).json({ error: 'Course is full.' });

    const dup = await query('SELECT id FROM enrollments WHERE student_id=$1 AND course_id=$2', [studentId, courseId]);
    if (dup.rows.length) return res.status(409).json({ error: 'Already enrolled.' });

    const { rows } = await query(
      `INSERT INTO enrollments(student_id,course_id,status) VALUES($1,$2,'active') RETURNING *`,
      [studentId, courseId]
    );
    res.status(201).json({ message: 'Enrolled!', enrollment: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/enrollments/my
router.get('/my', authenticate, async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT e.id,e.status,e.enrolled_at,e.grade,e.progress,
             c.id AS course_id,c.title,c.description,c.start_date,c.end_date,
             c.duration_hours,c.level,
             cat.name AS category,
             u.first_name||' '||u.last_name AS instructor_name
      FROM enrollments e
      JOIN courses c     ON c.id=e.course_id
      LEFT JOIN categories cat ON cat.id=c.category_id
      LEFT JOIN users u        ON u.id=c.instructor_id
      JOIN students s    ON s.id=e.student_id
      WHERE s.user_id=$1
      ORDER BY e.enrolled_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/enrollments/:id/progress
router.put('/:id/progress', authenticate, async (req, res) => {
  const progress = Math.min(100, Math.max(0, parseInt(req.body.progress) || 0));
  try {
    const { rows } = await query(`
      UPDATE enrollments SET progress=$1,updated_at=NOW()
      WHERE id=$2 AND student_id=(SELECT id FROM students WHERE user_id=$3)
      RETURNING *
    `, [progress, req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Enrollment not found.' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/enrollments/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await query(`
      UPDATE enrollments SET status='cancelled',updated_at=NOW()
      WHERE id=$1 AND student_id=(SELECT id FROM students WHERE user_id=$2)
    `, [req.params.id, req.user.id]);
    res.json({ message: 'Unenrolled.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

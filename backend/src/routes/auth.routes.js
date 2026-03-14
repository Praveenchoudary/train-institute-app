const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query }       = require('../config/database');
const { authenticate } = require('../middleware/auth.middleware');

const issueToken = (userId, role) =>
  jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/auth/register
router.post('/register', [
  body('firstName').trim().notEmpty().withMessage('First name required'),
  body('lastName').trim().notEmpty().withMessage('Last name required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password min 8 chars'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { firstName, lastName, email, password, phone } = req.body;
  try {
    const exists = await query('SELECT id FROM users WHERE email=$1', [email]);
    if (exists.rows.length) return res.status(409).json({ error: 'Email already registered.' });

    const hash = await bcrypt.hash(password, 12);
    const u    = await query(
      `INSERT INTO users(first_name,last_name,email,password_hash,phone,role)
       VALUES($1,$2,$3,$4,$5,'student') RETURNING id,email,role,first_name,last_name`,
      [firstName, lastName, email, hash, phone || null]
    );
    const user = u.rows[0];

    // create student profile row
    await query('INSERT INTO students(user_id) VALUES($1)', [user.id]);

    const token = issueToken(user.id, user.role);
    res.status(201).json({ token, user: { id: user.id, email, role: user.role, firstName: user.first_name, lastName: user.last_name } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  try {
    const { rows } = await query(
      'SELECT id,email,password_hash,role,is_active,first_name,last_name FROM users WHERE email=$1',
      [email]
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ error: 'Invalid email or password.' });
    if (!user.is_active)
      return res.status(403).json({ error: 'Account deactivated.' });

    const token = issueToken(user.id, user.role);
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, firstName: user.first_name, lastName: user.last_name } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT u.id,u.first_name,u.last_name,u.email,u.phone,u.role,u.created_at,
              s.id AS student_id, s.enrollment_number
       FROM users u LEFT JOIN students s ON s.user_id=u.id WHERE u.id=$1`,
      [req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/change-password
router.post('/change-password', authenticate, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }),
], async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const { rows } = await query('SELECT password_hash FROM users WHERE id=$1', [req.user.id]);
    if (!(await bcrypt.compare(currentPassword, rows[0].password_hash)))
      return res.status(401).json({ error: 'Current password incorrect.' });
    const hash = await bcrypt.hash(newPassword, 12);
    await query('UPDATE users SET password_hash=$1,updated_at=NOW() WHERE id=$2', [hash, req.user.id]);
    res.json({ message: 'Password updated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

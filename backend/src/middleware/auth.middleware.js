// ══════════════════════════════════════════════════════════════════
//  auth.middleware.js
//
//  authenticate  — verifies JWT, attaches req.user
//  authorize     — checks req.user.role against allowed roles
// ══════════════════════════════════════════════════════════════════

const jwt    = require('jsonwebtoken');
const { query } = require('../config/database');

const authenticate = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer '))
    return res.status(401).json({ error: 'No token provided.' });

  try {
    const token   = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { rows } = await query(
      'SELECT id, email, role, first_name, last_name, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );
    if (!rows.length || !rows[0].is_active)
      return res.status(401).json({ error: 'Token invalid or user inactive.' });

    req.user = rows[0];
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ error: 'Insufficient permissions.' });
  next();
};

module.exports = { authenticate, authorize };

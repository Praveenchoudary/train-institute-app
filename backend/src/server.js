// ══════════════════════════════════════════════════════════════════
//  server.js — Express Application Entry Point
//
//  Responsibilities:
//  1. Register all middleware (security, logging, parsing)
//  2. Mount all route modules under /api/*
//  3. Global error handler
//  4. Connect to DB then start HTTP listener
// ══════════════════════════════════════════════════════════════════

require('dotenv').config();
const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');

const { connectDB }        = require('./config/database');
const { runMigrations }    = require('./config/migrate');
const logger               = require('./config/logger');
const authRoutes           = require('./routes/auth.routes');
const courseRoutes         = require('./routes/course.routes');
const enrollmentRoutes     = require('./routes/enrollment.routes');
const studentRoutes        = require('./routes/student.routes');
const adminRoutes          = require('./routes/admin.routes');
const paymentRoutes        = require('./routes/payment.routes');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Trust proxy ────────────────────────────────────────────────────
// REQUIRED: Express sits behind nginx reverse proxy.
// "1" means trust the first proxy hop (the nginx container).
// This fixes X-Forwarded-For header validation for express-rate-limit.
app.set('trust proxy', 1);

// ── Security Middleware ────────────────────────────────────────────
// helmet: sets secure HTTP headers (XSS, clickjacking, sniffing, etc.)
app.use(helmet());

// cors: only allow requests from the frontend URL
app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost',
  credentials: true,
}));

// rate limiter: 100 requests per IP per 15 minutes
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  message: { error: 'Too many requests — try again in 15 minutes.' },
}));

// ── Request Parsing ────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: m => logger.info(m.trim()) } }));

// ── Health Check (used by nginx + docker healthcheck) ─────────────
app.get('/health', (_, res) =>
  res.json({
    status:  'ok',
    service: 'hyderabad-edutech-api',
    uptime:  Math.round(process.uptime()),
    memory:  process.memoryUsage(),
    env:     process.env.NODE_ENV,
    gateway: process.env.PAYMENT_GATEWAY || 'dummy',
  })
);

// ── In-browser Log Viewer ──────────────────────────────────────────
// Access at: http://localhost/api/logs
// Shows the 200 most recent request logs in a terminal-style page.
// ADMIN ONLY in production — protected by a simple token check.
const logBuffer = [];
const MAX_LOG_ENTRIES = 200;

// Tap into morgan output to capture logs in memory
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms     = Date.now() - start;
    const status = res.statusCode;
    const color  = status >= 500 ? '#ff4d6d' : status >= 400 ? '#FFB830' : '#10D9A4';
    logBuffer.push({
      time:   new Date().toISOString(),
      method: req.method,
      url:    req.originalUrl,
      status,
      ms,
      color,
      ip:     req.ip || req.headers['x-forwarded-for'] || 'unknown',
    });
    if (logBuffer.length > MAX_LOG_ENTRIES) logBuffer.shift();
  });
  next();
});

app.get('/api/logs', (req, res) => {
  // Simple auth: require ?token= matching LOG_TOKEN env var (optional)
  const logToken = process.env.LOG_TOKEN;
  if (logToken && req.query.token !== logToken) {
    return res.status(401).send('Unauthorized — add ?token=YOUR_LOG_TOKEN');
  }

  const rows = [...logBuffer].reverse().map(l => `
    <tr>
      <td style="color:#8888AA;font-size:11px">${l.time.replace('T',' ').slice(0,19)}</td>
      <td style="color:#FFB830;font-weight:700">${l.method}</td>
      <td style="color:#F5F5FF">${l.url}</td>
      <td style="color:${l.color};font-weight:700">${l.status}</td>
      <td style="color:#8888AA">${l.ms}ms</td>
      <td style="color:#44446A">${l.ip}</td>
    </tr>`).join('');

  res.send(`<!DOCTYPE html>
<html>
<head>
  <title>Hyderabad EduTech — App Logs</title>
  <meta http-equiv="refresh" content="5">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background:#020209; color:#F5F5FF; font-family:'DM Mono',monospace; font-size:13px; }
    header {
      background:linear-gradient(135deg,rgba(255,107,53,.15),rgba(139,92,246,.1));
      border-bottom:1px solid rgba(255,255,255,.08);
      padding:18px 28px; display:flex; align-items:center; gap:14;
    }
    .dot { width:10px; height:10px; border-radius:50%; background:#10D9A4;
           box-shadow:0 0 8px #10D9A4; animation:pulse 2s ease-in-out infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
    h1 { font-size:16px; font-weight:700; }
    h1 span { background:linear-gradient(135deg,#FF6B35,#FFB830);
              -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
    .meta { margin-left:auto; font-size:11px; color:#44446A; }
    table { width:100%; border-collapse:collapse; }
    th {
      text-align:left; padding:9px 14px; font-size:10px; letter-spacing:.1em;
      text-transform:uppercase; color:#44446A;
      background:rgba(255,107,53,.04); border-bottom:1px solid rgba(255,255,255,.06);
      position:sticky; top:0;
    }
    td { padding:8px 14px; border-bottom:1px solid rgba(255,255,255,.04); white-space:nowrap; }
    tr:hover td { background:rgba(255,255,255,.03); }
    .empty { text-align:center; padding:60px; color:#44446A; }
    .badge { display:inline-block; padding:2px 8px; border-radius:4px;
             background:rgba(255,107,53,.12); color:#FF6B35; font-size:10px; margin-left:8px; }
  </style>
</head>
<body>
  <header>
    <div class="dot"></div>
    <h1><span>Hyderabad Education Tech</span> — Live App Logs</h1>
    <div class="meta">
      Auto-refreshes every 5s &nbsp;·&nbsp;
      ${logBuffer.length}/${MAX_LOG_ENTRIES} entries &nbsp;·&nbsp;
      Uptime: ${Math.round(process.uptime())}s
      <span class="badge">PAYMENT_GATEWAY=${process.env.PAYMENT_GATEWAY||'dummy'}</span>
    </div>
  </header>
  <table>
    <thead>
      <tr>
        <th>Time</th><th>Method</th><th>URL</th>
        <th>Status</th><th>Duration</th><th>IP</th>
      </tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="6" class="empty">No requests yet…</td></tr>'}
    </tbody>
  </table>
</body>
</html>`);
});

// ── API Routes ─────────────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/courses',     courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/students',    studentRoutes);
app.use('/api/admin',       adminRoutes);
app.use('/api/payments',    paymentRoutes);

// ── 404 ────────────────────────────────────────────────────────────
app.use('*', (req, res) =>
  res.status(404).json({ error: `Route ${req.originalUrl} not found` })
);

// ── Global Error Handler ───────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(err.statusCode || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
});

// ── Bootstrap ─────────────────────────────────────────────────────
(async () => {
  try {
    await connectDB();
    await runMigrations();   // ensure payment tables exist on every start
    app.listen(PORT, () =>
      logger.info(`🚀 API running on port ${PORT} [${process.env.NODE_ENV}]`)
    );
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
})();

module.exports = app;

// ══════════════════════════════════════════════════════════════════
//  payment.routes.js
//
//  PAYMENT FLOW (no Stripe needed right now):
//  ──────────────────────────────────────────
//  1. POST /api/payments/create-order   → creates an order record
//  2. POST /api/payments/process        → simulates card charge
//                                         ↳ FREE courses skip card entry
//                                         ↳ Any card → succeeds
//                                         ↳ Card ending 0000 → declined
//                                         ↳ On success → creates enrollment
//
//  ADDING REAL STRIPE LATER:
//    Set PAYMENT_GATEWAY=stripe + STRIPE_SECRET_KEY=sk_live_xxx in .env
//    Then replace the dummy block below with Stripe SDK calls.
// ══════════════════════════════════════════════════════════════════

const express  = require('express');
const router   = express.Router();
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const GATEWAY = process.env.PAYMENT_GATEWAY || 'dummy';

// ── Helpers ──────────────────────────────────────────────────────
function genTxnId() {
  return 'TXN-' + Date.now() + '-' + Math.random().toString(36).slice(2,7).toUpperCase();
}
function detectBrand(num) {
  const n = (num||'').replace(/\s/g,'');
  if (n.startsWith('4'))    return 'visa';
  if (/^5[1-5]/.test(n))   return 'mastercard';
  if (/^3[47]/.test(n))    return 'amex';
  if (n.startsWith('6011')) return 'discover';
  return 'card';
}
const delay = ms => new Promise(r => setTimeout(r, ms));

// ══════════════════════════════════════════════════════════════════
//  POST /api/payments/create-order
//  Creates a pending order and returns it to the frontend.
//  Frontend uses the order to show the payment modal.
// ══════════════════════════════════════════════════════════════════
router.post('/create-order', authenticate, async (req, res) => {
  try {
    const { courseId } = req.body;
    if (!courseId) return res.status(400).json({ error: 'courseId is required.' });

    // Get student record
    const stuRes = await query(
      'SELECT id FROM students WHERE user_id = $1', [req.user.id]
    );
    if (!stuRes.rows.length) return res.status(403).json({ error: 'Student profile not found.' });
    const studentId = stuRes.rows[0].id;

    // Get course
    const cRes = await query(
      `SELECT id, title, price, max_students,
              (SELECT COUNT(*) FROM enrollments WHERE course_id = courses.id AND status = 'active') AS enrolled
       FROM courses WHERE id = $1 AND is_active = TRUE`,
      [courseId]
    );
    if (!cRes.rows.length) return res.status(404).json({ error: 'Course not found.' });
    const course = cRes.rows[0];

    // Check spots
    const spots = course.max_students - parseInt(course.enrolled);
    if (spots <= 0) return res.status(409).json({ error: 'Course is full.' });

    // Check if already enrolled
    const enrChk = await query(
      `SELECT id FROM enrollments
       WHERE student_id = $1 AND course_id = $2 AND status IN ('active','completed')`,
      [studentId, courseId]
    );
    if (enrChk.rows.length) return res.status(409).json({ error: 'Already enrolled in this course.' });

    // Cancel any previous pending order for same student + course
    await query(
      `UPDATE orders SET status = 'failed' WHERE student_id = $1 AND course_id = $2 AND status = 'pending'`,
      [studentId, courseId]
    );

    // Create order
    const orderRes = await query(
      `INSERT INTO orders (student_id, course_id, amount) VALUES ($1, $2, $3) RETURNING *`,
      [studentId, courseId, parseFloat(course.price)]
    );
    const order = orderRes.rows[0];

    res.json({
      order: {
        id:       order.id,
        amount:   parseFloat(order.amount),
        currency: order.currency,
        title:    course.title,
        isFree:   parseFloat(order.amount) === 0,
      }
    });
  } catch (err) {
    console.error('[create-order]', err.message);
    res.status(500).json({ error: 'Failed to create order.' });
  }
});

// ══════════════════════════════════════════════════════════════════
//  POST /api/payments/process
//
//  Processes a pending order.
//  FREE courses → immediate enrollment, no card needed.
//  PAID courses → validates card, simulates charge, creates enrollment.
//
//  TO ADD STRIPE LATER:
//    if (GATEWAY === 'stripe') { ... call Stripe API here ... }
// ══════════════════════════════════════════════════════════════════
router.post('/process', authenticate, async (req, res) => {
  try {
    const { orderId, cardNumber, cardHolder, expiry, cvv } = req.body;
    if (!orderId) return res.status(400).json({ error: 'orderId is required.' });

    // Fetch order + verify ownership
    const oRes = await query(
      `SELECT o.id, o.student_id, o.course_id, o.amount, o.currency, o.status,
              s.user_id,
              c.title  AS course_title
       FROM orders o
       JOIN students s ON s.id = o.student_id
       JOIN courses  c ON c.id = o.course_id
       WHERE o.id = $1 AND o.status = 'pending'`,
      [orderId]
    );
    if (!oRes.rows.length) {
      return res.status(404).json({ error: 'Order not found or already processed.' });
    }
    const order = oRes.rows[0];

    if (order.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden.' });
    }

    const isFree = parseFloat(order.amount) === 0;
    const txnId  = genTxnId();

    // ── Simulate processing delay ─────────────────────────────────
    await delay(600);

    let paymentStatus = 'success';
    let declineReason = null;

    if (!isFree) {
      // Validate card fields
      const cleaned = (cardNumber || '').replace(/\s/g, '');
      if (!cleaned || cleaned.length < 13 || cleaned.length > 19) {
        return res.status(400).json({ error: 'Invalid card number.' });
      }
      if (!expiry || !cvv || !cardHolder) {
        return res.status(400).json({ error: 'All card fields are required.' });
      }

      // Test decline: card ending 0000
      if (cleaned.endsWith('0000')) {
        paymentStatus = 'failed';
        declineReason = 'Card declined — insufficient funds (test)';
      }

      // Future: Stripe integration point
      // if (GATEWAY === 'stripe') {
      //   const paymentIntent = await stripe.paymentIntents.create({ ... });
      //   paymentStatus = paymentIntent.status === 'succeeded' ? 'success' : 'failed';
      // }
    }

    const card_last4 = isFree ? null : (cardNumber || '').replace(/\s/g,'').slice(-4);
    const card_brand = isFree ? null : detectBrand(cardNumber || '');

    const gatewayResponse = {
      id:       txnId,
      gateway:  GATEWAY,
      amount:   Math.round(parseFloat(order.amount) * 100),
      currency: order.currency.toLowerCase(),
      status:   paymentStatus === 'success' ? 'succeeded' : 'payment_failed',
      failure_message: declineReason,
      created: Math.floor(Date.now() / 1000),
    };

    // Save payment record
    await query(
      `INSERT INTO payments
         (order_id, gateway, transaction_id, amount, status,
          card_last4, card_brand, cardholder_name, gateway_response, paid_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        order.id,
        GATEWAY,
        txnId,
        order.amount,
        paymentStatus,
        card_last4,
        card_brand,
        isFree ? 'FREE ENROLLMENT' : (cardHolder || ''),
        JSON.stringify(gatewayResponse),
        paymentStatus === 'success' ? new Date() : null,
      ]
    );

    // Update order status
    await query(
      `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2`,
      [paymentStatus === 'success' ? 'paid' : 'failed', order.id]
    );

    // Return decline response
    if (paymentStatus === 'failed') {
      return res.status(402).json({
        error:         declineReason || 'Payment declined.',
        transactionId: txnId,
        status:        'failed',
      });
    }

    // ── Payment succeeded → create enrollment ─────────────────────
    // NOTE: enrollments table has no start_date/end_date columns
    const enrRes = await query(
      `INSERT INTO enrollments (student_id, course_id, status)
       VALUES ($1, $2, 'active')
       ON CONFLICT (student_id, course_id)
       DO UPDATE SET status = 'active', updated_at = NOW()
       RETURNING id`,
      [order.student_id, order.course_id]
    );

    const message = isFree
      ? 'Enrollment confirmed! You can start learning now.'
      : `Payment of $${parseFloat(order.amount).toFixed(2)} successful! Enrollment confirmed.`;

    res.json({
      status:        'success',
      transactionId: txnId,
      amount:        parseFloat(order.amount),
      isFree,
      enrollmentId:  enrRes.rows[0].id,
      message,
      receipt: {
        txnId,
        courseTitle: order.course_title,
        amount:      parseFloat(order.amount),
        cardLast4:   card_last4,
        cardBrand:   card_brand,
        date:        new Date().toISOString(),
      }
    });

  } catch (err) {
    console.error('[process-payment]', err.message, err.stack);
    res.status(500).json({ error: 'Payment processing failed. Please try again.' });
  }
});

// ══════════════════════════════════════════════════════════════════
//  GET /api/payments/history
// ══════════════════════════════════════════════════════════════════
router.get('/history', authenticate, async (req, res) => {
  try {
    const stuRes = await query('SELECT id FROM students WHERE user_id = $1', [req.user.id]);
    if (!stuRes.rows.length) return res.json([]);

    const result = await query(
      `SELECT p.transaction_id, p.amount, p.status, p.card_last4, p.card_brand,
              p.cardholder_name, p.paid_at, p.created_at,
              c.title as course_title, o.currency
       FROM payments p
       JOIN orders   o ON o.id = p.order_id
       JOIN courses  c ON c.id = o.course_id
       JOIN students s ON s.id = o.student_id
       WHERE s.user_id = $1
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[payment-history]', err.message);
    res.status(500).json({ error: 'Failed to fetch history.' });
  }
});

// ══════════════════════════════════════════════════════════════════
//  GET /api/payments/receipt/:txnId
// ══════════════════════════════════════════════════════════════════
router.get('/receipt/:txnId', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT p.*, c.title as course_title, o.currency
       FROM payments p
       JOIN orders  o ON o.id = p.order_id
       JOIN courses c ON c.id = o.course_id
       JOIN students s ON s.id = o.student_id
       WHERE p.transaction_id = $1 AND s.user_id = $2`,
      [req.params.txnId, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Receipt not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch receipt.' });
  }
});

// ══════════════════════════════════════════════════════════════════
//  POST /api/payments/refund/:paymentId  [Admin only]
// ══════════════════════════════════════════════════════════════════
router.post('/refund/:paymentId', authenticate, authorize('admin'), async (req, res) => {
  try {
    const pRes = await query('SELECT * FROM payments WHERE id = $1', [req.params.paymentId]);
    if (!pRes.rows.length) return res.status(404).json({ error: 'Payment not found.' });
    const payment = pRes.rows[0];
    if (payment.status !== 'success') return res.status(400).json({ error: 'Only successful payments can be refunded.' });

    await query('UPDATE payments SET status = $1 WHERE id = $2', ['refunded', payment.id]);
    await query('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2', ['refunded', payment.order_id]);
    await query(
      `UPDATE enrollments SET status = 'cancelled', updated_at = NOW()
       WHERE student_id = (SELECT student_id FROM orders WHERE id = $1)
         AND course_id  = (SELECT course_id  FROM orders WHERE id = $1)`,
      [payment.order_id]
    );

    res.json({ message: 'Refund processed.', refundTxn: 'REF-' + payment.transaction_id });
  } catch (err) {
    res.status(500).json({ error: 'Refund failed.' });
  }
});

module.exports = router;

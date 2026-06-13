const express = require('express');
const { db, createSuccessResponse, createErrorResponse } = require('../../utils');

const router = express.Router();

// Lazily build the Stripe client only when a secret key is configured.
let stripe = null;
const getStripe = () => {
  if (stripe) return stripe;
  if (!process.env.STRIPE_SECRET_KEY) return null;
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  return stripe;
};
const isEnabled = () => !!process.env.STRIPE_SECRET_KEY;

// GET /api/payments/config — lets the frontend know whether to offer card payment.
router.get('/config', (req, res) => {
  return createSuccessResponse(res, {
    data: { enabled: isEnabled(), publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null },
  });
});

// POST /api/payments/create-intent { orderId } — creates a PaymentIntent for an existing order.
router.post('/create-intent', async (req, res, next) => {
  try {
    const client = getStripe();
    if (!client) {
      return createErrorResponse(res, { statusCode: 503, message: 'Paiement par carte non configuré (Stripe).' });
    }
    const { orderId } = req.body;
    if (!orderId) return createErrorResponse(res, { statusCode: 400, message: 'orderId requis' });

    const o = await db.query('SELECT id, total, payment FROM orders WHERE id = $1', [orderId]);
    if (o.rows.length === 0) return createErrorResponse(res, { statusCode: 404, message: 'Commande introuvable' });

    const order = o.rows[0];
    const intent = await client.paymentIntents.create({
      amount: Math.round(Number(order.total) * 100), // cents
      currency: 'eur',
      metadata: { orderId: order.id },
      automatic_payment_methods: { enabled: true },
    });

    return createSuccessResponse(res, { data: { clientSecret: intent.client_secret } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

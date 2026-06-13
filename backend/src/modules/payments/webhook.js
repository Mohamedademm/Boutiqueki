const { db } = require('../../utils');

// Stripe webhook handler. MUST receive the raw body (mounted with express.raw before express.json).
// On payment_intent.succeeded, marks the related order as paid.
module.exports = async function stripeWebhook(req, res) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).json({ success: false, message: 'Stripe non configuré' });
  }
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

  let event;
  try {
    const sig = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ success: false, message: `Webhook signature invalide: ${err.message}` });
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const orderId = event.data.object.metadata?.orderId;
      if (orderId) {
        await db.query(
          `UPDATE orders SET payment = jsonb_set(COALESCE(payment, '{}'::jsonb), '{status}', '"paid"'),
                             status = CASE WHEN status = 'pending' THEN 'processing' ELSE status END,
                             updated_at = NOW()
           WHERE id = $1`,
          [orderId]
        );
      }
    }
    return res.json({ received: true });
  } catch {
    return res.status(500).json({ success: false });
  }
};

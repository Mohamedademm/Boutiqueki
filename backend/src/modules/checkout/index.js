const express = require('express');
const { db, createSuccessResponse, createErrorResponse } = require('../../utils');
const { sendEmail } = require('../../utils/email');
const { validateCoupon } = require('../coupons/validate');
const validate = require('../../middleware/validate');
const { CheckoutSchema } = require('./schema');

const router = express.Router();

const SHIPPING_THRESHOLD = 50;
const SHIPPING_FEE = 5;

// POST /api/checkout — create an order from a public cart (no auth: customers).
// Totals are recomputed server-side; stock is decremented atomically.
router.post('/', validate(CheckoutSchema), async (req, res, next) => {
  const client = await db.getClient();
  try {
    const { shopId, customerInfo, shippingAddress, items, paymentMethod, couponCode } = req.body;

    await client.query('BEGIN');

    // Ensure shop exists and is active
    const shopRes = await client.query(
      "SELECT id FROM shops WHERE id = $1 AND status = 'active'",
      [shopId]
    );
    if (shopRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return createErrorResponse(res, { statusCode: 404, message: 'Boutique introuvable' });
    }

    let subtotal = 0;
    const orderItems = [];   // rows to insert
    const stockUpdates = [];  // { variantId, quantity }

    for (const line of items) {
      // Fetch product (must belong to this shop + be active) and its variants
      const prodRes = await client.query(
        `SELECT p.id, p.name, p.price,
                (SELECT json_agg(v.*) FROM product_variants v WHERE v.product_id = p.id) AS variants
         FROM products p
         WHERE p.id = $1 AND p.shop_id = $2 AND p.status = 'active'`,
        [line.productId, shopId]
      );
      if (prodRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return createErrorResponse(res, { statusCode: 400, message: `Produit indisponible : ${line.name || line.productId}` });
      }

      const product = prodRes.rows[0];
      const variants = product.variants || [];
      const unitPrice = Number(product.price); // server-side authority

      // Resolve the variant to decrement: explicit variantId, else single variant, else none
      let variant = null;
      if (line.variantId) {
        variant = variants.find(v => v.id === line.variantId) || null;
      } else if (variants.length === 1) {
        variant = variants[0];
      }

      // Stock check when a variant is identifiable
      if (variant) {
        if (Number(variant.stock_qty) < line.quantity) {
          await client.query('ROLLBACK');
          return createErrorResponse(res, {
            statusCode: 409,
            message: `Stock insuffisant pour ${product.name} (reste ${variant.stock_qty}).`,
          });
        }
        stockUpdates.push({ variantId: variant.id, quantity: line.quantity });
      }

      subtotal += unitPrice * line.quantity;
      orderItems.push({
        productId: product.id,
        variantId: variant ? variant.id : null,
        productName: product.name,
        variantName: variant ? variant.name : null,
        quantity: line.quantity,
        price: unitPrice,
      });
    }

    // Optional coupon (re-validated server-side)
    let discount = 0;
    let appliedCoupon = null;
    if (couponCode) {
      const cr = await validateCoupon(client, shopId, couponCode, subtotal);
      if (!cr.ok) {
        await client.query('ROLLBACK');
        return createErrorResponse(res, { statusCode: 400, message: cr.message });
      }
      discount = cr.discount;
      appliedCoupon = cr.coupon.code;
    }

    const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const total = Math.max(0, subtotal - discount) + shipping;

    const customer = {
      firstName: customerInfo.firstName,
      lastName: customerInfo.lastName,
      email: customerInfo.email,
      phone: customerInfo.phone,
      ...shippingAddress,
    };
    const payment = { method: paymentMethod, status: 'pending', couponCode: appliedCoupon, discount };

    const orderRes = await client.query(
      `INSERT INTO orders (shop_id, customer, payment, status, total)
       VALUES ($1, $2, $3, 'pending', $4)
       RETURNING id, status, total, created_at AS "createdAt"`,
      [shopId, JSON.stringify(customer), JSON.stringify(payment), total]
    );
    const order = orderRes.rows[0];

    for (const it of orderItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, variant_id, product_name, variant_name, quantity, price)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [order.id, it.productId, it.variantId, it.productName, it.variantName, it.quantity, it.price]
      );
    }

    // Decrement stock (CHECK stock_qty >= 0 guards against races)
    for (const upd of stockUpdates) {
      await client.query(
        'UPDATE product_variants SET stock_qty = stock_qty - $1 WHERE id = $2',
        [upd.quantity, upd.variantId]
      );
    }

    await client.query('COMMIT');

    // Order confirmation email (fire-and-forget — never block/fail the order on email).
    sendEmail({
      to: customer.email,
      subject: `Confirmation de commande #${String(order.id).slice(0, 8).toUpperCase()} — BoutiqueKi`,
      html: `<p>Bonjour ${customer.firstName},</p>
             <p>Merci pour votre commande <strong>#${String(order.id).slice(0, 8).toUpperCase()}</strong>.</p>
             <p>Total : <strong>${Number(order.total).toFixed(2)} €</strong> — Paiement : ${paymentMethod === 'stripe' ? 'Carte bancaire' : 'À la livraison'}.</p>
             <p>Nous vous tiendrons informé de l'expédition.</p>`,
      text: `Merci pour votre commande #${String(order.id).slice(0, 8).toUpperCase()} — Total ${Number(order.total).toFixed(2)} €`,
    }).catch(() => {});

    return createSuccessResponse(res, {
      statusCode: 201,
      message: 'Commande créée',
      data: { id: order.id, status: order.status, total: Number(order.total), createdAt: order.createdAt },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    // CHECK violation on stock => friendly message
    if (err.code === '23514') {
      return createErrorResponse(res, { statusCode: 409, message: 'Stock insuffisant pour un article.' });
    }
    next(err);
  } finally {
    client.release();
  }
});

module.exports = router;

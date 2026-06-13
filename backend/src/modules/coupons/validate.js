// Shared coupon validation/computation used by both the public validate route and checkout.
// Returns { ok, discount, coupon } or { ok:false, message }.
async function validateCoupon(db, shopId, code, subtotal) {
  if (!code) return { ok: false, message: 'Code requis' };
  const r = await db.query(
    `SELECT * FROM coupons WHERE shop_id = $1 AND lower(code) = lower($2)`,
    [shopId, String(code).trim()]
  );
  if (r.rows.length === 0) return { ok: false, message: 'Code promo invalide' };

  const c = r.rows[0];
  if (!c.active) return { ok: false, message: 'Code promo inactif' };
  if (c.expires_at && new Date(c.expires_at) < new Date()) return { ok: false, message: 'Code promo expiré' };
  if (subtotal < Number(c.min_total)) {
    return { ok: false, message: `Minimum ${Number(c.min_total).toFixed(2)} € requis` };
  }

  const discount = c.type === 'percent'
    ? Math.min(subtotal, (subtotal * Number(c.value)) / 100)
    : Math.min(subtotal, Number(c.value));

  return {
    ok: true,
    discount: Math.round(discount * 100) / 100,
    coupon: { code: c.code, type: c.type, value: Number(c.value) },
  };
}

module.exports = { validateCoupon };

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { db } = require('./src/utils');

async function seed() {
  try {
    console.log('Seeding database...');
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
    const passwordHash = await bcrypt.hash('admin123', saltRounds);

    // 1. Create Admin User
    const userRes = await db.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id',
      ['Admin', 'admin@gmail.com', passwordHash, 'admin']
    );
    const adminId = userRes.rows[0].id;
    console.log('✅ Admin user created');

    // 2. Create Shop
    const shopRes = await db.query(
      'INSERT INTO shops (owner_id, name, slug, description, plan) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [adminId, 'Boutiki Store', 'boutiki-store', 'La boutique officielle Boutiki', 'premium']
    );
    const shopId = shopRes.rows[0].id;
    console.log('✅ Shop created');

    // 3. Create Categories
    const catRes1 = await db.query(
      'INSERT INTO categories (shop_id, name, slug) VALUES ($1, $2, $3) RETURNING id',
      [shopId, 'Électronique', 'electronique']
    );
    const catRes2 = await db.query(
      'INSERT INTO categories (shop_id, name, slug) VALUES ($1, $2, $3) RETURNING id',
      [shopId, 'Vêtements', 'vetements']
    );
    const cat1 = catRes1.rows[0].id;
    const cat2 = catRes2.rows[0].id;
    console.log('✅ Categories created');

    // 4. Create Products
    const prodRes1 = await db.query(
      'INSERT INTO products (shop_id, category_id, name, description, price, sku, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [shopId, cat1, 'Smartphone X', 'Un super smartphone', 999.99, 'SKU-ELEC-1', 'active']
    );
    const prodRes2 = await db.query(
      'INSERT INTO products (shop_id, category_id, name, description, price, sku, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [shopId, cat2, 'T-Shirt Noir', '100% Coton', 19.99, 'SKU-VET-1', 'active']
    );
    const prod1 = prodRes1.rows[0].id;
    const prod2 = prodRes2.rows[0].id;
    console.log('✅ Products created');

    // 5. Create Variants
    const varRes1 = await db.query(
      'INSERT INTO product_variants (product_id, name, stock_qty) VALUES ($1, $2, $3) RETURNING id',
      [prod1, 'Standard', 50]
    );
    const varRes2 = await db.query(
      'INSERT INTO product_variants (product_id, name, stock_qty) VALUES ($1, $2, $3) RETURNING id',
      [prod2, 'Taille M', 100]
    );
    const var1 = varRes1.rows[0].id;
    const var2 = varRes2.rows[0].id;
    console.log('✅ Variants created');

    // 6. Create Stock Movements
    await db.query(
      'INSERT INTO stock_movements (product_id, variant_id, type, quantity, reason, created_by) VALUES ($1, $2, $3, $4, $5, $6)',
      [prod1, var1, 'in', 50, 'Initial stock', adminId]
    );
    await db.query(
      'INSERT INTO stock_movements (product_id, variant_id, type, quantity, reason, created_by) VALUES ($1, $2, $3, $4, $5, $6)',
      [prod2, var2, 'in', 100, 'Initial stock', adminId]
    );
    console.log('✅ Stock movements created');

    console.log('🎉 Database successfully seeded!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seed();

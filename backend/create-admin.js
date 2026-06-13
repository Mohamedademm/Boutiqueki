require('dotenv').config();
const bcrypt = require('bcrypt');
const { db } = require('./src/utils'); // Now it's in ./src/utils

async function createAdmin() {
  try {
    const email = 'admin@gmail.com';
    const password = 'admin123';
    const name = 'Admin';
    const role = 'admin';

    // Check if user exists
    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      console.log('Admin user already exists.');
      process.exit(0);
    }

    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
    const passwordHash = await bcrypt.hash(password, saltRounds);

    await db.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
      [name, email, passwordHash, role]
    );

    console.log('Admin user created successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin user:', err);
    process.exit(1);
  }
}

createAdmin();

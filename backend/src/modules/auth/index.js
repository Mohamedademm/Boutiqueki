const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { db, createSuccessResponse, createErrorResponse } = require('../../utils');
const validate = require('../../middleware/validate');
const authMiddleware = require('../../middleware/auth');
const { auditLog } = require('../../middleware/audit');
const { RegisterSchema, LoginSchema } = require('./schema');

const router = express.Router();

const generateTokens = (user) => {
  const payload = { id: user.id, email: user.email, role: user.role };
  
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '15m',
  });
  
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
  });

  return { accessToken, refreshToken };
};

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const setRefreshCookie = (res, refreshToken) => {
  res.cookie('boutiki_refresh', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

router.post('/register', validate(RegisterSchema), auditLog('USER_REGISTER', '/api/auth/register'), async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return createErrorResponse(res, { statusCode: 400, message: 'Email already in use' });
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user
    const result = await db.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
      [name, email, passwordHash, role]
    );

    const user = result.rows[0];
    const { accessToken, refreshToken } = generateTokens(user);

    // Save refresh token
    await db.query('UPDATE users SET refresh_token = $1 WHERE id = $2', [refreshToken, user.id]);

    setRefreshCookie(res, refreshToken);

    return createSuccessResponse(res, {
      statusCode: 201,
      message: 'User registered successfully',
      data: { token: accessToken, data: user },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/login', validate(LoginSchema), auditLog('USER_LOGIN', '/api/auth/login'), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return createErrorResponse(res, { statusCode: 401, message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return createErrorResponse(res, { statusCode: 401, message: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    // Save refresh token
    await db.query('UPDATE users SET refresh_token = $1 WHERE id = $2', [refreshToken, user.id]);

    setRefreshCookie(res, refreshToken);

    const userData = { id: user.id, name: user.name, email: user.email, role: user.role };

    return createSuccessResponse(res, {
      message: 'Login successful',
      data: { token: accessToken, data: userData },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/google', auditLog('USER_GOOGLE_AUTH', '/api/auth/google'), async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return createErrorResponse(res, { statusCode: 400, message: 'Missing Google credential' });
    }
    if (!process.env.GOOGLE_CLIENT_ID) {
      return createErrorResponse(res, { statusCode: 500, message: 'Google authentication is not configured' });
    }

    // Verify the Google ID token
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      return createErrorResponse(res, { statusCode: 401, message: 'Invalid Google credential' });
    }

    const { sub: googleId, email, name, picture } = payload;
    if (!email) {
      return createErrorResponse(res, { statusCode: 400, message: 'Google account has no email' });
    }

    // Find by google_id, then by email (link existing account); otherwise create.
    let user;
    const byGoogle = await db.query('SELECT id, name, email, role FROM users WHERE google_id = $1', [googleId]);
    if (byGoogle.rows.length > 0) {
      user = byGoogle.rows[0];
    } else {
      const byEmail = await db.query('SELECT id, name, email, role FROM users WHERE email = $1', [email]);
      if (byEmail.rows.length > 0) {
        user = byEmail.rows[0];
        await db.query('UPDATE users SET google_id = $1, avatar_url = COALESCE(avatar_url, $2) WHERE id = $3', [googleId, picture || null, user.id]);
      } else {
        const inserted = await db.query(
          `INSERT INTO users (name, email, google_id, avatar_url, role)
           VALUES ($1, $2, $3, $4, 'owner')
           RETURNING id, name, email, role`,
          [name || email.split('@')[0], email, googleId, picture || null]
        );
        user = inserted.rows[0];
      }
    }

    const { accessToken, refreshToken } = generateTokens(user);
    await db.query('UPDATE users SET refresh_token = $1 WHERE id = $2', [refreshToken, user.id]);
    setRefreshCookie(res, refreshToken);

    const userData = { id: user.id, name: user.name, email: user.email, role: user.role };
    return createSuccessResponse(res, {
      message: 'Google authentication successful',
      data: { token: accessToken, data: userData },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.boutiki_refresh;
    if (!refreshToken) {
      return createErrorResponse(res, { statusCode: 401, message: 'Refresh token not found' });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return createErrorResponse(res, { statusCode: 401, message: 'Invalid or expired refresh token' });
    }

    // Verify token matches DB
    const result = await db.query('SELECT id, name, email, role, refresh_token FROM users WHERE id = $1', [decoded.id]);
    const user = result.rows[0];

    if (!user || user.refresh_token !== refreshToken) {
      res.clearCookie('boutiki_refresh');
      return createErrorResponse(res, { statusCode: 401, message: 'Invalid refresh token' });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    await db.query('UPDATE users SET refresh_token = $1 WHERE id = $2', [newRefreshToken, user.id]);
    setRefreshCookie(res, newRefreshToken);

    return createSuccessResponse(res, {
      data: { token: accessToken },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', authMiddleware, async (req, res, next) => {
  try {
    await db.query('UPDATE users SET refresh_token = NULL WHERE id = $1', [req.user.id]);
    res.clearCookie('boutiki_refresh');
    return createSuccessResponse(res, { message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const result = await db.query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return createErrorResponse(res, { statusCode: 404, message: 'User not found' });
    }
    return createSuccessResponse(res, { data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

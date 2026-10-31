const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'alnoor_super_secret_jwt_key_2026_ans_hms';

/**
 * Middleware: Verify JWT and validate active database session in `user_sessions`
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }

    // Check user in database
    const [users] = await pool.query(
      `SELECT u.user_id, u.username, u.full_name, u.role_id, r.role_name, u.is_active
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       WHERE u.user_id = ? AND u.is_active = 1`,
      [decoded.user_id]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'User account not found or deactivated.' });
    }

    const user = users[0];

    // Check user_sessions if session_id is provided
    if (decoded.session_id) {
      const [sessions] = await pool.query(
        'SELECT session_id, expires_at FROM user_sessions WHERE session_id = ? AND expires_at > NOW()',
        [decoded.session_id]
      );
      if (sessions.length > 0) {
        // Touch session activity
        pool.query('UPDATE user_sessions SET last_activity = NOW() WHERE session_id = ?', [decoded.session_id]).catch(() => {});
      }
    }

    req.user = {
      user_id: user.user_id,
      username: user.username,
      full_name: user.full_name,
      role_id: user.role_id,
      role_name: user.role_name,
      session_id: decoded.session_id
    };

    next();
  } catch (error) {
    console.error('Authentication Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error in authentication.' });
  }
}

/**
 * Middleware: Role Guard - restricts route to specific roles
 * @param  {...string} roles
 */
function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated.' });
    }
    // Allow COMPLIANCE_ADMIN (Medical Director / SuperAdmin) or specified roles
    if (req.user.role_name === 'COMPLIANCE_ADMIN' || roles.includes(req.user.role_name)) {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: `Access denied. Requires one of: ${roles.join(', ')}. Current role: ${req.user.role_name}`
    });
  };
}

module.exports = {
  authenticate,
  requireRoles,
  JWT_SECRET
};


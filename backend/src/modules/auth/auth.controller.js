const authService = require('./auth.service');

class AuthController {
  async login(req, res) {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required' });
      }

      const clientMeta = {
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      };

      const result = await authService.login(username, password, clientMeta);
      return res.json({ success: true, ...result });
    } catch (error) {
      return res.status(401).json({ success: false, message: error.message });
    }
  }

  async quickSwitch(req, res) {
    try {
      const { roleOrUsername } = req.body;
      if (!roleOrUsername) {
        return res.status(400).json({ success: false, message: 'Target role or username required' });
      }

      const clientMeta = {
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      };

      const result = await authService.quickSwitch(roleOrUsername, clientMeta);
      return res.json({ success: true, ...result });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async getTestUsers(req, res) {
    try {
      const users = await authService.getAllRolesAndTestUsers();
      return res.json({ success: true, data: users });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getMe(req, res) {
    return res.json({ success: true, user: req.user });
  }

  async logout(req, res) {
    try {
      const sessionId = req.user?.session_id;
      await authService.logout(sessionId);
      return res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new AuthController();


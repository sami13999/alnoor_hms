const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { authenticate } = require('../../middleware/auth');

router.post('/login', (req, res) => authController.login(req, res));
router.post('/quick-switch', (req, res) => authController.quickSwitch(req, res));
router.get('/test-users', (req, res) => authController.getTestUsers(req, res));
router.get('/me', authenticate, (req, res) => authController.getMe(req, res));
router.post('/logout', authenticate, (req, res) => authController.logout(req, res));

module.exports = router;


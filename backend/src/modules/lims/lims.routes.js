const express = require('express');
const router = express.Router();
const limsController = require('./lims.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);

router.get('/tests', (req, res) => limsController.getTests(req, res));
router.get('/orders', (req, res) => limsController.getOrders(req, res));
router.get('/orders/:id', (req, res) => limsController.getOrder(req, res));
router.post('/orders', (req, res) => limsController.createOrder(req, res));
router.post('/orders/:id/simulate-analyzer', (req, res) => limsController.simulateAnalyzer(req, res));
router.put('/orders/:id/verify', (req, res) => limsController.verifyOrder(req, res));

module.exports = router;


const express = require('express');
const router = express.Router();
const pharmacyController = require('./pharmacy.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);

router.get('/inventory', (req, res) => pharmacyController.getInventory(req, res));
router.get('/prescriptions/pending', (req, res) => pharmacyController.getPendingPrescriptions(req, res));
router.post('/dispense', (req, res) => pharmacyController.dispense(req, res));
router.get('/crash-cart/logs', (req, res) => pharmacyController.getCrashCartLogs(req, res));
router.post('/crash-cart/verify', (req, res) => pharmacyController.verifyCrashCart(req, res));

module.exports = router;


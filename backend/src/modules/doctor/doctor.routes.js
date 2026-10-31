const express = require('express');
const router = express.Router();
const doctorController = require('./doctor.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);

router.get('/queue', (req, res) => doctorController.getLiveQueue(req, res));
router.put('/appointments/:id/status', (req, res) => doctorController.updateAppointmentStatus(req, res));
router.get('/order-sets', (req, res) => doctorController.getClinicalOrderSets(req, res));
router.post('/prescriptions', (req, res) => doctorController.createPrescription(req, res));
router.post('/verbal-orders', (req, res) => doctorController.logVerbalOrder(req, res));
router.put('/verbal-orders/:id/sign', (req, res) => doctorController.signVerbalOrder(req, res));
router.get('/verbal-orders', (req, res) => doctorController.getVerbalOrders(req, res));

module.exports = router;


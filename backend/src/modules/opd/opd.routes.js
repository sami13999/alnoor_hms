const express = require('express');
const router = express.Router();
const opdController = require('./opd.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);

router.get('/patients', (req, res) => opdController.searchPatients(req, res));
router.get('/patients/:id', (req, res) => opdController.getPatient(req, res));
router.post('/patients', (req, res) => opdController.registerPatient(req, res));
router.post('/tokens', (req, res) => opdController.generateToken(req, res));
router.post('/emergency-admission', (req, res) => opdController.redAlertEmergency(req, res));
router.get('/appointments/recent', (req, res) => opdController.getRecentAppointments(req, res));

module.exports = router;


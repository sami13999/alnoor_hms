const express = require('express');
const router = express.Router();
const ipdController = require('./ipd.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);

router.get('/wards-beds', (req, res) => ipdController.getWardsAndBeds(req, res));
router.put('/beds/:id/status', (req, res) => ipdController.updateBedStatus(req, res));
router.post('/admissions', (req, res) => ipdController.admitPatient(req, res));
router.get('/admissions/active', (req, res) => ipdController.getActiveAdmissions(req, res));
router.put('/admissions/:id/discharge', (req, res) => ipdController.dischargePatient(req, res));
router.get('/wristband/:admissionId', (req, res) => ipdController.getWristband(req, res));

module.exports = router;


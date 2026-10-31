const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./modules/auth/auth.routes');
const opdRoutes = require('./modules/opd/opd.routes');
const doctorRoutes = require('./modules/doctor/doctor.routes');
const pharmacyRoutes = require('./modules/pharmacy/pharmacy.routes');
const limsRoutes = require('./modules/lims/lims.routes');
const ipdRoutes = require('./modules/ipd/ipd.routes');
const emarRoutes = require('./modules/emar/emar.routes');
const otRoutes = require('./modules/ot/ot.routes');
const billingRoutes = require('./modules/billing/billing.routes');
const auditRoutes = require('./modules/audit/audit.routes');

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    hospital: 'Al Noor Specialist Hospital, Battagram',
    compliance: 'KP-HCC MSDS Category 2-B',
    timestamp: new Date().toISOString()
  });
});

// Feature Modules
app.use('/api/auth', authRoutes);
app.use('/api/opd', opdRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/lims', limsRoutes);
app.use('/api/ipd', ipdRoutes);
app.use('/api/emar', emarRoutes);
app.use('/api/ot', otRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/audit', auditRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? {} : err.stack
  });
});

module.exports = app;


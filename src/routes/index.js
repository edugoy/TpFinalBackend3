const express = require('express');
const userRoutes = require('./userRoutes');
const shipmentRoutes = require('./shipmentRoutes');
const mockRoutes = require('./mockRoutes');
const systemRoutes = require('./systemRoutes');

const router = express.Router();
router.use('/users', userRoutes);
router.use('/shipments', shipmentRoutes);
router.use('/mocks', mockRoutes);
router.use('/', systemRoutes);
module.exports = router;

const express = require('express');
const controller = require('../controllers/MockController');
const asyncHandler = require('../middlewares/asyncHandler');

const router = express.Router();
router.post('/users', asyncHandler(controller.users.bind(controller)));
router.post('/shipments', asyncHandler(controller.shipments.bind(controller)));
module.exports = router;

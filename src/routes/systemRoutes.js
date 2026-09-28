const express = require('express');
const controller = require('../controllers/SystemController');
const asyncHandler = require('../middlewares/asyncHandler');

const router = express.Router();
router.get('/health', asyncHandler(controller.health.bind(controller)));
router.get('/logger/test', asyncHandler(controller.loggerTest.bind(controller)));
module.exports = router;

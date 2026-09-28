const express = require('express');
const controller = require('../controllers/ShipmentController');
const asyncHandler = require('../middlewares/asyncHandler');
const upload = require('../middlewares/upload');

const router = express.Router();

router.post('/', asyncHandler(controller.create.bind(controller)));
router.get('/', asyncHandler(controller.list.bind(controller)));
router.get('/tracking/:idOrCode', asyncHandler(controller.tracking.bind(controller)));
router.get('/:id', asyncHandler(controller.getById.bind(controller)));
router.patch('/:id', asyncHandler(controller.update.bind(controller)));
router.patch('/:id/status', asyncHandler(controller.changeStatus.bind(controller)));
router.post('/:id/receipt', upload.single('receipt'), asyncHandler(controller.uploadReceipt.bind(controller)));
router.delete('/:id', asyncHandler(controller.remove.bind(controller)));

module.exports = router;

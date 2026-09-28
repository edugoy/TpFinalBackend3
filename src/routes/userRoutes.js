const express = require('express');
const controller = require('../controllers/UserController');
const asyncHandler = require('../middlewares/asyncHandler');
const upload = require('../middlewares/upload');

const router = express.Router();

router.post('/', asyncHandler(controller.create.bind(controller)));
router.get('/', asyncHandler(controller.list.bind(controller)));
router.get('/:id', asyncHandler(controller.getById.bind(controller)));
router.patch('/:id', asyncHandler(controller.update.bind(controller)));
router.delete('/:id', asyncHandler(controller.remove.bind(controller)));
router.post('/:id/documents', upload.array('documents', 5), asyncHandler(controller.uploadDocuments.bind(controller)));

module.exports = router;

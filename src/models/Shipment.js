const mongoose = require('mongoose');
const { SHIPMENT_STATUS } = require('../constants');

const fileMetadataSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  filename: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  path: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: true });

const trackingEventSchema = new mongoose.Schema({
  status: { type: String, enum: Object.values(SHIPMENT_STATUS), required: true },
  note: { type: String, trim: true, default: '' },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const shipmentSchema = new mongoose.Schema({
  trackingCode: { type: String, required: true, unique: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  recipient: {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true }
  },
  package: {
    description: { type: String, required: true, trim: true },
    weightKg: { type: Number, min: 0.01, max: 100, default: 1 }
  },
  status: {
    type: String,
    enum: Object.values(SHIPMENT_STATUS),
    default: SHIPMENT_STATUS.CREATED,
    index: true
  },
  history: { type: [trackingEventSchema], default: [] },
  receipt: { type: fileMetadataSchema, default: undefined }
}, {
  timestamps: true,
  versionKey: false
});

shipmentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Shipment', shipmentSchema);

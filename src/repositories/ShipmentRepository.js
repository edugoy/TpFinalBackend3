const Shipment = require('../models/Shipment');

class ShipmentRepository {
  create(data) { return Shipment.create(data); }
  findById(id) { return Shipment.findById(id).populate('sender', 'firstName lastName email'); }
  findByTrackingCode(code) { return Shipment.findOne({ trackingCode: code }).populate('sender', 'firstName lastName email'); }
  async findAll({ filter = {}, skip = 0, limit = 20 } = {}) {
    return Shipment.find(filter)
      .populate('sender', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }
  count(filter = {}) { return Shipment.countDocuments(filter); }
  updateById(id, data) { return Shipment.findByIdAndUpdate(id, data, { new: true, runValidators: true }).populate('sender', 'firstName lastName email'); }
  deleteById(id) { return Shipment.findByIdAndDelete(id); }
  setReceipt(id, receipt) { return Shipment.findByIdAndUpdate(id, { receipt }, { new: true, runValidators: true }).populate('sender', 'firstName lastName email'); }
}

module.exports = new ShipmentRepository();

const shipmentService = require('../services/ShipmentService');
const { ok } = require('../utils/response');

class ShipmentController {
  async create(req, res) {
    const shipment = await shipmentService.create(req.body);
    return ok(res, shipment, 201);
  }

  async list(req, res) {
    const result = await shipmentService.list(req.query);
    return ok(res, result.items, 200, result.meta);
  }

  async getById(req, res) {
    const shipment = await shipmentService.getById(req.params.id);
    return ok(res, shipment);
  }

  async update(req, res) {
    const shipment = await shipmentService.update(req.params.id, req.body);
    return ok(res, shipment);
  }

  async changeStatus(req, res) {
    const shipment = await shipmentService.changeStatus(req.params.id, req.body.status, req.body.note);
    return ok(res, shipment);
  }

  async tracking(req, res) {
    const tracking = await shipmentService.tracking(req.params.idOrCode);
    return ok(res, tracking);
  }

  async uploadReceipt(req, res) {
    const shipment = await shipmentService.addReceipt(req.params.id, req.file);
    return ok(res, shipment, 201);
  }

  async remove(req, res) {
    const shipment = await shipmentService.remove(req.params.id);
    return ok(res, { id: shipment._id, deleted: true });
  }
}

module.exports = new ShipmentController();

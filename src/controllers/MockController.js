const mockService = require('../services/MockService');
const { ok } = require('../utils/response');

class MockController {
  async users(req, res) {
    const items = await mockService.generateUsers(req.body.count);
    return ok(res, items, 201, { generated: items.length });
  }

  async shipments(req, res) {
    const items = await mockService.generateShipments(req.body.count);
    return ok(res, items, 201, { generated: items.length });
  }
}

module.exports = new MockController();

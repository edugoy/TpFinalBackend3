const userService = require('../services/UserService');
const { ok } = require('../utils/response');

class UserController {
  async create(req, res) {
    const user = await userService.create(req.body);
    return ok(res, user, 201);
  }

  async list(req, res) {
    const result = await userService.list(req.query);
    return ok(res, result.items, 200, result.meta);
  }

  async getById(req, res) {
    const user = await userService.getById(req.params.id);
    return ok(res, user);
  }

  async update(req, res) {
    const user = await userService.update(req.params.id, req.body);
    return ok(res, user);
  }

  async remove(req, res) {
    const user = await userService.remove(req.params.id);
    return ok(res, { id: user._id, deleted: true });
  }

  async uploadDocuments(req, res) {
    const user = await userService.addDocuments(req.params.id, req.files);
    return ok(res, user, 201);
  }
}

module.exports = new UserController();

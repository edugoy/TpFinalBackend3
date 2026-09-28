const User = require('../models/User');

class UserRepository {
  create(data) { return User.create(data); }
  findById(id) { return User.findById(id); }
  findByEmail(email) { return User.findOne({ email }); }
  findAll({ skip = 0, limit = 20 } = {}) { return User.find().sort({ createdAt: -1 }).skip(skip).limit(limit); }
  countAll() { return User.countDocuments(); }
  updateById(id, data) { return User.findByIdAndUpdate(id, data, { new: true, runValidators: true }); }
  deleteById(id) { return User.findByIdAndDelete(id); }
  addDocuments(id, documents) {
    return User.findByIdAndUpdate(id, { $push: { documents: { $each: documents } } }, { new: true, runValidators: true });
  }
}

module.exports = new UserRepository();

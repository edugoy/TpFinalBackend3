const userRepository = require('../repositories/UserRepository');
const { NotFoundError, ValidationError } = require('../errors/AppError');

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''));
}

class UserService {
  async create(data) {
    const firstName = String(data.firstName || '').trim();
    const lastName = String(data.lastName || '').trim();
    const email = String(data.email || '').trim().toLowerCase();

    if (firstName.length < 2 || lastName.length < 2 || !validateEmail(email)) {
      throw new ValidationError('Nombre, apellido y email válido son obligatorios');
    }

    const exists = await userRepository.findByEmail(email);
    if (exists) throw new ValidationError('El email ya se encuentra registrado');

    return userRepository.create({ firstName, lastName, email, phone: String(data.phone || '').trim() });
  }

  async list({ page = 1, limit = 20 } = {}) {
    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip = (safePage - 1) * safeLimit;
    const [items, total] = await Promise.all([
      userRepository.findAll({ skip, limit: safeLimit }),
      userRepository.countAll()
    ]);
    return { items, meta: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) || 1 } };
  }

  async getById(id) {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError('Usuario');
    return user;
  }

  async update(id, data) {
    const allowed = {};
    if (data.firstName !== undefined) allowed.firstName = String(data.firstName).trim();
    if (data.lastName !== undefined) allowed.lastName = String(data.lastName).trim();
    if (data.phone !== undefined) allowed.phone = String(data.phone).trim();
    if (data.email !== undefined) {
      const email = String(data.email).trim().toLowerCase();
      if (!validateEmail(email)) throw new ValidationError('Email inválido');
      const owner = await userRepository.findByEmail(email);
      if (owner && String(owner._id) !== String(id)) throw new ValidationError('El email ya se encuentra registrado');
      allowed.email = email;
    }
    if (Object.keys(allowed).length === 0) throw new ValidationError('No hay campos válidos para actualizar');

    const updated = await userRepository.updateById(id, allowed);
    if (!updated) throw new NotFoundError('Usuario');
    return updated;
  }

  async remove(id) {
    const deleted = await userRepository.deleteById(id);
    if (!deleted) throw new NotFoundError('Usuario');
    return deleted;
  }

  async addDocuments(id, files) {
    if (!files || files.length === 0) {
      const { FileRequiredError } = require('../errors/AppError');
      throw new FileRequiredError('Debe adjuntar al menos un documento');
    }
    await this.getById(id);
    const docs = files.map((file) => ({
      originalName: file.originalname,
      filename: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      path: file.path
    }));
    return userRepository.addDocuments(id, docs);
  }
}

module.exports = new UserService();

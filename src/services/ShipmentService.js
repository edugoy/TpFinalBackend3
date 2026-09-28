const shipmentRepository = require('../repositories/ShipmentRepository');
const userRepository = require('../repositories/UserRepository');
const createTrackingCode = require('../utils/trackingCode');
const { SHIPMENT_STATUS, ALLOWED_SHIPMENT_TRANSITIONS } = require('../constants');
const { NotFoundError, ValidationError, InvalidStateError, FileRequiredError } = require('../errors/AppError');

class ShipmentService {
  async create(data) {
    const sender = await userRepository.findById(data.senderId);
    if (!sender) throw new NotFoundError('Usuario remitente');

    const recipientName = String(data.recipientName || '').trim();
    const recipientAddress = String(data.recipientAddress || '').trim();
    const description = String(data.packageDescription || '').trim();
    const weightKg = Number(data.weightKg || 1);

    if (!recipientName || !recipientAddress || !description || !Number.isFinite(weightKg) || weightKg <= 0 || weightKg > 100) {
      throw new ValidationError('Datos de envío inválidos');
    }

    return shipmentRepository.create({
      trackingCode: createTrackingCode(),
      sender: sender._id,
      recipient: { name: recipientName, address: recipientAddress },
      package: { description, weightKg },
      status: SHIPMENT_STATUS.CREATED,
      history: [{ status: SHIPMENT_STATUS.CREATED, note: 'Envío creado' }]
    });
  }

  async list({ page = 1, limit = 20, status } = {}) {
    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const filter = {};
    if (status) {
      const normalized = String(status).toUpperCase();
      if (!Object.values(SHIPMENT_STATUS).includes(normalized)) throw new ValidationError('Estado de envío inválido');
      filter.status = normalized;
    }
    const skip = (safePage - 1) * safeLimit;
    const [items, total] = await Promise.all([
      shipmentRepository.findAll({ filter, skip, limit: safeLimit }),
      shipmentRepository.count(filter)
    ]);
    return { items, meta: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) || 1 } };
  }

  async getById(id) {
    const shipment = await shipmentRepository.findById(id);
    if (!shipment) throw new NotFoundError('Envío');
    return shipment;
  }

  async getByTrackingCode(code) {
    const shipment = await shipmentRepository.findByTrackingCode(String(code).toUpperCase());
    if (!shipment) throw new NotFoundError('Envío');
    return shipment;
  }

  async update(id, data) {
    const shipment = await this.getById(id);
    if (shipment.status !== SHIPMENT_STATUS.CREATED) {
      throw new InvalidStateError('Solo se puede editar un envío en estado CREATED');
    }

    const update = {};
    if (data.recipientName !== undefined) update['recipient.name'] = String(data.recipientName).trim();
    if (data.recipientAddress !== undefined) update['recipient.address'] = String(data.recipientAddress).trim();
    if (data.packageDescription !== undefined) update['package.description'] = String(data.packageDescription).trim();
    if (data.weightKg !== undefined) {
      const weight = Number(data.weightKg);
      if (!Number.isFinite(weight) || weight <= 0 || weight > 100) throw new ValidationError('Peso inválido');
      update['package.weightKg'] = weight;
    }
    if (Object.keys(update).length === 0) throw new ValidationError('No hay campos válidos para actualizar');
    return shipmentRepository.updateById(id, update);
  }

  async changeStatus(id, nextStatus, note = '') {
    const shipment = await this.getById(id);
    const normalized = String(nextStatus || '').toUpperCase();
    if (!Object.values(SHIPMENT_STATUS).includes(normalized)) throw new ValidationError('Estado de envío inválido');

    const allowed = ALLOWED_SHIPMENT_TRANSITIONS[shipment.status] || [];
    if (!allowed.includes(normalized)) {
      throw new InvalidStateError(`Transición inválida: ${shipment.status} → ${normalized}`);
    }

    const history = [...shipment.history.map((item) => item.toObject ? item.toObject() : item), {
      status: normalized,
      note: String(note || '').trim(),
      timestamp: new Date()
    }];

    return shipmentRepository.updateById(id, { status: normalized, history });
  }

  async tracking(idOrCode) {
    let shipment;
    if (String(idOrCode).startsWith('SN-')) shipment = await this.getByTrackingCode(idOrCode);
    else shipment = await this.getById(idOrCode);
    return {
      trackingCode: shipment.trackingCode,
      currentStatus: shipment.status,
      history: shipment.history,
      updatedAt: shipment.updatedAt
    };
  }

  async addReceipt(id, file) {
    if (!file) throw new FileRequiredError('Debe adjuntar un comprobante');
    await this.getById(id);
    const receipt = {
      originalName: file.originalname,
      filename: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      path: file.path
    };
    return shipmentRepository.setReceipt(id, receipt);
  }

  async remove(id) {
    const shipment = await this.getById(id);
    if (shipment.status === SHIPMENT_STATUS.IN_TRANSIT || shipment.status === SHIPMENT_STATUS.DELIVERED) {
      throw new InvalidStateError('No se puede eliminar un envío en tránsito o entregado');
    }
    const deleted = await shipmentRepository.deleteById(id);
    if (!deleted) throw new NotFoundError('Envío');
    return deleted;
  }
}

module.exports = new ShipmentService();

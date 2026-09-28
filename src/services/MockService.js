const userRepository = require('../repositories/UserRepository');
const shipmentRepository = require('../repositories/ShipmentRepository');
const createTrackingCode = require('../utils/trackingCode');
const { SHIPMENT_STATUS, MOCK_LIMITS } = require('../constants');
const { InvalidMockCountError, ValidationError } = require('../errors/AppError');

const firstNames = ['Ana', 'Juan', 'Lucía', 'Martín', 'Sofía', 'Diego', 'Camila', 'Nicolás'];
const lastNames = ['Gómez', 'Pérez', 'López', 'Fernández', 'Martínez', 'Díaz', 'Romero', 'Sosa'];
const streets = ['Av. Corrientes 1234', 'Av. Santa Fe 2500', 'Rivadavia 4000', 'Cabildo 1800', 'San Juan 900'];
const items = ['Documentación', 'Indumentaria', 'Accesorios', 'Libros', 'Electrónica'];

function validateCount(value) {
  const count = Number(value);
  if (!Number.isInteger(count) || count < MOCK_LIMITS.MIN || count > MOCK_LIMITS.MAX) {
    throw new InvalidMockCountError(`La cantidad debe ser un entero entre ${MOCK_LIMITS.MIN} y ${MOCK_LIMITS.MAX}`);
  }
  return count;
}

class MockService {
  async generateUsers(rawCount) {
    const count = validateCount(rawCount);
    const users = [];
    for (let i = 0; i < count; i += 1) {
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[(i * 3) % lastNames.length];
      users.push(await userRepository.create({
        firstName,
        lastName,
        email: `mock-${Date.now()}-${i}@shipnow.test`,
        phone: `+54 11 5555-${String(1000 + i)}`
      }));
    }
    return users;
  }

  async generateShipments(rawCount) {
    const count = validateCount(rawCount);
    const senders = await userRepository.findAll({ limit: Math.max(count, 1) });
    if (senders.length === 0) throw new ValidationError('Debe existir al menos un usuario para generar envíos mock');

    const shipments = [];
    for (let i = 0; i < count; i += 1) {
      shipments.push(await shipmentRepository.create({
        trackingCode: createTrackingCode(),
        sender: senders[i % senders.length]._id,
        recipient: { name: `Destinatario ${i + 1}`, address: streets[i % streets.length] },
        package: { description: items[i % items.length], weightKg: (i % 10) + 1 },
        status: SHIPMENT_STATUS.CREATED,
        history: [{ status: SHIPMENT_STATUS.CREATED, note: 'Envío mock creado' }]
      }));
    }
    return shipments;
  }
}

module.exports = new MockService();

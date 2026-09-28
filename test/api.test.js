const fs = require('fs');
const path = require('path');
const { expect } = require('chai');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const { connectDb, disconnectDb } = require('../src/config/db');
const User = require('../src/models/User');
const Shipment = require('../src/models/Shipment');

const uploadsDir = path.resolve(process.cwd(), 'uploads');
let mongo;

async function createUser(overrides = {}) {
  const response = await request(app)
    .post('/api/users')
    .send({
      firstName: 'Ana',
      lastName: 'López',
      email: `ana-${Date.now()}-${Math.random()}@test.com`,
      phone: '+54 11 5555-0000',
      ...overrides
    });
  expect(response.status).to.equal(201);
  return response.body.data;
}

async function createShipment(senderId, overrides = {}) {
  const response = await request(app)
    .post('/api/shipments')
    .send({
      senderId,
      recipientName: 'Pedro Pérez',
      recipientAddress: 'Av. Corrientes 1234',
      packageDescription: 'Documentación',
      weightKg: 2.5,
      ...overrides
    });
  expect(response.status).to.equal(201);
  return response.body.data;
}

describe('ShipNow API - functional tests', function () {
  before(async function () {
    if (process.env.TEST_MONGO_URI) {
      await connectDb(process.env.TEST_MONGO_URI);
    } else {
      mongo = await MongoMemoryServer.create();
      await connectDb(mongo.getUri('shipnow_test'));
    }
  });

  beforeEach(async function () {
    await Promise.all([User.deleteMany({}), Shipment.deleteMany({})]);
  });

  after(async function () {
    await disconnectDb();
    if (mongo) await mongo.stop();
    if (fs.existsSync(uploadsDir)) {
      for (const file of fs.readdirSync(uploadsDir)) {
        if (file !== '.gitkeep') fs.rmSync(path.join(uploadsDir, file), { force: true });
      }
    }
  });

  it('GET /api/health devuelve estado saludable', async function () {
    const res = await request(app).get('/api/health');
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.data.database).to.equal('connected');
  });

  it('GET /api/docs expone Swagger', async function () {
    const res = await request(app).get('/api/docs/');
    expect(res.status).to.equal(200);
    expect(res.text).to.include('Swagger UI');
  });

  it('GET /api/logger/test ejercita el logger interno', async function () {
    const res = await request(app).get('/api/logger/test');
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
  });

  it('crea, consulta y actualiza un usuario', async function () {
    const user = await createUser();

    const getRes = await request(app).get(`/api/users/${user._id}`);
    expect(getRes.status).to.equal(200);
    expect(getRes.body.data.email).to.equal(user.email);

    const patchRes = await request(app)
      .patch(`/api/users/${user._id}`)
      .send({ phone: '+54 11 4444-2222' });
    expect(patchRes.status).to.equal(200);
    expect(patchRes.body.data.phone).to.equal('+54 11 4444-2222');
  });

  it('rechaza un usuario con datos inválidos', async function () {
    const res = await request(app)
      .post('/api/users')
      .send({ firstName: 'A', lastName: '', email: 'incorrecto' });
    expect(res.status).to.equal(400);
    expect(res.body.error.code).to.equal('VALIDATION_ERROR');
  });

  it('crea un envío y ejecuta el flujo CREATED → IN_TRANSIT → DELIVERED', async function () {
    const user = await createUser();
    const shipment = await createShipment(user._id);
    expect(shipment.status).to.equal('CREATED');
    expect(shipment.trackingCode).to.match(/^SN-/);

    const inTransit = await request(app)
      .patch(`/api/shipments/${shipment._id}/status`)
      .send({ status: 'IN_TRANSIT', note: 'Retirado por transporte' });
    expect(inTransit.status).to.equal(200);
    expect(inTransit.body.data.status).to.equal('IN_TRANSIT');

    const delivered = await request(app)
      .patch(`/api/shipments/${shipment._id}/status`)
      .send({ status: 'DELIVERED', note: 'Entregado al destinatario' });
    expect(delivered.status).to.equal(200);
    expect(delivered.body.data.status).to.equal('DELIVERED');

    const tracking = await request(app).get(`/api/shipments/tracking/${shipment.trackingCode}`);
    expect(tracking.status).to.equal(200);
    expect(tracking.body.data.history).to.have.length(3);
  });

  it('rechaza una transición de estado inválida', async function () {
    const user = await createUser();
    const shipment = await createShipment(user._id);

    const res = await request(app)
      .patch(`/api/shipments/${shipment._id}/status`)
      .send({ status: 'DELIVERED' });
    expect(res.status).to.equal(409);
    expect(res.body.error.code).to.equal('INVALID_STATE');
  });

  it('lista envíos con paginación y filtro por estado', async function () {
    const user = await createUser();
    await createShipment(user._id);
    await createShipment(user._id, { packageDescription: 'Libros' });

    const res = await request(app).get('/api/shipments?status=CREATED&page=1&limit=1');
    expect(res.status).to.equal(200);
    expect(res.body.data).to.have.length(1);
    expect(res.body.meta.total).to.equal(2);
  });

  it('genera mocks consistentes y valida cantidades', async function () {
    const usersRes = await request(app).post('/api/mocks/users').send({ count: 3 });
    expect(usersRes.status).to.equal(201);
    expect(usersRes.body.data).to.have.length(3);

    const shipmentsRes = await request(app).post('/api/mocks/shipments').send({ count: 2 });
    expect(shipmentsRes.status).to.equal(201);
    expect(shipmentsRes.body.data).to.have.length(2);

    const invalid = await request(app).post('/api/mocks/users').send({ count: 1000 });
    expect(invalid.status).to.equal(400);
    expect(invalid.body.error.code).to.equal('INVALID_MOCK_COUNT');
  });

  it('carga documentos válidos de usuario y persiste metadatos', async function () {
    const user = await createUser();
    const res = await request(app)
      .post(`/api/users/${user._id}/documents`)
      .attach('documents', path.resolve(__dirname, 'fixtures/test.pdf'));

    expect(res.status).to.equal(201);
    expect(res.body.data.documents).to.have.length(1);
    expect(res.body.data.documents[0].mimeType).to.equal('application/pdf');
  });

  it('carga un comprobante en un envío', async function () {
    const user = await createUser();
    const shipment = await createShipment(user._id);
    const res = await request(app)
      .post(`/api/shipments/${shipment._id}/receipt`)
      .attach('receipt', path.resolve(__dirname, 'fixtures/test.pdf'));

    expect(res.status).to.equal(201);
    expect(res.body.data.receipt.mimeType).to.equal('application/pdf');
  });

  it('rechaza upload sin archivo', async function () {
    const user = await createUser();
    const res = await request(app).post(`/api/users/${user._id}/documents`);
    expect(res.status).to.equal(400);
    expect(res.body.error.code).to.equal('FILE_REQUIRED');
  });

  it('rechaza un tipo de archivo no permitido', async function () {
    const user = await createUser();
    const res = await request(app)
      .post(`/api/users/${user._id}/documents`)
      .attach('documents', path.resolve(__dirname, 'fixtures/not-allowed.txt'));
    expect(res.status).to.equal(415);
    expect(res.body.error.code).to.equal('INVALID_FILE_TYPE');
  });

  it('devuelve JSON estandarizado para rutas inexistentes', async function () {
    const res = await request(app).get('/api/no-existe');
    expect(res.status).to.equal(404);
    expect(res.body).to.deep.include({ success: false });
    expect(res.body.error.code).to.equal('NOT_FOUND');
  });
});

function ok(res, data, statusCode = 200, meta) {
  const payload = { success: true, data };
  if (meta) payload.meta = meta;
  return res.status(statusCode).json(payload);
}

module.exports = { ok };

function errorHandler(err, req, res, next) {
  console.error('[Error]', err);

  if (err.isValidation) {
    return res.status(400).json({ error: err.message, field: err.field });
  }

  res.status(500).json({ error: 'Internal server error' });
}

module.exports = errorHandler;

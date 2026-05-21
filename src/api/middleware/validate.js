function validateChat(req, res, next) {
  const { query } = req.body;

  if (query === undefined || query === null) {
    return res.status(400).json({ error: 'query is required' });
  }

  if (typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({ error: 'query cannot be empty' });
  }

  if (query.length > 500) {
    return res.status(400).json({ error: 'query too long, max 500 chars' });
  }

  next();
}

module.exports = { validateChat };

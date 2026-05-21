const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    memory: process.memoryUsage().heapUsed,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;

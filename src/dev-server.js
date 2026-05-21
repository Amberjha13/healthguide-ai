/**
 * Development server with in-memory MongoDB — no local mongod needed.
 * Usage: node src/dev-server.js
 */
require('dotenv').config();
const { MongoMemoryServer } = require('mongodb-memory-server');

(async () => {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

  require('./server');

  process.on('SIGINT', async () => {
    await mongod.stop();
    process.exit(0);
  });
})();

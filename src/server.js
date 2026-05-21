require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const memory = require('./memory/sessionMemory');
const chatRouter = require('./api/routes/chat');
const sessionsRouter = require('./api/routes/sessions');
const healthRouter = require('./api/routes/health');
const errorHandler = require('./api/middleware/errorHandler');
const { chatRateLimiter } = require('./api/middleware/rateLimiter');

const app = express();
const server = http.createServer(app);

// eslint-disable-next-line no-unused-vars
const io = new Server(server, {
  cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'] },
});

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/health', healthRouter);
app.use('/api/chat', chatRateLimiter, chatRouter);
app.use('/api/sessions', sessionsRouter);

app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '3001', 10);

async function start() {
  await memory.connect();
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'not connected';
  server.listen(PORT, () => {
    console.log(`HealthGuide AI server running on port ${PORT}`);
    console.log(`MongoDB: ${mongoStatus}`);
  });
}

start();

module.exports = app;

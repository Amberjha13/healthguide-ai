const mongoose = require('mongoose');
const config = require('../config');

const sessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, index: true },
    query: { type: String, required: true },
    agentSteps: [
      {
        thought: String,
        toolName: String,
        toolParams: mongoose.Schema.Types.Mixed,
        toolResult: mongoose.Schema.Types.Mixed,
      },
    ],
    toolsUsed: [String],
    finalAnswer: String,
    safetyApplied: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Session = mongoose.model('Session', sessionSchema);

let isConnected = false;

async function connect() {
  if (isConnected) return;
  try {
    await mongoose.connect(config.mongodb.uri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
    });
    isConnected = true;
    console.log('MongoDB connected');
  } catch (err) {
    console.warn(`MongoDB unavailable: ${err.message}. Session persistence disabled.`);
  }
}

async function save({ sessionId, query, agentSteps, toolsUsed, finalAnswer, safetyApplied }) {
  if (!isConnected) return null;
  try {
    const session = new Session({ sessionId, query, agentSteps, toolsUsed, finalAnswer, safetyApplied });
    await session.save();
    return session;
  } catch (err) {
    console.warn(`Failed to save session: ${err.message}`);
    return null;
  }
}

async function get(sessionId) {
  if (!isConnected) return [];
  try {
    return await Session.find({ sessionId }).sort({ createdAt: -1 }).limit(10).lean();
  } catch (err) {
    console.warn(`Failed to retrieve session: ${err.message}`);
    return [];
  }
}

module.exports = { connect, save, get };

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
require('../../memory/sessionMemory');

function getModel() {
  return mongoose.model('Session');
}

function requireDb(res) {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ error: 'Database not connected' });
    return false;
  }
  return true;
}

router.get('/', async (req, res, next) => {
  if (!requireDb(res)) return;
  try {
    const Session = getModel();
    const docs = await Session.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .select('sessionId query agentSteps createdAt')
      .lean();

    res.json(
      docs.map((s) => ({
        sessionId: s.sessionId,
        query: s.query,
        stepCount: (s.agentSteps || []).length,
        createdAt: s.createdAt,
      }))
    );
  } catch (err) {
    next(err);
  }
});

router.get('/:sessionId', async (req, res, next) => {
  if (!requireDb(res)) return;
  try {
    const Session = getModel();
    const session = await Session.findOne({ sessionId: req.params.sessionId })
      .sort({ createdAt: -1 })
      .lean();

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      sessionId: session.sessionId,
      query: session.query,
      steps: session.agentSteps || [],
      finalAnswer: session.finalAnswer,
      createdAt: session.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/:sessionId', async (req, res, next) => {
  if (!requireDb(res)) return;
  try {
    const Session = getModel();
    await Session.deleteMany({ sessionId: req.params.sessionId });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Orchestrator = require('../../agent/orchestrator');
const SSEEmitter = require('../../streaming/sseEmitter');
const { validateChat } = require('../middleware/validate');

router.post('/', validateChat, async (req, res) => {
  const { query, sessionId: existingSessionId } = req.body;
  const sessionId = existingSessionId || crypto.randomUUID();

  const emitter = new SSEEmitter(res);
  const orchestrator = new Orchestrator();

  orchestrator.on('thought', (data) => emitter.emitThought(data.message));
  orchestrator.on('tool_call', (data) => emitter.emitToolCall(data.toolName, data.toolParams));
  orchestrator.on('tool_result', (data) => emitter.emitToolResult(data.toolName, data.toolResult));

  try {
    const result = await orchestrator.run(query.trim(), sessionId);
    emitter.emitFinal(result.answer);
    emitter.done();
  } catch (err) {
    emitter.emitError(err.message);
    emitter.done();
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Orchestrator = require('../../agent/orchestrator');
const SSEEmitter = require('../../streaming/sseEmitter');
const { validateChat } = require('../middleware/validate');
const { logAudit } = require('../../memory/auditLog');

const EMERGENCY_PATTERN =
  /\b(chest pain|can'?t breathe|cannot breathe|overdose|emergency|heart attack|not breathing|unconscious|stroke)\b/i;

const EMERGENCY_RESPONSE =
  '🚨 This sounds like a medical emergency. Please call 112 (India) or your local emergency number immediately. Do not wait — call now.';

router.post('/', validateChat, async (req, res) => {
  const { query, sessionId: existingSessionId } = req.body;
  const sessionId = existingSessionId || crypto.randomUUID();
  const user = req.user || {};

  const emitter = new SSEEmitter(res);

  if (EMERGENCY_PATTERN.test(query)) {
    emitter.emitFinal(EMERGENCY_RESPONSE);
    emitter.done();
    logAudit({
      userId: user.userId,
      username: user.username,
      query,
      hadDosageWarning: false,
      hadEmergencyFlag: true,
      toolsUsed: [],
    });
    return;
  }

  const orchestrator = new Orchestrator();
  orchestrator.on('thought', (data) => emitter.emitThought(data.message));
  orchestrator.on('tool_call', (data) => emitter.emitToolCall(data.toolName, data.toolParams));
  orchestrator.on('tool_result', (data) => emitter.emitToolResult(data.toolName, data.toolResult));

  try {
    const result = await orchestrator.run(query.trim(), sessionId);
    emitter.emitFinal(result.answer);
    emitter.done();
    logAudit({
      userId: user.userId,
      username: user.username,
      query,
      hadDosageWarning: result.hadDosageWarning || false,
      hadEmergencyFlag: false,
      toolsUsed: result.toolsUsed || [],
    });
  } catch (err) {
    emitter.emitError(err.message);
    emitter.done();
  }
});

module.exports = router;

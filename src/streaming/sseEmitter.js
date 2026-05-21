class SSEEmitter {
  constructor(res) {
    this.res = res;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
  }

  _send(data) {
    this.res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  emitThought(text) {
    this._send({ type: 'thought', content: text });
  }

  emitToolCall(toolName, params) {
    this._send({ type: 'tool_call', toolName, params });
  }

  emitToolResult(toolName, result) {
    this._send({ type: 'tool_result', toolName, result });
  }

  emitFinal(answer) {
    this._send({ type: 'final', content: answer });
  }

  emitError(message) {
    this._send({ type: 'error', message });
  }

  done() {
    this.res.end();
  }
}

module.exports = SSEEmitter;

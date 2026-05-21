const EventEmitter = require('events');
const { plan } = require('./planner');
const { execute } = require('./executor');
const { validate } = require('./safety');
const memory = require('../memory/sessionMemory');

class Orchestrator extends EventEmitter {
  async run(query, sessionId) {
    this.emit('thought', { message: 'Planning query breakdown...' });

    const subTasks = await plan(query);
    this.emit('thought', { message: `Plan: ${subTasks.length} sub-task(s)`, subTasks });

    const allAnswers = [];
    const allSteps = [];
    const allToolsUsed = new Set();

    for (let i = 0; i < subTasks.length; i++) {
      const task = subTasks[i];
      this.emit('thought', { message: `Executing sub-task ${i + 1}/${subTasks.length}: ${task}` });

      const { answer, steps, toolsUsed } = await execute(task, (event, data) => {
        this.emit(event, data);
      });

      allAnswers.push(answer);
      allSteps.push(...steps);
      toolsUsed.forEach((t) => allToolsUsed.add(t));
    }

    const combinedAnswer =
      allAnswers.length === 1
        ? allAnswers[0]
        : allAnswers.map((a, i) => `**Part ${i + 1}:** ${a}`).join('\n\n');

    this.emit('thought', { message: 'Running safety validation...' });
    const safetyResult = await validate(combinedAnswer);

    await memory.save({
      sessionId,
      query,
      agentSteps: allSteps,
      toolsUsed: Array.from(allToolsUsed),
      finalAnswer: safetyResult.response,
      safetyApplied: safetyResult.safetyApplied,
    });

    return {
      sessionId,
      query,
      answer: safetyResult.response,
      steps: allSteps,
      toolsUsed: Array.from(allToolsUsed),
      safetyApplied: safetyResult.safetyApplied,
      concerns: safetyResult.concerns,
    };
  }
}

module.exports = Orchestrator;

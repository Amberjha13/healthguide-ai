const Anthropic = require('@anthropic-ai/sdk');
const config = require('../config');
const { getToolDescriptions, runTool } = require('../tools/registry');

const client = new Anthropic({ apiKey: config.anthropic.apiKey });
const MAX_ITERATIONS = 7;

const TOOL_CALL_PATTERN = /TOOL:\s*(\w+)\s*\|\s*(\{[\s\S]*?\})/;
const FINAL_ANSWER_PATTERN = /FINAL ANSWER:\s*([\s\S]+)/;

function buildSystemPrompt() {
  return {
    type: 'text',
    text: `You are HealthGuide AI, an expert healthcare assistant helping users understand medications, insurance coverage, and healthcare costs. You have access to tools to look up accurate information.

AVAILABLE TOOLS:
${getToolDescriptions()}

REACT LOOP INSTRUCTIONS:
Think step by step. For each step, either:
1. Use a tool: Write exactly "TOOL: tool_name | {params_as_json}" on its own line
2. Provide your final answer: Write exactly "FINAL ANSWER: your complete response" on its own line

Rules:
- Always use tools to look up drug information, formulary data, or perform calculations
- Parse tool results carefully and use them in your reasoning
- Provide accurate, educational information without giving medical diagnoses
- When you have enough information, provide a comprehensive FINAL ANSWER
- Never make up drug information — use tools to look it up

Example:
Thought: I need to look up metformin's side effects.
TOOL: drug_lookup | {"drugName": "metformin"}
[tool result provided]
Thought: Now I have the information to answer.
FINAL ANSWER: Metformin's common side effects include...`,
    cache_control: { type: 'ephemeral' },
  };
}

async function execute(task, onEvent) {
  const messages = [];
  const steps = [];
  const toolsUsed = new Set();
  let answer = null;

  messages.push({ role: 'user', content: task });

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await client.messages.create({
      model: config.anthropic.model,
      max_tokens: 2048,
      system: [buildSystemPrompt()],
      messages,
    });

    const assistantText = response.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('');

    messages.push({ role: 'assistant', content: assistantText });

    const finalMatch = assistantText.match(FINAL_ANSWER_PATTERN);
    if (finalMatch) {
      answer = finalMatch[1].trim();
      if (onEvent) onEvent('final', { answer });
      break;
    }

    const toolMatch = assistantText.match(TOOL_CALL_PATTERN);
    if (toolMatch) {
      const toolName = toolMatch[1].trim();
      let toolParams = {};
      try {
        toolParams = JSON.parse(toolMatch[2]);
      } catch {
        toolParams = {};
      }

      const step = { thought: assistantText, toolName, toolParams, toolResult: null };
      if (onEvent) onEvent('tool_call', { toolName, toolParams });

      const toolResult = await runTool(toolName, toolParams);
      step.toolResult = toolResult;
      steps.push(step);
      toolsUsed.add(toolName);

      if (onEvent) onEvent('tool_result', { toolName, toolResult });

      messages.push({
        role: 'user',
        content: `Tool result for ${toolName}:\n${JSON.stringify(toolResult, null, 2)}`,
      });
    } else {
      // No tool call and no final answer — treat remaining text as the answer
      answer = assistantText.trim();
      if (onEvent) onEvent('final', { answer });
      break;
    }
  }

  if (!answer) {
    answer = 'I was unable to complete the analysis within the allowed steps. Please try rephrasing your question.';
  }

  return { answer, steps, toolsUsed: Array.from(toolsUsed) };
}

module.exports = { execute };

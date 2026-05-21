const Anthropic = require('@anthropic-ai/sdk');
const config = require('../config');

const client = new Anthropic({ apiKey: config.anthropic.apiKey });

async function plan(query) {
  try {
    const result = await client.messages.create({
      model: config.anthropic.model,
      max_tokens: 512,
      system: `You are a healthcare query planner. Break complex healthcare queries into 1-3 focused sub-tasks.
Return ONLY a JSON array of sub-task strings. Examples:
- Simple query → ["answer the question directly"]
- Drug + cost query → ["look up drug information", "check formulary and copay"]
- Multi-part query → ["address part 1", "address part 2", "combine findings"]

Keep sub-tasks concise and actionable. Never return more than 3 sub-tasks.`,
      messages: [
        {
          role: 'user',
          content: `Break this healthcare query into sub-tasks:\n\n${query}`,
        },
      ],
    });

    const text = result.content[0].text.trim();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const tasks = JSON.parse(jsonMatch[0]);
      if (Array.isArray(tasks) && tasks.length > 0) {
        return tasks.slice(0, 3);
      }
    }
  } catch (err) {
    // Fall back to treating the query as a single task
  }

  return [query];
}

module.exports = { plan };

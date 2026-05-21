const Anthropic = require('@anthropic-ai/sdk');
const config = require('../config');

const client = new Anthropic({ apiKey: config.anthropic.apiKey });

const DOSAGE_PATTERN = /\b\d+\.?\d*\s*(?:mg|mcg|g|ml|units?|iu)\b/i;

const DISCLAIMER =
  '\n\n⚕️ This information is for educational purposes only. Always consult a qualified healthcare professional before making medical decisions.';

const DOSAGE_WARNING =
  '\n\n⚠️ Dosage information varies by individual. Never self-medicate based on AI responses.';

async function validate(response) {
  const hasDosage = DOSAGE_PATTERN.test(response);

  let flagged = false;
  let concerns = [];

  try {
    const result = await client.messages.create({
      model: config.anthropic.model,
      max_tokens: 512,
      system: `You are a healthcare content safety reviewer. Analyze the given response for safety concerns.
Return ONLY valid JSON with this structure:
{
  "flagged": boolean,
  "concerns": string[]
}

Flag content that:
- Provides specific medical diagnoses
- Gives prescriptive treatment plans without professional consultation disclaimers
- Contains harmful or dangerous medical advice
- Makes definitive claims about a patient's condition

Do NOT flag general educational information about drugs, costs, or insurance.`,
      messages: [
        {
          role: 'user',
          content: `Review this healthcare response for safety:\n\n${response}`,
        },
      ],
    });

    const text = result.content[0].text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      flagged = parsed.flagged || false;
      concerns = parsed.concerns || [];
    }
  } catch (err) {
    // Safety check failed silently — still apply disclaimer
    concerns = ['Safety validation unavailable'];
  }

  const safetyApplied = flagged || hasDosage;
  let finalResponse = response + DISCLAIMER;
  if (hasDosage) {
    finalResponse += DOSAGE_WARNING;
  }

  return {
    response: finalResponse,
    safetyApplied,
    hadDosageWarning: hasDosage,
    concerns,
    flagged,
  };
}

module.exports = { validate };

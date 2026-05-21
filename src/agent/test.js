require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const memory = require('../memory/sessionMemory');
const Orchestrator = require('./orchestrator');

const TEST_QUERIES = [
  'What are the side effects of Metformin?',
  'What tier is Lipitor in my formulary and what\'s the copay?',
  'I\'ve spent $1200 of my $3000 deductible. How much is left?',
];

async function runTest(query, index) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TEST ${index + 1}: ${query}`);
  console.log('='.repeat(60));

  const orchestrator = new Orchestrator();
  const sessionId = uuidv4();

  orchestrator.on('thought', ({ message, subTasks }) => {
    console.log(`\n[THOUGHT] ${message}`);
    if (subTasks) console.log('  Sub-tasks:', subTasks);
  });

  orchestrator.on('tool_call', ({ toolName, toolParams }) => {
    console.log(`[TOOL CALL] ${toolName}(${JSON.stringify(toolParams)})`);
  });

  orchestrator.on('tool_result', ({ toolName, toolResult }) => {
    const preview = JSON.stringify(toolResult).slice(0, 120);
    console.log(`[TOOL RESULT] ${toolName}: ${preview}...`);
  });

  orchestrator.on('final', ({ answer }) => {
    console.log(`[FINAL] ${answer.slice(0, 100)}...`);
  });

  try {
    const result = await orchestrator.run(query, sessionId);

    console.log('\n--- RESPONSE ---');
    console.log(result.answer);
    console.log('\n--- METADATA ---');
    console.log(`Tools used: ${result.toolsUsed.join(', ') || 'none'}`);
    console.log(`Safety applied: ${result.safetyApplied}`);
    if (result.concerns.length > 0) {
      console.log(`Safety concerns: ${result.concerns.join(', ')}`);
    }

    return { success: true, query, answer: result.answer };
  } catch (err) {
    console.error(`[ERROR] ${err.message}`);
    return { success: false, query, error: err.message };
  }
}

async function main() {
  console.log('HealthGuide AI — Test Suite');
  console.log(`Model: ${process.env.CLAUDE_MODEL || 'claude-opus-4-7'}`);
  console.log(`Running ${TEST_QUERIES.length} test queries...\n`);

  await memory.connect();

  const results = [];
  for (let i = 0; i < TEST_QUERIES.length; i++) {
    const result = await runTest(TEST_QUERIES[i], i);
    results.push(result);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  results.forEach((r, i) => {
    const status = r.success ? 'PASS' : 'FAIL';
    console.log(`[${status}] Test ${i + 1}: ${r.query}`);
    if (!r.success) console.log(`       Error: ${r.error}`);
  });

  const passed = results.filter((r) => r.success).length;
  console.log(`\nResults: ${passed}/${results.length} passed`);

  process.exit(passed === results.length ? 0 : 1);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

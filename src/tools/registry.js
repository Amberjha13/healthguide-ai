const { webSearch } = require('./webSearch');
const { drugLookup } = require('./drugLookup');
const { pbmLookup } = require('./pbmLookup');
const { calculate } = require('./calculator');

const registry = {
  web_search: {
    fn: webSearch,
    description: 'Search the web for current healthcare information, drug news, or medical guidelines.',
    params: 'query (string): the search query',
  },
  drug_lookup: {
    fn: drugLookup,
    description: 'Look up FDA drug label information including indications, warnings, side effects, and interactions.',
    params: 'drugName (string): brand or generic drug name',
  },
  pbm_lookup: {
    fn: pbmLookup,
    description: 'Look up drug formulary tier, copay, and prior authorization requirements from the PBM database.',
    params: 'drugName (string): drug name; planType (string, optional): hmo|ppo|hdhp (default: ppo)',
  },
  calculator: {
    fn: calculate,
    description: 'Calculate healthcare costs: copay, deductible status, out-of-pocket max, or annual drug cost.',
    params: 'operation (string): copay|deductible|outOfPocketMax|annualCost|planDefaults; see tool for additional params per operation',
  },
};

function getToolDescriptions() {
  return Object.entries(registry)
    .map(([name, tool]) => `- ${name}: ${tool.description}\n  Params: ${tool.params}`)
    .join('\n');
}

async function runTool(toolName, params) {
  const tool = registry[toolName];
  if (!tool) {
    return { error: `Unknown tool: ${toolName}. Available tools: ${Object.keys(registry).join(', ')}` };
  }
  try {
    return await tool.fn(params);
  } catch (err) {
    return { error: `Tool ${toolName} failed: ${err.message}` };
  }
}

module.exports = { registry, getToolDescriptions, runTool };

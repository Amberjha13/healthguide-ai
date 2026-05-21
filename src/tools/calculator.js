const PLAN_DEFAULTS = {
  hmo: { deductible: 1500, outOfPocketMax: 5000, coinsurance: 0.2 },
  ppo: { deductible: 2000, outOfPocketMax: 7000, coinsurance: 0.25 },
  hdhp: { deductible: 3000, outOfPocketMax: 9000, coinsurance: 0.3 },
};

function calculateCopay({ drugTier, planType = 'ppo', copayOverride }) {
  if (copayOverride != null) return copayOverride;
  const copayTable = {
    hmo: { 1: 10, 2: 35, 3: 65, 4: 100 },
    ppo: { 1: 15, 2: 45, 3: 80, 4: 120 },
    hdhp: { 1: 20, 2: 55, 3: 95, 4: 150 },
  };
  const plan = copayTable[planType] || copayTable.ppo;
  return plan[drugTier] || plan[1];
}

function calculateDeductible({ spent, total }) {
  const remaining = Math.max(0, total - spent);
  const percentMet = total > 0 ? Math.round((spent / total) * 100) : 0;
  return { spent, total, remaining, percentMet };
}

function calculateOutOfPocketMax({ spent, total }) {
  const remaining = Math.max(0, total - spent);
  const percentMet = total > 0 ? Math.round((spent / total) * 100) : 0;
  return { spent, total, remaining, percentMet };
}

function calculateAnnualCost({ copay, refillsPerYear = 12, deductibleContribution = 0 }) {
  const annualCopay = copay * refillsPerYear;
  const annualCost = annualCopay + deductibleContribution;
  return { copay, refillsPerYear, annualCopay, deductibleContribution, annualCost };
}

async function calculate(params) {
  const { operation, planType } = params;

  if (operation === 'copay') {
    const copay = calculateCopay(params);
    return {
      operation: 'copay',
      result: copay,
      details: `Copay for tier ${params.drugTier} on ${planType || 'ppo'} plan: $${copay}`,
    };
  }

  if (operation === 'deductible') {
    const result = calculateDeductible(params);
    return {
      operation: 'deductible',
      result,
      details: `Deductible: $${result.spent} spent of $${result.total} total. $${result.remaining} remaining (${result.percentMet}% met).`,
    };
  }

  if (operation === 'outOfPocketMax') {
    const result = calculateOutOfPocketMax(params);
    return {
      operation: 'outOfPocketMax',
      result,
      details: `Out-of-pocket max: $${result.spent} spent of $${result.total} total. $${result.remaining} remaining (${result.percentMet}% met).`,
    };
  }

  if (operation === 'annualCost') {
    const result = calculateAnnualCost(params);
    return {
      operation: 'annualCost',
      result,
      details: `Annual drug cost: ${result.refillsPerYear} refills × $${result.copay} copay = $${result.annualCopay} + $${result.deductibleContribution} deductible contribution = $${result.annualCost} total.`,
    };
  }

  if (operation === 'planDefaults') {
    const plan = PLAN_DEFAULTS[planType] || PLAN_DEFAULTS.ppo;
    return {
      operation: 'planDefaults',
      result: plan,
      details: `${planType || 'ppo'} plan defaults: deductible $${plan.deductible}, OOP max $${plan.outOfPocketMax}, coinsurance ${plan.coinsurance * 100}%.`,
    };
  }

  return { error: `Unknown operation: ${operation}. Valid: copay, deductible, outOfPocketMax, annualCost, planDefaults` };
}

module.exports = { calculate };

const FORMULARY = {
  metformin: {
    brandName: 'Glucophage',
    genericName: 'metformin',
    tier: 1,
    copay: { hmo: 10, ppo: 15, hdhp: 20 },
    priorAuthRequired: false,
    alternatives: ['metformin ER'],
    notes: 'Preferred generic. Available as extended-release.',
  },
  lipitor: {
    brandName: 'Lipitor',
    genericName: 'atorvastatin',
    tier: 2,
    copay: { hmo: 35, ppo: 45, hdhp: 55 },
    priorAuthRequired: false,
    alternatives: ['atorvastatin (generic)', 'rosuvastatin'],
    notes: 'Generic atorvastatin available at Tier 1.',
  },
  lisinopril: {
    brandName: 'Zestril',
    genericName: 'lisinopril',
    tier: 1,
    copay: { hmo: 10, ppo: 15, hdhp: 20 },
    priorAuthRequired: false,
    alternatives: ['enalapril', 'ramipril'],
    notes: 'Preferred generic ACE inhibitor.',
  },
  synthroid: {
    brandName: 'Synthroid',
    genericName: 'levothyroxine',
    tier: 2,
    copay: { hmo: 35, ppo: 45, hdhp: 55 },
    priorAuthRequired: false,
    alternatives: ['levothyroxine (generic)'],
    notes: 'Generic levothyroxine available at Tier 1. Brand preferred for some patients.',
  },
  humira: {
    brandName: 'Humira',
    genericName: 'adalimumab',
    tier: 4,
    copay: { hmo: 100, ppo: 120, hdhp: 150 },
    priorAuthRequired: true,
    alternatives: ['Hadlima', 'Hyrimoz', 'Cyltezo (biosimilars)'],
    notes: 'Prior authorization required. Biosimilars may be covered at lower tier.',
  },
  eliquis: {
    brandName: 'Eliquis',
    genericName: 'apixaban',
    tier: 3,
    copay: { hmo: 65, ppo: 80, hdhp: 95 },
    priorAuthRequired: false,
    alternatives: ['warfarin (Tier 1)', 'rivaroxaban'],
    notes: 'No generic available. Manufacturer copay assistance may apply.',
  },
  jardiance: {
    brandName: 'Jardiance',
    genericName: 'empagliflozin',
    tier: 3,
    copay: { hmo: 65, ppo: 80, hdhp: 95 },
    priorAuthRequired: false,
    alternatives: ['metformin (Tier 1)', 'dapagliflozin'],
    notes: 'SGLT-2 inhibitor with cardiovascular and renal benefits.',
  },
  ozempic: {
    brandName: 'Ozempic',
    genericName: 'semaglutide',
    tier: 4,
    copay: { hmo: 100, ppo: 120, hdhp: 150 },
    priorAuthRequired: true,
    alternatives: ['Rybelsus (oral semaglutide)', 'dulaglutide (Trulicity)'],
    notes: 'Prior authorization required. Manufacturer savings program available.',
  },
  xarelto: {
    brandName: 'Xarelto',
    genericName: 'rivaroxaban',
    tier: 3,
    copay: { hmo: 65, ppo: 80, hdhp: 95 },
    priorAuthRequired: false,
    alternatives: ['warfarin (Tier 1)', 'apixaban'],
    notes: 'No generic available. Check manufacturer copay card.',
  },
  nexium: {
    brandName: 'Nexium',
    genericName: 'esomeprazole',
    tier: 2,
    copay: { hmo: 35, ppo: 45, hdhp: 55 },
    priorAuthRequired: false,
    alternatives: ['omeprazole (Tier 1)', 'pantoprazole (Tier 1)'],
    notes: 'Generic esomeprazole and omeprazole available at lower tiers.',
  },
};

async function pbmLookup({ drugName, planType = 'ppo' }) {
  const key = drugName.toLowerCase().trim();
  let drug = FORMULARY[key];

  if (!drug) {
    // Search by brand or generic name
    drug = Object.values(FORMULARY).find(
      (d) =>
        d.brandName.toLowerCase() === key ||
        d.genericName.toLowerCase() === key
    );
  }

  if (!drug) {
    return {
      found: false,
      drugName,
      message: `${drugName} not found in formulary. Please check the drug name or consult your plan's formulary.`,
    };
  }

  const copay = drug.copay[planType] || drug.copay.ppo;

  return {
    found: true,
    brandName: drug.brandName,
    genericName: drug.genericName,
    tier: drug.tier,
    copay,
    planType,
    priorAuthRequired: drug.priorAuthRequired,
    alternatives: drug.alternatives,
    notes: drug.notes,
    summary: `${drug.brandName} (${drug.genericName}) is Tier ${drug.tier} on your ${planType.toUpperCase()} plan with a $${copay} copay.${drug.priorAuthRequired ? ' Prior authorization required.' : ''}`,
  };
}

module.exports = { pbmLookup };

const axios = require('axios');

const FDA_BASE = 'https://api.fda.gov/drug/label.json';

function truncate(str, maxLen = 500) {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen) + '...' : str;
}

function extractField(result, ...fieldNames) {
  for (const field of fieldNames) {
    if (result[field] && Array.isArray(result[field]) && result[field].length > 0) {
      return result[field][0];
    }
  }
  return null;
}

async function fetchFromFDA(searchQuery) {
  const response = await axios.get(FDA_BASE, {
    params: { search: searchQuery, limit: 1 },
    timeout: 8000,
  });
  return response.data.results[0];
}

async function drugLookup({ drugName }) {
  let result = null;

  try {
    result = await fetchFromFDA(`openfda.brand_name:"${drugName}"`);
  } catch (err) {
    // Brand name not found, try generic name
    try {
      result = await fetchFromFDA(`openfda.generic_name:"${drugName}"`);
    } catch (err2) {
      // Try broad search
      try {
        result = await fetchFromFDA(`openfda.substance_name:"${drugName}"`);
      } catch (err3) {
        return {
          found: false,
          drugName,
          error: 'Drug not found in FDA database. Please verify the drug name.',
        };
      }
    }
  }

  if (!result) {
    return { found: false, drugName, error: 'No FDA label data available for this drug.' };
  }

  const openfda = result.openfda || {};

  const warnings = truncate(extractField(result, 'warnings', 'warnings_and_cautions', 'boxed_warning'));
  const indications = truncate(extractField(result, 'indications_and_usage', 'purpose'));
  const interactions = truncate(extractField(result, 'drug_interactions'));
  const adverseReactions = truncate(extractField(result, 'adverse_reactions'), 400);
  const dosage = truncate(extractField(result, 'dosage_and_administration'), 400);
  const contraindications = truncate(extractField(result, 'contraindications'));

  return {
    found: true,
    drugName,
    brandNames: openfda.brand_name || [],
    genericNames: openfda.generic_name || [],
    manufacturerName: openfda.manufacturer_name ? openfda.manufacturer_name[0] : null,
    routeOfAdministration: openfda.route || [],
    indications,
    warnings,
    adverseReactions,
    dosage,
    interactions,
    contraindications,
    summary: `FDA label data for ${drugName}. ${indications ? 'Used for: ' + indications.slice(0, 150) + '...' : ''}`,
  };
}

module.exports = { drugLookup };

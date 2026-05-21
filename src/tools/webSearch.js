const axios = require('axios');
const config = require('../config');

async function webSearch({ query }) {
  if (!config.tavily.apiKey) {
    return {
      found: false,
      query,
      error: 'Tavily API key not configured. Set TAVILY_API_KEY in .env to enable web search.',
    };
  }

  try {
    const response = await axios.post(
      'https://api.tavily.com/search',
      {
        api_key: config.tavily.apiKey,
        query,
        search_depth: 'basic',
        include_answer: true,
        max_results: 3,
      },
      { timeout: 10000 }
    );

    const data = response.data;
    const results = (data.results || []).slice(0, 3).map((r) => ({
      title: r.title,
      url: r.url,
      content: r.content ? r.content.slice(0, 300) : '',
    }));

    return {
      found: true,
      query,
      answer: data.answer || null,
      results,
      summary: data.answer || (results.length > 0 ? results[0].content : 'No results found.'),
    };
  } catch (err) {
    return {
      found: false,
      query,
      error: `Web search failed: ${err.message}`,
    };
  }
}

module.exports = { webSearch };

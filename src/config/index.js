require('dotenv').config();

module.exports = {
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: process.env.CLAUDE_MODEL || 'claude-opus-4-7',
  },
  tavily: {
    apiKey: process.env.TAVILY_API_KEY,
  },
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/healthguide',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  },
  port: parseInt(process.env.PORT || '3001', 10),
};

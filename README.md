# HealthGuide AI

AI-powered healthcare guidance agent using a ReAct loop architecture.

## Setup

1. Copy `.env.example` to `.env` and fill in your API keys:
   ```bash
   cp .env.example .env
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run tests:
   ```bash
   npm test
   ```

4. Start the server:
   ```bash
   npm start
   ```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key |
| `TAVILY_API_KEY` | No | Tavily search API key (web_search tool disabled without it) |
| `MONGODB_URI` | No | MongoDB connection string (defaults to localhost, gracefully skipped if unavailable) |
| `CLAUDE_MODEL` | No | Claude model (defaults to `claude-opus-4-7`) |
| `PORT` | No | Server port (defaults to 3000) |

## API

### POST /api/chat
Streams agent events via SSE.

```json
{ "query": "What are the side effects of Metformin?", "sessionId": "optional-session-id" }
```

Events: `thought`, `tool_call`, `tool_result`, `final`, `done`, `error`

### GET /api/health
Returns server status.

### GET /api/sessions/:sessionId
Returns session history (requires MongoDB).

## Tools

- **drug_lookup** — FDA drug label data (indications, warnings, interactions)
- **pbm_lookup** — Formulary tier, copay, prior auth for 10 common drugs
- **calculator** — Copay, deductible, OOP max, annual cost calculations
- **web_search** — Tavily web search for current healthcare information

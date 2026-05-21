/**
 * Week 4 integration test — uses in-memory MongoDB so no local mongod needed.
 * Run: node src/test-w4.js
 */
require('dotenv').config();
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

const TEST_PORT = 3099;
const BASE = `http://localhost:${TEST_PORT}`;

let mongod;
let server;

async function setup() {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.PORT = String(TEST_PORT);
  process.env.JWT_SECRET = 'test-secret-week4';

  // Re-require server after env is set
  server = require('./server');
  // Give express a moment to bind
  await new Promise((r) => setTimeout(r, 800));
}

async function teardown() {
  await mongoose.disconnect();
  await mongod.stop();
  process.exit(0);
}

async function req(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}

async function ssePost(path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  // parse SSE lines
  const events = [];
  for (const line of text.split('\n')) {
    if (line.startsWith('data: ')) {
      try { events.push(JSON.parse(line.slice(6))); } catch {}
    }
  }
  return events;
}

function pass(label) { console.log(`  ✅  ${label}`); }
function fail(label, detail) { console.log(`  ❌  ${label}: ${detail}`); }

async function run() {
  console.log('\n═══════════════════════════════════════');
  console.log('  HealthGuide AI — Week 4 Integration Test');
  console.log('═══════════════════════════════════════\n');

  await setup();
  console.log('  MongoDB in-memory: started');
  console.log(`  Backend: http://localhost:${TEST_PORT}\n`);

  // ── Test 1: Register ──────────────────────────────────────
  console.log('── Test 1: Register new user ──');
  const reg = await req('POST', '/api/auth/register', { username: 'testuser', password: 'pass123' });
  console.log(`  Status: ${reg.status}`);
  console.log(`  Response: ${JSON.stringify(reg.data)}`);
  if (reg.status === 201 && reg.data.token) {
    pass('Register returned 201 with token');
  } else {
    fail('Register', `Expected 201, got ${reg.status}`);
  }
  const token = reg.data.token;
  console.log(`  Token: ${token ? token.slice(0, 30) + '...' : 'MISSING'}\n`);

  // ── Test 2: Login ─────────────────────────────────────────
  console.log('── Test 2: Login with same user ──');
  const login = await req('POST', '/api/auth/login', { username: 'testuser', password: 'pass123' });
  console.log(`  Status: ${login.status}`);
  console.log(`  Response: ${JSON.stringify({ ...login.data, token: login.data.token?.slice(0, 20) + '...' })}`);
  if (login.status === 200 && login.data.token) {
    pass('Login returned 200 with token');
  } else {
    fail('Login', `Expected 200, got ${login.status}`);
  }
  console.log();

  // ── Test 3: Emergency query ───────────────────────────────
  console.log('── Test 3: Emergency query — "I have chest pain" ──');
  const emergencyEvents = await ssePost('/api/chat', { query: 'I have chest pain' }, token);
  const emergencyFinal = emergencyEvents.find((e) => e.type === 'final');
  console.log(`  SSE events received: ${emergencyEvents.length}`);
  console.log(`  Final response: ${emergencyFinal?.content || 'NOT FOUND'}`);
  if (emergencyFinal?.content?.includes('🚨')) {
    pass('Emergency flag triggered — agent bypassed, 🚨 response returned');
  } else {
    fail('Emergency detection', 'Expected 🚨 in response');
  }
  console.log();

  // ── Test 4: Dosage query ──────────────────────────────────
  console.log('── Test 4: Dosage query — "What is the dosage of Metformin?" ──');
  console.log('  (calling Claude API — this may take 20-40s)\n');
  const dosageEvents = await ssePost(
    '/api/chat',
    { query: 'What is the dosage of Metformin?' },
    token
  );
  const dosageFinal = dosageEvents.find((e) => e.type === 'final');
  console.log(`  SSE events received: ${dosageEvents.length}`);
  const dosageContent = dosageFinal?.content || '';
  console.log(`  Final answer (first 200 chars): ${dosageContent.slice(0, 200)}`);
  if (dosageContent.includes('⚕️')) {
    pass('Medical disclaimer ⚕️ appended');
  } else {
    fail('Disclaimer', 'Missing ⚕️');
  }
  if (dosageContent.includes('⚠️ Dosage information')) {
    pass('Dosage warning ⚠️ appended');
  } else {
    fail('Dosage warning', 'Missing ⚠️ dosage text');
  }
  console.log();

  // ── Test 5: Normal query ──────────────────────────────────
  console.log('── Test 5: Normal query — "What are Lipitor side effects?" ──');
  console.log('  (calling Claude API — this may take 20-40s)\n');
  const normalEvents = await ssePost(
    '/api/chat',
    { query: 'What are Lipitor side effects?' },
    token
  );
  const normalFinal = normalEvents.find((e) => e.type === 'final');
  const normalContent = normalFinal?.content || '';
  console.log(`  SSE events received: ${normalEvents.length}`);
  console.log(`  Final answer (first 200 chars): ${normalContent.slice(0, 200)}`);
  if (normalContent.includes('⚕️')) {
    pass('Disclaimer ⚕️ present on normal response');
  } else {
    fail('Disclaimer', 'Missing ⚕️');
  }
  console.log();

  // ── Test 6: Audit log ─────────────────────────────────────
  console.log('── Test 6: MongoDB audits collection ──');
  const { Audit } = require('./memory/auditLog');
  const audits = await Audit.find().lean();
  console.log(`  Audit records found: ${audits.length}`);
  audits.forEach((a, i) => {
    console.log(`  [${i + 1}] query="${a.query.slice(0, 40)}" emergency=${a.hadEmergencyFlag} dosage=${a.hadDosageWarning} tools=${JSON.stringify(a.toolsUsed)}`);
  });
  if (audits.length >= 3) {
    pass(`${audits.length} audit records saved`);
  } else {
    fail('Audit count', `Expected >=3, found ${audits.length}`);
  }

  // ── Test 7: Unauthorized access ───────────────────────────
  console.log('\n── Test 7: Protected route without token ──');
  const unauth = await req('GET', '/api/sessions');
  console.log(`  Status: ${unauth.status}, body: ${JSON.stringify(unauth.data)}`);
  if (unauth.status === 401) {
    pass('Unauthenticated request correctly rejected with 401');
  } else {
    fail('Auth guard', `Expected 401, got ${unauth.status}`);
  }

  console.log('\n═══════════════════════════════════════');
  console.log('  All tests complete');
  console.log('═══════════════════════════════════════\n');

  await teardown();
}

run().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});

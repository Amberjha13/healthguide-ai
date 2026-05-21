const BASE = '/api';

export async function fetchSessions() {
  const res = await fetch(`${BASE}/sessions`);
  if (!res.ok) throw new Error(`Sessions unavailable (${res.status})`);
  return res.json();
}

export async function fetchSession(sessionId) {
  const res = await fetch(`${BASE}/sessions/${sessionId}`);
  if (!res.ok) throw new Error(`Session not found (${res.status})`);
  return res.json();
}

export async function deleteSession(sessionId) {
  const res = await fetch(`${BASE}/sessions/${sessionId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Delete failed (${res.status})`);
  return res.json();
}

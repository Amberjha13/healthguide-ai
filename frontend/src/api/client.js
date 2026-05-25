const BASE = (import.meta.env.VITE_API_URL || '') + '/api';

function authHeaders() {
  const token = localStorage.getItem('hg_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchSessions() {
  const res = await fetch(`${BASE}/sessions`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Sessions unavailable (${res.status})`);
  return res.json();
}

export async function fetchSession(sessionId) {
  const res = await fetch(`${BASE}/sessions/${sessionId}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Session not found (${res.status})`);
  return res.json();
}

export async function deleteSession(sessionId) {
  const res = await fetch(`${BASE}/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Delete failed (${res.status})`);
  return res.json();
}

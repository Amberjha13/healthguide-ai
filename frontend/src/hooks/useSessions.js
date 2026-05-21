import { useState, useEffect, useCallback } from 'react';
import { fetchSessions } from '../api/client.js';

export function useSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSessions();
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { sessions, loading, error, reload: load };
}

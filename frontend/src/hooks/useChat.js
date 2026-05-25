import { useState, useRef, useCallback } from 'react';

const BASE = (import.meta.env.VITE_API_URL || '') + '/api';

function authHeaders() {
  const token = localStorage.getItem('hg_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [thoughts, setThoughts] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  const abortRef = useRef(null);
  const isThinkingRef = useRef(false);
  const sessionIdRef = useRef(null);

  const sendQuery = useCallback(async (query) => {
    if (isThinkingRef.current) return;

    let sid = sessionIdRef.current;
    if (!sid) {
      sid = crypto.randomUUID();
      setSessionId(sid);
      sessionIdRef.current = sid;
    }

    setMessages((prev) => [...prev, { role: 'user', content: query, id: `u-${Date.now()}` }]);
    setThoughts([]);
    setIsThinking(true);
    isThinkingRef.current = true;
    setError(null);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(`${BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ query, sessionId: sid }),
        signal: controller.signal,
      });

      if (!response.body) throw new Error('No response body from server');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const evt = JSON.parse(line.slice(6));

            if (evt.type === 'thought') {
              setThoughts((prev) => [
                ...prev,
                { type: 'thought', content: evt.content, id: `t-${Date.now()}-${Math.random()}` },
              ]);
            } else if (evt.type === 'tool_call') {
              setThoughts((prev) => [
                ...prev,
                {
                  type: 'tool_call',
                  toolName: evt.toolName,
                  params: evt.params,
                  status: 'running',
                  id: `tc-${Date.now()}-${Math.random()}`,
                },
              ]);
            } else if (evt.type === 'tool_result') {
              setThoughts((prev) => {
                const reversed = [...prev].reverse();
                const idx = reversed.findIndex(
                  (t) => t.type === 'tool_call' && t.toolName === evt.toolName && t.status === 'running'
                );
                if (idx === -1) return prev;
                const actualIdx = prev.length - 1 - idx;
                return prev.map((t, i) => (i === actualIdx ? { ...t, status: 'done' } : t));
              });
            } else if (evt.type === 'final') {
              setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: evt.content, id: `a-${Date.now()}` },
              ]);
            } else if (evt.type === 'error') {
              setError(evt.message);
            }
          } catch {
            // ignore malformed SSE lines
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message);
    } finally {
      setIsThinking(false);
      isThinkingRef.current = false;
    }
  }, []);

  const clearSession = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setThoughts([]);
    setIsThinking(false);
    isThinkingRef.current = false;
    setError(null);
    setSessionId(null);
    sessionIdRef.current = null;
  }, []);

  const loadSession = useCallback((session) => {
    abortRef.current?.abort();
    setSessionId(session.sessionId);
    sessionIdRef.current = session.sessionId;
    const msgs = [{ role: 'user', content: session.query, id: `u-${session.sessionId}` }];
    if (session.finalAnswer) {
      msgs.push({ role: 'assistant', content: session.finalAnswer, id: `a-${session.sessionId}` });
    }
    setMessages(msgs);
    setThoughts([]);
    setIsThinking(false);
    isThinkingRef.current = false;
    setError(null);
  }, []);

  return { messages, thoughts, isThinking, error, sessionId, sendQuery, clearSession, loadSession };
}

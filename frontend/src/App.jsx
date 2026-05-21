import { useState } from 'react';
import SessionSidebar from './components/SessionSidebar.jsx';
import ChatWindow from './components/ChatWindow.jsx';
import ThoughtStream from './components/ThoughtStream.jsx';
import InputBar from './components/InputBar.jsx';
import { useChat } from './hooks/useChat.js';
import { useSessions } from './hooks/useSessions.js';
import { fetchSession } from './api/client.js';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const chat = useChat();
  const { sessions, loading: sessionsLoading, reload: reloadSessions } = useSessions();

  async function handleSelectSession(session) {
    try {
      const detail = await fetchSession(session.sessionId);
      chat.loadSession(detail);
    } catch {
      chat.loadSession(session);
    }
  }

  async function handleSendQuery(query) {
    await chat.sendQuery(query);
    reloadSessions();
  }

  function handleNewChat() {
    chat.clearSession();
  }

  return (
    <div className={`app-container${sidebarOpen ? ' sidebar-open' : ''}`}>
      <SessionSidebar
        open={sidebarOpen}
        sessions={sessions}
        loading={sessionsLoading}
        activeSessionId={chat.sessionId}
        onSelect={handleSelectSession}
        onNewChat={handleNewChat}
        onToggle={() => setSidebarOpen((o) => !o)}
      />

      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="main-panel">
        <div className="chat-header">
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
          <h1 className="app-title">HealthGuide AI</h1>
        </div>

        <ChatWindow
          messages={chat.messages}
          isThinking={chat.isThinking}
          error={chat.error}
          onSampleQuery={handleSendQuery}
        />

        <ThoughtStream thoughts={chat.thoughts} isThinking={chat.isThinking} />

        <InputBar onSend={handleSendQuery} isThinking={chat.isThinking} />
      </div>
    </div>
  );
}

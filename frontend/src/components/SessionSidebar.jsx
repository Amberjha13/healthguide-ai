function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function truncate(str, max) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

export default function SessionSidebar({
  open,
  sessions,
  loading,
  activeSessionId,
  onSelect,
  onNewChat,
  onToggle,
}) {
  return (
    <aside className={`sidebar${open ? ' open' : ''}`}>
      <div className="sidebar-header">
        <span className="sidebar-title">🏥 HealthGuide</span>
        <button className="sidebar-close" onClick={onToggle} aria-label="Close sidebar">
          ✕
        </button>
      </div>

      <button className="new-chat-btn" onClick={onNewChat}>
        + New Chat
      </button>

      <div className="sessions-list">
        {loading && <div className="sessions-status">Loading sessions…</div>}
        {!loading && sessions.length === 0 && (
          <div className="sessions-status">No past sessions</div>
        )}
        {sessions.map((session) => (
          <button
            key={`${session.sessionId}-${session.createdAt}`}
            className={`session-item${session.sessionId === activeSessionId ? ' active' : ''}`}
            onClick={() => onSelect(session)}
          >
            <span className="session-query">{truncate(session.query, 40)}</span>
            <span className="session-date">{formatDate(session.createdAt)}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}

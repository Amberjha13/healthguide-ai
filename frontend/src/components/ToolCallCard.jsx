export default function ToolCallCard({ toolName, params, status }) {
  return (
    <div className="tool-call-card">
      <div className="tool-call-header">
        <span className="thought-icon">🔧</span>
        <code className="tool-name">{toolName}</code>
        <span className={`tool-status ${status}`}>
          {status === 'running' ? 'running...' : 'done'}
        </span>
      </div>
      <pre className="tool-params">{JSON.stringify(params, null, 2)}</pre>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import ToolCallCard from './ToolCallCard.jsx';

export default function ThoughtStream({ thoughts, isThinking }) {
  const [isOpen, setIsOpen] = useState(false);
  const wasThinking = useRef(false);

  useEffect(() => {
    if (isThinking && !wasThinking.current) {
      setIsOpen(true);
    }
    wasThinking.current = isThinking;
  }, [isThinking]);

  if (thoughts.length === 0 && !isThinking) return null;

  const visibleThoughts = thoughts.slice(-5);

  return (
    <div className="thought-stream">
      <button className="thought-stream-header" onClick={() => setIsOpen((o) => !o)}>
        <span className="thought-label">
          {isThinking && <span className="pulse-dot" />}
          Agent thinking...
        </span>
        <span className="collapse-icon">{isOpen ? '▼' : '▲'}</span>
      </button>

      {isOpen && (
        <div className="thought-list">
          {visibleThoughts.map((thought) => (
            <div key={thought.id} className={`thought-item thought-${thought.type}`}>
              {thought.type === 'thought' && (
                <>
                  <span className="thought-icon">🧠</span>
                  <span className="thought-text">{thought.content}</span>
                </>
              )}
              {thought.type === 'tool_call' && (
                <ToolCallCard
                  toolName={thought.toolName}
                  params={thought.params}
                  status={thought.status}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

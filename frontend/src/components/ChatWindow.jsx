import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble.jsx';

const SAMPLE_QUERIES = [
  'What are side effects of Metformin?',
  'What tier is Lipitor and what is my copay?',
  'I spent $800 of $2000 deductible, how much left?',
];

export default function ChatWindow({ messages, isThinking, error, onSampleQuery }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const isEmpty = messages.length === 0 && !isThinking && !error;

  return (
    <div className="chat-window">
      {isEmpty ? (
        <div className="empty-state">
          <div className="empty-icon">🏥</div>
          <h2>HealthGuide AI</h2>
          <p>
            Get accurate information about medications, insurance coverage, and healthcare costs.
          </p>
          <div className="sample-queries">
            {SAMPLE_QUERIES.map((q) => (
              <button key={q} className="sample-query-btn" onClick={() => onSampleQuery(q)}>
                {q}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="messages-container">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {isThinking && (
            <div className="typing-indicator-wrapper">
              <div className="typing-indicator">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}

          {error && <div className="error-message">⚠️ {error}</div>}

          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}

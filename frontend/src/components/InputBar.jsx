import { useState, useRef, useEffect } from 'react';

const MAX = 500;
const WARN = 400;

export default function InputBar({ onSend, isThinking }) {
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || isThinking || trimmed.length > MAX) return;
    onSend(trimmed);
    setValue('');
    setTimeout(() => textareaRef.current?.focus(), 0);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  const len = value.length;
  const isOver = len > MAX;
  const isNear = len >= WARN && !isOver;

  return (
    <div className="input-bar">
      <div className="input-wrapper">
        <textarea
          ref={textareaRef}
          className="query-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about medications, insurance coverage, or healthcare costs…"
          rows={3}
          disabled={isThinking}
        />
        <div className="input-footer">
          <span className={`char-count${isOver ? ' over' : isNear ? ' near' : ''}`}>
            {len}/{MAX}
          </span>
          <button
            className="send-btn"
            onClick={submit}
            disabled={isThinking || !value.trim() || isOver}
          >
            {isThinking ? '⏳' : 'Send →'}
          </button>
        </div>
      </div>
      <p className="input-hint">Enter to send · Shift+Enter for new line</p>
    </div>
  );
}

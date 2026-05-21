function parseInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4)
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2)
      return <em key={i}>{part.slice(1, -1)}</em>;
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2)
      return <code key={i} className="inline-code">{part.slice(1, -1)}</code>;
    return part;
  });
}

function renderMarkdown(content) {
  const lines = content.split('\n');
  const out = [];
  let key = 0;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('## ')) {
      out.push(<h3 key={key++} className="md-h3">{parseInline(line.slice(3))}</h3>);
      i++;
    } else if (line.startsWith('# ')) {
      out.push(<h2 key={key++} className="md-h2">{parseInline(line.slice(2))}</h2>);
      i++;
    } else if (line === '---') {
      out.push(<hr key={key++} className="md-hr" />);
      i++;
    } else if (line.startsWith('- ')) {
      const items = [];
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(<li key={i}>{parseInline(lines[i].slice(2))}</li>);
        i++;
      }
      out.push(<ul key={key++} className="md-ul">{items}</ul>);
    } else if (line.trim() === '') {
      i++;
    } else {
      out.push(<p key={key++} className="md-p">{parseInline(line)}</p>);
      i++;
    }
  }

  return out;
}

export default function MessageBubble({ message }) {
  return (
    <div className={`message-bubble ${message.role}`}>
      <div className="bubble-content">
        {message.role === 'user' ? (
          <p>{message.content}</p>
        ) : (
          <div className="markdown">{renderMarkdown(message.content)}</div>
        )}
      </div>
    </div>
  );
}

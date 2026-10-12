const WHATSAPP_MARKUP = /(```[\s\S]*?```|\*\*[^*\n]+\*\*|\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~)/g;

export function parseWhatsAppFormatting(value) {
  const text = String(value || '');
  const tokens = [];
  let cursor = 0;

  for (const match of text.matchAll(WHATSAPP_MARKUP)) {
    const index = match.index ?? 0;
    if (index > cursor) tokens.push({ type: 'text', value: text.slice(cursor, index) });
    const marked = match[0];
    if (marked.startsWith('```')) tokens.push({ type: 'code', value: marked.slice(3, -3) });
    else if (marked.startsWith('**')) tokens.push({ type: 'bold', value: marked.slice(2, -2) });
    else if (marked.startsWith('*')) tokens.push({ type: 'bold', value: marked.slice(1, -1) });
    else if (marked.startsWith('_')) tokens.push({ type: 'italic', value: marked.slice(1, -1) });
    else tokens.push({ type: 'strike', value: marked.slice(1, -1) });
    cursor = index + marked.length;
  }

  if (cursor < text.length) tokens.push({ type: 'text', value: text.slice(cursor) });
  return tokens.length ? tokens : [{ type: 'text', value: text }];
}

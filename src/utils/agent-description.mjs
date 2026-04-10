function coerceRichText(value) {
  if (value == null) return null;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || null;
  }

  if (Array.isArray(value)) {
    const combined = value
      .map(coerceRichText)
      .filter(Boolean)
      .join('\n\n')
      .trim();
    return combined || null;
  }

  if (typeof value === 'object') {
    for (const key of ['summary', 'description', 'overview', 'text', 'content', 'value', 'markdown']) {
      if (value[key] != null) {
        const next = coerceRichText(value[key]);
        if (next) return next;
      }
    }

    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
}

function stripInlineMarkdown(text) {
  return String(text || '')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function isMarkdownHeading(line) {
  return /^\s*#{1,6}\s+/.test(line);
}

function isNoiseLine(line) {
  const trimmed = String(line || '').trim();
  if (!trimmed) return true;
  if (/^\s*[-*_]{3,}\s*$/.test(trimmed)) return true;
  if (/^\|.*\|\s*$/.test(trimmed)) return true;
  return false;
}

function extractOverviewSection(text) {
  const lines = String(text || '').split('\n');
  const start = lines.findIndex(line => /^\s*#{1,6}\s+overview\b/i.test(line));
  if (start < 0) return null;

  const collected = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (isMarkdownHeading(line)) break;
    collected.push(line);
  }

  const next = collected.join('\n').trim();
  return next || null;
}

function firstMeaningfulParagraph(text) {
  const paragraphs = String(text || '')
    .split(/\n\s*\n/g)
    .map(paragraph => (
      paragraph
        .split('\n')
        .filter(line => !isNoiseLine(line))
        .join(' ')
        .trim()
    ))
    .map(stripInlineMarkdown)
    .filter(Boolean);

  return paragraphs[0] || null;
}

function truncateAtWordBoundary(text, maxLength) {
  if (!Number.isFinite(maxLength) || maxLength <= 0 || text.length <= maxLength) {
    return text;
  }

  const clipped = text.slice(0, maxLength - 1).trimEnd();
  const lastSpace = clipped.lastIndexOf(' ');
  const safe = lastSpace >= Math.floor(maxLength * 0.6)
    ? clipped.slice(0, lastSpace)
    : clipped;
  return `${safe}…`;
}

export function getAgentDescriptionSummary(description, {maxLength = 320} = {}) {
  const richText = coerceRichText(description);
  if (!richText) return null;

  const overview = extractOverviewSection(richText);
  const summary = firstMeaningfulParagraph(overview || richText) || stripInlineMarkdown(richText);
  if (!summary) return null;

  return truncateAtWordBoundary(summary, maxLength);
}

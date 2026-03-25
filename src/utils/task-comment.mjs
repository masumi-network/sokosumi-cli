const FILE_EXTENSION_ALLOWLIST = new Set([
  'png',
  'jpg',
  'jpeg',
  'webp',
  'svg',
  'gif',
  'pdf',
  'txt',
  'md',
  'rtf',
  'csv',
  'json',
  'xml',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'zip',
  'tar',
  'gz',
  'mp3',
  'mp4',
  'wav',
  'mov'
]);

const MARKDOWN_LINK_REGEX = /\[([^\]\n]+)\]\(((?:\\\)|[^)\s])+)(?:\s+"[^"]*")?\)/g;
const AUTO_LINKS_REGEX = /<((?:https?:)\/\/[^>\s]+)>/gi;

function unescapeMarkdownLinkUrl(url) {
  return String(url || '').replace(/\\\)/g, ')');
}

function sanitizeLabel(label, fallback = 'link') {
  const sanitized = String(label || '').replace(/[[\]]/g, '').trim();
  return sanitized || fallback;
}

function normalizeMarkdown(markdown) {
  return String(markdown || '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function isHttpUrl(url) {
  return /^https?:\/\//i.test(String(url || ''));
}

function getExtensionFromUrl(url) {
  try {
    const pathname = new URL(url).pathname;
    const last = pathname.split('/').pop() || '';
    const parts = last.split('.');
    return parts.length > 1 ? String(parts.pop()).toLowerCase() : '';
  } catch {
    const last = String(url || '').split('/').pop() || '';
    const parts = last.split('.');
    return parts.length > 1 ? String(parts.pop()).toLowerCase() : '';
  }
}

export function isFileLikeUrl(url) {
  if (!isHttpUrl(url)) return false;

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    if (parsed.hash) {
      return false;
    }
  } catch {
    return false;
  }

  const extension = getExtensionFromUrl(url);
  return Boolean(extension) && FILE_EXTENSION_ALLOWLIST.has(extension);
}

export function getFileNameFromUrl(url) {
  try {
    return new URL(url).pathname.split('/').pop() || null;
  } catch {
    return String(url || '').split('/').pop() || null;
  }
}

function getHostFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '') || null;
  } catch {
    return null;
  }
}

function extractLinks(markdown) {
  const text = String(markdown || '');
  const matches = [];

  for (const match of text.matchAll(MARKDOWN_LINK_REGEX)) {
    matches.push({
      label: sanitizeLabel(match[1], 'link'),
      url: unescapeMarkdownLinkUrl(match[2])
    });
  }

  for (const match of text.matchAll(AUTO_LINKS_REGEX)) {
    matches.push({
      label: getHostFromUrl(match[1]) || match[1],
      url: match[1]
    });
  }

  return matches;
}

function stripMarkdown(markdown) {
  return normalizeMarkdown(markdown)
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\s*#{1,6}\s+/gm, '')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function extractTaskCommentArtifacts(comment) {
  const original = normalizeMarkdown(comment);
  if (!original) {
    return {
      body: '',
      plainText: '',
      files: [],
      links: []
    };
  }

  const files = [];
  const links = [];
  const seenFiles = new Set();
  const seenLinks = new Set();

  for (const link of extractLinks(original)) {
    if (!isHttpUrl(link.url)) continue;

    if (isFileLikeUrl(link.url)) {
      if (seenFiles.has(link.url)) continue;
      seenFiles.add(link.url);
      files.push({
        name: sanitizeLabel(link.label, getFileNameFromUrl(link.url) || 'Attachment'),
        url: link.url
      });
      continue;
    }

    if (seenLinks.has(link.url)) continue;
    seenLinks.add(link.url);
    const fallbackLabel = getHostFromUrl(link.url) || 'Link';
    links.push({
      title: sanitizeLabel(link.label, fallbackLabel),
      description: getHostFromUrl(link.url),
      url: link.url
    });
  }

  const body = normalizeMarkdown(
    original.replace(MARKDOWN_LINK_REGEX, (_, label) => sanitizeLabel(label, 'link'))
  );

  return {
    body,
    plainText: stripMarkdown(body),
    files,
    links
  };
}

export function createTaskCommentPreview(comment, maxLength = 160) {
  const {plainText} = extractTaskCommentArtifacts(comment);
  if (!plainText) return '';

  const singleLine = plainText
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .join(' ');

  if (singleLine.length <= maxLength) {
    return singleLine;
  }

  return `${singleLine.slice(0, Math.max(1, maxLength - 1)).trimEnd()}…`;
}

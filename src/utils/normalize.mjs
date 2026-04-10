export function normalizeCapabilities(value) {
  const values = Array.isArray(value) ? value : (value == null ? [] : [value]);
  return values
    .flatMap(item => String(item).split(','))
    .map(item => item.trim())
    .filter(Boolean);
}

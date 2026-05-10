export const STORAGE_KEY = 'ai-scanner:api-keys';

export function loadKeys(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function saveKey(provider: string, key: string) {
  const map = loadKeys();
  map[provider] = key;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function deleteKey(provider: string) {
  const map = loadKeys();
  delete map[provider];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function getKey(provider: string) {
  const map = loadKeys();
  return map[provider] || null;
}

export function maskKey(key: string | null) {
  if (!key) return null;
  if (key.length <= 8) return '•'.repeat(6);
  const last = key.slice(-4);
  return '••••••' + last;
}

// Empty VITE_API_BASE_URL = same-origin relative paths (/api/...) for production.
// Set VITE_API_BASE_URL only when the API runs on a different host (e.g. local dev proxy).
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export function apiUrl(path) {
  if (path.startsWith('http')) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return API_BASE ? `${API_BASE}${normalized}` : normalized;
}

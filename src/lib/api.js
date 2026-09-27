import { getToken } from './auth';
import { apiUrl } from './config';
import { readImageFile } from './avatar';

export { apiUrl } from './config';

export async function authFetch(input, init = {}) {
  const token = getToken();
  const headers = new Headers(init.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(apiUrl(input), { ...init, headers });
  if (!res.ok) {
    let msg = 'Request failed';
    try {
      const j = await res.json();
      msg = j.error || msg;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return res.json();
}

async function uploadAvatarImage(path, file) {
  const image = await readImageFile(file);
  return authFetch(path, { method: 'POST', body: JSON.stringify({ image }) });
}

export const api = {
  get: (path) => authFetch(path),
  post: (path, body) => authFetch(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => authFetch(path, { method: 'PUT', body: JSON.stringify(body) }),
  del: (path, body = {}) => authFetch(path, { method: 'DELETE', body: JSON.stringify(body) }),
  uploadMyAvatar: (file) => uploadAvatarImage('/api/me/avatar', file),
  uploadProfileAvatar: (profileId, file) => uploadAvatarImage(`/api/profiles/${profileId}/avatar`, file),
  uploadProfileAvatarImage: (profileId, image) =>
    authFetch(`/api/profiles/${profileId}/avatar`, { method: 'POST', body: JSON.stringify({ image }) }),
};

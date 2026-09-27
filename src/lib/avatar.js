import { apiUrl } from './config';

export function avatarFallback(name, colors = '2563EB,0EA5E9,0F172A') {
  const seed = encodeURIComponent(name || 'U');
  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=${colors}&fontFamily=Inter&fontWeight=700`;
}

export function hasAvatar(avatarUrl) {
  return Boolean(avatarUrl && typeof avatarUrl === 'string' && avatarUrl.trim());
}

export function resolveAvatarUrl(avatarUrl, name, colors) {
  if (!hasAvatar(avatarUrl)) return avatarFallback(name, colors);
  if (avatarUrl.startsWith('http') || avatarUrl.startsWith('data:')) return avatarUrl;
  return apiUrl(avatarUrl);
}

export function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

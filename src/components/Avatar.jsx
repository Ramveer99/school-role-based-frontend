// import { useEffect, useState } from 'react';
// import { avatarFallback, hasAvatar, resolveAvatarUrl } from '../lib/avatar';

// export function AvatarImg({ src, name, colors, className = '', alt }) {
//   const [failed, setFailed] = useState(false);

//   useEffect(() => {
//     setFailed(false);
//   }, [src, name]);

//   const resolved = !hasAvatar(src) || failed
//     ? avatarFallback(name, colors)
//     : resolveAvatarUrl(src, name, colors);

//   return (
//     <img
//       src={resolved}
//       alt={alt || name || 'Avatar'}
//       className={className}
//       onError={() => setFailed(true)}
//     />
//   );
// }

import { useEffect, useState } from 'react';

import {
  avatarFallback,
  hasAvatar,
  resolveAvatarUrl,
} from '../lib/avatar';

const getInitials = (name = '') => {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (!words.length) return '?';

  // First + second name
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  // Single name
  return words[0][0].toUpperCase();
};

export function AvatarImg({
  src,
  name,
  colors,
  className = '',
  alt,
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src, name]);

  const hasValidAvatar = hasAvatar(src) && !failed;

  if (!hasValidAvatar) {
    return (
      <div
        className={`flex items-center justify-center rounded-full font-semibold ${className}`}
        style={{
          background: colors?.background || '#E5E7EB',
          color: colors?.color || '#374151',
        }}
        aria-label={alt || name || 'Avatar'}
      >
        {getInitials(name)}
      </div>
    );
  }

  return (
    <img
      src={resolveAvatarUrl(src, name, colors)}
      alt={alt || name || 'Avatar'}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}



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

import { useState } from 'react';

import {
  hasAvatar,
  resolveAvatarUrl,
} from '../lib/avatar';

const getInitialLetter = (name = '') => {
  const firstCharacter = String(name).trim()[0];
  return firstCharacter ? firstCharacter.toUpperCase() : '?';
};

export function AvatarImg({
  src,
  name,
  colors,
  className = '',
  alt,
}) {
  const [failedSrc, setFailedSrc] = useState(null);

  const hasValidAvatar = hasAvatar(src) && failedSrc !== src;

  if (!hasValidAvatar) {
    return (
      <div
        className={`flex items-center justify-center font-semibold ${className}`}
        style={{
          background: colors?.background || '#E5E7EB',
          color: colors?.color || '#374151',
        }}
        aria-label={alt || name || 'Avatar'}
      >
        {getInitialLetter(name)}
      </div>
    );
  }

  return (
    <img
      src={resolveAvatarUrl(src, name, colors)}
      alt={alt || name || 'Avatar'}
      className={className}
      onError={() => setFailedSrc(src)}
    />
  );
}

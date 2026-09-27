import { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { resolveAvatarUrl } from '../lib/avatar';

export default function AvatarUpload({
  src,
  name,
  colors,
  size = 'lg',
  onUpload,
  disabled = false,
  className = '',
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const sizeClass =
    size === 'sm' ? 'w-14 h-14 rounded-full' : size === 'md' ? 'w-20 h-20 rounded-2xl' : 'w-24 h-24 rounded-2xl';

  const handleSelect = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !onUpload) return;

    if (!file.type.startsWith('image/')) {
      onUpload(null, new Error('Please choose an image file'));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      onUpload(null, new Error('Image must be smaller than 2MB'));
      return;
    }

    setUploading(true);
    try {
      await onUpload(file);
    } finally {
      setUploading(false);
    }
  };

  const avatarSrc = resolveAvatarUrl(src, name, colors);

  return (
    <div className={`relative inline-flex ${className}`}>
      <img
        src={avatarSrc}
        alt={name || 'Profile'}
        className={`${sizeClass} object-cover border-4 border-white shadow bg-white`}
      />
      {!disabled && onUpload && (
        <>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 w-9 h-9 rounded-xl bg-[#2563EB] text-white shadow-lg flex items-center justify-center hover:bg-[#1D4ED8] disabled:opacity-60"
            aria-label="Upload profile photo"
          >
            <Camera className="w-4 h-4" />
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleSelect}
          />
        </>
      )}
      {uploading && (
        <div className={`absolute inset-0 ${sizeClass} bg-black/40 flex items-center justify-center text-white text-xs font-bold`}>
          ...
        </div>
      )}
    </div>
  );
}

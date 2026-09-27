import ImageUploadField from './ImageUploadField';
import { hasAvatar, resolveAvatarUrl } from '../lib/avatar';

export default function EditPhotoField({ profileId, avatarUrl, avatarImage, name, onChange, onError }) {
  const preview = avatarImage || (hasAvatar(avatarUrl) ? resolveAvatarUrl(avatarUrl, name) : null);

  return (
    <div className="col-span-2">
      <ImageUploadField
        label="Profile Photo"
        preview={preview}
        onChange={(value, error) => {
          if (error) {
            onError?.(error.message);
            return;
          }
          onChange(value);
        }}
      />
      {!profileId && (
        <p className="text-[11px] text-amber-600 mt-1">This record has no login profile, so photo cannot be saved.</p>
      )}
    </div>
  );
}

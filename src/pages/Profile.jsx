import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import AvatarUpload from '../components/AvatarUpload';
import { api } from '../lib/api';

export default function Profile() {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [avatarUrl, setAvatarUrl] = useState(null);

  if (!profile) return null;

  const currentAvatar = avatarUrl || profile.avatar_url;

  const handleUpload = async (file, error) => {
    if (error) {
      toast(error.message, 'error');
      return;
    }

    try {
      const result = await api.uploadMyAvatar(file);
      setAvatarUrl(result.avatar_url);
      await refreshProfile();
      toast('Profile photo updated');
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-[#2563EB] to-[#0EA5E9] relative"></div>
        <div className="px-6 pb-6">
          <div className="flex flex-wrap items-end gap-4 -mt-10 relative z-10">
            <AvatarUpload
              src={currentAvatar}
              name={profile.full_name}
              onUpload={handleUpload}
            />
            <div className="pb-2">
              <div className="font-display font-extrabold text-xl">{profile.full_name}</div>
              <div className="text-sm text-slate-500">
                {profile.role.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())} • {profile.email}
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4">Tap the camera icon to upload a profile photo (JPG, PNG, WEBP, max 2MB).</p>
          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <div className="rounded-2xl bg-[#F8FAFC] border border-slate-200 p-4">
              <div className="text-xs font-bold tracking-widest text-slate-400">EMAIL</div>
              <div className="text-sm font-semibold mt-1">{profile.email}</div>
            </div>
            <div className="rounded-2xl bg-[#F8FAFC] border border-slate-200 p-4">
              <div className="text-xs font-bold tracking-widest text-slate-400">PHONE</div>
              <div className="text-sm font-semibold mt-1">{profile.phone || '—'}</div>
            </div>
            <div className="rounded-2xl bg-[#F8FAFC] border border-slate-200 p-4">
              <div className="text-xs font-bold tracking-widest text-slate-400">ORGANIZATION</div>
              <div className="text-sm font-semibold mt-1">{profile.organization_name || 'Platform-wide'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

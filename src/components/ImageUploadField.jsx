import { readImageFile } from '../lib/avatar';

export default function ImageUploadField({ label, preview, onChange, className = '' }) {
  const handleChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onChange(null, new Error('Please choose an image file'));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      onChange(null, new Error('Image must be smaller than 2MB'));
      return;
    }

    try {
      const dataUrl = await readImageFile(file);
      onChange(dataUrl);
    } catch {
      onChange(null, new Error('Failed to read image file'));
    }
  };

  return (
    <div className={className}>
      <label className="text-xs font-bold text-slate-600">{label}</label>
      <div className="mt-1.5 flex items-center gap-3">
        {preview ? (
          <img src={preview} alt="Preview" className="w-11 h-11 rounded-full object-cover border border-slate-200 bg-white shrink-0" />
        ) : (
          <div className="w-11 h-11 rounded-full border border-dashed border-slate-300 bg-slate-50 shrink-0 flex items-center justify-center text-slate-400">
            <i className="fa-solid fa-image text-sm"></i>
          </div>
        )}
        <label className="flex-1 min-w-0 h-11 px-3 rounded-xl border border-slate-200 text-sm flex items-center cursor-pointer bg-white hover:bg-slate-50">
          <span className="text-slate-500 truncate">{preview ? 'Change photo' : 'Choose photo (JPG, PNG, max 2MB)'}</span>
          <input type="file" accept="image/*" className="hidden" onChange={handleChange} />
        </label>
      </div>
    </div>
  );
}

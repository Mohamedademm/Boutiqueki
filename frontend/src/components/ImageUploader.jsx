import { useRef, useState } from 'react';
import { UploadCloud, X, Loader2, Plus } from 'lucide-react';
import api from '../utils/axios';

/**
 * Drag-&-drop image uploader.
 * Controlled: `value` is an array of image URLs, `onChange(newArray)` updates it.
 * Uploads each file to POST /api/uploads and stores the returned URL.
 *
 *   <ImageUploader value={images} onChange={setImages} max={8} />
 *   <ImageUploader value={logo ? [logo] : []} onChange={a => setLogo(a[0] || '')} max={1} label="Logo" />
 */
const ImageUploader = ({ value = [], onChange, max = 8, label }) => {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(null);

  const remaining = max - value.length;

  const uploadFiles = async (fileList) => {
    const files = Array.from(fileList).slice(0, remaining);
    if (files.length === 0) return;
    setUploading(true);
    setError(null);
    const urls = [];
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        const { data } = await api.post('/uploads', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        if (data?.data?.url) urls.push(data.data.url);
      }
      onChange([...value, ...urls].slice(0, max));
    } catch (err) {
      setError(err.response?.data?.message || "Échec de l'upload.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
  };

  const removeAt = (i) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <div>
      {label && <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{label}</p>}

      {/* Thumbnails */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {value.map((url, i) => (
            <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 group">
              <img src={url} alt={`img-${i}`} className="w-full h-full object-cover" onError={e => { e.target.style.opacity = 0.3; }} />
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {remaining > 0 && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
            dragOver
              ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30'
              : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
          ) : (
            <UploadCloud className="w-6 h-6 text-slate-400" />
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            {uploading ? 'Envoi en cours…' : (
              <>Glissez vos images ici ou <span className="text-indigo-600 dark:text-indigo-400 font-semibold">parcourez</span></>
            )}
          </p>
          <p className="text-[10px] text-slate-400">{value.length}/{max} · JPG, PNG, WebP · max 5 Mo</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple={max > 1}
            className="hidden"
            onChange={(e) => { uploadFiles(e.target.files); e.target.value = ''; }}
          />
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
};

export default ImageUploader;

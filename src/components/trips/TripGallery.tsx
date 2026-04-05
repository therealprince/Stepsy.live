import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, Loader2, Check, X, ZoomIn } from 'lucide-react';
import { Image as ImageIcon } from 'lucide-react';
import { compressImage } from '../../services/image-compress';
import { useData } from '../../context/DataContext';

interface Props {
  photos: string[];
  tripId?: string;
}

export default function TripGallery({ photos, tripId }: Props) {
  const { settings } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localPhotos, setLocalPhotos] = useState<string[]>([]);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  const allPhotos = [...photos, ...localPhotos];

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setCompressionInfo(null);

    try {
      const originalSize = (file.size / 1024).toFixed(0);

      // Compress using browser-image-compression (Squoosh alternative)
      const compressed = await compressImage(file, {
        maxSizeMB: settings.photoMaxSizeMB,
        maxWidthPx: settings.photoMaxWidthPx,
      });

      const compressedSize = (compressed.size / 1024).toFixed(0);
      const reduction = Math.round((1 - compressed.size / file.size) * 100);

      if (reduction > 5) {
        setCompressionInfo(`${originalSize}KB → ${compressedSize}KB (${reduction}% smaller)`);
      } else {
        setCompressionInfo(`${compressedSize}KB (already optimized)`);
      }

      // Create local preview URL
      const url = URL.createObjectURL(compressed);
      setPreviewUrl(url);

      // TODO: Upload to Google Drive when connected
      // const driveFileId = await uploadPhoto(compressed, tripId);
      // For now, just add the local preview
      setLocalPhotos(prev => [...prev, url]);

      setTimeout(() => {
        setCompressionInfo(null);
        setPreviewUrl(null);
      }, 3000);
    } catch (err) {
      console.error('Photo upload failed:', err);
      setCompressionInfo('Compression failed');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [settings.photoMaxSizeMB, settings.photoMaxWidthPx]);

  return (
    <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-neutral-300 flex items-center gap-2">
          <ImageIcon size={16} /> Trip Gallery
        </h3>
        <div className="flex items-center gap-2">
          {compressionInfo && (
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Check size={10} /> {compressionInfo}
            </span>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-xs bg-neutral-900 border border-neutral-800 hover:border-neutral-700 px-3 py-1.5 rounded-full flex items-center gap-2 transition-colors text-neutral-300 disabled:opacity-50"
          >
            {uploading ? (
              <><Loader2 size={12} className="animate-spin" /> Compressing...</>
            ) : (
              <><Upload size={12} /> Add Photo</>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      </div>

      {allPhotos.length > 0 ? (
        <div className="flex gap-4 overflow-x-auto pb-2 snap-x scrollbar-thin">
          {allPhotos.map((img, i) => (
            <div key={i} className="relative group shrink-0">
              <img
                src={img}
                alt={`Trip photo ${i + 1}`}
                className="h-32 w-48 object-cover rounded-xl border border-neutral-800 snap-center cursor-pointer transition-transform hover:scale-105"
                onClick={() => setViewingPhoto(img)}
              />
              {/* Zoom indicator */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded-xl pointer-events-none">
                <ZoomIn size={20} className="text-white" />
              </div>
            </div>
          ))}
          
          {/* Add more button inline */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="h-32 w-32 rounded-xl border border-dashed border-neutral-800 flex flex-col items-center justify-center text-neutral-600 hover:text-neutral-400 hover:border-neutral-700 transition-colors shrink-0 snap-center"
          >
            <Camera size={20} className="mb-1" />
            <span className="text-[10px] font-mono">Add</span>
          </button>
        </div>
      ) : (
        <div className="h-32 rounded-xl border border-dashed border-neutral-800 flex flex-col items-center justify-center text-neutral-600 bg-neutral-900/20">
          <Camera size={24} className="mb-2 opacity-50" />
          <p className="text-xs font-mono">No photos added yet</p>
          <p className="text-[10px] text-neutral-700 font-mono mt-1">
            Photos are compressed before upload to save Drive space
          </p>
        </div>
      )}

      {/* Full-screen photo viewer */}
      {viewingPhoto && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[9999] flex items-center justify-center p-8 cursor-pointer"
          onClick={() => setViewingPhoto(null)}
        >
          <button
            className="absolute top-6 right-6 text-neutral-400 hover:text-white transition-colors"
            onClick={() => setViewingPhoto(null)}
          >
            <X size={24} />
          </button>
          <img
            src={viewingPhoto}
            alt="Full view"
            className="max-w-full max-h-full object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

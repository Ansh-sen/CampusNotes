import React, { useState, useCallback } from 'react';
import { X, ImageIcon, UploadCloud, Loader2, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { listingService } from '@/services/listingService';
import { useAuth } from '@/hooks/useAuth';

interface ImageUploaderProps {
  images: Array<{ url: string; is_cover: boolean }>;
  onChange: (images: Array<{ url: string; is_cover: boolean }>) => void;
  maxImages?: number;
}

export function ImageUploader({ images, onChange, maxImages = 5 }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const { jwt } = useAuth();

  const handleFile = async (file: File) => {
    if (images.length >= maxImages) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) return; // 5MB limit

    setUploading(true);
    try {
      const res = await listingService.uploadImage(file, jwt!);
      if (res.url) {
        onChange([...images, { url: res.url, is_cover: images.length === 0 }]);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [images]);

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    // If we removed the cover image, set the first one as cover
    if (images[index].is_cover && newImages.length > 0) {
      newImages[0].is_cover = true;
    }
    onChange(newImages);
  };

  const setCover = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      is_cover: i === index
    }));
    onChange(newImages);
  };

  return (
    <div className="space-y-4">
      <div className={cn(
        "grid gap-3",
        images.length === 0 ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3"
      )}>
        {images.map((img, idx) => (
          <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-[hsl(var(--muted))] group">
            <img src={`http://localhost:3001${img.url}`} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
            
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button 
                onClick={() => removeImage(idx)}
                className="p-2 bg-white/20 hover:bg-red-500 text-white rounded-full backdrop-blur-md transition-colors"
                title="Remove"
              >
                <X className="w-4 h-4" />
              </button>
              {!img.is_cover && (
                <button 
                  onClick={() => setCover(idx)}
                  className="p-2 bg-white/20 hover:bg-[hsl(var(--primary))] text-white rounded-full backdrop-blur-md transition-colors"
                  title="Set as Cover"
                >
                  <Star className="w-4 h-4" />
                </button>
              )}
            </div>

            {img.is_cover && (
              <div className="absolute top-2 left-2 bg-[hsl(var(--primary))] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                COVER
              </div>
            )}
          </div>
        ))}

        {images.length < maxImages && (
          <label 
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className={cn(
              "rounded-2xl border-2 border-dashed border-[hsl(var(--muted))] flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:bg-gray-50 hover:border-[hsl(var(--primary))]",
              images.length === 0 ? "h-48 w-full" : "aspect-square",
              uploading && "opacity-50 pointer-events-none"
            )}
          >
            <input 
              type="file" 
              className="hidden" 
              accept="image/*" 
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} 
            />
            {uploading ? (
              <Loader2 className="w-8 h-8 text-[hsl(var(--primary))] animate-spin" />
            ) : (
              <div className="flex flex-col items-center text-center px-4">
                <div className="w-12 h-12 rounded-full bg-[hsl(var(--primary))/5] flex items-center justify-center mb-2">
                  <UploadCloud className="w-6 h-6 text-[hsl(var(--primary))]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[hsl(var(--text))]">Add Photos</p>
                  <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                    {images.length === 0 ? "Click or drag to upload (Max 5)" : `${images.length}/${maxImages} uploaded`}
                  </p>
                </div>
              </div>
            )}
          </label>
        )}
      </div>

      <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-3">
        <ImageIcon className="w-5 h-5 text-[hsl(var(--text-muted))] shrink-0 mt-0.5" />
        <p className="text-[11px] text-[hsl(var(--text-muted))] font-medium leading-relaxed">
          Upload clear photos of your material. The first image will be shown as the cover. High-quality images attract more buyers.
        </p>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { FileText, UploadCloud, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { listingService } from '@/services/listingService';
import { useAuth } from '@/hooks/useAuth';

interface FileUploaderProps {
  fileUrl: string | null;
  onChange: (url: string | null) => void;
}

export function FileUploader({ fileUrl, onChange }: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const { jwt } = useAuth();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reject files larger than 10MB
    if (file.size > 10 * 1024 * 1024) {
      alert("File is too large. Max 10MB allowed.");
      return;
    }

    setUploading(true);
    try {
      const res = await listingService.uploadFile(file, jwt!);
      if (res.url) {
        onChange(res.url);
      }
    } catch (error) {
      console.error('File upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(null);
  };

  const fileName = fileUrl ? fileUrl.split('/').pop() : '';

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-[hsl(var(--text))] flex items-center gap-2">
          <FileText className="w-4 h-4 text-[hsl(var(--primary))]" /> 
          Upload Material (PDF/Zip/Doc)
        </h3>
        <p className="text-[11px] text-[hsl(var(--text-muted))] font-medium">
          Upload the actual notes or material here. Buyers will get access to this after purchase.
        </p>
      </div>

      <label 
        className={cn(
          "relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer group",
          fileUrl ? "border-[hsl(var(--success))] bg-[hsl(var(--success))/5]" : "border-[hsl(var(--muted))] hover:bg-gray-50 hover:border-[hsl(var(--primary))]",
          uploading && "opacity-50 pointer-events-none"
        )}
      >
        <input 
          type="file" 
          className="hidden" 
          accept=".pdf,.doc,.docx,.zip,.txt" 
          onChange={handleFile} 
        />

        {uploading ? (
          <div className="flex flex-col items-center py-2">
            <Loader2 className="w-8 h-8 text-[hsl(var(--primary))] animate-spin mb-2" />
            <span className="text-xs font-bold text-[hsl(var(--primary))] uppercase tracking-widest">Uploading...</span>
          </div>
        ) : fileUrl ? (
          <div className="flex flex-col items-center w-full px-4">
            <div className="w-12 h-12 rounded-full bg-[hsl(var(--success))] text-white flex items-center justify-center mb-3 shadow-lg shadow-[hsl(var(--success))/20]">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="text-center w-full">
              <p className="text-sm font-bold text-[hsl(var(--text))] truncate max-w-full mb-1">{fileName}</p>
              <button 
                onClick={removeFile}
                className="text-[10px] font-black tracking-widest uppercase text-red-500 hover:text-red-600 px-3 py-1 bg-red-50 rounded-full"
              >
                Remove File
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3 group-hover:bg-[hsl(var(--primary))/10] transition-colors">
              <UploadCloud className="w-6 h-6 text-gray-400 group-hover:text-[hsl(var(--primary))]" />
            </div>
            <p className="text-sm font-bold text-[hsl(var(--text))]">Attach Digital Material</p>
            <p className="text-[10px] text-gray-400 mt-1 font-medium">Max 10MB (PDF, DOC, ZIP)</p>
          </div>
        )}
      </label>
    </div>
  );
}

import { useState } from 'react';
import { API_URL, API_BASE_URL } from '@/config';
import { 
  X, UploadCloud, Loader2, 
  AlertTriangle, 
  Sparkles, CheckCircle2,
  ArrowLeft, ArrowRight, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { listingService } from '@/services/listingService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/toast-provider';
import { Card } from '@/components/ui/card';

interface ImageItem {
  url: string;
  is_cover: boolean;
}

interface ListingImageGridProps {
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  aiScore: number | null;
  aiReasons: string[];
  setAiScore: (score: number | null) => void;
  setAiReasons: (reasons: string[]) => void;
}

export function ListingImageGrid({ 
  images, onChange, 
  aiScore, aiReasons, setAiScore, setAiReasons 
}: ListingImageGridProps) {
  const [uploading, setUploading] = useState(false);
  const [duplicateFile, setDuplicateFile] = useState<{ title: string, seller: string } | null>(null);
  const [scoring, setScoring] = useState(false);
  const { jwt } = useAuth();
  const { toast } = useToast();

  const handleUpload = async (file: File) => {
    if (images.length >= 6) {
      toast({ title: 'Limit Reached', description: 'Maximum 6 images allowed.', type: 'error' });
      return;
    }
    
    setUploading(true);
    setDuplicateFile(null);
    
    try {
      const res = await listingService.uploadImage(file, jwt!);
      const newUrl = res.url;

      if (images.length === 0) {
        setScoring(true);
        const [dupRes, scoreRes] = await Promise.all([
          listingService.checkDuplicate(newUrl, jwt!),
          fetch(`${API_URL}/listings/score-test`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
            body: JSON.stringify({ image_url: newUrl })
          }).then(r => r.json())
        ]);

        if (dupRes.is_duplicate) {
          setDuplicateFile({ title: dupRes.title, seller: dupRes.seller });
        }
        
        if (scoreRes.score) {
          setAiScore(scoreRes.score);
          setAiReasons(scoreRes.reasons || []);
        }
        setScoring(false);
      }

      onChange([...images, { url: newUrl, is_cover: images.length === 0 }]);
    } catch (error) {
      console.error('Upload Error:', error);
      toast({ title: 'Upload Failed', description: 'Could not upload image.', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx: number) => {
    const newImgs = images.filter((_, i) => i !== idx);
    if (images[idx].is_cover && newImgs.length > 0) {
      newImgs[0].is_cover = true;
    }
    if (newImgs.length === 0) {
      setAiScore(null);
      setAiReasons([]);
      setDuplicateFile(null);
    }
    onChange(newImgs);
  };

  const moveImage = (from: number, to: number) => {
    const newImgs = [...images];
    const [moved] = newImgs.splice(from, 1);
    newImgs.splice(to, 0, moved);
    
    const finalImgs = newImgs.map((img, i) => ({
      ...img,
      is_cover: i === 0
    }));
    
    onChange(finalImgs);
  };


  return (
    <div className="space-y-6">
      {duplicateFile && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-[2.5rem] flex items-start gap-4 animate-in fade-in slide-in-from-top-2 relative overflow-hidden group/warn">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-12 -mt-12 group-hover/warn:scale-150 transition-transform duration-1000" />
          <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="space-y-1 relative z-10">
            <p className="text-sm font-black text-foreground uppercase tracking-tight">Similar Listing Detected</p>
            <p className="text-[10px] text-muted-foreground font-bold leading-relaxed uppercase tracking-widest opacity-60">
              This photo looks very similar to <span className="text-amber-500">"{duplicateFile.title}"</span> by {duplicateFile.seller}. 
              Please ensure you are uploading your own original work.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {images.map((img, idx) => (
          <div 
            key={idx} 
            className={cn(
              "relative aspect-square rounded-[2rem] overflow-hidden border-4 group transition-all",
              img.is_cover ? "border-primary ring-8 ring-primary/5" : "border-border/50 hover:border-primary/40"
            )}
          >
            <img 
              src={`${API_BASE_URL}${img.url}`} 
              alt={`Upload ${idx}`} 
              className="w-full h-full object-cover" 
            />
            
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button 
                onClick={() => removeImage(idx)}
                className="p-2.5 bg-white/20 hover:bg-red-500 text-white rounded-full backdrop-blur-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              {idx > 0 && (
                <button 
                  onClick={() => moveImage(idx, idx - 1)}
                  className="p-2.5 bg-white/20 hover:bg-blue-600 text-white rounded-full backdrop-blur-md transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              {idx < images.length - 1 && (
                <button 
                  onClick={() => moveImage(idx, idx + 1)}
                  className="p-2.5 bg-white/20 hover:bg-blue-600 text-white rounded-full backdrop-blur-md transition-colors"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {img.is_cover && (
              <div className="absolute top-3 left-3 bg-blue-600 text-white text-[9px] font-black px-2 py-1 rounded-lg shadow-lg uppercase tracking-widest">
                Cover Photo
              </div>
            )}
          </div>
        ))}

        {images.length < 6 && (
          <label className={cn(
            "aspect-square rounded-[2rem] border-4 border-dashed border-border/50 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:bg-primary/5 hover:border-primary/40 group relative overflow-hidden",
            uploading && "opacity-50 pointer-events-none"
          )}>
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <input 
              type="file" 
              className="hidden" 
              accept="image/*" 
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} 
            />
            {uploading ? (
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/10 transition-all shadow-inner group-hover:shadow-xl">
                  <UploadCloud className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="text-center relative z-10">
                  <p className="text-[10px] font-black text-foreground uppercase tracking-widest">Add Photo</p>
                  <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-40 mt-1">{images.length}/6</p>
                </div>
              </>
            )}
          </label>
        )}
      </div>

      {images.length > 0 && (
        <Card className="rounded-[2.5rem] border border-border/50 bg-card overflow-hidden shadow-2xl shadow-black/5 relative group/ai">
          <div className="space-y-3 p-8">
          <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-inner group-hover/ai:scale-110 transition-transform duration-500">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-40 leading-none">Quality Check</h3>
                  <h4 className="text-sm font-black text-foreground uppercase tracking-tight mt-1">AI Quality Score</h4>
                </div>
              </div>
              {scoring && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
            </div>

            {aiScore !== null ? (
              <div className="space-y-4 animate-in fade-in duration-700">
                <div className="flex items-baseline gap-1 bg-muted/30 p-4 rounded-2xl border border-border/20 shadow-inner w-fit mx-auto">
                   <span className={cn("text-5xl font-black tracking-tighter tabular-nums", 
                     aiScore >= 8 ? "text-emerald-500" : aiScore >= 5 ? "text-amber-500" : "text-danger"
                   )}>
                     {aiScore}
                   </span>
                   <span className="text-xs font-black text-muted-foreground uppercase tracking-widest opacity-30">/ 10</span>
                </div>

                <div className="h-2 w-full bg-muted rounded-full overflow-hidden shadow-inner">
                  <div 
                    className={cn("h-full transition-all duration-1000", aiScore >= 8 ? "bg-emerald-500" : aiScore >= 5 ? "bg-amber-500" : "bg-danger")}
                    style={{ width: `${aiScore * 10}%` }}
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 pt-4 border-t border-border/50">
                  {aiReasons.map((reason, i) => (
                    <div key={i} className="flex gap-4 items-start p-4 bg-muted/20 rounded-2xl border border-border/10 hover:border-border/30 transition-all group/reason">
                      <div className="h-5 w-5 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                      <p className="text-[11px] font-black text-foreground/70 leading-relaxed uppercase tracking-tight italic">"{reason}"</p>
                    </div>
                  ))}
                </div>
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
              </div>
            ) : (
              <div className="text-center py-6">
                {!scoring ? (
                  <p className="text-xs font-bold text-gray-300 italic">Upload cover photo to see magic...</p>
                ) : (
                  <p className="text-xs font-bold text-blue-400 animate-pulse uppercase tracking-widest">Analyzing your notes...</p>
                )}
              </div>
            )}
          </div>
        </Card>
      )}

      <div className="p-6 rounded-[2.5rem] bg-card border border-border/50 shadow-xl shadow-black/5 flex gap-5 group/info transition-all hover:shadow-2xl">
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shrink-0 group-hover/info:rotate-12 transition-transform duration-500">
          <Info className="w-6 h-6 text-primary" />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black text-foreground uppercase tracking-widest leading-none">Pro Tip</p>
          <p className="text-[10px] font-black text-muted-foreground/60 leading-relaxed uppercase tracking-widest opacity-60">
            Wait for AI feedback! High-quality ratings (<span className="text-emerald-500">8/10+</span>) boost your visibility by <span className="text-primary opacity-100">40%</span>. 
            Ensure your first capture is pristine.
          </p>
        </div>
      </div>
    </div>
  );
}

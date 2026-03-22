import { useState } from 'react';
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
import { Card, CardContent } from '@/components/ui/card';

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
          fetch('http://localhost:3001/api/listings/score-test', {
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

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-green-600';
    if (score >= 6) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 8) return 'Excellent Quality';
    if (score >= 5) return 'Good Quality';
    return 'Low Quality';
  };

  return (
    <div className="space-y-6">
      {duplicateFile && (
        <div className="bg-amber-50 border-2 border-amber-100 p-4 rounded-3xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-black text-amber-900 tracking-tight">Similar Listing Detected</p>
            <p className="text-xs text-amber-700 font-medium leading-relaxed">
              This photo looks very similar to "{duplicateFile.title}" by {duplicateFile.seller}. 
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
              "relative aspect-square rounded-3xl overflow-hidden border-4 group transition-all",
              img.is_cover ? "border-blue-600 ring-4 ring-blue-50" : "border-gray-50 hover:border-gray-100"
            )}
          >
            <img 
              src={`http://localhost:3001${img.url}`} 
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
            "aspect-square rounded-3xl border-4 border-dashed border-gray-100 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:bg-gray-50 hover:border-blue-100 group",
            uploading && "opacity-50 pointer-events-none"
          )}>
            <input 
              type="file" 
              className="hidden" 
              accept="image/*" 
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} 
            />
            {uploading ? (
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black text-[#1a2744] uppercase tracking-widest">Add Photo</p>
                  <p className="text-[9px] text-gray-400 font-bold mt-0.5">{images.length}/6 uploaded</p>
                </div>
              </>
            )}
          </label>
        )}
      </div>

      {images.length > 0 && (
        <Card className="rounded-[2rem] border-2 border-gray-50 overflow-hidden shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 rounded-xl">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-sm font-black text-[#1a2744] uppercase tracking-tight">AI Quality Scorer</h3>
              </div>
              {scoring && <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />}
            </div>

            {aiScore !== null ? (
              <div className="space-y-4 animate-in fade-in duration-700">
                <div className="flex items-end justify-between">
                  <div>
                    <p className={cn("text-xl font-black tracking-tighter", 
                      aiScore >= 8 ? "text-emerald-600" : aiScore >= 5 ? "text-amber-600" : "text-red-600"
                    )}>
                      {aiScore}/10 — <span className="text-sm font-bold uppercase tracking-wide opacity-80">{getScoreLabel(aiScore)}</span>
                    </p>
                  </div>
                </div>

                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full transition-all duration-1000", getScoreColor(aiScore))}
                    style={{ width: `${aiScore * 10}%` }}
                  />
                </div>

                <div className="space-y-2 pt-2">
                  {aiReasons.map((reason, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] font-medium text-gray-500 leading-tight">{reason}</p>
                    </div>
                  ))}
                </div>
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
          </CardContent>
        </Card>
      )}

      <div className="bg-[#1a2744]/5 p-4 rounded-3xl flex gap-3">
        <Info className="w-4 h-4 text-[#1a2744] shrink-0 mt-0.5" />
        <p className="text-[10px] font-bold text-gray-500 leading-relaxed uppercase tracking-tight">
          Wait for AI feedback! High-quality ratings (8/10+) boost your visibility by <span className="text-blue-600 font-black">40%</span>. 
          Make sure your first photo is the clearest.
        </p>
      </div>
    </div>
  );
}

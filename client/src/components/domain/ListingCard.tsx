import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { API_BASE_URL } from '@/config';
import { FileText, CheckCircle, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast-provider';

export function ListingCard({ listing, index = 0, viewMode = 'list' }: { listing: any, index?: number, viewMode?: 'grid' | 'list' }) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const isGrid = viewMode === 'grid';

  // Handle listing_images which might be a JSON string or an array depending on the backend driver
  const images = typeof listing.listing_images === 'string' 
    ? JSON.parse(listing.listing_images) 
    : (listing.listing_images || []);
    
  const hasImages = Array.isArray(images) && images.length > 0;
  let coverImage = hasImages ? images[0].image_url : null;
  
  // Add backend URL prefix if it's a relative path
  if (coverImage && coverImage.startsWith('/')) {
    coverImage = `${API_BASE_URL}${coverImage}`;
  }

  const aiScore = listing.ai_score;
  const isTopper = listing.seller_is_topper;
  const isVerified = !!listing.seller_is_verified;

  // AI score color logic - Updating to match search image (dark pills)
  const getAiScoreColor = (score: number) => {
    if (score >= 8) return 'bg-emerald-500 text-white border-white/20';
    if (score >= 6) return 'bg-amber-500 text-white border-white/20';
    return 'bg-danger text-white border-white/10';
  };

  const formattedAiScore = aiScore ? `${Math.round(aiScore / 10)}/10` : null;

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing.title,
          text: `Check out these notes on CampusNotes: ${listing.title}`,
          url: window.location.origin + `/listing/${listing.id}`,
        });
      } catch (err) {
        console.error('Share failed', err);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.origin + `/listing/${listing.id}`);
      toast({ title: 'Link copied!', description: 'Listing link copied to clipboard.', type: 'success' });
    }
  };

  const bgColors = ['bg-primary/5', 'bg-emerald-500/5', 'bg-indigo-500/5', 'bg-amber-500/5'];
  const bgColor = bgColors[index % bgColors.length];

  return (
    <Card 
      onClick={() => navigate(`/listing/${listing.id}`)}
      className={cn(
        "group cursor-pointer overflow-hidden border border-border/50 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 bg-card rounded-[2rem] flex flex-col active:scale-[0.98]",
        isGrid ? "h-full" : "h-auto"
      )}
    >
      {/* Image Section */}
      <div className={cn("relative w-full overflow-hidden", isGrid ? "aspect-square" : "aspect-[21/9]", bgColor, "dark:bg-muted/20")}>
        {coverImage ? (
          <img 
            src={coverImage} 
            alt={listing.title} 
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="flex flex-col h-full w-full items-center justify-center gap-2 bg-muted/30">
            <FileText className="h-8 w-8 text-muted-foreground/30" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">No preview</span>
          </div>
        )}
        
        {/* Badges Overlay */}
        <div className="absolute inset-0 p-3 flex flex-col justify-between pointer-events-none">
          <div className="flex justify-between items-start gap-2 flex-wrap">
            {aiScore !== null && aiScore !== undefined && (
              <div className={cn("px-2.5 py-1 rounded-lg text-[9px] font-black border flex items-center gap-1 shadow-md uppercase tracking-tighter backdrop-blur-md", getAiScoreColor(aiScore))}>
                AI {formattedAiScore}
              </div>
            )}
            {listing.material_type && (
               <div className="bg-primary/90 backdrop-blur-md px-2.5 py-1 rounded-lg shadow-xl flex items-center justify-center border border-white/10">
                 <span className="text-[9px] font-black text-white uppercase tracking-widest leading-none">{listing.material_type}</span>
               </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Content Section */}
      <CardContent className={cn("p-6 flex-1 flex flex-col", isGrid ? "gap-4 p-4" : "gap-5")}>
        <div className="space-y-2">
          <h3 className={cn(
            "line-clamp-2 font-black text-foreground tracking-tight group-hover:text-primary transition-colors uppercase leading-tight",
            isGrid ? "text-[13px]" : "text-lg"
          )}>
            {listing.title}
          </h3>
          <div className="flex items-center gap-2 flex-wrap min-h-[22px]">
            <span className="text-[9px] font-black text-primary/60 uppercase tracking-widest bg-primary/5 px-2 py-1 rounded-lg border border-primary/10 flex items-center h-full">
              {listing.subject_code || 'General Notes'}
            </span>
            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-40 flex items-center h-full">
              SEM {listing.semester || 'N/A'}
            </span>
          </div>
        </div>

        {!isGrid && (
          <div className="flex flex-wrap gap-2">
            {isTopper && (
              <div className="flex items-center gap-2 text-[8px] font-black text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 uppercase tracking-widest shadow-sm">
                 Topper Verified
              </div>
            )}
            {isVerified && (
              <div className="flex items-center gap-2 text-[8px] font-black text-blue-500 bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-500/20 uppercase tracking-widest shadow-sm">
                 <CheckCircle size={10} fill="currentColor" className="text-blue-500" />
                 ID Verified
              </div>
            )}
          </div>
        )}

        <div className={cn("flex items-center justify-between mt-auto border-t border-border/50", isGrid ? "pt-4" : "pt-6")}>
          <div className="flex flex-col gap-0.5">
            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-40 leading-none">Price</span>
            <span className={cn("text-foreground font-black leading-none tracking-tighter tabular-nums", isGrid ? "text-lg" : "text-2xl")}>
              ₹{listing.price > 0 ? listing.price : 'FREE'}
            </span>
          </div>
          
          <div className={cn("px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center justify-center shadow-inner border h-7", 
            listing.status === 'available' 
              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
              : "bg-danger/10 text-danger border-danger/20"
          )}>
            {listing.status === 'available' ? 'Available' : 'Sold out'}
          </div>
        </div>

        {/* Share Button (Hide in Grid to save space) */}
        {!isGrid && (
          <button 
            onClick={handleShare}
            className="w-full mt-2 py-4 px-4 bg-muted/30 text-muted-foreground text-[10px] font-black rounded-2xl hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-center gap-3 uppercase tracking-[0.25em] active:scale-95 border border-border/50 group/share shadow-lg"
          >
            <Share2 className="h-4 w-4 transition-transform group-hover/share:rotate-12" />
            Share Notes
          </button>
        )}
      </CardContent>
    </Card>
  );
}

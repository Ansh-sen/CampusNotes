import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { API_BASE_URL } from '@/config';
import { FileText, Share2 } from 'lucide-react';
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
        "group cursor-pointer overflow-hidden border border-border/50 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 bg-card rounded-[2.5rem] flex flex-col md:flex-row active:scale-[0.98]",
        isGrid ? "h-full" : "min-h-[180px]"
      )}
    >
      {/* Image Section */}
      <div className={cn(
        "relative overflow-hidden shrink-0", 
        isGrid ? "w-full aspect-square" : "w-full md:w-56 aspect-[21/9] md:aspect-square", 
        bgColor, "dark:bg-muted/20"
      )}>
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
        <div className="absolute inset-x-0 top-0 p-3 flex justify-between pointer-events-none">
          {aiScore !== null && aiScore !== undefined && (
            <div className={cn("px-2.5 py-1 rounded-lg text-[9px] font-black border flex items-center gap-1 shadow-md uppercase tracking-tighter backdrop-blur-md", getAiScoreColor(aiScore))}>
              AI {formattedAiScore}
            </div>
          )}
          {listing.material_type && (
             <div className="bg-primary/90 backdrop-blur-md px-2.5 py-1 rounded-lg shadow-xl flex items-center justify-center border border-white/10 ml-auto">
               <span className="text-[9px] font-black text-white uppercase tracking-widest leading-none">{listing.material_type}</span>
             </div>
          )}
        </div>
      </div>
      
      {/* Content Section */}
      <CardContent className={cn("p-6 flex-1 flex flex-col justify-between", isGrid ? "p-4" : "p-6 md:p-8")}>
        <div className="space-y-4">
          <div className="flex justify-between items-start gap-4">
            <h3 className={cn(
              "line-clamp-2 font-black text-foreground tracking-tight group-hover:text-primary transition-colors uppercase leading-[1.1]",
              isGrid ? "text-[13px]" : "text-[clamp(1.125rem,3vw,1.375rem)]"
            )}>
              {listing.title}
            </h3>
            <div className={cn("hidden md:flex flex-col items-end gap-1 shrink-0", isGrid && "md:hidden")}>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40 leading-none">Price</span>
                <span className="text-2xl font-black text-foreground leading-none tracking-tighter tabular-nums text-right">
                  ₹{listing.price > 0 ? listing.price : 'FREE'}
                </span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[11px] font-black text-primary/70 uppercase tracking-widest bg-primary/5 px-3.5 py-2 rounded-xl border border-primary/10 flex items-center">
              {listing.subject_code || 'General Notes'}
            </span>
            {listing.semester && (
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-50 flex items-center">
                SEM {listing.semester}
              </span>
            )}
          </div>

          {!isGrid && (
            <div className="flex flex-wrap gap-2 pt-1">
              {isTopper && (
                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-3.5 py-2 rounded-xl border border-emerald-500/20 uppercase tracking-widest">
                   Topper Select
                </div>
              )}
              {isVerified && (
                <div className="flex items-center gap-2 text-[10px] font-black text-blue-500 bg-blue-500/10 px-3.5 py-2 rounded-xl border border-blue-500/20 uppercase tracking-widest">
                   ID Verified
                </div>
              )}
            </div>
          )}
        </div>

        <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-5 mt-8 border-t border-border/50 pt-6", isGrid && "mt-4 pt-4")}>
          <div className={cn("flex flex-col gap-1.5", !isGrid && "md:hidden")}>
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40 leading-none">Price</span>
            <span className="text-3xl font-black text-foreground leading-none tracking-tighter tabular-nums">
              ₹{listing.price > 0 ? listing.price : 'FREE'}
            </span>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className={cn("px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center shadow-inner border border-border/50 flex-1 sm:flex-none", 
              listing.status === 'available' 
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                : "bg-danger/10 text-danger border-danger/20"
            )}>
              {listing.status === 'available' ? 'Available' : 'Sold out'}
            </div>
            
            {!isGrid && (
               <button 
                onClick={handleShare}
                className="p-4 bg-muted/30 text-muted-foreground rounded-2xl hover:bg-primary/10 hover:text-primary transition-all active:scale-90 border border-border/50 group/share shrink-0"
              >
                <Share2 className="h-5 w-5 transition-transform group-hover/share:rotate-12" />
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

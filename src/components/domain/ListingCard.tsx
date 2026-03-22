import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast-provider';

export function ListingCard({ listing, index = 0 }: { listing: any, index?: number }) {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Handle listing_images which might be a JSON string or an array depending on the backend driver
  const images = typeof listing.listing_images === 'string' 
    ? JSON.parse(listing.listing_images) 
    : (listing.listing_images || []);
    
  const hasImages = Array.isArray(images) && images.length > 0;
  let coverImage = hasImages ? images[0].image_url : null;
  
  // Add backend URL prefix if it's a relative path
  if (coverImage && coverImage.startsWith('/')) {
    coverImage = `http://localhost:3001${coverImage}`;
  }

  const aiScore = listing.ai_score;
  const isTopper = listing.seller_is_topper;

  // AI score color logic - Updating to match search image (dark pills)
  const getAiScoreColor = (score: number) => {
    if (score >= 8) return 'bg-green-600 text-white border-transparent';
    if (score >= 6) return 'bg-amber-500 text-white border-transparent';
    return 'bg-red-500 text-white border-transparent';
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

  const bgColors = ['bg-blue-50', 'bg-green-50', 'bg-purple-50', 'bg-orange-50'];
  const bgColor = bgColors[index % bgColors.length];

  return (
    <Card 
      onClick={() => navigate(`/listing/${listing.id}`)}
      className="group cursor-pointer overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 bg-white rounded-2xl flex flex-col h-full"
    >
      {/* Image Section */}
      <div className={cn("relative aspect-[4/3] w-full overflow-hidden", bgColor)}>
        {coverImage ? (
          <img 
            src={coverImage} 
            alt={listing.title} 
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex flex-col h-full w-full items-center justify-center gap-2 bg-slate-100">
            <FileText className="h-8 w-8 text-slate-400" />
            <span className="text-xs font-bold text-slate-400">No image</span>
          </div>
        )}
        
        {/* Badges Overlay */}
        <div className="absolute inset-0 p-2 flex flex-col justify-between pointer-events-none">
          <div className="flex justify-between items-start">
            {aiScore !== null && aiScore !== undefined && (
              <div className={cn("px-2 py-0.5 rounded-md text-[8px] font-black border flex items-center gap-1 shadow-sm uppercase tracking-tighter", getAiScoreColor(aiScore))}>
                AI {formattedAiScore}
              </div>
            )}
            {hasImages && (
              <div className="bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-md shadow-sm border border-gray-100 flex items-center justify-center">
                <span className="text-[8px] font-black text-gray-500 uppercase tracking-tighter">Preview</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Content Section */}
      <CardContent className="p-3 pb-4 flex-1 flex flex-col gap-2">
        <div className="space-y-0.5">
          <h3 className="line-clamp-1 font-bold text-sm text-[#1a2744] tracking-tight group-hover:text-blue-600 transition-colors">
            {listing.title}
          </h3>
          <p className="text-[10px] font-medium text-gray-400 flex items-center gap-1.5 uppercase tracking-tight">
            <span>{listing.subject_code || listing.course_code || 'GNR'}</span>
            <span>-</span>
            <span>Sem {listing.semester || 'N/A'}</span>
          </p>
        </div>

        {isTopper && (
          <div className="flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-50 w-fit px-2 py-0.5 rounded-full border border-amber-100">
             Verified Topper
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-1">
          <div className="flex items-center gap-2">
            <span className="text-[#1a2744] font-black text-base leading-none">
              ₹{listing.price > 0 ? listing.price : 'Free'}
            </span>
          </div>
          
          <div className={cn("text-[9px] px-2 py-1 rounded-full font-black uppercase tracking-tight leading-none", 
            listing.status === 'available' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          )}>
            {listing.status === 'available' ? 'Available' : 'Sold'}
          </div>
        </div>

        {/* Share Button (Image shows list style button for 'Available', pill for 'Sold') */}
        <button 
          onClick={handleShare}
          className="w-full mt-1 py-1.5 px-3 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
        >
          Share listing
        </button>
      </CardContent>
    </Card>
  );
}

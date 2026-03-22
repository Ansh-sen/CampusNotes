import { Card, CardContent } from '@/components/ui/card';
import { 
  Eye, 
  MessageCircle, 
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface MyListingCardProps {
  listing: any;
  onAction: (action: string, listingId: string) => void;
}

export function MyListingCard({ listing, onAction }: MyListingCardProps) {
  
  const images = typeof listing.listing_images === 'string' 
    ? JSON.parse(listing.listing_images) 
    : (listing.listing_images || []);
    
  const hasImages = Array.isArray(images) && images.length > 0;
  let coverImage = hasImages ? images[0].image_url : null;
  
  if (coverImage && coverImage.startsWith('/')) {
    coverImage = `http://localhost:3001${coverImage}`;
  }

  const aiScore = listing.ai_score;
  const isDraft = !!listing.is_draft;
  const status = listing.status;
  const bookmarkCount = listing.bookmark_count || 0;
  const inquiryCount = listing.inquiry_count || 0;
  const viewCount = listing.view_count || 0;

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-green-600';
    if (score >= 6) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const renderStatusBadges = () => {
    const badges = [];
    
    if (isDraft) {
      badges.push(<Badge key="draft" variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 text-[10px]">Draft</Badge>);
    } else if (status === 'available') {
      badges.push(<Badge key="active" variant="outline" className="bg-green-100 text-green-700 border-green-200 text-[10px]">Available</Badge>);
    } else if (status === 'paused') {
      badges.push(<Badge key="paused" variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">Paused</Badge>);
    } else if (status === 'sold') {
      badges.push(<Badge key="sold" variant="outline" className="bg-red-100 text-red-700 border-red-200 text-[10px]">Sold</Badge>);
    }

    if (bookmarkCount > 0) {
      badges.push(<Badge key="saved" variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 text-[10px]">{bookmarkCount} saved</Badge>);
    }

    if (aiScore >= 9) {
      badges.push(<Badge key="topper" variant="outline" className="bg-purple-50 text-purple-600 border-purple-200 text-[10px]">Topper pick</Badge>);
    }

    return badges;
  };

  const renderActions = () => {
    if (isDraft) {
      return (
        <>
          <button onClick={() => onAction('continue_draft', listing.id)} className="flex-1 py-4 text-[10px] font-black text-[#1a2744] uppercase tracking-widest hover:bg-gray-50 transition-colors">Continue draft</button>
          <div className="w-[1px] h-6 bg-gray-100 self-center" />
          <button onClick={() => onAction('discard_draft', listing.id)} className="flex-1 py-4 text-[10px] font-black text-red-500 uppercase tracking-widest hover:bg-red-50 transition-colors">Discard</button>
        </>
      );
    }

    if (status === 'sold') {
      return (
        <>
          <button onClick={() => onAction('relist', listing.id)} className="flex-1 py-4 text-[10px] font-black text-[#1a2744] uppercase tracking-widest hover:bg-gray-50 transition-colors">Relist</button>
          <div className="w-[1px] h-6 bg-gray-100 self-center" />
          <button onClick={() => onAction('view_review', listing.id)} className="flex-1 py-4 text-[10px] font-black text-[#1a2744] uppercase tracking-widest hover:bg-gray-50 transition-colors">Review</button>
          <div className="w-[1px] h-6 bg-gray-100 self-center" />
          <button onClick={() => onAction('delete', listing.id)} className="flex-1 py-4 text-[10px] font-black text-red-500 uppercase tracking-widest hover:bg-red-50 transition-colors">Delete</button>
        </>
      );
    }

    return (
      <>
        <button onClick={() => onAction('edit', listing.id)} className="flex-1 py-4 text-[10px] font-black text-[#1a2744] uppercase tracking-widest hover:bg-gray-50 transition-colors">Edit</button>
        <div className="w-[1px] h-6 bg-gray-100 self-center" />
        {status === 'paused' ? (
          <button onClick={() => onAction('resume', listing.id)} className="flex-1 py-4 text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:bg-emerald-50 transition-colors">Resume</button>
        ) : (
          <button onClick={() => onAction('pause', listing.id)} className="flex-1 py-4 text-[10px] font-black text-[#1a2744] uppercase tracking-widest hover:bg-gray-50 transition-colors">Pause</button>
        )}
        <div className="w-[1px] h-6 bg-gray-100 self-center" />
        <button onClick={() => onAction('mark_sold', listing.id)} className="flex-1 py-4 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:bg-blue-50 transition-colors">Mark sold</button>
        <div className="w-[1px] h-6 bg-gray-100 self-center" />
        <button onClick={() => onAction('delete', listing.id)} className="flex-1 py-4 text-[10px] font-black text-red-500 uppercase tracking-widest hover:bg-red-50 transition-colors">Delete</button>
      </>
    );
  };

  return (
    <Card className={cn(
      "overflow-hidden border border-gray-100 shadow-sm transition-all duration-300 bg-white rounded-xl mb-3",
      isDraft && "border-amber-200 shadow-amber-50/50"
    )}>
      {isDraft && (
        <div className="bg-amber-100/50 px-3 py-1.5 flex justify-between items-center">
          <span className="text-[10px] font-bold text-amber-800">Draft — {listing.title || 'Untitled'}</span>
          <span className="text-[10px] font-medium text-amber-700">Step {listing.last_step || 1} of 3</span>
        </div>
      )}
      
      {isDraft && (
        <div className="h-1 bg-amber-100 w-full overflow-hidden">
          <div 
            className="h-full bg-amber-400 transition-all duration-500" 
            style={{ width: `${(listing.last_step || 1) / 3 * 100}%` }}
          />
        </div>
      )}

      <CardContent className="p-0">
        {/* Top Info Row */}
        <div className="p-3 flex gap-3">
          <div className="relative h-[52px] w-[52px] min-w-[52px] rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center">
            {coverImage ? (
              <img src={coverImage} alt="" className="h-full w-full object-cover" />
            ) : (
              <FileText className="h-6 w-6 text-slate-400" />
            )}
            {aiScore !== null && !isDraft && (
              <div className={cn(
                "absolute bottom-0 right-0 px-1 py-0.5 text-[8px] font-black text-white",
                getScoreColor(aiScore)
              )}>
                {aiScore}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-[#1a2744] truncate">{listing.title || 'Untitled Listing'}</h3>
            <p className="text-[10px] font-medium text-gray-500 mt-0.5">
              {listing.subject_code} • {listing.semester} • {listing.material_type}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {renderStatusBadges()}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className={cn(
          "px-3 py-2 border-y border-gray-50 flex items-center justify-between",
          isDraft && "opacity-50"
        )}>
          <div className="flex gap-4">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3 text-gray-400" />
              <span className="text-[11px] font-bold text-[#1a2744]">{viewCount}</span>
              <span className="text-[10px] text-gray-400 font-medium">Views</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3 text-gray-400" />
              <span className="text-[11px] font-bold text-[#1a2744]">{inquiryCount}</span>
              <span className="text-[10px] text-gray-400 font-medium">Inquiries</span>
            </div>
          </div>
          <div className="text-[11px] font-black text-[#1a2744]">
            {status === 'sold' && listing.buyer_name ? (
                <span className="text-gray-500">Sold to <span className="text-[#1a2744]">{listing.buyer_name}</span></span>
            ) : (
                <span>₹{listing.price}</span>
            )}
          </div>
        </div>

        {/* Actions Row */}
        <div className="flex divide-x divide-gray-50">
          {renderActions()}
        </div>
      </CardContent>
    </Card>
  );
}

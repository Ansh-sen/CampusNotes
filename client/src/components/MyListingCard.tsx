import { Card, CardContent } from '@/components/ui/card';
import { API_BASE_URL } from '@/config';
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
    coverImage = `${API_BASE_URL}${coverImage}`;
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
      badges.push(<Badge key="draft" variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[9px] font-black uppercase tracking-widest">Draft</Badge>);
    } else if (listing.approval_status === 'pending_approval') {
      badges.push(<Badge key="pending" variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[9px] font-black uppercase tracking-widest">Pending Audit</Badge>);
    } else if (listing.approval_status === 'rejected') {
      badges.push(<Badge key="rejected" variant="outline" className="bg-danger/10 text-danger border-danger/20 text-[9px] font-black uppercase tracking-widest">Rejected</Badge>);
    } else if (status === 'available') {
      badges.push(<Badge key="active" variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] font-black uppercase tracking-widest">Live</Badge>);
    } else if (status === 'paused') {
      badges.push(<Badge key="paused" variant="outline" className="bg-muted text-muted-foreground border-border/50 text-[9px] font-black uppercase tracking-widest">Paused</Badge>);
    } else if (status === 'sold') {
      badges.push(<Badge key="sold" variant="outline" className="bg-danger/10 text-danger border-danger/20 text-[9px] font-black uppercase tracking-widest">Sold</Badge>);
    }

    if (bookmarkCount > 0) {
      badges.push(<Badge key="saved" variant="outline" className="bg-primary/5 text-primary border-primary/10 text-[9px] font-black uppercase tracking-widest">{bookmarkCount} bookmarks</Badge>);
    }

    return badges;
  };

  const renderActions = () => {
    const btnClass = "flex-1 py-4 text-[9px] font-black uppercase tracking-[0.2em] transition-all hover:bg-muted/50 active:scale-95";
    
    if (isDraft) {
      return (
        <>
          <button onClick={() => onAction('continue_draft', listing.id)} className={cn(btnClass, "text-primary")}>Resume Build</button>
          <div className="w-[1px] h-6 bg-border/50 self-center" />
          <button onClick={() => onAction('discard_draft', listing.id)} className={cn(btnClass, "text-danger")}>Flush Draft</button>
        </>
      );
    }

    const secondaryBtnClass = cn(btnClass, "text-foreground opacity-60 hover:opacity-100");

    if (status === 'sold') {
      return (
        <>
          <button onClick={() => onAction('relist', listing.id)} className={secondaryBtnClass}>Relist Asset</button>
          <div className="w-[1px] h-6 bg-border/50 self-center" />
          <button onClick={() => onAction('view_review', listing.id)} className={secondaryBtnClass}>Audits</button>
          <div className="w-[1px] h-6 bg-border/50 self-center" />
          <button onClick={() => onAction('delete', listing.id)} className={cn(btnClass, "text-danger")}>Terminate</button>
        </>
      );
    }

    return (
      <>
        <button onClick={() => onAction('edit', listing.id)} className={secondaryBtnClass}>Refine</button>
        <div className="w-[1px] h-6 bg-border/50 self-center" />
        {status === 'paused' ? (
          <button onClick={() => onAction('resume', listing.id)} className={cn(btnClass, "text-emerald-500")}>Unarchive</button>
        ) : (
          <button onClick={() => onAction('pause', listing.id)} className={secondaryBtnClass}>Archive</button>
        )}
        <div className="w-[1px] h-6 bg-border/50 self-center" />
        <button onClick={() => onAction('mark_sold', listing.id)} className={cn(btnClass, "text-primary")}>Liquidate</button>
        <div className="w-[1px] h-6 bg-border/50 self-center" />
        <button onClick={() => onAction('delete', listing.id)} className={cn(btnClass, "text-danger")}>Terminate</button>
      </>
    );
  };

  return (
    <Card className={cn(
      "overflow-hidden border border-border/50 shadow-xl shadow-black/5 transition-all duration-500 bg-card rounded-[2.5rem] mb-6 hover:border-primary/20",
      isDraft && "border-amber-500/20 shadow-amber-500/5"
    )}>
      {isDraft && (
        <div className="bg-amber-500/10 px-6 py-3 flex justify-between items-center border-b border-amber-500/10">
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none">Intelligence Staging — {listing.title || 'Incomplete'}</span>
          <span className="text-[9px] font-black text-amber-500 opacity-60 uppercase tracking-widest">Phase {listing.last_step || 1} / 3</span>
        </div>
      )}
      
      {isDraft && (
        <div className="h-[2px] bg-amber-500/10 w-full overflow-hidden">
          <div 
            className="h-full bg-amber-500 transition-all duration-1000 ease-out" 
            style={{ width: `${(listing.last_step || 1) / 3 * 100}%` }}
          />
        </div>
      )}

      <CardContent className="p-0">
        {/* Top Info Row */}
        <div className="p-6 flex gap-6 items-center">
          <div className="relative h-20 w-20 min-w-[80px] rounded-3xl overflow-hidden bg-muted flex items-center justify-center border border-border/50 shadow-inner group">
            {coverImage ? (
              <img src={coverImage} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
            ) : (
              <FileText className="h-8 w-8 text-muted-foreground/20" />
            )}
            {aiScore !== null && !isDraft && (
              <div className={cn(
                "absolute bottom-0 right-0 px-2 py-1 text-[9px] font-black text-white uppercase tracking-tighter",
                getScoreColor(aiScore)
              )}>
                AI {aiScore}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <h3 className="text-base font-black text-foreground truncate uppercase tracking-tight leading-none">{listing.title || 'Asset Untitled'}</h3>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">
              {listing.subject_code || 'GEN'} • Sem {listing.semester || 'N/A'} • {listing.material_type || 'Archive'}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {renderStatusBadges()}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className={cn(
          "px-8 py-4 border-y border-border/30 flex items-center justify-between bg-muted/20",
          isDraft && "opacity-30 pointer-events-none"
        )}>
          <div className="flex gap-8">
            <div className="flex items-center gap-2 group/metric">
              <Eye className="h-4 w-4 text-primary opacity-40 group-hover/metric:opacity-100 transition-opacity" />
              <div className="flex flex-col">
                <span className="text-xs font-black text-foreground tabular-nums leading-none">{viewCount}</span>
                <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-30">Reach</span>
              </div>
            </div>
            <div className="flex items-center gap-2 group/metric">
              <MessageCircle className="h-4 w-4 text-emerald-500 opacity-40 group-hover/metric:opacity-100 transition-opacity" />
              <div className="flex flex-col">
                <span className="text-xs font-black text-foreground tabular-nums leading-none">{inquiryCount}</span>
                <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-30">Inquiry</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            {status === 'sold' && listing.buyer_name ? (
                <div className="flex flex-col items-end">
                  <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-30">Acquired by</span>
                  <span className="text-[10px] font-black text-primary uppercase tracking-tight">{listing.buyer_name}</span>
                </div>
            ) : (
                <div className="flex flex-col items-end">
                  <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-30">Market Value</span>
                  <span className="text-sm font-black text-foreground tracking-tighter tabular-nums leading-none">₹{listing.price}</span>
                </div>
            )}
          </div>
        </div>

        {/* Actions Row */}
        <div className="flex divide-x divide-border/30 bg-muted/10 group-hover:bg-muted/20 transition-colors">
          {renderActions()}
        </div>
      </CardContent>
    </Card>
  );
}

import { useNavigate } from 'react-router-dom';
import { FileText, Calendar, CheckCircle2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ListingContextBarProps {
  listing: {
    id: string;
    title: string;
    subject_code: string;
    price: number;
    status: 'available' | 'sold';
    image?: string;
  } | null;
  isSeller?: boolean;
  onScheduleMeet: () => void;
  onAction?: (action: string) => void;
}

export function ListingContextBar({ listing, isSeller, onScheduleMeet, onAction }: ListingContextBarProps) {
  const navigate = useNavigate();

  if (!listing) return null;

  const isSold = listing.status === 'sold';

  return (
    <div className="w-full bg-card/80 backdrop-blur-md border-b border-border/50 px-6 py-4 flex items-center justify-between shadow-xl shadow-black/5 animate-in slide-in-from-top duration-300">
      <div 
        onClick={() => !isSold && navigate(`/listing/${listing.id}`)}
        className={`flex items-center gap-4 flex-1 min-w-0 ${!isSold ? 'cursor-pointer hover:opacity-80 transition-all active:scale-[0.98]' : ''}`}
      >
        <div className="h-12 w-12 rounded-xl overflow-hidden bg-muted flex items-center justify-center shrink-0 border border-border/50 shadow-inner">
          {listing.image ? (
            <img src={listing.image} alt="Listing" className="h-full w-full object-cover" />
          ) : (
            <FileText className="h-6 w-6 text-muted-foreground/30" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-black text-foreground truncate uppercase tracking-tight leading-none mb-1">
            {listing.title}
          </h4>
          <div className="flex items-center gap-2 mt-1 whitespace-nowrap overflow-hidden">
            <span className="text-[11px] font-black text-emerald-500 shrink-0 tabular-nums">₹{listing.price}</span>
            <span className="text-[8px] text-muted-foreground font-black uppercase tracking-widest truncate shrink-0 opacity-60">• {listing.subject_code}</span>
            {isSold ? (
              <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded-lg text-[7px] font-black uppercase tracking-widest border border-border shrink-0">Sold</span>
            ) : (
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-lg text-[7px] font-black uppercase tracking-widest border border-emerald-500/20 shrink-0">Available</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 ml-4">
        {!isSold && (
          <>
            {isSeller ? (
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  onAction?.('mark_sold');
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-[1.25rem] h-11 px-6 text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/10 transition-all active:scale-95"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark Sold
              </Button>
            ) : (
                <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  onAction?.('mark_sold'); // Currently using same logic as intent
                }}
                className="bg-primary hover:bg-primary/90 text-white rounded-[1.25rem] h-11 px-6 text-[9px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95"
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Purchase
              </Button>
            )}
            
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                onScheduleMeet();
              }}
              variant="outline"
              className="border-border/50 bg-background/50 hover:bg-muted text-foreground rounded-[1.25rem] h-11 px-6 text-[9px] font-black uppercase tracking-widest transition-all active:scale-95"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Meet
            </Button>
          </>
        )}
        
        {isSold && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/50 rounded-[1.25rem] border border-border/50 shadow-inner">
            <CheckCircle2 className="h-4 w-4 text-muted-foreground/40" />
            <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">Completed</span>
          </div>
        )}
      </div>
    </div>
  );
}

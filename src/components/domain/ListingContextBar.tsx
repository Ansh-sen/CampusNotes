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
    <div className="w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-300">
      <div 
        onClick={() => !isSold && navigate(`/listing/${listing.id}`)}
        className={`flex items-center gap-3 flex-1 min-w-0 ${!isSold ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
      >
        <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
          {listing.image ? (
            <img src={listing.image} alt="Listing" className="h-full w-full object-cover" />
          ) : (
            <FileText className="h-5 w-5 text-gray-300" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-[11px] font-black text-[#1a2744] truncate uppercase tracking-tight leading-tight">
            {listing.title}
          </h4>
          <div className="flex items-center gap-2 mt-0.5 whitespace-nowrap overflow-hidden">
            <span className="text-[10px] font-bold text-emerald-600 shrink-0">₹{listing.price}</span>
            <span className="text-[8px] text-gray-400 font-black uppercase tracking-widest truncate shrink-0">• {listing.subject_code}</span>
            {isSold ? (
              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[7px] font-black uppercase tracking-widest border border-gray-200 shrink-0">Sold</span>
            ) : (
              <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[7px] font-black uppercase tracking-widest border border-emerald-100 shrink-0">Available</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-4">
        {!isSold && (
          <>
            {isSeller ? (
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  onAction?.('mark_sold');
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-9 px-4 text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-600/10"
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                Sold
              </Button>
            ) : (
                <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  onAction?.('mark_sold'); // Currently using same logic as intent
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-9 px-4 text-[9px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/10"
              >
                <ShoppingBag className="h-3.5 w-3.5 mr-1.5" />
                Purchase
              </Button>
            )}
            
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                onScheduleMeet();
              }}
              variant="outline"
              className="border-gray-200 hover:bg-gray-50 text-[#1a2744] rounded-xl h-9 px-4 text-[9px] font-black uppercase tracking-widest"
            >
              <Calendar className="h-3.5 w-3.5 mr-1.5" />
              Meet
            </Button>
          </>
        )}
        
        {isSold && (
          <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 rounded-xl border border-gray-200">
            <CheckCircle2 className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Completed</span>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/UserAvatar';

interface ChatHeaderProps {
  conversation: any;
  onBack: () => void;
  onAction: (action: string) => void;
}

export function ChatHeader({ conversation, onBack, onAction }: ChatHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  
  if (!conversation) return null;

  const otherUserId = conversation.other_id;
  const otherUserName = conversation.other_name;
  const otherUserAvatar = conversation.other_avatar;
  const otherIsTopper = conversation.other_is_topper;
  const otherSales = conversation.other_sales || 0;
  const otherRating = conversation.other_rating || 'N/A';
  const lastSeenAt = conversation.other_last_seen_at;

  const isOnline = lastSeenAt && (new Date().getTime() - new Date(lastSeenAt).getTime() < 300000); // 5 mins
  
  const formatLastSeen = (dateStr: string) => {
    if (!dateStr) return 'long ago';
    const diff = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return 'just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff/60)}h ago`;
    return 'long ago';
  };

  return (
    <div className="w-full bg-white/95 backdrop-blur-xl border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors active:scale-90">
          <ArrowLeft className="h-5 w-5 text-[#1a2744]" />
        </button>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <UserAvatar 
              src={otherUserAvatar} 
              seed={otherUserId} 
              size="sm"
              className="h-10 w-10 ring-2 ring-white shadow-sm"
            />
            {isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
            )}
          </div>
          
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm font-black text-[#1a2744] truncate max-w-[140px] leading-tight">
                {otherUserName}
              </span>
              {!!otherIsTopper && (
                <div className="shrink-0 px-1.5 py-0.5 bg-[#f59e0b]/10 text-[#f59e0b] rounded-full text-[7px] font-black uppercase tracking-widest border border-[#f59e0b]/20">
                  Verified Topper
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
               <span>{otherSales} sales</span>
               <span className="h-1 w-1 rounded-full bg-gray-200"></span>
               <span>{otherRating} rating</span>
               <span className="h-1 w-1 rounded-full bg-gray-200"></span>
               {isOnline ? (
                 <span className="text-emerald-500 font-black">Online now</span>
               ) : (
                 <span className="truncate">Last seen {formatLastSeen(lastSeenAt)}</span>
               )}
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10 text-[#1a2744] hover:bg-gray-100 rounded-full"
          onClick={() => setShowMenu(!showMenu)}
        >
          <MoreVertical className="h-5 w-5" />
        </Button>
        
        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 top-12 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
              <button 
                onClick={() => { onAction(conversation.is_archived ? 'unarchive' : 'archive'); setShowMenu(false); }}
                className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#1a2744] hover:bg-gray-50 rounded-xl transition-colors"
              >
                {conversation.is_archived ? 'Unarchive Chat' : 'Archive Chat'}
              </button>
              {conversation.seller_id === conversation.current_user_id && conversation.listing_status === 'available' && (
                <button 
                  onClick={() => { onAction('mark_sold'); setShowMenu(false); }}
                  className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                >
                  Mark as Sold
                </button>
              )}
              <button 
                onClick={() => { onAction('report'); setShowMenu(false); }}
                className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-orange-500 hover:bg-orange-50 rounded-xl transition-colors"
              >
                Report User
              </button>
              <button 
                onClick={() => { onAction('block'); setShowMenu(false); }}
                className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 rounded-xl transition-colors"
              >
                Block User
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

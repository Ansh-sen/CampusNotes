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
    <div className="w-full bg-card/80 backdrop-blur-xl border-b border-border/50 px-4 py-4 flex items-center justify-between shadow-lg shadow-black/5">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2.5 -ml-2 hover:bg-muted rounded-full transition-colors active:scale-90">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <UserAvatar 
              src={otherUserAvatar} 
              seed={otherUserId} 
              size="sm"
              className="h-11 w-11 ring-2 ring-background shadow-md"
            />
            {isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-emerald-500 rounded-full border-2 border-card shadow-sm" />
            )}
          </div>
          
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-black text-foreground truncate max-w-[140px] leading-tight tracking-tight">
                {otherUserName}
              </span>
              {!!otherIsTopper && (
                <div className="shrink-0 px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg text-[7px] font-black uppercase tracking-widest border border-amber-500/20">
                  Verified Topper
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
               <span>{otherSales} sales</span>
               <span className="h-1 w-1 rounded-full bg-border"></span>
               <span>{otherRating} rating</span>
               <span className="h-1 w-1 rounded-full bg-border"></span>
               {isOnline ? (
                 <span className="text-emerald-500 font-black">Online</span>
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
          className="h-11 w-11 text-foreground hover:bg-muted rounded-full transition-all active:scale-90"
          onClick={() => setShowMenu(!showMenu)}
        >
          <MoreVertical className="h-5 w-5" />
        </Button>
        
        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 top-14 w-56 bg-card rounded-[2rem] shadow-2xl border border-border/50 p-3 z-50 animate-in fade-in zoom-in-95 duration-300">
              <button 
                onClick={() => { onAction(conversation.is_archived ? 'unarchive' : 'archive'); setShowMenu(false); }}
                className="w-full text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-muted rounded-2xl transition-all active:scale-[0.98]"
              >
                {conversation.is_archived ? 'Unarchive Chat' : 'Archive Chat'}
              </button>
              {conversation.seller_id === conversation.current_user_id && conversation.listing_status === 'available' && (
                <button 
                  onClick={() => { onAction('mark_sold'); setShowMenu(false); }}
                  className="w-full text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:bg-emerald-500/10 rounded-2xl transition-all active:scale-[0.98]"
                >
                  Mark as Sold
                </button>
              )}
              <button 
                onClick={() => { onAction('report'); setShowMenu(false); }}
                className="w-full text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-amber-500 hover:bg-amber-500/10 rounded-2xl transition-all active:scale-[0.98]"
              >
                Report User
              </button>
              <button 
                onClick={() => { onAction('block'); setShowMenu(false); }}
                className="w-full text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-danger hover:bg-danger/10 rounded-2xl transition-all active:scale-[0.98]"
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

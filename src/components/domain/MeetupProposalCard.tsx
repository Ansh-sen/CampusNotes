import { Calendar, MapPin, IndianRupee, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MeetupProposalCardProps {
  message: {
    id: string;
    content: string; // JSON string
    sender_id: string;
  };
  currentUserId: string;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}

export function MeetupProposalCard({ message, currentUserId, onAccept, onDecline }: MeetupProposalCardProps) {
  let proposal: any = {};
  try {
    proposal = JSON.parse(message.content);
  } catch (e) {
    console.error('Failed to parse meetup proposal content', e);
  }
  const isSender = message.sender_id === currentUserId;
  const status = proposal.status || 'pending';

  return (
    <div className={`flex flex-col gap-4 p-6 rounded-[2.5rem] border shadow-xl max-w-[300px] sm:max-w-xs animate-in zoom-in-95 duration-500 hover:shadow-2xl transition-all ${
      isSender 
        ? 'bg-primary/5 border-primary/20 shadow-primary/5' 
        : 'bg-card border-border shadow-black/5'
    }`}>
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-dashed border-border">
        <div className="h-10 w-10 bg-primary/10 rounded-2xl flex items-center justify-center shadow-inner">
          <Calendar className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h5 className="text-[10px] font-black text-foreground uppercase tracking-widest leading-none mb-1">Meet-up Proposal</h5>
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter opacity-60">Request for exchange</p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-5 py-2">
        <div className="flex items-start gap-4">
          <div className="h-4 w-4 shrink-0 mt-0.5 flex items-center justify-center">
            <Clock className="h-4 w-4 text-muted-foreground/40" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block mb-0.5 opacity-60">When</span>
            <span className="text-xs font-black text-foreground truncate block tracking-tight">{proposal.date} at {proposal.time}</span>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="h-4 w-4 shrink-0 mt-0.5 flex items-center justify-center">
            <MapPin className="h-4 w-4 text-muted-foreground/40" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block mb-0.5 opacity-60">Where</span>
            <span className="text-xs font-black text-foreground truncate block tracking-tight">{proposal.location}</span>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="h-4 w-4 shrink-0 mt-0.5 flex items-center justify-center">
            <IndianRupee className="h-4 w-4 text-muted-foreground/40" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block mb-0.5 opacity-60">Amount</span>
            <span className="text-sm font-black text-emerald-500 tabular-nums tracking-tight">₹{proposal.amount}</span>
          </div>
        </div>
      </div>

      {/* Status & Actions */}
      <div className="mt-2">
        {status === 'pending' ? (
          isSender ? (
            <div className="flex items-center justify-center gap-3 py-4 bg-primary/10 rounded-2xl border border-primary/20 shadow-inner">
              <Clock className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">Awaiting response</span>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button 
                onClick={() => onDecline(message.id)}
                variant="outline" 
                className="flex-1 h-12 rounded-[1.25rem] text-danger border-danger/20 hover:bg-danger/10 hover:border-danger/30 text-[9px] font-black uppercase tracking-widest transition-all active:scale-95"
              >
                Decline
              </Button>
              <Button 
                onClick={() => onAccept(message.id)}
                className="flex-1 h-12 bg-primary hover:bg-primary/90 text-white rounded-[1.25rem] text-[9px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-95"
              >
                Accept
              </Button>
            </div>
          )
        ) : status === 'accepted' ? (
          <div className="flex items-center justify-center gap-3 py-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shadow-inner">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Accepted</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3 py-4 bg-muted/50 rounded-2xl border border-border shadow-inner">
            <XCircle className="h-4 w-4 text-muted-foreground/40" />
            <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">Declined</span>
          </div>
        )}
      </div>
    </div>
  );
}

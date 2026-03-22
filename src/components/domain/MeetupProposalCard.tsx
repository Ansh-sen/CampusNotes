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
  const proposal = JSON.parse(message.content);
  const isSender = message.sender_id === currentUserId;
  const status = proposal.status || 'pending';

  return (
    <div className={`flex flex-col gap-3 p-5 rounded-[2rem] border shadow-sm max-w-[280px] sm:max-w-xs animate-in zoom-in-95 duration-300 ${
      isSender ? 'bg-white border-blue-100' : 'bg-gray-50 border-gray-100'
    }`}>
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-dashed border-gray-200">
        <div className="h-8 w-8 bg-blue-50 rounded-full flex items-center justify-center">
          <Calendar className="h-4 w-4 text-blue-600" />
        </div>
        <div className="flex-1">
          <h5 className="text-[10px] font-black text-[#1a2744] uppercase tracking-widest">Meet-up Proposal</h5>
          <p className="text-[9px] font-bold text-gray-400">Request for exchange</p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-4 py-2">
        <div className="flex items-start gap-3">
          <Clock className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">When</span>
            <span className="text-xs font-bold text-[#1a2744] truncate">{proposal.date} at {proposal.time}</span>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Where</span>
            <span className="text-xs font-bold text-[#1a2744] truncate">{proposal.location}</span>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <IndianRupee className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Amount</span>
            <span className="text-xs font-bold text-emerald-600">₹{proposal.amount}</span>
          </div>
        </div>
      </div>

      {/* Status & Actions */}
      <div className="mt-2">
        {status === 'pending' ? (
          isSender ? (
            <div className="flex items-center justify-center gap-2 py-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
              <Clock className="h-3.5 w-3.5 text-blue-400 animate-spin-slow" />
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Awaiting response</span>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button 
                onClick={() => onDecline(message.id)}
                variant="ghost" 
                className="flex-1 h-10 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 text-[9px] font-black uppercase tracking-widest border border-red-100"
              >
                Decline
              </Button>
              <Button 
                onClick={() => onAccept(message.id)}
                className="flex-1 h-10 bg-[#1a2744] hover:bg-[#1a2744]/90 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-[#1a2744]/10"
              >
                Accept
              </Button>
            </div>
          )
        ) : status === 'accepted' ? (
          <div className="flex items-center justify-center gap-2 py-3 bg-emerald-50 rounded-xl border border-emerald-100">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Accepted</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 py-3 bg-gray-50 rounded-xl border border-gray-100">
            <XCircle className="h-4 w-4 text-gray-400" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Declined</span>
          </div>
        )}
      </div>
    </div>
  );
}

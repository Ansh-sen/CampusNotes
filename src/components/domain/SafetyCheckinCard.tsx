import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SafetyCheckinCardProps {
  meetupId: string;
  onConfirm: (id: string) => void;
  onReport: (id: string) => void;
}

export function SafetyCheckinCard({ meetupId, onConfirm, onReport }: SafetyCheckinCardProps) {
  return (
    <div className="p-5 bg-gradient-to-r from-[#1a2744] to-[#2d4371] border-b border-white/10 text-white shadow-xl animate-in slide-in-from-top duration-500 overflow-hidden relative">
      <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 bg-white/5 rounded-full blur-3xl" />
      
      <div className="flex items-center gap-4 relative z-10">
        <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 border border-white/10">
          <ShieldCheck className="h-6 w-6 text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] leading-none opacity-60">Safety Check-in</h4>
          <p className="text-sm font-black mt-1 leading-tight">Did your exchange go smoothly?</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => onReport(meetupId)}
            className="h-11 px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/5"
          >
            <AlertTriangle className="h-4 w-4 text-orange-400" />
          </Button>
          <Button 
            onClick={() => onConfirm(meetupId)}
            className="h-11 px-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20"
          >
            All Good
          </Button>
        </div>
      </div>
    </div>
  );
}

import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SafetyCheckinCardProps {
  meetupId: string;
  onConfirm: (id: string) => void;
  onReport: (id: string) => void;
}

export function SafetyCheckinCard({ meetupId, onConfirm, onReport }: SafetyCheckinCardProps) {
  return (
    <div className="p-6 bg-gradient-to-br from-primary to-primary/80 border-b border-white/10 text-white shadow-2xl animate-in slide-in-from-top duration-700 overflow-hidden relative">
      <div className="absolute top-0 right-0 -mr-12 -mt-12 h-40 w-40 bg-white/10 rounded-full blur-[80px]" />
      <div className="absolute bottom-0 left-0 -ml-8 -mb-8 h-24 w-24 bg-black/10 rounded-full blur-2xl" />
      
      <div className="flex items-center gap-5 relative z-10">
        <div className="h-14 w-14 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 border border-white/20 shadow-lg backdrop-blur-md">
          <ShieldCheck className="h-7 w-7 text-emerald-300" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] leading-none opacity-60 mb-1">Safety Check-in</h4>
          <p className="text-base font-black leading-tight tracking-tight">Did your exchange go smoothly?</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => onReport(meetupId)}
            className="h-12 w-12 p-0 bg-white/10 hover:bg-white/20 text-white rounded-[1.25rem] border border-white/10 transition-all active:scale-95 shadow-lg"
          >
            <AlertTriangle className="h-5 w-5 text-amber-300" />
          </Button>
          <Button 
            onClick={() => onConfirm(meetupId)}
            className="h-12 px-8 bg-white text-primary hover:bg-white/90 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-black/20 transition-all active:scale-95"
          >
            All Good
          </Button>
        </div>
      </div>
    </div>
  );
}

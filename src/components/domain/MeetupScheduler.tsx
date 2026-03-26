import { useState } from 'react';
import { X, Calendar, Clock, MapPin, IndianRupee, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MeetupSchedulerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { date: string; time: string; location: string; amount: number }) => void;
  listingPrice: number;
}

export function MeetupScheduler({ isOpen, onClose, onSubmit, listingPrice }: MeetupSchedulerProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(() => {
    const nextHour = new Date();
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
    return nextHour.toTimeString().slice(0, 5);
  });
  const [location, setLocation] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4 bg-background/60 backdrop-blur-md animate-in fade-in duration-500">
      <div 
        className="w-full max-w-md bg-card rounded-t-[3rem] sm:rounded-[3rem] p-10 shadow-3xl animate-in slide-in-from-bottom duration-700 relative border border-border/50 shadow-black/20"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="space-y-1.5">
            <h2 className="text-2xl font-black text-foreground tracking-tight">Propose Meet-up</h2>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Set a time and place to exchange</p>
          </div>
          <button 
            onClick={onClose}
            className="h-12 w-12 bg-muted hover:bg-muted/80 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-inner"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-foreground uppercase tracking-widest ml-1 opacity-70">Date</label>
              <div className="relative group">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)}
                  className="pl-12 h-16 bg-muted/30 border-border/50 rounded-2xl font-black focus:ring-4 focus:ring-primary/10 hover:bg-muted/50 transition-all text-sm"
                />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-foreground uppercase tracking-widest ml-1 opacity-70">Time</label>
              <div className="relative group">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  type="time" 
                  value={time} 
                  onChange={(e) => setTime(e.target.value)}
                  className="pl-12 h-16 bg-muted/30 border-border/50 rounded-2xl font-black focus:ring-4 focus:ring-primary/10 hover:bg-muted/50 transition-all text-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-foreground uppercase tracking-widest ml-1 opacity-70">Location</label>
            <div className="relative group">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                type="text" 
                placeholder="Library Gate, RGPV"
                value={location} 
                onChange={(e) => setLocation(e.target.value)}
                className="pl-12 h-16 bg-muted/30 border-border/50 rounded-2xl font-black focus:ring-4 focus:ring-primary/10 hover:bg-muted/50 transition-all text-sm placeholder:text-muted-foreground/30"
              />
            </div>
          </div>

          <div className="space-y-3 opacity-80">
            <label className="text-[10px] font-black text-foreground uppercase tracking-widest ml-1 opacity-50">Total Amount</label>
            <div className="relative">
              <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
              <Input 
                readOnly
                value={`₹${listingPrice}`} 
                className="pl-12 h-16 bg-primary/5 border-primary/20 rounded-2xl font-black text-primary shadow-inner text-base"
              />
            </div>
          </div>

          <Button 
            onClick={() => onSubmit({ date, time, location: location || 'Library Gate, RGPV', amount: listingPrice })}
            className="w-full h-16 bg-primary hover:bg-primary/90 text-white text-xs font-black uppercase tracking-widest rounded-[2rem] mt-6 shadow-2xl shadow-primary/20 transition-all active:scale-95"
          >
            <Send className="h-5 w-5 mr-3" />
            Send Proposal
          </Button>
        </div>
      </div>
    </div>
  );
}

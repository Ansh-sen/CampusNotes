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
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="w-full max-w-md bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-500 relative ring-1 ring-black/5"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-[#1a2744] tracking-tight">Propose Meet-up</h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Set a time and place to exchange</p>
          </div>
          <button 
            onClick={onClose}
            className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors shadow-sm"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-[#1a2744] uppercase tracking-widest ml-1">Date</label>
              <div className="relative group">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-[#1a2744] transition-colors" />
                <Input 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)}
                  className="pl-12 h-14 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-[#1a2744]/10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-[#1a2744] uppercase tracking-widest ml-1">Time</label>
              <div className="relative group">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-[#1a2744] transition-colors" />
                <Input 
                  type="time" 
                  value={time} 
                  onChange={(e) => setTime(e.target.value)}
                  className="pl-12 h-14 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-[#1a2744]/10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-[#1a2744] uppercase tracking-widest ml-1">Location</label>
            <div className="relative group">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-[#1a2744] transition-colors" />
              <Input 
                type="text" 
                placeholder="Library Gate, RGPV"
                value={location} 
                onChange={(e) => setLocation(e.target.value)}
                className="pl-12 h-14 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-[#1a2744]/10"
              />
            </div>
          </div>

          <div className="space-y-2 opacity-60">
            <label className="text-[9px] font-black text-[#1a2744] uppercase tracking-widest ml-1">Total Amount</label>
            <div className="relative">
              <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1a2744]" />
              <Input 
                readOnly
                value={`₹${listingPrice}`} 
                className="pl-12 h-14 bg-gray-100 border-none rounded-2xl font-black text-[#1a2744]"
              />
            </div>
          </div>

          <Button 
            onClick={() => onSubmit({ date, time, location: location || 'Library Gate, RGPV', amount: listingPrice })}
            className="w-full h-16 bg-[#1a2744] hover:bg-[#1a2744]/90 text-sm font-black uppercase tracking-widest rounded-2xl mt-4 shadow-xl shadow-[#1a2744]/20"
          >
            <Send className="h-4 w-4 mr-2" />
            Send Proposal
          </Button>
        </div>
      </div>
    </div>
  );
}

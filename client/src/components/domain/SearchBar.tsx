import { Search, LayoutGrid } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onFilterClick?: () => void;
}

export function SearchBar({ value, onChange, onFilterClick }: SearchBarProps) {
  return (
    <div className="flex items-center gap-2 w-full bg-white h-12 p-1 rounded-2xl shadow-sm border border-gray-100/50">
      <div className="relative flex-1">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center h-5 w-5 text-gray-400">
          <Search className="h-full w-full stroke-[2.5px]" />
        </div>
        <Input 
          placeholder="Search notes, subjects..." 
          className="pl-11 h-full bg-transparent border-none rounded-none focus-visible:ring-0 text-sm placeholder:text-gray-400 font-bold"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      {onFilterClick && (
        <button 
          onClick={onFilterClick}
          className="flex items-center justify-center h-full px-4 bg-[#e0f2fe] hover:bg-[#bae6fd] text-[#0369a1] text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shrink-0"
        >
          <LayoutGrid className="h-4 w-4 mr-1.5 fill-[#0369a1]" />
          Filter
        </button>
      )}
    </div>
  );
}

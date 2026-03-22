import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Tag as TagIcon, Hash } from 'lucide-react';

interface ListingFormProps {
  data: any;
  onChange: (data: any) => void;
}

export function ListingForm({ data, onChange }: ListingFormProps) {
  const [tagInput, setTagInput] = useState('');

  const updateField = (field: string, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const addTag = () => {
    if (!tagInput.trim()) return;
    const newTags = [...(data.tags || [])];
    if (!newTags.includes(tagInput.trim())) {
      newTags.push(tagInput.trim());
      updateField('tags', newTags);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    updateField('tags', (data.tags || []).filter((t: string) => t !== tag));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Title & Description */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-bold text-[hsl(var(--text))] flex items-center gap-2">
             Listing Title
          </label>
          <Input 
            placeholder="e.g. Complete DS Final Notes + 5 Practice Exams" 
            value={data.title} 
            onChange={e => updateField('title', e.target.value)}
            className="rounded-xl h-12 focus:ring-[hsl(var(--primary))]"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-bold text-[hsl(var(--text))]">Description</label>
            <span className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full",
              (data.description?.length || 0) < 20 ? "bg-red-50 text-red-500" : "bg-green-50 text-green-500"
            )}>
              {data.description?.length || 0} characters
            </span>
          </div>
          <textarea 
            className="w-full flex min-h-[140px] rounded-2xl border border-[hsl(var(--muted))] bg-white px-4 py-3 text-sm shadow-sm placeholder:text-[hsl(var(--text-muted))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] transition-all"
            placeholder="What makes this material special? List subjects covered, exam years, etc..."
            value={data.description}
            onChange={e => updateField('description', e.target.value)}
          />
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-[hsl(var(--text))] flex items-center gap-2">
           <TagIcon className="w-4 h-4 text-[hsl(var(--primary))]" /> Tags & Keywords
        </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {(data.tags || []).map((tag: string) => (
            <Badge key={tag} variant="secondary" className="px-3 py-1 bg-[hsl(var(--primary))/10] text-[hsl(var(--primary))] border-none flex items-center gap-1 hover:bg-[hsl(var(--primary))/20]">
              <Hash className="w-3 h-3" />
              {tag}
              <button onClick={() => removeTag(tag)} className="ml-1 hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input 
            placeholder="Add tag (e.g. Finals, 2024, Python)" 
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTag()}
            className="rounded-xl h-11"
          />
          <button 
            onClick={addTag}
            className="px-4 bg-[hsl(var(--primary))] text-white rounded-xl font-bold hover:opacity-90 active:scale-95 transition-all shrink-0"
          >
            Add
          </button>
        </div>
      </div>

    </div>
  );
}

// Helper to use cn in this file if not exported correctly elsewhere
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

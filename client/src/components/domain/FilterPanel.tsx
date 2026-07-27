import { useState, useEffect } from 'react';
import { API_URL } from '@/config';
import { X, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProgrammes, useBranches, useSemesters, useSubjects } from '@/hooks/useAcademicData';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
  currentFilters: any;
}

const MATERIAL_TYPES = ['Lecture Notes', 'Practice Exams', 'Lab Manuals', 'Projects', 'Tutoring'];
const SORT_OPTIONS = [
  { label: 'Latest', value: 'latest' },
  { label: 'Price Low to High', value: 'price_asc' },
  { label: 'Price High to Low', value: 'price_desc' },
  { label: 'Popular', value: 'popular' }
];

const chev = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`;
const selectCls = `w-full h-12 px-4 pr-10 rounded-xl border border-gray-100 bg-gray-50 text-sm font-semibold text-[#1a2744] focus:outline-none focus:ring-2 focus:ring-[#1a2744] focus:bg-white appearance-none transition-all`;
const selectStyle = { backgroundImage: chev, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.1rem' };

export function FilterPanel({ isOpen, onClose, onApply, currentFilters }: FilterPanelProps) {
  const [filters, setFilters] = useState(currentFilters);
  const [resultCount, setResultCount] = useState<number | null>(null);

  // Academic data hooks
  const { programmes } = useProgrammes();
  const { branches } = useBranches(filters.programme);
  const { semesters } = useSemesters(filters.programme, filters.branch);
  const { subjects } = useSubjects(filters.programme, filters.branch, filters.semester);

  // Sync internal state when opened
  useEffect(() => {
    if (isOpen) {
      setFilters(currentFilters);
    }
  }, [isOpen, currentFilters]);

  // Fetch count when filters change
  useEffect(() => {
    if (!isOpen) return;
    const fetchCount = async () => {
      try {
        const params = new URLSearchParams();
        if (filters.programme) params.append('programme', filters.programme);
        if (filters.branch) params.append('branch', filters.branch);
        if (filters.semester) params.append('semester', filters.semester);
        if (filters.subject_code) params.append('subject_code', filters.subject_code);
        if (filters.materialType) params.append('material_types', filters.materialType);
        if (filters.minPrice) params.append('min_price', filters.minPrice);
        if (filters.maxPrice) params.append('max_price', filters.maxPrice);
        
        const response = await fetch(`${API_URL}/listings?${params.toString()}`);
        const json = await response.json();
        setResultCount(json.count || 0);
      } catch (err) {
        console.error("Failed to fetch count", err);
      }
    };
    
    const timer = setTimeout(fetchCount, 300);
    return () => clearTimeout(timer);
  }, [filters, isOpen]);

  const toggleMaterialType = (type: string) => {
    const currentTypes = filters.materialType ? filters.materialType.split(',') : [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter((t: string) => t !== type)
      : [...currentTypes, type];
    setFilters({ ...filters, materialType: newTypes.join(',') });
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleClear = () => {
    const cleared = {
      sort: 'latest',
      programme: '',
      branch: '',
      semester: '',
      subject_code: '',
      materialType: '',
      minPrice: '',
      maxPrice: ''
    };
    setFilters(cleared);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#001529]/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      
      {/* Panel */}
      <div className="relative w-full max-w-md bg-white rounded-t-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full duration-300 flex flex-col max-h-[92vh]">
        {/* Drag handle decoration */}
        <div className="h-1.5 w-12 bg-gray-200 rounded-full mx-auto mt-4 mb-2 shrink-0" />
        
        <div className="px-6 pb-6 overflow-y-auto scrollbar-hide space-y-8 flex-1">
          {/* Header */}
          <div className="flex items-center justify-between sticky top-0 bg-white pt-2 pb-4 z-10 border-b border-gray-50">
            <h2 className="text-2xl font-extrabold text-[#1a2744]">Filters</h2>
            <button onClick={onClose} className="p-2.5 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors">
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Sort Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#1a2744] uppercase tracking-widest">Sort By</h3>
            <div className="grid grid-cols-2 gap-3">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFilters({ ...filters, sort: opt.value })}
                  className={`flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold border transition-all ${
                    filters.sort === opt.value
                      ? 'bg-[#1a2744] text-white border-[#1a2744] shadow-md'
                      : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300'
                  }`}
                >
                  {opt.label}
                  {filters.sort === opt.value && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-gray-50" />

          {/* Academic Context */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-[#1a2744] uppercase tracking-widest">Academic Context</h3>
            
            <div className="grid gap-5">
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-gray-400 uppercase ml-1">Programme & Branch</p>
                <div className="flex gap-2">
                   <select 
                     className={selectCls} style={selectStyle}
                     value={filters.programme}
                     onChange={e => setFilters({ ...filters, programme: e.target.value, branch: '', semester: '', subject_code: '' })}
                   >
                     <option value="">All Programmes</option>
                     {programmes.map(p => <option key={p} value={p}>{p}</option>)}
                   </select>
                   <select 
                     className={selectCls} style={selectStyle}
                     value={filters.branch}
                     onChange={e => setFilters({ ...filters, branch: e.target.value, semester: '', subject_code: '' })}
                     disabled={!filters.programme}
                   >
                     <option value="">All Branches</option>
                     {branches.map(b => <option key={b} value={b}>{b}</option>)}
                   </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-gray-400 uppercase ml-1">Semester</p>
                  <select 
                    className={selectCls} style={selectStyle}
                    value={filters.semester}
                    onChange={e => setFilters({ ...filters, semester: e.target.value, subject_code: '' })}
                    disabled={!filters.branch}
                  >
                    <option value="">All</option>
                    {semesters.map(s => <option key={s} value={String(s)}>Sem {s}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-gray-400 uppercase ml-1">Subject</p>
                  <select 
                    className={selectCls} style={selectStyle}
                    value={filters.subject_code}
                    onChange={e => setFilters({ ...filters, subject_code: e.target.value })}
                    disabled={!filters.semester}
                  >
                    <option value="">All Subjects</option>
                    {subjects.map(s => <option key={s.subject_code} value={s.subject_code}>{s.subject_code}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-50" />

          {/* Material Type */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#1a2744] uppercase tracking-widest">Material Type</h3>
            <div className="flex flex-wrap gap-2.5">
              {MATERIAL_TYPES.map(type => {
                const isActive = filters.materialType?.split(',').includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleMaterialType(type)}
                    className={`px-5 py-2.5 rounded-full text-xs font-extrabold transition-all border ${
                      isActive
                        ? 'bg-[#1a2744] text-white border-[#1a2744] shadow-sm'
                        : 'bg-white text-gray-500 border-gray-100'
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-gray-50" />

          {/* Price Range */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#1a2744] uppercase tracking-widest">Price Range (₹)</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-xs">MIN</span>
                <input 
                  type="number"
                  className="w-full h-12 pl-12 pr-4 rounded-xl bg-gray-50 border border-gray-100 text-sm font-bold text-[#1a2744] focus:ring-2 focus:ring-[#1a2744]"
                  value={filters.minPrice}
                  onChange={e => setFilters({ ...filters, minPrice: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="flex-1 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-xs">MAX</span>
                <input 
                  type="number"
                  className="w-full h-12 pl-12 pr-4 rounded-xl bg-gray-50 border border-gray-100 text-sm font-bold text-[#1a2744] focus:ring-2 focus:ring-[#1a2744]"
                  value={filters.maxPrice}
                  onChange={e => setFilters({ ...filters, maxPrice: e.target.value })}
                  placeholder="5000"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-4 border-t border-gray-100 bg-white grid grid-cols-2 gap-4 shrink-0">
          <Button 
            variant="ghost" 
            className="h-14 rounded-2xl text-gray-600 font-bold hover:bg-gray-50 hover:text-red-500"
            onClick={handleClear}
          >
            Clear all
          </Button>
          <Button 
            className="h-14 rounded-2xl bg-[#1a2744] text-white font-extrabold flex items-center justify-between px-6 shadow-xl shadow-blue-900/20 active:scale-95 transition-all"
            onClick={handleApply}
          >
            <span className="text-sm">Show Results {resultCount !== null && `(${resultCount})`}</span>
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

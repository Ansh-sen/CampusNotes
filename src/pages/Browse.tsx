import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { SearchBar } from '@/components/domain/SearchBar';
import { FilterPanel } from '@/components/domain/FilterPanel';
import { ListingCard } from '@/components/domain/ListingCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, ArrowLeft, SlidersHorizontal, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  useAuth();

  // Filters state from URL
  const initialFilters = {
    sort: searchParams.get('sort') || 'latest',
    category: searchParams.get('category') || 'all',
    search: searchParams.get('search') || '',
    programme: searchParams.get('programme') || '',
    branch: searchParams.get('branch') || '',
    semester: searchParams.get('semester') || '',
    subject_code: searchParams.get('subject_code') || '',
    materialType: searchParams.get('material_types') || '',
    minPrice: searchParams.get('min_price') || '',
    maxPrice: searchParams.get('max_price') || ''
  };

  const [filters, setFilters] = useState(initialFilters);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchListings();
    
    // Sync filters with URL if changed externally
    setFilters({
      sort: searchParams.get('sort') || 'latest',
      category: searchParams.get('category') || 'all',
      search: searchParams.get('search') || '',
      programme: searchParams.get('programme') || '',
      branch: searchParams.get('branch') || '',
      semester: searchParams.get('semester') || '',
      subject_code: searchParams.get('subject_code') || '',
      materialType: searchParams.get('material_types') || '',
      minPrice: searchParams.get('min_price') || '',
      maxPrice: searchParams.get('max_price') || ''
    });
  }, [searchParams]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchParams.get('programme')) params.append('programme', searchParams.get('programme')!);
      if (searchParams.get('branch')) params.append('branch', searchParams.get('branch')!);
      if (searchParams.get('semester')) params.append('semester', searchParams.get('semester')!);
      if (searchParams.get('subject_code')) params.append('subject_code', searchParams.get('subject_code')!);
      
      const materialTypes = searchParams.get('material_types');
      if (materialTypes) params.append('material_types', materialTypes);
      
      const category = searchParams.get('category');
      if (category && category !== 'all') {
        // If it's a specific material type category...
        // This logic needs to match how the backend handles categories vs material types
        params.append('category', category);
      }
      
      if (searchParams.get('min_price')) params.append('min_price', searchParams.get('min_price')!);
      if (searchParams.get('max_price')) params.append('max_price', searchParams.get('max_price')!);
      if (searchParams.get('sort')) params.append('sort', searchParams.get('sort')!);
      if (searchParams.get('search')) params.append('search', searchParams.get('search')!);

      const response = await fetch(`http://localhost:3001/api/listings?${params.toString()}`);
      const json = await response.json();
      setListings(json.data || []);
    } catch (error) {
      console.error("Failed to fetch listings:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateURL = (newFilters: any) => {
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        // Map frontend keys to API query param keys
        if (key === 'materialType') params.append('material_types', value as string);
        else if (key === 'minPrice') params.append('min_price', value as string);
        else if (key === 'maxPrice') params.append('max_price', value as string);
        else params.append(key, value as string);
      }
    });
    setSearchParams(params);
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    updateURL({ ...filters, ...newFilters });
  };

  const handleSearch = (q: string) => {
    handleFilterChange({ search: q });
  };

  const clearFilters = () => {
    const cleared = {
      sort: 'latest',
      category: 'all',
      search: '',
      programme: '',
      branch: '',
      semester: '',
      subject_code: '',
      materialType: '',
      minPrice: '',
      maxPrice: ''
    };
    setFilters(cleared);
    setSearchParams({});
  };

  return (
    <div className="w-full max-w-screen-sm mx-auto min-h-screen bg-[#f8f9fc] pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40 px-4 pt-4 pb-4 space-y-4 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-[#1a2744]" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-black text-[#1a2744] uppercase tracking-tight">Browse Notes</h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {loading ? 'Searching...' : `${listings.length} Results found`}
            </p>
          </div>
          <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl">
            <button 
              onClick={() => setViewMode('grid')}
              className={cn("p-1.5 rounded-lg transition-all", viewMode === 'grid' ? "bg-white shadow-sm text-blue-600" : "text-gray-400")}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={cn("p-1.5 rounded-lg transition-all", viewMode === 'list' ? "bg-white shadow-sm text-blue-600" : "text-gray-400")}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1">
            <SearchBar 
              value={filters.search}
              onChange={handleSearch}
            />
          </div>
          <button 
            onClick={() => setIsFilterPanelOpen(true)}
            className="h-12 w-12 flex items-center justify-center bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-gray-200 hover:bg-gray-50 transition-all active:scale-95 relative shrink-0"
          >
            <SlidersHorizontal className="h-5 w-5 text-[#1a2744]" />
            {Object.values(filters).filter(v => v && v !== 'all' && v !== 'latest').length > 0 && (
               <div className="absolute -top-1 -right-1 h-4 w-4 bg-blue-600 rounded-full border-2 border-white" />
            )}
          </button>
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className={cn(
            "grid gap-4",
            viewMode === 'grid' ? "grid-cols-2" : "grid-cols-1"
          )}>
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="space-y-2">
                <Skeleton className={cn("rounded-2xl w-full", viewMode === 'grid' ? "aspect-square" : "h-24")} />
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="py-20 text-center space-y-6 bg-white rounded-[2rem] border border-gray-100 px-6">
            <div className="bg-gray-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto">
              <Search className="h-10 w-10 text-gray-300" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-[#1a2744]">No results found</h3>
              <p className="text-sm text-gray-400 font-bold max-w-xs mx-auto uppercase tracking-tight">Try adjusting your filters or search terms to find what you're looking for.</p>
            </div>
            <Button 
              onClick={clearFilters}
              variant="outline"
              className="rounded-xl px-8 h-12 text-[10px] font-black uppercase tracking-widest border-gray-200"
            >
              Clear All Filters
            </Button>
          </div>
        ) : (
          <div className={cn(
            "grid gap-x-4 gap-y-6",
            viewMode === 'grid' ? "grid-cols-2" : "grid-cols-1"
          )}>
            {listings.map((listing, idx) => (
              <ListingCard key={listing.id} listing={listing} index={idx} />
            ))}
          </div>
        )}
      </div>

      <FilterPanel 
        isOpen={isFilterPanelOpen} 
        onClose={() => setIsFilterPanelOpen(false)}
        currentFilters={filters}
        onApply={handleFilterChange}
      />
    </div>
  );
}

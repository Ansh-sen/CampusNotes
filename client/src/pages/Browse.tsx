import { useState, useEffect } from 'react';
import { API_URL } from '@/config';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
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

      const response = await fetch(`${API_URL}/listings?${params.toString()}`);
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
    <div className="w-full min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-xl border-b border-border/50 sticky top-0 z-40 px-4 pt-10 pb-6 space-y-6 shadow-2xl shadow-black/5">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="h-10 w-10 flex items-center justify-center bg-muted hover:bg-muted/80 rounded-xl transition-all active:scale-90 border border-border/50 shadow-inner"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-black text-foreground uppercase tracking-tighter">Browse Notes</h1>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">
              {loading ? 'Scanning Campus...' : `${listings.length} Results matched`}
            </p>
          </div>
          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-2xl border border-border/50 shadow-inner">
            <button 
              onClick={() => setViewMode('grid')}
              className={cn("p-2 rounded-xl transition-all duration-500", viewMode === 'grid' ? "bg-primary shadow-lg text-white scale-110" : "text-muted-foreground hover:text-foreground")}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={cn("p-2 rounded-xl transition-all duration-500", viewMode === 'list' ? "bg-primary shadow-lg text-white scale-110" : "text-muted-foreground hover:text-foreground")}
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
            className="h-14 w-14 flex items-center justify-center bg-card border border-border/50 rounded-2xl shadow-xl hover:border-primary/50 hover:bg-muted transition-all active:scale-90 relative shrink-0 group"
          >
            <SlidersHorizontal className="h-6 w-6 text-foreground group-hover:text-primary transition-colors" />
            {Object.values(filters).filter(v => v && v !== 'all' && v !== 'latest').length > 0 && (
               <div className="absolute -top-1 -right-1 h-5 w-5 bg-primary rounded-full border-4 border-card shadow-lg animate-in zoom-in" />
            )}
          </button>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="grid grid-cols-1 gap-6">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="space-y-4 bg-card p-4 rounded-[2rem] border border-border/50 shadow-sm animate-pulse">
                <Skeleton className={cn("rounded-2xl w-full", viewMode === 'grid' ? "aspect-square" : "h-24")} />
                <Skeleton className="h-6 w-3/4 rounded-lg" />
                <Skeleton className="h-4 w-1/2 rounded-lg" />
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="py-24 text-center space-y-8 bg-card rounded-[3rem] border border-border/50 px-8 shadow-xl shadow-black/5 relative overflow-hidden group">
            <div className="bg-muted h-24 w-24 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner group-hover:rotate-12 transition-transform duration-500">
              <Search className="h-12 w-12 text-muted-foreground/20" />
            </div>
            <div className="space-y-3 relative z-10">
              <h3 className="text-2xl font-black text-foreground tracking-tight">Nothing Found</h3>
              <p className="text-xs text-muted-foreground font-black max-w-[200px] mx-auto uppercase tracking-widest opacity-60 leading-relaxed">Try adjusting your filters to discover more hidden gems.</p>
            </div>
            <Button 
              onClick={clearFilters}
              variant="outline"
              className="rounded-2xl px-10 h-14 text-[10px] font-black uppercase tracking-widest border-border/50 bg-muted hover:bg-primary hover:text-white hover:border-primary transition-all active:scale-95"
            >
              Reset Filters
            </Button>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          </div>
        ) : (
          <div className={cn(
            "grid gap-4 transition-all duration-500",
            viewMode === 'grid' ? "grid-cols-2" : "grid-cols-1"
          )}>
            {listings.map((listing: any, idx: number) => (
              <Link key={listing.id} to={`/listing/${listing.id}`} className="animate-in fade-in slide-in-from-bottom-5 duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                <ListingCard listing={listing} index={idx} viewMode={viewMode} />
              </Link>
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

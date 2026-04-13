import { useState, useEffect } from 'react';
import { API_URL, API_BASE_URL } from '@/config';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useProgrammes, useBranches, useSemesters, useSubjects } from '@/hooks/useAcademicData';
import { ListingCard } from '@/components/domain/ListingCard';
import { SearchBar } from '@/components/domain/SearchBar';
import { FilterPanel } from '@/components/domain/FilterPanel';
import { Link, useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Search, X, Sparkles, Plus, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast-provider';

export function Home() {
  const { profile, jwt } = useAuth() as any;
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [activeCategory, setActiveCategory] = useState({ id: 'all', label: 'All' });
  const [categories, setCategories] = useState<{ id: string, label: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [forYouListings, setForYouListings] = useState<any[]>([]);
  const [newOnCampusListings, setNewOnCampusListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [trending, setTrending] = useState<any[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Note Requests state
  const [requests, setRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newRequest, setNewRequest] = useState({
    programme: '',
    branch: '',
    semester: '',
    subject_code: '',
    subject_name: '',
    description: ''
  });

  // Exam state
  const [upcomingExam, setUpcomingExam] = useState<any>(null);
  const [dismissedExams, setDismissedExams] = useState<string[]>(() => {
    const saved = localStorage.getItem('dismissed_exams');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [filters, setFilters] = useState({
    sort: 'latest',
    programme: '',
    branch: '',
    semester: '',
    subject_code: '',
    materialType: '',
    minPrice: '',
    maxPrice: ''
  });
  
  // Academic data hooks for Request Modal
  const { programmes: requestProgrammes } = useProgrammes();
  const { branches: requestBranches } = useBranches(newRequest.programme);
  const { semesters: requestSemesters } = useSemesters(newRequest.programme, newRequest.branch);
  const { subjects: requestSubjects } = useSubjects(newRequest.programme, newRequest.branch, newRequest.semester);

  // Offline and PWA state
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      fetchForYou();
      fetchTrending();
      fetchTopRequests();
    };
    const handleOffline = () => setIsOffline(true);
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      const visits = parseInt(localStorage.getItem('visit_count') || '0');
      const isDismissed = localStorage.getItem('pwa-prompt-dismissed') === 'true';
      if (visits >= 3 && !isDismissed) {
        setShowInstallPrompt(true);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Track visits
    const visits = parseInt(localStorage.getItem('visit_count') || '0');
    localStorage.setItem('visit_count', (visits + 1).toString());

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  useEffect(() => {
    // Restore active category from sessionStorage
    const savedCategory = sessionStorage.getItem('active_category');
    if (savedCategory) {
      try {
        setActiveCategory(JSON.parse(savedCategory));
      } catch (e) {
        console.error('Failed to parse saved category', e);
      }
    }
    fetchCategories();
    fetchTrending();
    if (profile?.programme && profile?.branch && profile?.semester) {
      fetchUpcomingExam();
      fetchTopRequests();
    }
  }, [profile]);

  // Persist category to sessionStorage
  useEffect(() => {
    if (activeCategory.id !== 'all') {
      sessionStorage.setItem('active_category', JSON.stringify(activeCategory));
    } else {
      sessionStorage.removeItem('active_category');
    }
  }, [activeCategory]);

  useEffect(() => {
    if (showRequestModal && profile) {
      setNewRequest(prev => ({
        ...prev,
        programme: profile.programme || '',
        branch: profile.branch || '',
        semester: profile.semester?.toString() || '',
      }));
    }
  }, [showRequestModal, profile]);

  const fetchTopRequests = async () => {
    if (!profile?.branch || !profile?.semester || !profile?.programme) return;
    if (profile.branch === '' || profile.semester === '' || profile.programme === '') return;
    setRequestsLoading(true);
    try {
      const params = new URLSearchParams({
        branch: profile?.branch || '',
        semester: profile?.semester?.toString() || '',
        programme: profile?.programme || ''
      });
      const response = await fetch(`${API_URL}/requests/top?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${jwt}` }
      });
      const json = await response.json();
      if (response.ok) {
        setRequests(json.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch requests:", error);
    } finally {
      setRequestsLoading(false);
    }
  };


  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequest.subject_name) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify({
          subject_name: newRequest.subject_name,
          subject_code: newRequest.subject_code,
          description: newRequest.description,
          branch: newRequest.branch,
          semester: newRequest.semester,
          programme: newRequest.programme
        })
      });
      
      const json = await response.json();
      if (!response.ok) throw new Error(json.error);
      
      toast({ 
        title: 'Success', 
        description: json.upvoted ? "Already requested — your upvote has been added." : "Request posted — sellers will be notified.",
        type: 'success' 
      });
      
      setShowRequestModal(false);
      setNewRequest({ 
        programme: profile.programme || '',
        branch: profile.branch || '',
        semester: profile.semester?.toString() || '',
        subject_name: '', 
        subject_code: '', 
        description: '' 
      });
      fetchTopRequests();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (jwt) {
      fetchForYou();
      fetchNewOnCampus();
    }
  }, [profile?.branch, profile?.semester, activeCategory, filters, searchQuery, jwt]);

  const fetchForYou = async () => {
    // If branch or semester is missing, we don't fetch but wait for the nudge card
    if (!profile?.branch || !profile?.semester) {
      setForYouListings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Use categories/filters/search if active, otherwise fetch from /for-you
      const isSearching = searchQuery || activeCategory.id !== 'all' || 
                         filters.programme || filters.branch || filters.semester || 
                         filters.subject_code || filters.materialType || filters.minPrice || filters.maxPrice;

      if (isSearching) {
        const params = new URLSearchParams();
        if (filters.programme) params.append('programme', filters.programme);
        if (filters.branch) params.append('branch', filters.branch);
        if (filters.semester) params.append('semester', filters.semester);
        if (filters.subject_code) params.append('subject_code', filters.subject_code);
        
        let materialTypes = filters.materialType ? filters.materialType.split(',') : [];
        if (activeCategory.id !== 'all' && !materialTypes.includes(activeCategory.label)) {
          materialTypes.push(activeCategory.label);
        }
        if (materialTypes.length > 0) params.append('material_types', materialTypes.join(','));
        
        if (filters.minPrice) params.append('min_price', filters.minPrice);
        if (filters.maxPrice) params.append('max_price', filters.maxPrice);
        if (filters.sort) params.append('sort', filters.sort);
        if (searchQuery) params.append('search', searchQuery);

        const response = await fetch(`${API_URL}/listings?${params.toString()}`);
        const json = await response.json();
        
        // Client-side local filtering as a fallback/enhancement for searchQuery
        let data = json.data || [];
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          data = data.filter((l: any) => 
            l.title.toLowerCase().includes(q) || 
            (l.subject_code && l.subject_code.toLowerCase().includes(q)) ||
            (l.seller_name && l.seller_name.toLowerCase().includes(q))
          );
        }
        setForYouListings(data);
      } else {
        const response = await fetch(`${API_URL}/listings/for-you`, {
          headers: { 'Authorization': `Bearer ${jwt}` }
        });
        const json = await response.json();
        setForYouListings(json.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch for-you listings:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNewOnCampus = async () => {
    try {
      const response = await fetch(`${API_URL}/listings?sort=latest&limit=6`);
      const json = await response.json();
      setNewOnCampusListings(json.data || []);
    } catch (error) {
      console.error("Failed to fetch new-on-campus listings:", error);
    }
  };

  const fetchUpcomingExam = async () => {
    if (!profile?.branch || !profile?.semester || !profile?.programme) return;
    try {
      const params = new URLSearchParams({
        programme: profile?.programme || '',
        branch: profile?.branch || '',
        semester: profile?.semester?.toString() || ''
      });
      const response = await fetch(`${API_URL}/exams/upcoming?${params.toString()}`);
      const json = await response.json();
      if (response.ok && json.data) {
        setUpcomingExam(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch upcoming exam:", error);
    }
  };


  const dismissExam = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    const newDismissed = [...dismissedExams, code];
    setDismissedExams(newDismissed);
    localStorage.setItem('dismissed_exams', JSON.stringify(newDismissed));
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/categories`);
      const json = await response.json();
      if (response.ok && json.data) {
        setCategories([{ id: 'all', label: 'All' }, ...json.data]);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const fetchTrending = async () => {
    setTrendingLoading(true);
    try {
      const response = await fetch(`${API_URL}/listings/trending`);
      const json = await response.json();
      if (response.ok) {
        const data = json.data || [];
        // Only show if at least one listing has > 5 views
        if (data.some((l: any) => l.view_count > 5)) {
          setTrending(data);
        } else {
          setTrending([]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch trending:", error);
    } finally {
      setTrendingLoading(false);
    }
  };




  const showExamBanner = upcomingExam && !dismissedExams.includes(upcomingExam.subject_code);
  const isProfileComplete = !!(profile?.branch && profile?.semester);

  return (
    <div className="w-full pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-background min-h-screen">
      
      {/* Offline Banner */}
      {isOffline && (
        <div className="bg-amber-500 text-white text-[10px] font-black py-2 px-4 text-center sticky top-0 z-[60] animate-in slide-in-from-top duration-300">
          YOU ARE OFFLINE · SHOWING CACHED CONTENT
        </div>
      )}

      {/* Hero Header Section */}
      <div className="px-4 pt-0 pb-14 premium-gradient text-white rounded-b-[3.5rem] shadow-2xl shadow-primary/20 relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/20 rounded-full -ml-10 -mb-10 blur-2xl" />
        
        <div className="relative space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tighter leading-none drop-shadow-md">
              Hi, <span className="text-blue-300">{profile?.full_name?.split(' ')[0] || 'Ansh'}</span>!
            </h1>
            <div className="flex items-center gap-2 text-white/70 text-[10px] font-black uppercase tracking-widest bg-white/10 w-fit px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">
              <Sparkles className="w-3 h-3 text-amber-300" />
              Sem {profile?.semester || 4} • {profile?.branch || 'CSE'} • RGPV
            </div>
          </div>

          <SearchBar 
            value={searchQuery}
            onChange={setSearchQuery}
            onFilterClick={() => setIsFilterPanelOpen(true)}
          />
        </div>
      </div>

      {/* Filter Pills */}
      {Object.entries(filters).some(([key, val]) => (key !== 'sort' || val !== 'latest') && val !== '') && (
        <div className="flex items-center gap-2 overflow-x-auto px-4 py-4 scrollbar-hide animate-in fade-in slide-in-from-left-4 duration-300">
          <div className="flex items-center gap-2 shrink-0">
            {Object.entries(filters).map(([key, value]) => {
              if ((key === 'sort' && value === 'latest') || value === '') return null;
              
              const getLabel = () => {
                if (key === 'sort') return `Sort: ${value}`;
                if (key === 'minPrice') return `Min: ₹${value}`;
                if (key === 'maxPrice') return `Max: ₹${value}`;
                if (key === 'materialType') return value.toString().split(',')[0] + (value.toString().split(',').length > 1 ? ` +${value.toString().split(',').length - 1}` : '');
                return value.toString();
              };

              return (
                <button
                  key={key}
                  onClick={() => setFilters({ ...filters, [key]: key === 'sort' ? 'latest' : '' })}
                  className="px-4 py-2 bg-card border border-border rounded-full text-[10px] font-black text-foreground uppercase flex items-center gap-2 shadow-sm hover:border-primary/30 transition-all active:scale-95 whitespace-nowrap"
                >
                  {getLabel()}
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              );
            })}
            <button 
              onClick={() => setFilters({
                sort: 'latest', programme: '', branch: '', semester: '',
                subject_code: '', materialType: '', minPrice: '', maxPrice: ''
              })}
              className="text-[10px] font-black text-danger uppercase px-3 py-1 hover:bg-danger/10 rounded-xl transition-colors shrink-0"
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      <div className={cn("px-4 space-y-8", !Object.entries(filters).some(([key, val]) => (key !== 'sort' || val !== 'latest') && val !== '') && "mt-10")}>
        
        {/* Exam Countdown Banner */}
        {showExamBanner && (
          <div 
            onClick={() => navigate(`/browse?subject_code=${upcomingExam.subject_code}`)}
            className="relative overflow-hidden bg-card border border-border border-l-4 border-l-amber-500 rounded-[2rem] p-6 shadow-xl shadow-amber-500/5 hover:shadow-amber-500/10 transition-all cursor-pointer group animate-in slide-in-from-top duration-500"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-foreground uppercase tracking-tight">{upcomingExam.subject_name} exam</h3>
                <p className="text-[10px] font-bold text-muted-foreground">Find {upcomingExam.subject_code} notes before it's too late</p>
              </div>
              <div className="px-4 py-2 bg-amber-500 text-white rounded-xl text-[10px] font-black shadow-lg shadow-amber-500/20 uppercase tracking-widest">
                {upcomingExam.days_remaining === 0 ? 'Today!' : upcomingExam.days_remaining === 1 ? 'Tomorrow' : `${upcomingExam.days_remaining} days left`}
              </div>
            </div>
            <button 
              onClick={(e) => dismissExam(e, upcomingExam.subject_code)}
              className="absolute top-3 right-5 p-1.5 rounded-full hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground/30" />
            </button>
          </div>
        )}

        {/* Category Chips */}
        <div className="flex overflow-x-auto gap-3 py-2 -mx-4 px-4 scrollbar-hide snap-x no-scrollbar">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category)}
              className={`snap-start whitespace-nowrap rounded-2xl px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                activeCategory.id === category.id 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' 
                  : 'bg-card border border-border text-muted-foreground hover:border-primary/30'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4 px-2">
            <div className="flex flex-col min-w-0">
              <h2 className="text-xl font-black text-foreground tracking-tight truncate uppercase">For you <span className="text-primary/50 text-sm ml-1">· Sem {profile?.semester || 4} {profile?.branch || 'CSE'}</span></h2>
            </div>
            <Link 
              to={`/browse?programme=${encodeURIComponent(profile?.programme || '')}&branch=${encodeURIComponent(profile?.branch || '')}&semester=${profile?.semester || ''}&category=${activeCategory.id !== 'all' ? activeCategory.id : ''}`} 
              className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline whitespace-nowrap shrink-0 bg-primary/5 px-3 py-1.5 rounded-lg"
            >
              See all
            </Link>
          </div>
          
          {!isProfileComplete ? (
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-[2.5rem] p-8 text-center space-y-6 shadow-inner">
              <div className="h-16 w-16 bg-card rounded-2xl flex items-center justify-center mx-auto shadow-xl">
                <Sparkles className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <div className="space-y-2">
                <p className="text-base font-black text-foreground uppercase tracking-tight">Personalize your feed</p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">Set your branch and semester to see notes made for you</p>
              </div>
              <Button onClick={() => navigate('/profile')} className="w-full bg-primary hover:bg-primary/90 text-white font-black rounded-2xl h-14 shadow-xl shadow-primary/20 uppercase tracking-widest text-[10px]">
                Complete Profile
              </Button>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 gap-6">
              {[1, 2, 3].map(n => (
                <div key={n} className="space-y-4">
                  <Skeleton className="aspect-video w-full rounded-[2.5rem]" />
                  <div className="space-y-3 px-4">
                    <Skeleton className="h-6 w-3/4 rounded-lg" />
                    <Skeleton className="h-4 w-1/2 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : forYouListings.length === 0 ? (
            <div className="rounded-[2.5rem] border-2 border-dashed border-border p-12 text-center space-y-4 bg-muted/10">
              <Search className="mx-auto h-12 w-12 text-muted-foreground/20" />
              <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">No listings found for this selection.</p>
              <Button variant="outline" size="sm" className="rounded-xl font-black uppercase tracking-widest text-[10px]" onClick={() => {
                setActiveCategory({ id: 'all', label: 'All' });
                setFilters({ sort: 'latest', programme: '', branch: '', semester: '', subject_code: '', materialType: '', minPrice: '', maxPrice: '' });
                setSearchQuery('');
              }}>Reset Filters</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {forYouListings.map((listing: any, idx: number) => (
                <Link key={listing.id} to={`/listing/${listing.id}`} className="animate-in fade-in zoom-in-95 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                  <ListingCard listing={listing} index={idx} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* New on Campus Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-black text-foreground tracking-tight">Fresh on campus</h2>
            <Link to="/browse?sort=latest" className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline whitespace-nowrap shrink-0 bg-primary/5 px-3 py-1.5 rounded-lg">See all</Link>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide -mx-4 px-4 snap-x no-scrollbar">
            {newOnCampusListings.map((item, idx) => (
              <Link 
                to={`/listing/${item.id}`} 
                key={item.id} 
                className="snap-start min-w-[180px] bg-card rounded-[2rem] border border-border/50 p-4 shadow-xl shadow-black/5 hover:shadow-primary/5 transition-all active:scale-95 flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-500"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="aspect-[4/3] bg-muted/20 rounded-2xl overflow-hidden relative shadow-inner">
                  {item.listing_images?.[0] ? (
                    <img 
                      src={item.listing_images[0].image_url.startsWith('/') 
                        ? `${API_BASE_URL}${item.listing_images[0].image_url}` 
                        : item.listing_images[0].image_url
                      } 
                      alt={item.title} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                      <FileText className="h-10 w-10" />
                    </div>
                  )}
                  {item.ai_score && (
                    <div className="absolute top-2 left-2 bg-indigo-600/90 backdrop-blur-md text-white text-[8px] font-black px-2 py-1 rounded-md shadow-lg uppercase tracking-widest">
                      AI {item.ai_score}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] font-black text-foreground line-clamp-1 uppercase tracking-tight">{item.title}</p>
                  <div className="flex items-center justify-between pt-1 border-t border-border/50">
                    <span className="text-primary font-black text-sm">₹{item.price > 0 ? item.price : 'Free'}</span>
                    <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest truncate max-w-[60px]">{item.subject_code || 'GEN'}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Trending Section */}
        {(trendingLoading || trending.length > 0) && (
          <section className="mt-12 space-y-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-black text-foreground tracking-tight">Trending now</h2>
              <Link to="/browse?sort=trending" className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline whitespace-nowrap shrink-0 bg-primary/5 px-3 py-1.5 rounded-lg">See all</Link>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide -mx-4 px-4 snap-x no-scrollbar">
              {trendingLoading ? (
                <>
                  <Skeleton className="snap-start min-w-[180px] h-[140px] rounded-[2rem]" />
                  <Skeleton className="snap-start min-w-[180px] h-[140px] rounded-[2rem]" />
                </>
              ) : trending.map((item, idx) => (
                <Link 
                  to={`/listing/${item.id}`} 
                  key={item.id} 
                  className="snap-start min-w-[220px] bg-card rounded-[2rem] border border-border/50 p-5 shadow-xl shadow-black/5 hover:shadow-primary/5 transition-all active:scale-95 flex flex-col gap-3 group animate-in fade-in slide-in-from-right-4 duration-500"
                  style={{ animationDelay: `${idx * 150}ms` }}
                >
                  <div className="space-y-1">
                    <p className="text-[11px] font-black text-foreground line-clamp-1 uppercase tracking-tight group-hover:text-primary transition-colors">
                      {item.title}
                    </p>
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest truncate opacity-60">
                      {item.subject_code || 'GENERAL'}
                    </p>
                  </div>
                  
                  <div className="mt-2 flex items-center justify-between pt-2 border-t border-border/50">
                    <div className="flex items-center gap-2">
                       <div className="p-1 bg-emerald-500/10 rounded-md">
                        <Sparkles className="w-3 h-3 text-emerald-500" />
                       </div>
                       <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">{item.view_count || 0} views</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <Plus className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Demand Requests Section */}
        {(requestsLoading || requests.length > 0) && (
          <section className="mt-12 mb-12 space-y-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <div className="bg-danger/10 text-danger text-[9px] font-black px-2.5 py-1 rounded-lg w-fit uppercase tracking-[0.15em] shadow-sm">
                  High Demand
                </div>
                <h2 className="text-xl font-black text-foreground tracking-tight">Requested by students</h2>
              </div>
              <Button 
                onClick={() => setShowRequestModal(true)}
                variant="ghost" 
                size="sm" 
                className="bg-primary text-white hover:bg-primary/90 font-black rounded-xl h-10 flex items-center gap-2 px-5 shadow-lg shadow-primary/20 uppercase tracking-widest text-[10px]"
              >
                <Plus className="h-4 w-4" /> New Req
              </Button>
            </div>
            
            <div className="grid gap-4">
              {requestsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full rounded-[2rem]" />
                  <Skeleton className="h-20 w-full rounded-[2rem]" />
                </div>
              ) : requests.slice(0, 3).map((req, idx) => (
                <div 
                  key={req.id} 
                  className="flex items-center justify-between p-6 bg-card border border-border/50 rounded-[2.5rem] shadow-xl shadow-black/5 hover:shadow-primary/5 transition-all group cursor-pointer active:scale-[0.98] animate-in fade-in slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: `${idx * 100}ms` }}
                  onClick={() => navigate(`/browse?subject_code=${req.subject_code}`)}
                >
                  <div className="space-y-1.5">
                    <p className="text-[13px] font-black text-foreground uppercase tracking-tight group-hover:text-primary transition-colors">
                      {req.subject_name}
                    </p>
                    <div className="flex items-center gap-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
                      <span>Sem {req.semester}</span>
                      <span>·</span>
                      <span>{req.subject_code}</span>
                    </div>
                  </div>
                  <div className="px-4 py-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl text-[10px] font-black shadow-inner border border-amber-500/20 uppercase tracking-tighter">
                    {req.upvote_count} Interests
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Request Form Bottom Sheet Modal */}
      {showRequestModal && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center bg-black/60 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-300">
            <div className="bg-card w-full max-w-md rounded-t-[3.5rem] sm:rounded-[3.5rem] p-10 pb-12 sm:pb-10 space-y-10 shadow-2xl animate-in slide-in-from-bottom duration-500 max-h-[90vh] overflow-y-auto scrollbar-hide border border-border/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-center justify-between relative z-10">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-foreground tracking-tight uppercase leading-none">New Request</h2>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-40">Help sellers know what you need</p>
                </div>
                <button onClick={() => setShowRequestModal(false)} className="h-10 w-10 flex items-center justify-center bg-muted/50 rounded-full hover:bg-muted transition-all active:scale-90 border border-border/50">
                  <X className="h-5 w-5 text-foreground" />
                </button>
              </div>
              
              <form onSubmit={handleSubmitRequest} className="space-y-8">
                <div className="space-y-8 relative z-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-40 ml-2">Academic Origin</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative group">
                        <select 
                          className="w-full h-14 bg-muted/20 border border-border/50 rounded-2xl px-5 text-xs font-black focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none appearance-none uppercase tracking-wider text-foreground shadow-inner"
                          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.25rem center', backgroundSize: '1rem' }}
                          value={newRequest.programme}
                          onChange={e => setNewRequest({ ...newRequest, programme: e.target.value, branch: '', semester: '', subject_code: '', subject_name: '' })}
                        >
                          <option value="" className="bg-card">Prog</option>
                          {requestProgrammes.map(p => <option key={p} value={p} className="bg-card">{p}</option>)}
                        </select>
                      </div>
                      <div className="relative group">
                        <select 
                          className="w-full h-14 bg-muted/20 border border-border/50 rounded-2xl px-5 text-xs font-black focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none appearance-none uppercase tracking-wider text-foreground shadow-inner disabled:opacity-20 disabled:grayscale"
                          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.25rem center', backgroundSize: '1rem' }}
                          value={newRequest.branch}
                          onChange={e => setNewRequest({ ...newRequest, branch: e.target.value, semester: '', subject_code: '', subject_name: '' })}
                          disabled={!newRequest.programme}
                        >
                          <option value="" className="bg-card">Branch</option>
                          {requestBranches.map(b => <option key={b} value={b} className="bg-card">{b}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-40 ml-2">Semester</label>
                      <div className="relative group">
                        <select 
                          className="w-full h-14 bg-muted/20 border border-border/50 rounded-2xl px-5 text-xs font-black focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none appearance-none text-foreground shadow-inner disabled:opacity-20 disabled:grayscale"
                          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.25rem center', backgroundSize: '1rem' }}
                          value={newRequest.semester}
                          onChange={e => setNewRequest({ ...newRequest, semester: e.target.value, subject_code: '', subject_name: '' })}
                          disabled={!newRequest.branch}
                        >
                          <option value="" className="bg-card">Phase</option>
                          {requestSemesters.map(s => <option key={s} value={String(s)} className="bg-card">Sem {s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-40 ml-2">Node Code</label>
                      <div className="relative group">
                        <select 
                          className="w-full h-14 bg-muted/20 border border-border/50 rounded-2xl px-5 text-xs font-black focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none appearance-none text-foreground shadow-inner disabled:opacity-20 disabled:grayscale"
                          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.25rem center', backgroundSize: '1rem' }}
                          value={newRequest.subject_code}
                          onChange={e => {
                            const sub = requestSubjects.find(s => s.subject_code === e.target.value);
                            setNewRequest({ ...newRequest, subject_code: e.target.value, subject_name: sub?.subject_name || '' });
                          }}
                          disabled={!newRequest.semester}
                        >
                          <option value="" className="bg-card">Generic</option>
                          {requestSubjects.map(s => <option key={s.subject_code} value={s.subject_code} className="bg-card">{s.subject_code}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {!newRequest.subject_code && (
                    <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-40 ml-2">Subject Descriptor</label>
                      <input 
                        required
                        value={newRequest.subject_name}
                        onChange={(e) => setNewRequest({...newRequest, subject_name: e.target.value})}
                        placeholder="E.G. DATA STRUCTURES"
                        className="w-full h-14 bg-card border border-border/50 rounded-2xl px-6 text-xs font-black focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none placeholder:opacity-5 uppercase tracking-widest text-foreground shadow-sm"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-40 ml-2">Protocol Specs</label>
                    <textarea 
                      value={newRequest.description}
                      onChange={(e) => setNewRequest({...newRequest, description: e.target.value})}
                      placeholder="Specify required modules or assets..."
                      className="w-full h-32 bg-card border border-border/50 rounded-2xl px-6 py-5 text-xs font-medium focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none resize-none placeholder:opacity-10 text-foreground shadow-sm"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting || !newRequest.programme || !newRequest.branch || !newRequest.semester || !newRequest.subject_name}
                  className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-sm shadow-2xl shadow-primary/20 transition-all active:scale-[0.98] uppercase tracking-[0.2em] relative z-10"
                >
                  {isSubmitting ? 'Posting...' : 'Submit Request'}
                </Button>
              </form>
            </div>
          </div>
      )}

      {/* PWA Install Prompt */}
      {showInstallPrompt && (
        <div className="fixed bottom-24 left-6 right-6 z-[90] animate-in slide-in-from-bottom-10 duration-500">
          <div className="bg-card text-foreground p-5 rounded-[2.5rem] shadow-2xl border border-border/50 flex items-center justify-between gap-4 glass">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                <BookOpen className="h-7 w-7 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black tracking-tight leading-tight">Install CampusNotes</p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Faster access from your home screen</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={handleInstallClick}
                size="sm" 
                className="bg-primary hover:bg-primary/90 text-white text-[10px] font-black px-6 h-11 rounded-xl transition-all active:scale-95 uppercase tracking-widest"
              >
                Install
              </Button>
              <button 
                onClick={dismissInstallPrompt}
                className="p-2 hover:bg-muted rounded-full transition-colors active:scale-90"
              >
                <X className="h-4 w-4 text-muted-foreground/40" />
              </button>
            </div>
          </div>
        </div>
      )}

      <FilterPanel 
        isOpen={isFilterPanelOpen} 
        onClose={() => setIsFilterPanelOpen(false)} 
        currentFilters={filters}
        onApply={(newFilters) => setFilters(newFilters)}
      />
    </div>
  );
}

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

  const removeFilter = (key: string, valueToRemove?: string) => {
    if (key === 'materialType' && valueToRemove) {
      const currentTypes = filters.materialType.split(',');
      const newTypes = currentTypes.filter(t => t !== valueToRemove);
      setFilters({ ...filters, materialType: newTypes.join(',') });
    } else {
      setFilters({ ...filters, [key]: '' });
    }
  };

  const getActiveFilterTags = () => {
    const tags: { key: string, label: string, value?: string }[] = [];
    if (filters.programme) tags.push({ key: 'programme', label: filters.programme });
    if (filters.branch) tags.push({ key: 'branch', label: filters.branch });
    if (filters.semester) tags.push({ key: 'semester', label: `Sem ${filters.semester}` });
    if (filters.subject_code) tags.push({ key: 'subject_code', label: filters.subject_code });
    if (filters.materialType) {
      filters.materialType.split(',').filter(Boolean).forEach(t => {
        tags.push({ key: 'materialType', label: t, value: t });
      });
    }
    return tags;
  };

  const activeFilterTags = getActiveFilterTags();
  const visibleTags = activeFilterTags.slice(0, 2);
  const extraTagsCount = activeFilterTags.length - visibleTags.length;


  const showExamBanner = upcomingExam && !dismissedExams.includes(upcomingExam.subject_code);
  const isProfileComplete = !!(profile?.branch && profile?.semester);

  const trendingItems = trending.map(item => (
    <Link 
      to={`/listing/${item.id}`} 
      key={item.id} 
      className="snap-start min-w-[200px] bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all active:scale-95 flex flex-col gap-2 group"
    >
      <div className="space-y-1">
        <p className="text-xs font-black text-[#1a2744] line-clamp-1 uppercase tracking-tight">
          {item.title}
        </p>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">
          {item.subject_code}
        </p>
      </div>
      
      <div className="mt-1 flex items-center gap-1.5">
         <span className="text-[#00a86b] font-black text-[12px]">↑</span>
         <span className="text-[11px] font-black text-[#1a2744] uppercase tracking-tighter">{item.view_count || 0} views</span>
      </div>
    </Link>
  ));

  const requestItems = requests.slice(0, 3).map((req) => (
    <div 
      key={req.id} 
      className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
      onClick={() => navigate(`/browse?subject_code=${req.subject_code}`)}
    >
      <div className="space-y-0.5">
        <p className="text-sm font-black text-[#1a2744] uppercase tracking-tight group-hover:text-blue-600 transition-colors">
          {req.subject_name}
        </p>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Sem {req.semester} · {req.subject_code}
        </p>
      </div>
      <div className="px-3 py-1 bg-amber-100 text-amber-900 rounded-lg text-[10px] font-black shadow-sm uppercase tracking-tighter">
        {req.upvote_count} requests
      </div>
    </div>
  ));

  return (
    <div className="w-full max-w-screen-sm mx-auto pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-[#f8f9fc] min-h-screen">
      
      {/* Offline Banner */}
      {isOffline && (
        <div className="bg-amber-500 text-white text-[10px] font-black py-2 px-4 text-center sticky top-0 z-[60] animate-in slide-in-from-top duration-300">
          YOU ARE OFFLINE · SHOWING CACHED CONTENT
        </div>
      )}

      {/* Hero Header Section */}
      <div className="px-6 pt-10 pb-10 bg-[#1a2744] text-white rounded-b-[2.5rem] shadow-xl space-y-8 relative overflow-hidden">

        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight leading-tight">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'Ansh'}!
          </h1>
          <p className="text-blue-200/60 text-sm font-medium">
            Sem {profile?.semester || 4} • {profile?.branch || 'CSE'} • RGPV
          </p>
        </div>

        <SearchBar 
          value={searchQuery}
          onChange={setSearchQuery}
          onFilterClick={() => setIsFilterPanelOpen(true)}
        />
      </div>

      {/* Filter Pills */}
      {Object.entries(filters).some(([key, val]) => (key !== 'sort' || val !== 'latest') && val !== '') && (
        <div className="flex items-center gap-2 overflow-x-auto px-6 py-4 scrollbar-hide animate-in fade-in slide-in-from-left-4 duration-300">
          <div className="flex items-center gap-2 shrink-0">
            {Object.entries(filters).map(([key, value]) => {
              if ((key === 'sort' && value === 'latest') || value === '') return null;
              
              // Human-readable labels
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
                  className="px-3 py-1.5 bg-white border border-gray-100 rounded-full text-[10px] font-black text-[#1a2744] uppercase flex items-center gap-1.5 shadow-sm hover:border-gray-300 transition-all active:scale-95 whitespace-nowrap"
                >
                  {getLabel()}
                  <X className="h-3 w-3 text-gray-400" />
                </button>
              );
            })}
            <button 
              onClick={() => setFilters({
                sort: 'latest', programme: '', branch: '', semester: '',
                subject_code: '', materialType: '', minPrice: '', maxPrice: ''
              })}
              className="text-[10px] font-black text-red-500 uppercase px-2 py-1 hover:bg-red-50 rounded-lg transition-colors shrink-0"
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      <div className={cn("px-6 space-y-6", !Object.entries(filters).some(([key, val]) => (key !== 'sort' || val !== 'latest') && val !== '') && "mt-6")}>
        
        {/* Step 5: Exam Countdown Banner */}
        {showExamBanner && (
          <div 
            onClick={() => navigate(`/browse?subject_code=${upcomingExam.subject_code}`)}
            className="relative overflow-hidden bg-white border border-gray-100 border-l-4 border-l-amber-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group animate-in slide-in-from-top duration-500"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-[#1a2744] uppercase tracking-tight">{upcomingExam.subject_name} exam</h3>
                <p className="text-[10px] font-bold text-gray-400">Find {upcomingExam.subject_code} notes before it's too late</p>
              </div>
              <div className="px-4 py-1.5 bg-amber-100 text-amber-900 rounded-full text-xs font-black shadow-sm">
                {upcomingExam.days_remaining === 0 ? 'Today!' : upcomingExam.days_remaining === 1 ? 'Tomorrow' : `${upcomingExam.days_remaining} days`}
              </div>
            </div>
            <button 
              onClick={(e) => dismissExam(e, upcomingExam.subject_code)}
              className="absolute top-2 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="h-3 w-3 text-gray-300" />
            </button>
          </div>
        )}


        {/* Selected Filter Tags */}
        {activeFilterTags.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
            {visibleTags.map((tag, i) => (
              <button
                key={`${tag.key}-${i}`}
                onClick={() => removeFilter(tag.key, tag.value)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-100 rounded-full shadow-sm text-[11px] font-bold text-[#1a2744] whitespace-nowrap animate-in zoom-in-95 duration-200"
              >
                {tag.label}
                <X className="h-3 w-3 text-gray-400" />
              </button>
            ))}
            {extraTagsCount > 0 && (
              <div onClick={() => setIsFilterPanelOpen(true)} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[11px] font-bold whitespace-nowrap cursor-pointer">
                +{extraTagsCount} more
              </div>
            )}
            <button 
              onClick={() => setFilters({ sort: 'latest', programme: '', branch: '', semester: '', subject_code: '', materialType: '', minPrice: '', maxPrice: '' })}
              className="text-[11px] font-bold text-gray-400 hover:text-red-500 ml-2 transition-colors"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Category Chips - Dynamically Fetched & Horizontally Scrollable */}
        <div className="flex overflow-x-auto gap-3 py-2 -mx-6 px-6 scrollbar-hide snap-x no-scrollbar">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category)}
              className={`snap-start whitespace-nowrap rounded-full px-5 py-2.5 text-xs font-bold transition-all ${
                activeCategory.id === category.id 
                  ? 'bg-[#1a2744] text-white shadow-md' 
                  : 'bg-white border border-gray-100 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col min-w-0">
              <h2 className="text-lg font-black text-[#1a2744] truncate">For you — Sem {profile?.semester || 4} {profile?.branch || 'CSE'}</h2>
            </div>
            <Link 
              to={`/browse?programme=${encodeURIComponent(profile?.programme || '')}&branch=${encodeURIComponent(profile?.branch || '')}&semester=${profile?.semester || ''}&category=${activeCategory.id !== 'all' ? activeCategory.id : ''}`} 
              className="text-blue-600 text-[10px] font-black uppercase tracking-widest hover:underline whitespace-nowrap shrink-0"
            >
              See all
            </Link>
          </div>
          
          {!isProfileComplete ? (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl p-6 text-center space-y-4 shadow-sm">
              <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <Sparkles className="h-6 w-6 text-blue-600" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-[#1a2744]">Personalize your feed</p>
                <p className="text-xs text-gray-500">Set your branch and semester to see notes made for you</p>
              </div>
              <Button onClick={() => navigate('/profile')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-11">
                Complete Profile
              </Button>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="space-y-2">
                  <Skeleton className="aspect-square w-full rounded-2xl" />
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-3 w-1/2 rounded" />
                </div>
              ))}
            </div>
          ) : forYouListings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center space-y-3 bg-white">
              <Search className="mx-auto h-8 w-8 text-gray-300" />
              <p className="text-gray-400 text-sm">No listings found for this selection.</p>
              <Button variant="outline" size="sm" onClick={() => {
                setActiveCategory({ id: 'all', label: 'All' });
                setFilters({ sort: 'latest', programme: '', branch: '', semester: '', subject_code: '', materialType: '', minPrice: '', maxPrice: '' });
                setSearchQuery('');
              }}>Clear Everything</Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-6">
              {forYouListings.map((listing: any, idx: number) => (
                <Link key={listing.id} to={`/listing/${listing.id}`}>
                  <ListingCard listing={listing} index={idx} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* New on Campus Section */}
        <section className="mt-10 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-black text-[#1a2744]">New on campus</h2>
            <Link to="/browse?sort=latest" className="text-blue-600 text-[10px] font-black uppercase tracking-widest hover:underline whitespace-nowrap shrink-0">See all</Link>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6 snap-x no-scrollbar">
            {newOnCampusListings.map((item) => (
              <Link 
                to={`/listing/${item.id}`} 
                key={item.id} 
                className="snap-start min-w-[160px] bg-white rounded-2xl border border-gray-100 p-3 shadow-sm hover:shadow-md transition-all active:scale-95 flex flex-col gap-3"
              >
                <div className="aspect-[4/3] bg-gray-50 rounded-xl overflow-hidden relative">
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
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <FileText className="h-8 w-8" />
                    </div>
                  )}
                  {item.ai_score && (
                    <div className="absolute top-2 left-2 bg-indigo-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm">
                      AI {item.ai_score}
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[#1a2744] line-clamp-1 uppercase tracking-tight">{item.title}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-600 font-extrabold text-[11px]">₹{item.price || 'Free'}</span>
                    <span className="text-[9px] font-bold text-gray-400 truncate ml-2">{item.subject_code}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Trending Section */}
        {(trendingLoading || trending.length > 0) && (
          <section className="mt-10 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-black text-[#1a2744]">Trending this week</h2>
              <Link to="/browse?sort=trending" className="text-blue-600 text-[10px] font-black uppercase tracking-widest hover:underline whitespace-nowrap shrink-0">See all</Link>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6 snap-x no-scrollbar transition-all">
              {trendingLoading ? (
                <>
                  <Skeleton className="snap-start min-w-[170px] h-[130px] rounded-2xl" />
                  <Skeleton className="snap-start min-w-[170px] h-[130px] rounded-2xl" />
                </>
              ) : trendingItems}
            </div>
          </section>
        )}
        {/* Step 8: Demand Requests Section */}
        {(requestsLoading || requests.length > 0) && (
          <section className="mt-10 mb-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="bg-pink-100 text-pink-600 text-[10px] font-black px-2 py-0.5 rounded-md w-fit uppercase tracking-tighter">
                  Students need this
                </div>
                <h2 className="text-lg font-black text-[#1a2744]">Top requested notes</h2>
              </div>
              <Button 
                onClick={() => setShowRequestModal(true)}
                variant="ghost" 
                size="sm" 
                className="bg-[#1a2744] text-white hover:bg-[#1a2744]/90 font-black rounded-lg h-9 flex items-center gap-1 px-4"
              >
                <Plus className="h-4 w-4" /> Request
              </Button>
            </div>
            
            <div className="space-y-3">
              {requestsLoading ? (
                <div className="p-4 space-y-3">
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              ) : requestItems}
            </div>
          </section>
        )}
      </div>

      {/* Request Form Bottom Sheet Modal (Simplified) */}
      {showRequestModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/40 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-t-[3rem] sm:rounded-[3rem] p-8 pb-12 sm:pb-8 space-y-6 shadow-2xl animate-in slide-in-from-bottom duration-500 max-h-[90vh] overflow-y-auto scrollbar-hide">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-[#1a2744]">New Request</h2>
                <button onClick={() => setShowRequestModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              
              <form onSubmit={handleSubmitRequest} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 border-l-2 border-pink-500 pl-2 uppercase tracking-widest">Programme & Branch</label>
                    <div className="grid grid-cols-2 gap-3">
                      <select 
                        className="w-full h-14 bg-gray-50 border-gray-100 rounded-2xl px-5 text-sm font-bold focus:ring-2 focus:ring-pink-500 focus:bg-white transition-all outline-none appearance-none"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.25rem center', backgroundSize: '1.2rem' }}
                        value={newRequest.programme}
                        onChange={e => setNewRequest({ ...newRequest, programme: e.target.value, branch: '', semester: '', subject_code: '', subject_name: '' })}
                      >
                        <option value="">Programme</option>
                        {requestProgrammes.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <select 
                        className="w-full h-14 bg-gray-50 border-gray-100 rounded-2xl px-5 text-sm font-bold focus:ring-2 focus:ring-pink-500 focus:bg-white transition-all outline-none appearance-none"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.25rem center', backgroundSize: '1.2rem' }}
                        value={newRequest.branch}
                        onChange={e => setNewRequest({ ...newRequest, branch: e.target.value, semester: '', subject_code: '', subject_name: '' })}
                        disabled={!newRequest.programme}
                      >
                        <option value="">Branch</option>
                        {requestBranches.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 border-l-2 border-pink-500 pl-2 uppercase tracking-widest">Semester</label>
                      <select 
                        className="w-full h-14 bg-gray-50 border-gray-100 rounded-2xl px-5 text-sm font-bold focus:ring-2 focus:ring-pink-500 focus:bg-white transition-all outline-none appearance-none"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.25rem center', backgroundSize: '1.2rem' }}
                        value={newRequest.semester}
                        onChange={e => setNewRequest({ ...newRequest, semester: e.target.value, subject_code: '', subject_name: '' })}
                        disabled={!newRequest.branch}
                      >
                        <option value="">Sem</option>
                        {requestSemesters.map(s => <option key={s} value={String(s)}>Sem {s}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 border-l-2 border-pink-500 pl-2 uppercase tracking-widest">Subject</label>
                      <select 
                        className="w-full h-14 bg-gray-50 border-gray-100 rounded-2xl px-5 text-sm font-bold focus:ring-2 focus:ring-pink-500 focus:bg-white transition-all outline-none appearance-none"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.25rem center', backgroundSize: '1.2rem' }}
                        value={newRequest.subject_code}
                        onChange={e => {
                          const sub = requestSubjects.find(s => s.subject_code === e.target.value);
                          setNewRequest({ ...newRequest, subject_code: e.target.value, subject_name: sub?.subject_name || '' });
                        }}
                        disabled={!newRequest.semester}
                      >
                        <option value="">Generic</option>
                        {requestSubjects.map(s => <option key={s.subject_code} value={s.subject_code}>{s.subject_code}</option>)}
                      </select>
                    </div>
                  </div>

                  {!newRequest.subject_code && (
                    <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                      <label className="text-[10px] font-black text-gray-400 border-l-2 border-pink-500 pl-2 uppercase tracking-widest">Subject Name (Custom)</label>
                      <input 
                        required
                        value={newRequest.subject_name}
                        onChange={(e) => setNewRequest({...newRequest, subject_name: e.target.value})}
                        placeholder="e.g. Data Structures & Algorithms"
                        className="w-full h-14 bg-gray-50 border-gray-100 rounded-2xl px-5 text-sm font-bold focus:ring-2 focus:ring-pink-500 focus:bg-white transition-all outline-none"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 border-l-2 border-pink-500 pl-2 uppercase tracking-widest">Description (Optional)</label>
                    <textarea 
                      value={newRequest.description}
                      onChange={(e) => setNewRequest({...newRequest, description: e.target.value})}
                      placeholder="Include specific topics or files you need..."
                      className="w-full h-24 bg-gray-50 border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-pink-500 focus:bg-white transition-all outline-none resize-none"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting || !newRequest.programme || !newRequest.branch || !newRequest.semester || !newRequest.subject_name}
                  className="w-full h-16 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white font-black text-lg shadow-xl shadow-pink-200 transition-all active:scale-[0.98]"
                >
                  {isSubmitting ? 'Posting...' : 'Submit Request'}
                </Button>
              </form>
            </div>
          </div>
      )}

      {/* PWA Install Prompt */}
      {showInstallPrompt && (
        <div className="fixed bottom-24 left-6 right-6 z-40 animate-in slide-in-from-bottom-10 duration-500">
          <div className="bg-[#1a2744] text-white p-5 rounded-[2rem] shadow-2xl border border-white/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-500/20 rounded-xl flex items-center justify-center shrink-0">
                <BookOpen className="h-5 w-5 text-blue-400" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold leading-tight">Install CampusNotes</p>
                <p className="text-[10px] text-blue-200/60 font-medium">Faster access from your home screen</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleInstallClick}
                size="sm" 
                className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black px-4 h-9 rounded-xl transition-all active:scale-95"
              >
                Install
              </Button>
              <button 
                onClick={dismissInstallPrompt}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="h-4 w-4 text-white/40" />
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

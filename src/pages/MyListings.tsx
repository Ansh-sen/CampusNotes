import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { 
  List, 
  BarChart2, 
  Plus, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  Trophy,
  FileText,
  Layout,
  Eye,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast-provider';
import { MyListingCard } from '@/components/MyListingCard';
import { cn } from '@/lib/utils';

type ViewType = 'listings' | 'analytics';
type TabType = 'all' | 'active' | 'sold' | 'drafts';

export function MyListings() {
  const { user, jwt } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeView, setActiveView] = useState<ViewType>('listings');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [aiTip, setAiTip] = useState<any>(null);

  useEffect(() => {
    if (user && jwt) {
      fetchData();
    }
  }, [user, jwt]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [listingsRes, statsRes, analyticsRes, tipRes] = await Promise.all([
        fetch('http://localhost:3001/api/listings/me', { headers: { 'Authorization': `Bearer ${jwt}` } }).then(r => r.json()),
        fetch('http://localhost:3001/api/listings/me/stats', { headers: { 'Authorization': `Bearer ${jwt}` } }).then(r => r.json()),
        fetch('http://localhost:3001/api/listings/analytics/views', { headers: { 'Authorization': `Bearer ${jwt}` } }).then(r => r.json()),
        fetch('http://localhost:3001/api/listings/analytics/tip', { headers: { 'Authorization': `Bearer ${jwt}` } }).then(r => r.json())
      ]);

      setListings(listingsRes.data || []);
      setStats(statsRes.data || null);
      setAnalytics(analyticsRes.data ? analyticsRes : null);
      setAiTip(tipRes.data || null);
    } catch (error) {
      console.error('Failed to load dashboard data', error);
      toast({ title: 'Error loading dashboard', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string, id: string) => {
    // Optimistic Update Layer
    const previousListings = [...listings];

    switch (action) {
      case 'pause':
      case 'resume':
      case 'mark_sold': {
        const newStatus = action === 'pause' ? 'paused' : action === 'resume' ? 'available' : 'sold';
        // Apply Optimistic Change
        setListings(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
        
        try {
          const res = await fetch(`http://localhost:3001/api/listings/${id}/status`, {
            method: 'PATCH',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${jwt}` 
            },
            body: JSON.stringify({ status: newStatus })
          });
          
          if (!res.ok) throw new Error();
          
          if (newStatus === 'sold') {
            handleSoldPrompt();
          } else {
            toast({ title: `Listing ${newStatus === 'available' ? 'activated' : 'paused'}`, type: 'success' });
          }
          fetchData();
        } catch (err) {
          setListings(previousListings);
          toast({ title: 'Update failed', type: 'error' });
        }
        break;
      }

      case 'delete':
      case 'discard_draft': {
        if (!window.confirm(action === 'delete' ? 'Delete this listing? This cannot be undone.' : 'Discard this draft? All progress will be lost.')) return;
        
        setListings(prev => prev.filter(l => l.id !== id));
        try {
          const endpoint = action === 'delete' ? `http://localhost:3001/api/listings/${id}` : `http://localhost:3001/api/listings/draft/${id}`;
          const res = await fetch(endpoint, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${jwt}` }
          });
          if (!res.ok) throw new Error();
          toast({ title: action === 'delete' ? 'Listing deleted' : 'Draft discarded', type: 'success' });
        } catch (err) {
          setListings(previousListings);
          toast({ title: 'Delete failed', type: 'error' });
        }
        break;
      }

      case 'relist': {
        try {
          const res = await fetch(`http://localhost:3001/api/listings/${id}/relist`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${jwt}` }
          }).then(r => r.json());
          if (res.success) {
            toast({ title: 'Listing relisted — review and publish when ready.', type: 'success' });
            navigate(`/create?edit=${res.id}`);
          }
        } catch (err) {
          toast({ title: 'Relist failed', type: 'error' });
        }
        break;
      }

      case 'edit':
        navigate(`/create?edit=${id}`);
        break;
      
      case 'continue_draft':
        navigate(`/create?draft=${id}`);
        break;

      case 'view_review':
        navigate(`/reviews/${id}`);
        break;
    }
  };

  const handleClearDrafts = async () => {
    if (!window.confirm("Are you sure you want to clear all drafts? This action cannot be undone.")) return;
    
    try {
      const res = await fetch('http://localhost:3001/api/listings/me/drafts/all', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${jwt}` }
      }).then(r => r.json());
      
      if (res.success) {
        toast({ title: 'All drafts cleared successfully', type: 'success' });
        fetchData();
      }
    } catch (err) {
      toast({ title: 'Failed to clear drafts', type: 'error' });
    }
  };

  const handleSoldPrompt = () => {
    toast({ title: 'Your notes sold, this listing inactive', type: 'success' });
  };

  const filteredListings = useMemo(() => {
    return listings.filter(l => {
      if (activeTab === 'all') return true;
      if (activeTab === 'active') return l.status === 'available' && !l.is_draft;
      if (activeTab === 'sold') return l.status === 'sold';
      if (activeTab === 'drafts') return !!l.is_draft;
      return true;
    });
  }, [listings, activeTab]);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-[#1a2744] text-white pt-8 pb-6 px-4 rounded-b-[2.5rem] shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold">My Listings</h1>
          <div className="flex items-center gap-3">
            <div className="bg-[#1a2744]/30 rounded-full p-1 flex">
              <button 
                onClick={() => setActiveView('listings')}
                className={cn("p-1.5 rounded-full transition-all", activeView === 'listings' ? "bg-white text-[#1a2744] shadow-sm" : "text-gray-400")}
              >
                <List size={16} />
              </button>
              <button 
                onClick={() => setActiveView('analytics')}
                className={cn("p-1.5 rounded-full transition-all", activeView === 'analytics' ? "bg-white text-[#1a2744] shadow-sm" : "text-gray-400")}
              >
                <BarChart2 size={16} />
              </button>
            </div>
            {activeTab === 'drafts' && (stats?.draft_count || 0) > 0 && (
              <button 
                onClick={handleClearDrafts}
                className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-100 border border-red-500/30 rounded-full text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
              >
                Clear All
              </button>
            )}
            <button 
              onClick={() => navigate('/create')}
              className="h-9 w-9 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 active:scale-95"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2">
          {loading ? (
             <>
               <div className="h-16 bg-white/5 animate-pulse rounded-2xl" />
               <div className="h-16 bg-white/5 animate-pulse rounded-2xl" />
               <div className="h-16 bg-white/5 animate-pulse rounded-2xl" />
             </>
          ) : activeView === 'listings' ? (
            <>
              < StatItem label="Total" value={stats?.total_count || 0} />
              <StatItem label="Active" value={stats?.active_count || 0} />
              <StatItem label="Notes Sold" value={stats?.sold_count || 0} variant="accent" />
            </>
          ) : (
            <>
              <StatItem label="Earned" value={`₹${stats?.total_earned || 0}`} variant="accent" />
              <StatItem label="Notes Sold" value={stats?.sold_count || 0} />
              <StatItem label="Rating" value={stats?.avg_rating || 'N/A'} />
            </>
          )}
        </div>
      </div>

      <div className="px-4 mt-6">
        {activeView === 'listings' ? (
          <>
            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide no-scrollbar">
              <TabButton label="All" count={stats?.total_count} active={activeTab === 'all'} onClick={() => setActiveTab('all')} />
              <TabButton label="Active" count={stats?.active_count} active={activeTab === 'active'} onClick={() => setActiveTab('active')} />
              <TabButton label="Sold" count={stats?.sold_count} active={activeTab === 'sold'} onClick={() => setActiveTab('sold')} />
              <TabButton label="Drafts" count={stats?.draft_count} active={activeTab === 'drafts'} onClick={() => setActiveTab('drafts')} />
            </div>

            {/* List */}
            {filteredListings.length > 0 ? (
              <div className="space-y-1">
                {filteredListings.map(listing => (
                  <MyListingCard key={listing.id} listing={listing} onAction={handleAction} />
                ))}
                
                {activeTab === 'sold' && user && (
                    <TopperNudge stats={stats} isTopper={(user as any).is_topper} />
                )}
              </div>
            ) : (
              <EmptyState tab={activeTab} hasListings={listings.length > 0} onAction={() => navigate('/sell')} />
            )}
          </>
        ) : (
          /* Analytics View */
          <div className="space-y-6">
            {!analytics || listings.length < 3 ? (
                <div className="bg-white p-8 rounded-3xl text-center shadow-sm border border-gray-100">
                    <Layout className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <h3 className="font-bold text-[#1a2744]">Not enough data yet</h3>
                    <p className="text-xs text-gray-500 mt-2">Analytics will appear once your listings get some views.</p>
                </div>
            ) : (
                <>
                    {/* Views Chart */}
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                        <h3 className="text-sm font-bold text-[#1a2744] mb-6">Weekly Views</h3>
                        <div className="flex items-end justify-between h-32 gap-2 mb-4">
                            {analytics.data.map((d: any, i: number) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                    <div 
                                        className={cn(
                                            "w-full rounded-t-lg transition-all duration-700",
                                            i === 6 ? "bg-[#0f172a]" : "bg-blue-100"
                                        )}
                                        style={{ height: `${(d.view_count / Math.max(...analytics.data.map((x: any) => x.view_count))) * 100}%` }}
                                    />
                                    <span className="text-[10px] font-bold text-gray-400">{d.date}</span>
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <MetricBox 
                                label="Total Views" 
                                value={analytics.total_week} 
                                change={((analytics.total_week - analytics.prev_week) / analytics.prev_week) * 100}
                            />
                            <MetricBox 
                                label="Inquiries" 
                                value={analytics.total_inquiries} 
                                change={((analytics.total_inquiries - analytics.prev_inquiries) / analytics.prev_inquiries) * 100}
                            />
                        </div>
                    </div>

                    {/* Earnings */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">This Month</p>
                            <p className="text-lg font-black text-[#1a2744] mt-1">₹{stats?.total_earned || 0}</p>
                            <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-emerald-500">
                                <TrendingUp size={12} />
                                <span>+₹240 vs last month</span>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">All Time</p>
                            <p className="text-lg font-black text-[#1a2744] mt-1">₹{stats?.total_earned || 0}</p>
                        </div>
                    </div>

                    {/* Top Performer */}
                    {listings.length > 0 && (
                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                            <h3 className="text-sm font-bold text-[#1a2744] mb-4">Top Performing Listing</h3>
                            <div className="flex gap-3">
                                <div className="h-16 w-16 bg-gray-50 rounded-xl overflow-hidden shrink-0">
                                    {listings[0].listing_images?.[0] ? (
                                        <img src={`http://localhost:3001${listings[0].listing_images[0].image_url}`} className="h-full w-full object-cover" />
                                    ) : <FileText className="m-auto h-6 w-6 text-gray-300" />}
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold truncate">{listings[0].title}</h4>
                                    <div className="flex gap-4 mt-2">
                                        <div className="flex items-center gap-1">
                                            <Eye size={12} className="text-gray-400" />
                                            <span className="text-xs font-bold">{listings[0].view_count}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <MessageCircle size={12} className="text-gray-400" />
                                            <span className="text-xs font-bold">{listings[0].inquiry_count}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => navigate(`/listing/${listings[0].id}`)}
                                className="w-full mt-4 flex items-center justify-between text-[11px] font-bold text-blue-600 bg-blue-50 py-2.5 px-4 rounded-xl"
                            >
                                <span>See full stats</span>
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    )}

                    {/* AI Tip */}
                    {aiTip && (
                        <div className="bg-[#fffbeb] p-5 rounded-3xl border border-amber-100 shadow-sm relative overflow-hidden">
                            <div className="absolute -top-6 -right-6 w-24 h-24 bg-amber-200/20 rounded-full" />
                            <div className="flex items-start gap-4">
                                <div className="bg-amber-100 p-2 rounded-xl">
                                    <AlertCircle className="text-amber-600" size={20} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-amber-900">AI Improvement Tip</h3>
                                    <p className="text-xs font-medium text-amber-800 mt-1">{aiTip.suggestion}</p>
                                    <button 
                                        onClick={() => navigate(`/sell?edit=${listings.find(l => l.title === aiTip.listing_title)?.id}`)}
                                        className="mt-3 text-[11px] font-black text-amber-900 flex items-center gap-1 group"
                                    >
                                        Edit {aiTip.listing_title}
                                        <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Sub-components
function StatItem({ label, value, variant }: { label: string, value: string | number, variant?: 'accent' }) {
  return (
    <div className="bg-white/5 p-3 rounded-2xl flex flex-col items-center">
      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{label}</span>
      <span className={cn("text-lg font-black mt-0.5", variant === 'accent' ? "text-amber-400" : "text-white")}>
        {value}
      </span>
    </div>
  );
}

function TabButton({ label, count, active, onClick }: { label: string, count: number, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-5 py-2 rounded-2xl whitespace-nowrap transition-all flex items-center gap-2",
        active 
          ? "bg-[#1a2744] text-white shadow-md shadow-blue-100" 
          : "bg-white text-gray-400 border border-gray-100"
      )}
    >
      <span className="text-xs font-bold">{label}</span>
      {count !== undefined && (
        <span className={cn("text-[10px] font-black px-1.5 py-0.5 rounded-md", active ? "bg-white/20" : "bg-gray-100")}>
          {count}
        </span>
      )}
    </button>
  );
}

function MetricBox({ label, value, change }: { label: string, value: number, change: number }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase">{label}</p>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-xl font-black text-[#1a2744]">{value}</span>
        <div className={cn(
          "flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-lg",
          change >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
        )}>
           {change >= 0 ? <TrendingUp size={10} className="mr-0.5" /> : <TrendingDown size={10} className="mr-0.5" />}
           {Math.abs(change).toFixed(0)}%
        </div>
      </div>
    </div>
  );
}

function EmptyState({ tab, hasListings, onAction }: { tab: TabType, hasListings: boolean, onAction: () => void }) {
  let icon = <FileText className="w-12 h-12 text-gray-200" />;
  let title = "No listings yet";
  let subtitle = "Start selling your notes and earn money on campus";
  let btnText = "Sell your first notes";

  if (tab === 'active' && hasListings) {
    title = "No active listings";
    subtitle = "All your listings are paused or in draft — resume or publish one to appear in search.";
    btnText = "";
  } else if (tab === 'sold') {
    title = "No sales yet";
    subtitle = "Keep your listings active and price them fairly to attract buyers.";
    btnText = "";
  } else if (tab === 'drafts') {
    title = "No drafts";
    subtitle = "Your unfinished listings will appear here.";
    btnText = "";
  }

  return (
    <div className="bg-white p-12 rounded-[2.5rem] text-center shadow-sm border border-gray-100 flex flex-col items-center">
      <div className="bg-gray-50 p-6 rounded-full mb-6">
        {icon}
      </div>
      <h3 className="text-lg font-black text-[#1a2744]">{title}</h3>
      <p className="text-sm font-medium text-gray-500 mt-2 max-w-[200px]">{subtitle}</p>
      {btnText && (
        <Button onClick={onAction} className="mt-8 bg-[#1a2744] hover:bg-[#1f2d4d] text-white px-8 rounded-2xl h-12 font-bold shadow-lg shadow-blue-100">
          {btnText}
        </Button>
      )}
    </div>
  );
}

function TopperNudge({ stats, isTopper }: { stats: any, isTopper: boolean }) {
  if (isTopper) {
    return (
        <div className="bg-emerald-500 p-6 rounded-3xl mt-6 text-white shadow-lg overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-20">
                <Trophy size={80} />
            </div>
            <h3 className="text-lg font-black">You are a Verified Topper!</h3>
            <p className="text-sm font-medium opacity-90 mt-1">Your listings are highlighted as expert material.</p>
        </div>
    );
  }

  const salesProgress = Math.min((stats?.sold_count || 0) / 10 * 100, 100);
  const ratingProgress = Math.min((stats?.avg_rating || 0) / 4.5 * 100, 100);
  const remaining = 10 - (stats?.sold_count || 0);

  return (
    <div className="bg-white p-6 rounded-3xl mt-6 shadow-sm border border-gray-100 overflow-hidden relative group">
      <div className="flex items-center gap-4 mb-4">
        <div className="bg-amber-100 p-3 rounded-2xl text-amber-600">
          <Trophy size={24} />
        </div>
        <div>
          <h3 className="font-black text-[#1a2744]">Verified Topper Progress</h3>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Unlock special badges & trust</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-[11px] font-bold mb-1.5">
            <span className="text-[#132b4b]">Sales: {stats?.sold_count || 0} of 10</span>
            <span className="text-gray-400">{Math.round(salesProgress)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-amber-400 transition-all duration-1000" style={{ width: `${salesProgress}%` }} />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[11px] font-bold mb-1.5">
            <span className="text-[#132b4b]">Rating: {stats?.avg_rating || 0} of 4.5</span>
            <span className="text-gray-400">{Math.round(ratingProgress)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${ratingProgress}%` }} />
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center">
        <p className="text-xs font-bold text-gray-500 mb-4">
          {remaining > 0 ? `${remaining} more sales to go — keep listing!` : "Maintain 4.5+ rating to unlock!"}
        </p>
        <button 
          onClick={() => window.location.href = '/sell'}
          className="w-full bg-[#1a2744] text-white py-3 rounded-2xl font-bold text-sm shadow-md transition-transform group-hover:scale-[1.02]"
        >
          Sell more notes
        </button>
      </div>
    </div>
  );
}

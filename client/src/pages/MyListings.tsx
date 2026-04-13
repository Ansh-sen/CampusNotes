import { useState, useEffect, useMemo, forwardRef } from 'react';
import { API_URL, API_BASE_URL } from '@/config';
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
  Eye,
  MessageCircle
} from 'lucide-react';
import { useToast } from '@/components/ui/toast-provider';
import { MyListingCard } from '@/components/MyListingCard';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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
        fetch(`${API_URL}/listings/me`, { headers: { 'Authorization': `Bearer ${jwt}` } }).then(r => r.json()),
        fetch(`${API_URL}/listings/me/stats`, { headers: { 'Authorization': `Bearer ${jwt}` } }).then(r => r.json()),
        fetch(`${API_URL}/listings/analytics/views`, { headers: { 'Authorization': `Bearer ${jwt}` } }).then(r => r.json()),
        fetch(`${API_URL}/listings/analytics/tip`, { headers: { 'Authorization': `Bearer ${jwt}` } }).then(r => r.json())
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
          const res = await fetch(`${API_URL}/listings/${id}/status`, {
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
          const endpoint = action === 'delete' ? `${API_URL}/listings/${id}` : `${API_URL}/listings/draft/${id}`;
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
          const res = await fetch(`${API_URL}/listings/${id}/relist`, {
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
      const res = await fetch(`${API_URL}/listings/me/drafts/all`, {
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
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="bg-primary text-primary-foreground pt-0 pb-10 px-4 rounded-b-[3rem] shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-white/10 transition-colors duration-1000" />
        
        <div className="flex justify-between items-center mb-8 relative z-10">
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">Dashboard</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Manage Your Notes</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-1.5 flex border border-white/10 shadow-inner">
              <button 
                onClick={() => setActiveView('listings')}
                className={cn(
                  "h-10 w-10 flex items-center justify-center rounded-xl transition-all duration-500", 
                  activeView === 'listings' ? "bg-white text-primary shadow-xl scale-105" : "text-white/40 hover:text-white"
                )}
              >
                <List size={20} />
              </button>
              <button 
                onClick={() => setActiveView('analytics')}
                className={cn(
                  "h-10 w-10 flex items-center justify-center rounded-xl transition-all duration-500", 
                  activeView === 'analytics' ? "bg-white text-primary shadow-xl scale-105" : "text-white/40 hover:text-white"
                )}
              >
                <BarChart2 size={20} />
              </button>
            </div>

            {activeTab === 'drafts' && (stats?.draft_count || 0) > 0 && (
              <button 
                onClick={handleClearDrafts}
                className="px-5 h-10 bg-danger/20 hover:bg-danger text-white border border-danger/30 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg"
              >
                Flush System
              </button>
            )}

            <button 
              onClick={() => navigate('/create')}
              className="h-12 w-12 flex items-center justify-center bg-white text-primary rounded-2xl hover:scale-110 transition-all active:scale-95 shadow-2xl shadow-black/20 group/btn"
            >
              <Plus size={24} className="group-hover:rotate-90 transition-transform duration-500" />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 relative z-10">
          {loading ? (
             <>
               <div className="h-20 bg-white/5 animate-pulse rounded-[1.5rem]" />
               <div className="h-20 bg-white/5 animate-pulse rounded-[1.5rem]" />
               <div className="h-20 bg-white/5 animate-pulse rounded-[1.5rem]" />
             </>
          ) : activeView === 'listings' ? (
            <>
              <StatItem label="Active" value={stats?.active_count || 0} />
              <StatItem label="Items Sold" value={stats?.sold_count || 0} variant="accent" />
              <StatItem label="Total Notes" value={stats?.total_count || 0} />
            </>
          ) : (
            <>
              <StatItem label="Revenue" value={`₹${stats?.total_earned || 0}`} variant="accent" />
              <StatItem label="Items Sold" value={stats?.sold_count || 0} />
              <StatItem label="Your Rating" value={stats?.avg_rating || 'N/A'} />
            </>
          )}
        </div>
      </div>

      <div className="w-full px-4 mt-8 space-y-8">
        {activeView === 'listings' ? (
          <>
            {/* Tabs - Evenly Distributed Grid */}
            <div className="grid grid-cols-4 gap-2 pb-6">
              <TabButton label="Overview" count={stats?.total_count} active={activeTab === 'all'} onClick={() => setActiveTab('all')} />
              <TabButton label="Active" count={stats?.active_count} active={activeTab === 'active'} onClick={() => setActiveTab('active')} />
              <TabButton label="Sold" count={stats?.sold_count} active={activeTab === 'sold'} onClick={() => setActiveTab('sold')} />
              <TabButton label="Drafts" count={stats?.draft_count} active={activeTab === 'drafts'} onClick={() => setActiveTab('drafts')} />
            </div>

            {/* List */}
            <AnimatePresence mode="popLayout">
              {filteredListings.length > 0 ? (
                <div className="space-y-4">
                  {filteredListings.map((listing, i) => (
                    <motion.div
                      key={listing.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <MyListingCard listing={listing} onAction={handleAction} />
                    </motion.div>
                  ))}
                  
                  {activeTab === 'sold' && user && (
                      <TopperNudge stats={stats} isTopper={(user as any).is_topper} />
                  )}
                </div>
              ) : (
                <EmptyState tab={activeTab} hasListings={listings.length > 0} onAction={() => navigate('/sell')} />
              )}
            </AnimatePresence>
          </>
        ) : (
          /* Analytics View */
          <div className="space-y-8 pb-10">
            {!analytics || listings.length < 1 ? (
                <div className="bg-card p-12 rounded-[2.5rem] text-center shadow-xl shadow-black/5 border border-border/50 flex flex-col items-center gap-6">
                    <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center">
                      <BarChart2 className="w-10 h-10 text-muted-foreground/30" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-foreground uppercase tracking-tight">Your Progress</h3>
                      <p className="text-xs font-medium text-muted-foreground mt-2 max-w-[200px] mx-auto opacity-60 italic">Publish your first notes to start seeing your views and progress here.</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Views Chart */}
                    <div className="bg-card p-8 rounded-[2.5rem] shadow-xl shadow-black/5 border border-border/50 space-y-8">
                        <div>
                          <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-40">Your Progress</h3>
                          <h4 className="text-xl font-black text-foreground mt-1">People who saw your notes</h4>
                        </div>

                        <div className="flex items-end justify-between h-40 gap-3">
                            {analytics.data.map((d: any, i: number) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-3 group/chart">
                                    <div 
                                        className={cn(
                                            "w-full rounded-2xl transition-all duration-700 relative",
                                            i === 6 ? "bg-primary shadow-lg shadow-primary/20 scale-x-110" : "bg-primary/10 group-hover/chart:bg-primary/20"
                                        )}
                                        style={{ height: `${Math.max(10, (d.view_count / (Math.max(...analytics.data.map((x: any) => x.view_count)) || 1)) * 100)}%` }}
                                    >
                                      {d.view_count > 0 && (
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-primary opacity-0 group-hover/chart:opacity-100 transition-opacity">
                                          {d.view_count}
                                        </div>
                                      )}
                                    </div>
                                    <span className={cn("text-[9px] font-black uppercase tracking-widest", i === 6 ? "text-primary" : "text-muted-foreground opacity-30")}>{d.date}</span>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-6 pt-6 border-t border-border/50">
                            <MetricBox 
                                label="Total Views" 
                                value={analytics.total_week} 
                                change={((analytics.total_week - analytics.prev_week) / (analytics.prev_week || 1)) * 100}
                            />
                            <MetricBox 
                                label="Interested Buyers" 
                                value={analytics.total_inquiries} 
                                change={((analytics.total_inquiries - analytics.prev_inquiries) / (analytics.prev_inquiries || 1)) * 100}
                            />
                        </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-card p-6 rounded-[2rem] shadow-xl shadow-black/5 border border-border/50 group hover:border-primary/20 transition-all active:scale-95">
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-40">Monthly Revenue</p>
                            <p className="text-2xl font-black text-foreground mt-2 tracking-tighter">₹{stats?.total_earned || 0}</p>
                            <div className="flex items-center gap-2 mt-2 text-[10px] font-black text-emerald-500">
                                <TrendingUp size={14} />
                                <span className="uppercase tracking-widest">Growing Trend</span>
                            </div>
                        </div>
                        <div className="bg-card p-6 rounded-[2rem] shadow-xl shadow-black/5 border border-border/50 group hover:border-primary/20 transition-all active:scale-95">
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-40">Portfolio Value</p>
                            <p className="text-2xl font-black text-foreground mt-2 tracking-tighter">₹{stats?.total_earned || 0}</p>
                            <p className="text-[10px] font-black text-muted-foreground mt-2 uppercase tracking-widest opacity-30">Lifetime Yield</p>
                        </div>
                    </div>

                    {/* Top Performer */}
                    {listings.length > 0 && (
                        <div className="bg-card p-8 rounded-[2.5rem] shadow-xl shadow-black/5 border border-border/50 space-y-6 relative overflow-hidden group">
                            <div>
                              <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-40">Your Best Seller</h3>
                              <h4 className="text-lg font-black text-foreground mt-1">Most Popular Notes</h4>
                            </div>

                            <div className="flex gap-6 items-center p-4 bg-muted/30 rounded-3xl border border-border/10">
                                <div className="h-20 w-20 bg-muted rounded-2xl overflow-hidden shrink-0 border border-border/50 shadow-inner">
                                    {listings[0].listing_images?.[0] ? (
                                        <img src={`${API_BASE_URL}${listings[0].listing_images[0].image_url}`} className="h-full w-full object-cover transition-transform group-hover:scale-110 duration-700" />
                                    ) : <FileText className="m-auto h-8 w-8 text-muted-foreground/20" />}
                                </div>
                                <div className="flex-1 space-y-2">
                                    <h4 className="text-base font-black text-foreground truncate leading-tight">{listings[0].title}</h4>
                                    <div className="flex gap-6">
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 bg-primary/10 rounded-lg flex items-center justify-center">
                                              <Eye size={12} className="text-primary" />
                                            </div>
                                            <span className="text-xs font-black text-foreground tabular-nums">{listings[0].view_count}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                                              <MessageCircle size={12} className="text-emerald-500" />
                                            </div>
                                            <span className="text-xs font-black text-foreground tabular-nums">{listings[0].inquiry_count}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => navigate(`/listing/${listings[0].id}`)}
                                className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 hover:bg-primary hover:text-white py-4 px-6 rounded-2xl transition-all shadow-xl shadow-primary/5 active:scale-95"
                            >
                                <span>See Details</span>
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}

                    {/* AI Tip */}
                    {aiTip && (
                        <div className="bg-amber-500/5 p-8 rounded-[2.5rem] border border-amber-500/20 shadow-xl shadow-amber-500/5 relative overflow-hidden group">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none group-hover:scale-150 transition-transform duration-1000" />
                            <div className="flex items-start gap-6 relative z-10">
                                <div className="bg-amber-500/20 p-4 rounded-2xl shadow-inner border border-amber-500/20">
                                    <AlertCircle className="text-amber-500" size={28} />
                                </div>
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                      <h3 className="text-[9px] font-black text-amber-500 uppercase tracking-[0.3em]">Tip to sell faster</h3>
                                      <p className="text-base font-bold text-foreground leading-tight italic opacity-90">"{aiTip.suggestion}"</p>
                                    </div>
                                    <button 
                                        onClick={() => navigate(`/sell?edit=${listings.find(l => l.title === aiTip.listing_title)?.id}`)}
                                        className="inline-flex items-center gap-3 text-[10px] font-black text-amber-500 uppercase tracking-widest group/btn active:scale-95 transition-all"
                                    >
                                        Improve Now
                                        <div className="h-8 w-8 bg-amber-500/20 rounded-full flex items-center justify-center group-hover/btn:translate-x-2 transition-transform">
                                          <ChevronRight size={16} />
                                        </div>
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
    <div className="bg-white/10 backdrop-blur-md p-5 rounded-[1.5rem] flex flex-col items-center border border-white/5 shadow-inner group/stat hover:bg-white/15 transition-all">
      <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">{label}</span>
      <span className={cn("text-2xl font-black mt-1 tracking-tighter tabular-nums", variant === 'accent' ? "text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" : "text-white")}>
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
        "px-2 py-4 rounded-2xl transition-all duration-500 flex flex-col items-center justify-center gap-2 group relative overflow-hidden h-full",
        active 
          ? "bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02] z-10" 
          : "bg-card text-muted-foreground border border-border/50 hover:border-primary/50"
      )}
    >
      <span className="text-[8px] font-black uppercase tracking-tight relative z-10 leading-none">{label}</span>
      {count !== undefined && (
        <span className={cn(
          "text-[10px] font-black px-2 py-0.5 rounded-lg tabular-nums relative z-10", 
          active ? "bg-white/20" : "bg-muted text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary transition-colors"
        )}>
          {count}
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

function MetricBox({ label, value, change }: { label: string, value: number, change: number }) {
  const isUp = change >= 0;
  return (
    <div className="space-y-2">
      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-40">{label}</p>
      <div className="flex items-center gap-3">
        <span className="text-2xl font-black text-foreground tracking-tighter tabular-nums">{value}</span>
        <div className={cn(
          "flex items-center text-[9px] font-black px-2 py-1 rounded-xl shadow-lg leading-none",
          isUp ? "bg-emerald-500/10 text-emerald-500 shadow-emerald-500/5" : "bg-danger/10 text-danger shadow-danger/5"
        )}>
           {isUp ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
           {Math.abs(change).toFixed(0)}%
        </div>
      </div>
    </div>
  );
}

const EmptyState = forwardRef<HTMLDivElement, { tab: TabType, hasListings: boolean, onAction: () => void }>(({ tab, hasListings, onAction }, ref) => {
  let icon = <FileText className="w-10 h-10 text-muted-foreground/20" />;
  let title = "No Notes Found";
  let subtitle = "Start selling your class notes and earn from your hard work.";
  let btnText = "Put Up Your First Note";

  if (tab === 'active' && hasListings) {
    title = "No Active Notes";
    subtitle = "You don't have any notes for sale right now. Put them up and start earning.";
    btnText = "";
  } else if (tab === 'sold') {
    title = "Nothing Sold Yet";
    subtitle = "Try adding better descriptions or more images to attract buyers.";
    btnText = "";
  } else if (tab === 'drafts') {
    title = "No Drafts";
    subtitle = "Your staging area is empty. Start a new listing anytime.";
    btnText = "";
  }

  return (
    <div ref={ref} className="bg-card p-12 rounded-[3rem] text-center shadow-2xl shadow-black/5 border border-border/50 flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
      <div className="bg-muted p-8 rounded-full shadow-inner border border-border/50">
        {icon}
      </div>
      <div>
        <h3 className="text-xl font-black text-foreground uppercase tracking-tight">{title}</h3>
        <p className="text-xs font-medium text-muted-foreground mt-2 max-w-[220px] mx-auto opacity-60 leading-relaxed">{subtitle}</p>
      </div>
      {btnText && (
        <button 
          onClick={onAction} 
          className="h-14 bg-primary hover:bg-primary/90 text-white px-10 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20 transition-all active:scale-95"
        >
          {btnText}
        </button>
      )}
    </div>
  );
});

function TopperNudge({ stats, isTopper }: { stats: any, isTopper: boolean }) {
  const navigate = useNavigate();
  if (isTopper) {
    return (
        <div className="bg-emerald-500 p-8 rounded-[2.5rem] mt-10 text-white shadow-2xl shadow-emerald-500/20 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                <Trophy size={120} />
            </div>
            <div className="relative z-10 space-y-2">
              <h3 className="text-2xl font-black tracking-tighter uppercase leading-none">Verified Seller Badge</h3>
              <p className="text-sm font-medium opacity-80 max-w-[220px]">Your notes are now marked as top-quality study material.</p>
            </div>
        </div>
    );
  }

  const salesProgress = Math.min((stats?.sold_count || 0) / 10 * 100, 100);
  const ratingProgress = Math.min((stats?.avg_rating || 0) / 4.5 * 100, 100);
  const remaining = 10 - (stats?.sold_count || 0);

  return (
    <div className="bg-card p-8 rounded-[2.5rem] mt-10 shadow-2xl shadow-black/5 border border-border/50 overflow-hidden relative group">
      <div className="flex items-center gap-6 mb-8 relative z-10">
        <div className="bg-amber-500/10 p-4 rounded-2xl text-amber-500 shadow-inner border border-amber-500/10">
          <Trophy size={32} />
        </div>
        <div>
          <h3 className="text-xl font-black text-foreground tracking-tight uppercase leading-none">Top Seller Badge</h3>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-2 opacity-40">Get more people to trust you</p>
        </div>
      </div>

      <div className="space-y-8 relative z-10">
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-black text-foreground uppercase tracking-widest">Market Volume: {stats?.sold_count || 0} / 10</span>
            <span className="text-[10px] font-black text-amber-500 tabular-nums">{Math.round(salesProgress)}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden border border-border/50">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${salesProgress}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-amber-400 to-amber-600 shadow-[0_0_15px_rgba(251,191,36,0.5)]" 
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-black text-foreground uppercase tracking-widest">Quality Rating: {stats?.avg_rating || 0} / 4.5</span>
            <span className="text-[10px] font-black text-primary tabular-nums">{Math.round(ratingProgress)}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden border border-border/50">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${ratingProgress}%` }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
              className="h-full bg-gradient-to-r from-primary to-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
            />
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-col items-center relative z-10">
        <p className="text-xs font-bold text-muted-foreground mb-6 opacity-60 text-center italic">
          {remaining > 0 ? `Target acquired: ${remaining} more acquisitions required.` : "Quality metrics met. Maintain rating to unlock."}
        </p>
        <button 
          onClick={() => navigate('/create')}
          className="w-full bg-primary text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
        >
          Put More Notes
        </button>
      </div>

      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
}

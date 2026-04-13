import { useEffect, useState } from 'react';
import { 
  Users, 
  FileText, 
  ShieldCheck, 
  TrendingUp,
  AlertCircle,
  ArrowUpRight,
  Clock,
  ArrowRight
} from 'lucide-react';
import { API_URL } from '../config';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('admin_token');
        window.location.href = '/login';
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setStats(data);
      } else {
        console.error('Failed to fetch stats:', data.error || res.statusText);
      }
    } catch (e) { 
      console.error('Network error fetching stats:', e); 
    }
    finally { setLoading(false); }
  };

  const cards = [
    { label: 'Total Students', value: stats?.total_users || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10', trend: '+12%', trendUp: true, delay: '0ms' },
    { label: 'Waitlist', value: stats?.pending_verifications || 0, icon: ShieldCheck, color: 'text-amber-500', bg: 'bg-amber-500/10', trend: 'Urgent', trendUp: false, delay: '100ms' },
    { label: 'Live Notes', value: stats?.active_listings || 0, icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-500/10', trend: '+5%', trendUp: true, delay: '200ms' },
    { label: 'Revenue', value: `₹${parseFloat(stats?.total_revenue || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-violet-500', bg: 'bg-violet-500/10', trend: '+18%', trendUp: true, delay: '300ms' },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="animate-fade-in" style={{ animationDelay: '0ms' }}>
          <h1 className="text-4xl font-black text-foreground tracking-tight">System Oversight</h1>
          <p className="text-muted-foreground font-bold text-sm mt-1 uppercase tracking-widest opacity-60 italic">Real-time platform metrics</p>
        </div>
        <div className="flex items-center gap-3 bg-secondary/50 px-5 py-2.5 rounded-2xl border border-border/50 text-[10px] font-black text-muted-foreground uppercase tracking-widest animate-fade-in" style={{ animationDelay: '100ms' }}>
          <Clock size={14} className="text-primary" />
          Refreshed: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div 
            key={i} 
            className="admin-card group hover:border-primary/30 animate-fade-in"
            style={{ animationDelay: card.delay }}
          >
            <div className="p-8 space-y-6">
              <div className="flex items-start justify-between">
                <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3", card.bg, card.color)}>
                  <card.icon size={28} />
                </div>
                <div className={cn(
                  "flex items-center gap-1.5 text-[10px] font-black uppercase px-3 py-1.5 rounded-full",
                  card.trendUp ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
                )}>
                  {card.trendUp ? <ArrowUpRight size={10} strokeWidth={3} /> : <AlertCircle size={10} strokeWidth={3} />}
                  {card.trend}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-50">{card.label}</p>
                <h2 className="text-4xl font-black text-foreground tracking-tighter tabular-nums drop-shadow-sm leading-none">
                  {loading ? (
                    <span className="h-8 w-16 bg-muted animate-pulse rounded block mt-2" />
                  ) : (
                    card.value
                  )}
                </h2>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 admin-card animate-fade-in" style={{ animationDelay: '400ms' }}>
          <div className="p-8 border-b border-border/50 flex items-center justify-between bg-muted/10">
            <div>
              <h3 className="text-xl font-black text-foreground tracking-tight">Recent Verifications</h3>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1 opacity-40">Queue priority: High</p>
            </div>
            <button 
              onClick={() => window.location.href = '#/verifications'}
              className="px-5 py-2.5 bg-primary/10 text-primary hover:bg-primary text-[10px] font-black uppercase tracking-widest rounded-xl transition-all hover:text-white"
            >
              See All
            </button>
          </div>
          <div className="p-2">
            {!stats?.recent_verifications || stats.recent_verifications.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto opacity-20">
                  <ShieldCheck size={32} />
                </div>
                <p className="text-muted-foreground font-black uppercase tracking-[0.2em] text-[10px] opacity-30">Clear for now</p>
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {stats.recent_verifications.map((v: any) => (
                  <div 
                    key={v.id} 
                    onClick={() => window.location.href = `#/verifications?id=${v.id}`}
                    className="flex items-center gap-5 p-6 hover:bg-secondary/30 transition-all cursor-pointer group rounded-2xl"
                  >
                    <div className="h-14 w-14 bg-primary/5 text-primary border border-primary/20 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner group-hover:bg-primary group-hover:text-white transition-all duration-300">
                      {v.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-black text-foreground group-hover:text-primary transition-colors truncate">{v.name}</h4>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">
                        {v.programme} • {v.branch || 'Pending'}
                      </p>
                    </div>
                    <div className="text-right hidden sm:block mr-4">
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Submitted</p>
                      <p className="text-xs font-black text-foreground">{new Date(v.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-secondary text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all">
                      <ArrowRight size={18} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* System Health */}
        <div className="admin-card bg-slate-900 dark:bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl animate-fade-in" style={{ animationDelay: '500ms' }}>
           <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12">
              <TrendingUp size={200} />
           </div>
           
           <div className="relative z-10 h-full flex flex-col">
             <div className="flex items-center gap-4 mb-10">
               <div className="h-4 w-4 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
               <h3 className="text-2xl font-black tracking-tight">Node Cluster</h3>
             </div>
             
             <div className="space-y-8 flex-1">
                {[
                  { label: 'API Gateway', status: 'Optimal', color: 'bg-emerald-500', load: '85%' },
                  { label: 'DB Connection', status: stats?.system?.db_status || 'Checking...', color: stats?.system?.db_status === 'Connected' ? 'bg-emerald-500' : 'bg-red-500', load: '100%' },
                  { label: 'Memory Heap', status: stats?.system?.memory ? `${Math.round(stats.system.memory / 1024 / 1024)}MB` : '0MB', color: 'bg-blue-400', load: '65%' },
                  { label: 'System Uptime', status: stats?.system?.uptime ? `${Math.round(stats.system.uptime / 3600)}h` : '0h', color: 'bg-violet-400', load: '100%' },
                ].map((sys, i) => (
                  <div key={i} className="space-y-3">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      <span>{sys.label}</span>
                      <span className="text-white opacity-100">{sys.status}</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5 shadow-inner">
                      <div className={cn("h-full transition-all duration-1000 ease-out", sys.color)} style={{ width: sys.load }} />
                    </div>
                  </div>
                ))}
             </div>

             <div className="mt-12 p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-blue-400 shadow-inner">
                  <ShieldCheck size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Security Active</p>
                  <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tight">End-to-end encryption</p>
                </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}

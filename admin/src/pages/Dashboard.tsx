import { useEffect, useState } from 'react';
import { 
  Users, 
  FileText, 
  ShieldCheck, 
  TrendingUp,
  AlertCircle,
  ArrowUpRight,
  Clock
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
      setStats(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const cards = [
    { label: 'Total Students', value: stats?.total_users || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50', trend: '+12%', trendUp: true },
    { label: 'Pending Verifications', value: stats?.pending_verifications || 0, icon: ShieldCheck, color: 'text-amber-500', bg: 'bg-amber-50', trend: 'Critical', trendUp: false },
    { label: 'Active Listings', value: stats?.active_listings || 0, icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-50', trend: '+5%', trendUp: true },
    { label: 'Platform Revenue', value: `₹${stats?.total_revenue || 0}`, icon: TrendingUp, color: 'text-indigo-500', bg: 'bg-indigo-50', trend: '+18%', trendUp: true },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Overview</h1>
          <p className="text-slate-500 font-medium">System performance and operations monitor</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm text-xs font-bold text-slate-500">
          <Clock size={14} />
          Refreshed: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300 group">
            <div className="flex items-start justify-between mb-4">
              <div className={cn("p-4 rounded-2xl group-hover:scale-110 transition-transform duration-500", card.bg, card.color)}>
                <card.icon size={24} />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-full",
                card.trendUp ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
              )}>
                {card.trendUp ? <ArrowUpRight size={10} /> : <AlertCircle size={10} />}
                {card.trend}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.label}</p>
              <h2 className="text-3xl font-black text-slate-900">{loading ? '...' : card.value}</h2>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900">Recent Verifications</h3>
            <button 
              onClick={() => window.location.href = '#/verifications'}
              className="text-blue-600 font-bold text-sm hover:underline"
            >
              View All
            </button>
          </div>
          <div className="space-y-6">
            {!stats?.recent_verifications || stats.recent_verifications.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No pending verifications</p>
              </div>
            ) : (
              stats.recent_verifications.map((v: any) => (
                <div 
                  key={v.id} 
                  onClick={() => window.location.href = `#/verifications?id=${v.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer group"
                >
                  <div className="h-12 w-12 bg-blue-100/50 text-blue-600 rounded-xl flex items-center justify-center font-black text-lg">
                    {v.name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-900">{v.name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                      Applied {new Date(v.created_at).toLocaleDateString()} • {v.programme}
                    </p>
                  </div>
                  <button className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    Review
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* System Health */}
        <div className="bg-[#1e293b] rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl">
           <div className="absolute top-0 right-0 p-8 opacity-10">
              <TrendingUp size={120} />
           </div>
           <h3 className="text-xl font-black mb-6 relative z-10">System Status</h3>
           <div className="space-y-6 relative z-10">
              {[
                { label: 'API Gateway', status: 'Operational', color: 'bg-emerald-500', load: '95%' },
                { label: 'Database', status: stats?.system?.db_status || 'Checking...', color: stats?.system?.db_status === 'Connected' ? 'bg-emerald-500' : 'bg-red-500', load: '100%' },
                { label: 'Memory Usage', status: stats?.system?.memory ? `${Math.round(stats.system.memory / 1024 / 1024)}MB` : '0MB', color: 'bg-blue-500', load: '65%' },
                { label: 'Uptime', status: stats?.system?.uptime ? `${Math.round(stats.system.uptime / 3600)}h` : '0h', color: 'bg-indigo-500', load: '100%' },
              ].map((sys, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span>{sys.label}</span>
                    <span>{sys.status}</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className={cn("h-full transition-all duration-1000", sys.color)} style={{ width: sys.load }} />
                  </div>
                </div>
              ))}
           </div>
           <div className="mt-10 p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
              <ShieldCheck className="text-blue-400" size={18} />
              <p className="text-[10px] font-bold text-slate-300">End-to-end encryption active</p>
           </div>
        </div>
      </div>
    </div>
  );
}

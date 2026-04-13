import { BarChart3, Download, Activity, Globe, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { API_URL } from '../config';
import { cn } from '../lib/utils';

export default function Reports() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchReports();
  }, [timeRange]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/reports?range=${timeRange}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      setData(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tight">Intelligence & Analytics</h1>
          <p className="text-muted-foreground font-bold text-sm mt-1 uppercase tracking-widest opacity-60 italic">Deep insights into platform growth and asset flow</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
           <div className="flex bg-secondary/50 rounded-2xl border border-border/50 p-1.5 shadow-inner">
             {['7d', '30d', '90d'].map(r => (
               <button 
                key={r}
                onClick={() => setTimeRange(r)}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  timeRange === r ? "bg-primary text-white shadow-xl" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
               >
                 {r === '7d' ? 'Weekly' : r === '30d' ? 'Monthly' : 'Quarterly'}
               </button>
             ))}
           </div>
           <button className="h-14 px-6 bg-card border border-border text-foreground rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-black/5 hover:border-primary/50 transition-all active:scale-95">
              <Download size={18} /> Export Data
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          {/* User Growth Chart */}
          <div className="admin-card p-10 xl:col-span-2">
            <div className="flex items-center justify-between mb-12">
               <div>
                  <h3 className="text-2xl font-black text-foreground tracking-tight">Acquisition Velocity</h3>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1 opacity-50">New users onboarded over time</p>
               </div>
               <div className="flex items-center gap-3 text-[10px] font-black text-primary bg-primary/10 px-4 py-2 rounded-xl uppercase tracking-widest border border-primary/10">
                  <Activity size={14} /> Real-time Nodes
               </div>
            </div>
            <div className="h-80 flex items-end gap-5 px-2 relative">
               <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-full h-px bg-foreground" />
                  ))}
               </div>
               {loading ? (
                 <div className="w-full h-full flex items-center justify-center text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px] opacity-40">Synchronizing nodes...</div>
               ) : !data?.userGrowth || data.userGrowth.length === 0 ? (
                 <div className="w-full h-full flex items-center justify-center text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px] opacity-40 italic">Registry silent: no growth signals found</div>
               ) : (
                 data.userGrowth.map((d: any, i: number) => {
                   const max = Math.max(...data.userGrowth.map((item: any) => item.count), 1);
                   return (
                     <div key={i} className="flex-1 h-full flex flex-col items-center gap-4 group relative z-10">
                        <div className="w-full bg-secondary/30 rounded-t-[1rem] relative overflow-hidden h-full flex flex-col justify-end">
                           <motion.div 
                             initial={{ height: 0 }}
                             animate={{ height: `${(d.count / max) * 100}%` }}
                             transition={{ duration: 1.2, ease: "circOut", delay: i * 0.08 }}
                             className="bg-primary group-hover:bg-primary/80 transition-all rounded-t-[1rem] shadow-2xl shadow-primary/40 relative"
                           >
                              <div className="absolute top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-[9px] font-black px-1.5 py-0.5 rounded shadow-xl">{d.count}</div>
                           </motion.div>
                        </div>
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest truncate w-full text-center opacity-40 group-hover:opacity-100 transition-opacity">{d.month}</span>
                     </div>
                   );
                 })
               )}
            </div>
          </div>

          {/* Categories Chart */}
          <div className="admin-card p-10">
            <h3 className="text-2xl font-black text-foreground tracking-tight mb-4">Asset Liquidity</h3>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-12 opacity-50">Sales distribution by material type</p>
            <div className="space-y-10">
               {loading ? (
                 <div className="py-20 flex flex-col items-center justify-center opacity-30">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-center">Parsing Market Meta...</p>
                 </div>
               ) : !data?.categorySales || data.categorySales.length === 0 ? (
                 <div className="h-48 flex items-center justify-center text-muted-foreground italic text-[10px] font-black uppercase tracking-widest opacity-30">No transaction data indexed</div>
               ) : (
                 data.categorySales.map((cat: any, i: number) => {
                    const maxVal = Math.max(...data.categorySales.map((item: any) => item.value), 1);
                    return (
                      <div key={i} className="space-y-3 group">
                         <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-widest">
                            <span className="text-muted-foreground group-hover:text-primary transition-colors">{cat.name}</span>
                            <span className="text-foreground bg-secondary/50 px-2 py-0.5 rounded-lg border border-border/50">{cat.value} Units</span>
                         </div>
                         <div className="h-3 bg-secondary/50 rounded-full overflow-hidden shadow-inner border border-border/20">
                            <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${(cat.value / maxVal) * 100}%` }}
                               transition={{ duration: 1.2, ease: "circOut", delay: i * 0.1 }}
                               className="h-full bg-primary rounded-full shadow-lg shadow-primary/20 relative" 
                            >
                               <div className="absolute inset-0 bg-white/20 animate-pulse" />
                            </motion.div>
                         </div>
                      </div>
                    );
                 })
               )}
            </div>
          </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          {/* Trending Subjects */}
          <div className="xl:col-span-2 admin-card p-10">
            <h3 className="text-2xl font-black text-foreground tracking-tight mb-4">High-Velocity Courses</h3>
             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-12 opacity-50">Subject nodes with peak marketplace engagement</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               {loading ? (
                  <div className="col-span-2 py-20 text-center opacity-30">
                     <p className="text-[10px] font-black uppercase tracking-widest italic">Calculating interest vectors...</p>
                  </div>
               ) : !data?.popularSubjects || data.popularSubjects.length === 0 ? (
                  <p className="col-span-2 text-center text-muted-foreground italic text-[10px] font-black uppercase tracking-widest py-10 opacity-30 italic">No trending courses detected in this cycle</p>
               ) : (
                  data.popularSubjects.map((sub: any, i: number) => (
                    <div 
                      key={i} 
                      className="flex items-center justify-between p-6 bg-secondary/30 rounded-[1.5rem] hover:bg-primary/5 border border-border/30 hover:border-primary/20 transition-all cursor-pointer group animate-fade-in"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                        <div className="flex items-center gap-5">
                           <div className="h-12 w-12 bg-card rounded-2xl flex items-center justify-center font-black text-primary shadow-xl shadow-black/5 border border-border/50 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all tabular-nums">{i+1}</div>
                           <div>
                              <h4 className="text-base font-black text-foreground tracking-tight group-hover:text-primary transition-colors">{sub.subject_code || 'UNTITLED_NODE'}</h4>
                              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.1em] opacity-40 group-hover:opacity-60">Active Index: {sub.count}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <div className="flex items-center gap-1.5 text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/10 shadow-sm animate-pulse">
                              <Zap size={10} className="fill-current" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Erupting</span>
                           </div>
                        </div>
                    </div>
                  ))
               )}
            </div>
          </div>

          {/* Reports Generation Link */}
          <div className="bg-[#1e293b] rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl flex flex-col items-center justify-center text-center space-y-8 animate-fade-in">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
              <div className="h-20 w-20 bg-blue-600/20 rounded-[2.5rem] flex items-center justify-center shadow-2xl border border-blue-500/30 group hover:scale-110 transition-transform cursor-pointer">
                <BarChart3 className="text-blue-500 group-hover:text-white transition-colors" size={40} />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-black tracking-tight uppercase">Platform Integrity</h3>
                <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest opacity-60">Last 24 hours ecosystem audit</p>
              </div>
              <div className="w-full bg-slate-800/50 rounded-[2rem] p-8 border border-white/5 space-y-6 shadow-inner">
                 <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
                    <span className="text-slate-500 flex items-center gap-2"><Globe size={12} className="text-blue-500" /> Gateway Latency</span>
                    <span className="text-emerald-500 tabular-nums">14ms</span>
                 </div>
                 <div className="h-px bg-white/5" />
                 <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
                    <span className="text-slate-500 flex items-center gap-2"><Zap size={12} className="text-blue-500" /> Request Fidelity</span>
                    <span className="text-blue-500 tabular-nums">99.99%</span>
                 </div>
              </div>
              <button className="w-full h-16 bg-white text-[#1e293b] rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-3xl shadow-white/5 hover:bg-blue-50 transition-all active:scale-95 flex items-center justify-center gap-3">
                 <Download size={18} /> Generate Data Vault
              </button>
          </div>
      </div>
    </div>
  );
}

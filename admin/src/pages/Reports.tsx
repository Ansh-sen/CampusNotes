import { BarChart3, PieChart, TrendingUp, Download, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Analytics & Reports</h1>
          <p className="text-slate-500 font-medium">Detailed insights into platform growth and usage</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex bg-white rounded-2xl border border-slate-200 p-1 shadow-sm">
             {['7d', '30d', '90d'].map(r => (
               <button 
                key={r}
                onClick={() => setTimeRange(r)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                  timeRange === r ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:text-slate-900"
                )}
               >
                 {r}
               </button>
             ))}
           </div>
           <button className="h-11 px-4 bg-white border border-slate-200 text-slate-900 rounded-2xl flex items-center gap-2 font-black text-xs uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all">
              <Download size={16} /> Export
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* User Growth Chart */}
          <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-xl font-black text-slate-900">User Growth</h3>
               <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase">
                  <TrendingUp size={10} /> Live Trends
               </div>
            </div>
            <div className="h-64 flex items-end gap-4 px-2">
               {loading ? (
                 <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold uppercase tracking-widest text-xs">Loading growth...</div>
               ) : !data?.userGrowth || data.userGrowth.length === 0 ? (
                 <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold uppercase tracking-widest text-xs italic">No user data yet</div>
               ) : (
                 data.userGrowth.map((d: any, i: number) => {
                   const max = Math.max(...data.userGrowth.map((item: any) => item.count), 1);
                   return (
                     <div key={i} className="flex-1 h-full flex flex-col items-center gap-3 group">
                        <div className="w-full bg-slate-50 rounded-t-xl relative overflow-hidden h-full flex flex-col justify-end">
                           <motion.div 
                             initial={{ height: 0 }}
                             animate={{ height: `${(d.count / max) * 100}%` }}
                             transition={{ duration: 1, delay: i * 0.1 }}
                             className="bg-blue-600 group-hover:bg-blue-500 transition-colors rounded-t-xl shadow-lg shadow-blue-200"
                           />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter truncate w-full text-center">{d.month}</span>
                     </div>
                   );
                 })
               )}
            </div>
          </div>

          {/* Categories Chart */}
          <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 mb-8">Categories Sold</h3>
            <div className="space-y-6">
               {loading ? (
                 <p className="text-center text-slate-300">Loading categories...</p>
               ) : !data?.categorySales || data.categorySales.length === 0 ? (
                 <div className="h-48 flex items-center justify-center text-slate-300 italic text-xs">No sales data recorded</div>
               ) : (
                 data.categorySales.map((cat: any, i: number) => {
                    const maxVal = Math.max(...data.categorySales.map((item: any) => item.value), 1);
                    return (
                      <div key={i} className="space-y-2">
                         <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <span>{cat.name}</span>
                            <span className="text-slate-900">{cat.value} Sales</span>
                         </div>
                         <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(cat.value / maxVal) * 100}%` }}
                              className="h-full bg-blue-600 rounded-full" 
                            />
                         </div>
                      </div>
                    );
                 })
               )}
            </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trending Subjects */}
          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 mb-8">Trending Subjects</h3>
            <div className="space-y-4">
               {loading ? (
                  <p className="text-center text-slate-300">Loading popular subjects...</p>
               ) : !data?.popularSubjects || data.popularSubjects.length === 0 ? (
                  <p className="text-center text-slate-300 italic text-xs py-10">No subjects trending yet</p>
               ) : (
                  data.popularSubjects.map((sub: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all cursor-pointer">
                        <div className="flex items-center gap-4">
                           <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center font-black text-blue-600 shadow-sm">{i+1}</div>
                           <div>
                              <h4 className="text-sm font-black text-slate-900">{sub.subject_code || 'General/Unknown'}</h4>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Active Listings</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <div className="text-sm font-black text-slate-900">{sub.count}</div>
                           <p className="text-[10px] font-bold text-emerald-500 uppercase flex items-center gap-1 justify-end">
                              <TrendingUp size={10} /> Hot
                           </p>
                        </div>
                    </div>
                  ))
               )}
            </div>
          </div>

          {/* Reports Generation Link */}
          <div className="bg-[#1e293b] rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl flex flex-col items-center justify-center text-center space-y-4">
              <div className="h-16 w-16 bg-blue-600/20 rounded-2xl flex items-center justify-center shadow-lg border border-blue-500/30">
                <BarChart3 className="text-blue-500" size={32} />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">System Reliability</h3>
                <p className="text-xs text-slate-400 font-medium">Last 24 hours platform metrics</p>
              </div>
              <div className="w-full bg-slate-800 rounded-2xl p-4 border border-slate-700 space-y-3">
                 <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                    <span className="text-slate-500">API Latency</span>
                    <span className="text-emerald-500">14ms</span>
                 </div>
                 <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                    <span className="text-slate-500">Success Rate</span>
                    <span className="text-blue-500">99.9%</span>
                 </div>
              </div>
              <button className="w-full h-12 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-white/5 hover:bg-slate-100 transition-all">
                Generate Full Report
              </button>
          </div>
      </div>
    </div>
  );
}

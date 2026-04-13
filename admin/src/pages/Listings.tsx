import { useEffect, useState } from 'react';
import { 
  Search,
  Filter,
  ExternalLink,
  Clock,
  BookOpen,
  FileText,
  CheckCircle,
  TrendingUp,
  Tag,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { API_URL, STUDENT_APP_URL } from '../config';
import { cn } from '../lib/utils';

export default function Listings() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('pending_approval');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [programme, setProgramme] = useState('');
  const [branch, setBranch] = useState('');
  const [materialType, setMaterialType] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    fetchListings();
  }, [status, page, programme, branch, materialType]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/listings?status=${status}&search=${search}&page=${page}&programme=${programme}&branch=${branch}&material_type=${materialType}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('admin_token');
        window.location.href = '/login';
        return;
      }
      const data = await res.json();
      setListings(data.listings || []);
      setTotal(data.total || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('Approve this listing for public view?')) return;
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/listings/${id}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed');
      fetchListings();
    } catch (e) { alert('Action failed'); }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Reason for rejection:');
    if (reason === null) return;
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/listings/${id}/reject`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ reason })
      });
      if (!res.ok) throw new Error('Failed');
      fetchListings();
    } catch (e) { alert('Action failed'); }
  };

  const handleApproveAll = async () => {
    if (!confirm(`Are you sure you want to approve ALL ${listings.length} pending listings?`)) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/listings/approve-all`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Bulk approval failed');
      const data = await res.json();
      alert(data.message);
      fetchListings();
    } catch (e) {
      alert('Bulk approval failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tight">Marketplace Moderation</h1>
          <p className="text-muted-foreground font-bold text-sm mt-1 uppercase tracking-widest opacity-60 italic">Quality assurance for campus notes and materials</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-secondary/50 rounded-2xl border border-border/50 p-1.5 shadow-inner">
             {[
               { id: 'pending_approval', label: 'Pending' },
               { id: 'approved', label: 'Approved' },
               { id: 'rejected', label: 'Rejected' },
               { id: 'all', label: 'Registry' }
             ].map((s) => (
               <button 
                key={s.id}
                onClick={() => { setStatus(s.id); setPage(1); }}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  status === s.id ? "bg-primary text-white shadow-xl" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                 )}
              >
                {s.label}
              </button>
             ))}
          </div>
          {status === 'pending_approval' && listings.length > 0 && (
            <button 
              disabled={loading}
              onClick={handleApproveAll}
              className="flex items-center gap-3 px-6 py-3 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all active:scale-95 shadow-xl shadow-emerald-500/20 disabled:opacity-50"
            >
              <CheckCircle size={18} />
              Bulk Approve All
            </button>
          )}
        </div>
      </div>

      <div className="admin-card">
        <div className="p-8 border-b border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-muted/5 sticky top-0 z-10">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchListings()}
              placeholder="Filter by title, subject or author..." 
              className="w-full h-14 bg-card border border-border rounded-[1.5rem] pl-14 pr-6 text-sm font-bold text-foreground focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-muted-foreground/50"
            />
          </div>
          <div className="flex items-center gap-3">
             <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={cn(
                "h-14 px-6 border rounded-2xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]",
                isFilterOpen ? "bg-foreground text-background border-foreground shadow-xl" : "bg-card border-border text-muted-foreground hover:border-primary/50"
              )}
            >
                <Filter size={18} />
                Categories
             </button>
             <button 
              onClick={fetchListings}
              className="btn-primary h-14 flex items-center gap-2"
            >
                <Search size={18} /> Apply Filter
             </button>
          </div>
        </div>

        {isFilterOpen && (
          <div className="p-10 bg-secondary/20 border-b border-border/50 grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 ml-2 block">Format Type</label>
              <select 
                value={materialType}
                onChange={(e) => setMaterialType(e.target.value)}
                className="w-full h-12 bg-card border border-border rounded-xl px-5 text-xs font-black uppercase tracking-tight focus:ring-4 focus:ring-primary/10 outline-none transition-all"
              >
                <option value="">All Formats</option>
                <option value="Notes">Typed Notes</option>
                <option value="Previous Year">PYQs / Papers</option>
                <option value="Assignment">Solutions / Assignments</option>
                <option value="Book">E-Books</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 ml-2 block">Programme</label>
              <select 
                value={programme}
                onChange={(e) => setProgramme(e.target.value)}
                className="w-full h-12 bg-card border border-border rounded-xl px-5 text-xs font-black uppercase tracking-tight focus:ring-4 focus:ring-primary/10 outline-none transition-all"
              >
                <option value="">All Programmes</option>
                <option value="B.Tech">B.Tech</option>
                <option value="BCA">BCA</option>
                <option value="MCA">MCA</option>
                <option value="MBA">MBA</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 ml-2 block">Branch Filter</label>
              <input 
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="e.g. CSE, Mechanical..."
                className="w-full h-12 bg-card border border-border rounded-xl px-5 text-xs font-black uppercase tracking-tight focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted-foreground/30"
              />
            </div>
          </div>
        )}

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
             <thead>
                <tr className="bg-secondary/20">
                   <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50">Note Material / Asset</th>
                   <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50">Publisher</th>
                   <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50">Taxonomy</th>
                   <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50">Ingestion Date</th>
                   <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50 text-right">Moderation</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-border/30">
                {loading ? (
                   <tr>
                      <td colSpan={5} className="py-32 text-center">
                         <div className="w-14 h-14 border-[6px] border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6 shadow-xl shadow-primary/20" />
                         <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-40">Scanning marketplace assets...</p>
                      </td>
                   </tr>
                ) : listings.length === 0 ? (
                   <tr>
                      <td colSpan={5} className="py-32 text-center space-y-4">
                         <div className="h-20 w-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6 opacity-20">
                           <BookOpen size={40} />
                         </div>
                         <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-40 italic">System clear: no assets in this segment</p>
                      </td>
                   </tr>
                ) : (
                   listings.map((item, idx) => (
                     <tr 
                      key={item.id} 
                      className="hover:bg-secondary/20 transition-all group animate-fade-in"
                      style={{ animationDelay: `${idx * 20}ms` }}
                     >
                        <td className="px-8 py-6">
                           <div className="flex items-start gap-4">
                              <div className="h-16 w-16 bg-secondary rounded-2xl flex items-center justify-center shrink-0 border border-border/50 overflow-hidden relative group-hover:bg-primary/10 transition-colors">
                                 {item.images ? (
                                   <div className="w-full h-full bg-primary/5 absolute inset-0 flex items-center justify-center">
                                      <FileText className="text-primary/40" size={24} />
                                   </div>
                                 ) : (
                                   <FileText className="text-muted-foreground/30" size={24} />
                                 )}
                              </div>
                              <div className="max-w-[320px] min-w-0">
                                 <h4 className="text-base font-black text-foreground truncate leading-tight group-hover:text-primary transition-colors tracking-tight">{item.title}</h4>
                                 <div className="flex items-center gap-3 mt-1.5 overflow-hidden">
                                    <span className="text-[9px] font-black text-primary uppercase tracking-widest whitespace-nowrap bg-primary/5 px-2 py-0.5 rounded-lg border border-primary/10">
                                       {item.subject_code}
                                    </span>
                                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest whitespace-nowrap opacity-40">
                                       {item.material_type}
                                    </span>
                                 </div>
                                 <div className="flex items-center gap-3 mt-2">
                                    <div className="flex items-center gap-1.5 group/price px-2.5 py-1 bg-emerald-500/10 rounded-xl border border-emerald-500/10">
                                       <Tag size={10} className="text-emerald-500" />
                                       <span className="text-[11px] font-black text-emerald-500 tabular-nums">₹{item.price}</span>
                                    </div>
                                    {item.ai_score && (
                                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 rounded-xl border border-indigo-500/10">
                                        <TrendingUp size={10} className="text-indigo-400" />
                                        <span className="text-[11px] font-black text-indigo-400 tabular-nums">AI {item.ai_score}</span>
                                      </div>
                                    )}
                                 </div>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="space-y-1">
                               <p className="text-sm font-black text-foreground group-hover:text-primary transition-colors">{item.seller_name || 'Anonymous'}</p>
                              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">{item.seller_email?.split('@')[0] || 'Unlinked'}</p>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex flex-col gap-1.5">
                              <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase text-foreground tracking-tight">
                                 <BookOpen size={12} className="text-primary" />
                                 {item.programme || 'N/A'}
                              </span>
                              <div className="h-0.5 w-6 bg-border/50 rounded-full" />
                              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-40">{item.branch || 'General'} · Sem {item.semester || 'X'}</span>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                            <div className="flex items-center gap-2 text-muted-foreground opacity-60">
                               <Clock size={12} className="text-primary" />
                               <span className="text-[11px] font-black tabular-nums">{new Date(item.created_at).toLocaleDateString()}</span>
                            </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 -translate-x-3 group-hover:translate-x-0">
                              {item.approval_status === 'pending_approval' && (
                                <>
                                  <button 
                                    onClick={() => handleApprove(item.id)}
                                    className="h-11 px-5 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95"
                                  >
                                      Authorize
                                  </button>
                                  <button 
                                    onClick={() => handleReject(item.id)}
                                    className="h-11 px-5 bg-destructive text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-destructive/20 hover:bg-destructive transition-all active:scale-95"
                                  >
                                      Deny
                                  </button>
                                </>
                              )}
                              <a 
                                href={`${STUDENT_APP_URL}/listings/${item.id}`} 
                                target="_blank"
                                rel="noreferrer"
                                className="h-11 w-11 bg-secondary text-primary hover:bg-primary hover:text-white rounded-xl transition-all flex items-center justify-center shadow-sm active:scale-95"
                                title="Visual Inspection"
                              >
                                 <ExternalLink size={18} />
                              </a>
                           </div>
                        </td>
                     </tr>
                   ))
                )}
             </tbody>
          </table>
        </div>

        <div className="p-10 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-6 bg-secondary/10">
           <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest italic opacity-40">
              Registry segment <b className="text-foreground">{(page-1)*20+1}-{Math.min(page*20, total)}</b> of <b className="text-foreground">{total}</b> digital assets
           </p>
           <div className="flex gap-4">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="inline-flex items-center gap-3 h-12 px-8 bg-card border border-border rounded-2xl text-[10px] font-black uppercase tracking-widest text-foreground hover:border-primary hover:bg-primary/5 disabled:opacity-30 transition-all active:scale-95 shadow-xl shadow-black/5"
              >
                <ChevronLeft size={18} /> Prev
              </button>
              <button 
                disabled={page * 20 >= total}
                onClick={() => setPage(p => p + 1)}
                className="inline-flex items-center gap-3 h-12 px-8 bg-card border border-border rounded-2xl text-[10px] font-black uppercase tracking-widest text-foreground hover:border-primary hover:bg-primary/5 disabled:opacity-30 transition-all active:scale-95 shadow-xl shadow-black/5"
              >
                Next <ChevronRight size={18} />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}

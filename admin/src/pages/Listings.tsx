import { useEffect, useState } from 'react';
import { 
  Search,
  Filter,
  ExternalLink,
  Clock,
  BookOpen,
  FileText
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Listing Moderation</h1>
          <p className="text-slate-500 font-medium">Review and manage marketplace content</p>
        </div>
        <div className="flex bg-white rounded-2xl border border-slate-200 p-1 shadow-sm">
           {[
             { id: 'pending_approval', label: 'Pending' },
             { id: 'approved', label: 'Approved' },
             { id: 'rejected', label: 'Rejected' },
             { id: 'all', label: 'All' }
           ].map((s) => (
             <button 
              key={s.id}
              onClick={() => { setStatus(s.id); setPage(1); }}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                status === s.id ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:text-slate-900"
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
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-100 disabled:opacity-50"
          >
            <BookOpen size={16} />
            Approve All ({listings.length})
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchListings()}
              placeholder="Search by title, subject..." 
              className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl pl-11 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-2 ml-4">
             <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={cn(
                "h-11 px-4 border rounded-xl transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest",
                isFilterOpen ? "bg-slate-900 text-white border-slate-900" : "bg-slate-50 border-slate-100 text-slate-500 hover:text-slate-900"
              )}
            >
                <Filter size={18} />
                Filter
             </button>
             <button 
              onClick={fetchListings}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95"
            >
                Search
             </button>
          </div>
        </div>

        {isFilterOpen && (
          <div className="p-6 bg-slate-50 border-b border-slate-100 grid grid-cols-3 gap-4 animate-in slide-in-from-top-4 duration-300">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Material Type</label>
              <select 
                value={materialType}
                onChange={(e) => setMaterialType(e.target.value)}
                className="w-full h-10 bg-white border border-slate-200 rounded-xl px-4 text-xs font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              >
                <option value="">All Types</option>
                <option value="Notes">Notes</option>
                <option value="Previous Year">Previous Year</option>
                <option value="Assignment">Assignment</option>
                <option value="Book">Book</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Programme</label>
              <select 
                value={programme}
                onChange={(e) => setProgramme(e.target.value)}
                className="w-full h-10 bg-white border border-slate-200 rounded-xl px-4 text-xs font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              >
                <option value="">All Programmes</option>
                <option value="B.Tech">B.Tech</option>
                <option value="BCA">BCA</option>
                <option value="MCA">MCA</option>
                <option value="MBA">MBA</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Branch</label>
              <input 
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="e.g. CSE, ECE..."
                className="w-full h-10 bg-white border border-slate-200 rounded-xl px-4 text-xs font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              />
            </div>
          </div>
        )}

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left">
             <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                   <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Content / Material</th>
                   <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Seller / Identity</th>
                   <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Category</th>
                   <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Created</th>
                   <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Moderation</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
                {loading ? (
                   <tr>
                      <td colSpan={5} className="py-20 text-center">
                         <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scanning Marketplace...</p>
                      </td>
                   </tr>
                ) : listings.length === 0 ? (
                   <tr>
                      <td colSpan={5} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No listings found in this queue</td>
                   </tr>
                ) : (
                   listings.map((item) => (
                     <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-5">
                           <div className="flex items-start gap-3">
                              <div className="h-12 w-12 bg-slate-100 rounded-xl flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden relative">
                                 {item.images ? (
                                   <div className="w-full h-full bg-slate-300 animate-pulse" />
                                 ) : (
                                   <FileText className="text-slate-400" size={20} />
                                 )}
                              </div>
                              <div className="max-w-[240px]">
                                 <h4 className="text-sm font-black text-slate-900 truncate leading-tight group-hover:text-blue-600 transition-colors">{item.title}</h4>
                                 <p className="text-[10px] font-bold text-slate-400 mt-0.5 truncate uppercase tracking-tighter">
                                    {item.subject_code} · {item.material_type}
                                 </p>
                                 <div className="flex items-center gap-2 mt-1.5">
                                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">₹{item.price}</span>
                                    {item.ai_score && (
                                      <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">AI {item.ai_score}/10</span>
                                    )}
                                 </div>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-5">
                           <div className="space-y-1">
                               <p className="text-xs font-black text-slate-800">{item.seller_name || 'Unknown Seller'}</p>
                              <p className="text-[10px] font-medium text-slate-400 italic">{item.seller_email || 'No email'}</p>
                           </div>
                        </td>
                        <td className="px-6 py-5">
                           <div className="flex flex-col gap-1">
                              <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-slate-500 tracking-tighter">
                                 <BookOpen size={10} className="text-slate-300" />
                                 {item.programme || 'N/A'}
                              </span>
                              <span className="text-[9px] font-bold text-slate-400">{item.branch || 'N/A'} · Sem {item.semester || 0}</span>
                           </div>
                        </td>
                        <td className="px-6 py-5">
                            <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                               <Clock size={10} /> {new Date(item.created_at).toLocaleDateString()}
                            </p>
                        </td>
                        <td className="px-6 py-5 text-right">
                           <div className="flex items-center justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                              {item.approval_status === 'pending_approval' && (
                                <>
                                  <button 
                                    onClick={() => handleApprove(item.id)}
                                    className="h-9 px-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100 transition-all active:scale-95"
                                  >
                                      Approve
                                  </button>
                                  <button 
                                    onClick={() => handleReject(item.id)}
                                    className="h-9 px-3 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest border border-red-100 transition-all active:scale-95"
                                  >
                                      Reject
                                  </button>
                                </>
                              )}
                              <a 
                                href={`${STUDENT_APP_URL}/listings/${item.id}`} 
                                target="_blank"
                                rel="noreferrer"
                                className="h-9 w-9 bg-slate-100 text-slate-400 hover:bg-slate-900 hover:text-white rounded-lg transition-all flex items-center justify-center border border-slate-200"
                              >
                                 <ExternalLink size={14} />
                              </a>
                           </div>
                        </td>
                     </tr>
                   ))
                )}
             </tbody>
          </table>
        </div>

        <div className="p-6 border-t border-slate-50 flex items-center justify-between">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Showing {listings.length} items</p>
           <div className="flex gap-2">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Prev
              </button>
              <button 
                disabled={page * 20 >= total}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Next
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}

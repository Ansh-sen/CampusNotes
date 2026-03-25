import { useEffect, useState } from 'react';
import { 
  Search,
  Ban,
  Trash2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Star,
  ExternalLink,
  Mail,
  UserCheck,
  ShieldCheck,
  AlertCircle,
  FileText
} from 'lucide-react';
import { API_URL } from '../config';
import { cn } from '../lib/utils';

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [page, status]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/users?page=${page}&status=${status}&search=${search}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('admin_token');
        window.location.href = '/login';
        return;
      }
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSelectedUser(data);
    } catch (e) {
      alert('Failed to load user details');
    }
  };

  const handleBlockAction = async (userId: string, isBlocked: boolean) => {
    const action = isBlocked ? 'unblock' : 'block';
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    
    setProcessingId(userId);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/users/${userId}/${action}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Action failed');
      fetchUsers();
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, is_blocked: !isBlocked });
      }
    } catch (e) {
      alert('Action failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('CRITICAL: Delete this user and ALL their data? This cannot be undone.')) return;
    
    setProcessingId(userId);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Delete failed');
      fetchUsers();
      if (selectedUser?.id === userId) setSelectedUser(null);
    } catch (e) {
      alert('Delete failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveAllPending = async () => {
    if (!confirm('Are you sure you want to approve ALL pending student verifications?')) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/verifications/approve-all`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Bulk approval failed');
      const data = await res.json();
      alert(data.message);
      fetchUsers();
    } catch (e) {
      alert('Bulk approval failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex items-start justify-between bg-gradient-to-br from-white to-slate-50">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-blue-200 uppercase">
                  {selectedUser.full_name?.charAt(0) || '?'}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 leading-tight">{selectedUser.full_name}</h3>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">{selectedUser.email}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedUser(null)}
                className="p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-400 hover:text-slate-900"
              >
                <Trash2 size={24} className="rotate-45" />
              </button>
            </div>
            
            <div className="p-8 max-h-[60vh] overflow-y-auto no-scrollbar space-y-8">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Total Listings', value: selectedUser.stats?.total_listings, icon: <FileText size={14}/> },
                  { label: 'Total Sales', value: selectedUser.stats?.total_sales, icon: <TrendingUp size={14}/> },
                  { label: 'Reviews', value: selectedUser.stats?.total_reviews, icon: <Star size={14}/> }
                ].map((stat, i) => (
                  <div key={i} className="bg-slate-50 border border-slate-100 p-4 rounded-3xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                      {stat.icon} {stat.label}
                    </p>
                    <p className="text-xl font-black text-slate-900">{stat.value || 0}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                 <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck size={16} className="text-blue-500" /> Verification History
                 </h4>
                 <div className="space-y-2">
                    {selectedUser.verifications?.length > 0 ? selectedUser.verifications.map((v: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
                         <div>
                            <p className="text-xs font-black text-slate-800 uppercase">{v.action}</p>
                            <p className="text-[10px] font-bold text-slate-400">{new Date(v.created_at).toLocaleString()}</p>
                            {v.reason && <p className="text-[10px] text-red-500 font-medium mt-1">Reason: {v.reason}</p>}
                         </div>
                         <div className="text-right">
                            <p className="text-[9px] font-black text-slate-400 uppercase">Admin</p>
                            <p className="text-[10px] font-bold text-slate-700">{v.admin_name}</p>
                         </div>
                      </div>
                    )) : (
                      <p className="text-xs font-bold text-slate-400 italic">No verification history found</p>
                    )}
                 </div>
              </div>

              {selectedUser.id_image_url && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Student ID Photo</h4>
                  <div className="rounded-3xl border border-slate-100 overflow-hidden bg-slate-100">
                    <img src={selectedUser.id_image_url} alt="ID" className="w-full h-auto" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex gap-4">
              <button 
                onClick={() => {
                  handleBlockAction(selectedUser.id, selectedUser.is_blocked);
                }}
                disabled={processingId === selectedUser.id}
                className={cn(
                  "flex-1 h-12 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95",
                  selectedUser.is_blocked ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-red-600 text-white hover:bg-red-700"
                )}
              >
                {selectedUser.is_blocked ? 'Unblock User' : 'Block User from System'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">User Management</h1>
          <p className="text-slate-500 font-medium">Monitor and moderate registered student accounts</p>
        </div>
        <div className="flex bg-white rounded-2xl border border-slate-200 p-1 shadow-sm">
           {['all', 'verified', 'pending', 'blocked'].map((s) => (
             <button 
              key={s}
              onClick={() => { setStatus(s); setPage(1); }}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                status === s ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:text-slate-900"
               )}
            >
              {s}
            </button>
           ))}
        </div>
        {(status === 'pending' || status === 'all') && (
          <button 
            disabled={loading}
            onClick={handleApproveAllPending}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-100 disabled:opacity-50"
          >
            <ShieldCheck size={16} />
            Approve All Pending
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
              onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
              placeholder="Search users..." 
              className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl pl-11 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-2 ml-4">
             <button 
              onClick={fetchUsers}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-100"
            >
              Search
            </button>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">User / Identity</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Performance</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Verified ID</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Retrieving User Records...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No users found matching criteria</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-12 w-12 rounded-2xl flex items-center justify-center font-black text-white text-lg shadow-sm capitalize transition-all",
                          user.is_blocked ? "bg-slate-400 grayscale" : "bg-gradient-to-br from-blue-500 to-indigo-600 group-hover:scale-110"
                        )}>
                          {user.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                             <h4 
                              onClick={() => fetchUserDetails(user.id)}
                              className="text-sm font-black text-slate-900 cursor-pointer hover:text-blue-600 transition-colors"
                            >
                               {user.name}
                            </h4>
                             {user.is_blocked && <Ban size={12} className="text-red-500" />}
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                             <Mail size={10} /> {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                        user.verification_status === 'verified' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                        user.verification_status === 'pending' ? "bg-amber-50 text-amber-600 border-amber-100" :
                        "bg-slate-100 text-slate-500 border-slate-200"
                      )}>
                        {user.verification_status === 'verified' ? <ShieldCheck size={10} /> : <AlertCircle size={10} />}
                        {user.verification_status}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="space-y-0.5">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                            <TrendingUp size={10} /> Sales
                          </p>
                          <p className="text-xs font-black text-slate-900">{user.total_sales || 0}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                            <Star size={10} /> Rating
                          </p>
                          <p className="text-xs font-black text-slate-900">{user.avg_rating || '0.0'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       {user.enrollment_number ? (
                         <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-600 font-mono tracking-tighter bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200/50">
                               {user.enrollment_number}
                            </span>
                            <button 
                              onClick={() => {
                                if (user.id_image_url) window.open(user.id_image_url, '_blank');
                                else alert('No ID image available');
                              }}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            >
                               <ExternalLink size={14} />
                            </button>
                         </div>
                       ) : (
                         <span className="text-[10px] font-bold text-slate-300 uppercase italic tracking-widest">Not Submitted</span>
                       )}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-2 opacity-20 group-hover:opacity-100 transition-all duration-300">
                          <button 
                            onClick={() => fetchUserDetails(user.id)}
                            className="h-9 w-9 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all flex items-center justify-center border border-blue-100 shadow-sm"
                          >
                             <Search size={14} />
                          </button>
                          <button 
                           onClick={() => handleBlockAction(user.id, user.is_blocked)}
                           disabled={processingId === user.id}
                           className={cn(
                             "h-9 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border shadow-sm",
                             user.is_blocked ? "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white" : "bg-red-50 text-red-600 border-red-100 hover:bg-red-500 hover:text-white"
                           )}
                         >
                             {user.is_blocked ? <UserCheck size={12} /> : <Ban size={12} />}
                             {user.is_blocked ? 'Unblock' : 'Block'}
                          </button>
                          <button 
                           onClick={() => handleDeleteUser(user.id)}
                           disabled={processingId === user.id}
                           className="h-9 w-9 bg-slate-50 text-slate-400 hover:bg-red-600 hover:text-white rounded-xl transition-all flex items-center justify-center border border-slate-200 shadow-sm"
                         >
                             <Trash2 size={14} />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-8 border-t border-slate-50 flex items-center justify-between bg-slate-50/20">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
              Showing <b className="text-slate-900">{(page-1)*20+1}-{Math.min(page*20, total)}</b> of <b className="text-slate-900">{total}</b> campus members
           </p>
           <div className="flex gap-3">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:border-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white transition-all active:scale-95 shadow-sm"
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <button 
                disabled={page * 20 >= total}
                onClick={() => setPage(p => p + 1)}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:border-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white transition-all active:scale-95 shadow-sm"
              >
                Next <ChevronRight size={16} />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}

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
  FileText,
  X
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
      
      // Optimistic UI update: Remove deleted user from local state immediately
      setUsers(prev => prev.filter(u => u.id !== userId));
      
      // Refresh full list from server
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
    <div className="space-y-10 animate-fade-in">
      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-xl animate-fade-in">
          <div className="admin-card w-full max-w-3xl overflow-hidden shadow-2xl scale-in-center">
            <div className="p-10 border-b border-border/50 flex items-start justify-between bg-gradient-to-br from-card to-secondary/30">
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 bg-primary rounded-[2rem] flex items-center justify-center text-3xl font-black text-white shadow-2xl shadow-primary/20 uppercase">
                  {selectedUser.full_name?.charAt(0) || '?'}
                </div>
                <div>
                  <h3 className="text-3xl font-black text-foreground tracking-tight leading-tight">{selectedUser.full_name}</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <p className="text-primary font-black uppercase tracking-[0.2em] text-[10px]">{selectedUser.email}</p>
                    <div className={cn(
                      "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                      selectedUser.is_blocked ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-500"
                    )}>
                      {selectedUser.is_blocked ? 'Banned' : 'Active Member'}
                    </div>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedUser(null)}
                className="h-12 w-12 flex items-center justify-center bg-secondary hover:bg-secondary/80 rounded-2xl transition-all text-foreground active:scale-95"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-10 max-h-[60vh] overflow-y-auto no-scrollbar space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Total Listings', value: selectedUser.stats?.total_listings, icon: <FileText size={18}/>, color: 'text-blue-500' },
                  { label: 'Total Sales', value: selectedUser.stats?.total_sales, icon: <TrendingUp size={18}/>, color: 'text-emerald-500' },
                  { label: 'Avg Rating', value: selectedUser.stats?.total_reviews || '0.0', icon: <Star size={18}/>, color: 'text-amber-500' }
                ].map((stat, i) => (
                  <div key={i} className="bg-secondary/50 border border-border/50 p-6 rounded-[2rem] group hover:border-primary/30 transition-all">
                    <p className={cn("text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2 opacity-50", stat.color)}>
                      {stat.icon} {stat.label}
                    </p>
                    <p className="text-3xl font-black text-foreground tabular-nums">{stat.value || 0}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-6">
                 <h4 className="text-[10px] font-black text-foreground uppercase tracking-[0.3em] flex items-center gap-2 opacity-50">
                    <ShieldCheck size={16} className="text-primary" /> Incident History
                 </h4>
                 <div className="space-y-3">
                    {selectedUser.verifications?.length > 0 ? selectedUser.verifications.map((v: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-6 bg-secondary/30 border border-border/30 rounded-3xl group hover:bg-secondary/50 transition-all">
                         <div className="space-y-1">
                            <p className="text-xs font-black text-foreground uppercase tracking-tight">{v.action}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">{new Date(v.created_at).toLocaleString()}</p>
                            {v.reason && <p className="text-xs text-destructive font-black mt-2">Reason: {v.reason}</p>}
                         </div>
                         <div className="text-right">
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-40 mb-1">Moderator</p>
                            <div className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-black uppercase">
                              {v.admin_name}
                            </div>
                         </div>
                      </div>
                    )) : (
                      <div className="py-12 text-center border-2 border-dashed border-border/50 rounded-[2rem]">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-30 italic">No historical records</p>
                      </div>
                    )}
                 </div>
              </div>

              {selectedUser.id_image_url && (
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-foreground uppercase tracking-[0.3em] opacity-50">Identity Verification</h4>
                  <div className="rounded-[2.5rem] border border-border/50 overflow-hidden bg-secondary/50 group relative">
                    <img src={selectedUser.id_image_url} alt="ID" className="w-full h-auto transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                       <button 
                        onClick={() => window.open(selectedUser.id_image_url, '_blank')}
                        className="bg-primary text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-2"
                       >
                         <ExternalLink size={14} /> Open Original
                       </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-10 bg-secondary/20 border-t border-border/50 flex gap-4">
              <button 
                onClick={() => {
                  handleBlockAction(selectedUser.id, selectedUser.is_blocked);
                }}
                disabled={processingId === selectedUser.id}
                className={cn(
                  "flex-1 h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95",
                  selectedUser.is_blocked ? "bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-500/20" : "bg-destructive text-white hover:bg-destructive shadow-destructive/20"
                )}
              >
                {selectedUser.is_blocked ? 'Reinstate Member access' : 'Restrict Profile Access'}
              </button>
              <button 
                onClick={() => handleDeleteUser(selectedUser.id)}
                className="h-14 w-14 bg-secondary text-destructive rounded-2xl flex items-center justify-center hover:bg-destructive hover:text-white transition-all active:scale-95"
              >
                <Trash2 size={24} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tight">Personnel Directory</h1>
          <p className="text-muted-foreground font-bold text-sm mt-1 uppercase tracking-widest opacity-60 italic">Platform user and identity management</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-secondary/50 rounded-2xl border border-border/50 p-1.5 shadow-inner">
             {['all', 'verified', 'pending', 'blocked'].map((s) => (
               <button 
                key={s}
                onClick={() => { setStatus(s); setPage(1); }}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  status === s ? "bg-primary text-white shadow-xl" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
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
              className="flex items-center gap-3 px-6 py-3 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all active:scale-95 shadow-xl shadow-emerald-500/20 disabled:opacity-50"
            >
              <ShieldCheck size={18} />
              Bulk Approve
            </button>
          )}
        </div>
      </div>

      <div className="admin-card">
        <div className="p-8 border-b border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-muted/5">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
              placeholder="Filter by name, email or ID..." 
              className="w-full h-14 bg-card border border-border rounded-[1.5rem] pl-14 pr-6 text-sm font-bold text-foreground focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-muted-foreground/50"
            />
          </div>
          <div className="flex items-center gap-3">
             <button 
              onClick={fetchUsers}
              className="btn-primary flex items-center gap-2 h-14"
            >
              <Search size={18} /> Apply Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/20">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50">Student Profile</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50">Status</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50">Performance</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50">Credential</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-32 text-center">
                    <div className="w-12 h-12 border-[6px] border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6 shadow-xl shadow-primary/20" />
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-40">Syncing personnel records...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-32 text-center">
                    <div className="h-20 w-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6 opacity-20">
                      <Users />
                    </div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-40 italic">System clear: no matching profiles found</p>
                  </td>
                </tr>
              ) : (
                users.map((user, idx) => (
                  <tr 
                    key={user.id} 
                    className="hover:bg-secondary/20 transition-all group animate-fade-in"
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "h-14 w-14 rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3",
                          user.is_blocked ? "bg-muted text-muted-foreground/50 grayscale" : "bg-gradient-to-br from-primary to-violet-500 shadow-primary/20"
                        )}>
                          {user.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                             <h4 
                               onClick={() => fetchUserDetails(user.id)}
                               className="text-base font-black text-foreground cursor-pointer hover:text-primary transition-colors tracking-tight"
                             >
                                {user.name}
                             </h4>
                             {user.is_blocked && (
                               <div className="p-1 bg-destructive/10 text-destructive rounded-lg">
                                 <Ban size={12} strokeWidth={3} />
                               </div>
                             )}
                          </div>
                          <p className="text-[11px] font-black text-muted-foreground flex items-center gap-1.5 mt-1 opacity-60">
                             <Mail size={12} className="text-primary" /> {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className={cn(
                        "inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-inner",
                        user.verification_status === 'verified' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                        user.verification_status === 'pending' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                        "bg-muted text-muted-foreground border-border"
                      )}>
                        {user.verification_status === 'verified' ? <ShieldCheck size={12} /> : <AlertCircle size={12} />}
                        {user.verification_status}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-6">
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 opacity-40">
                            <TrendingUp size={12} /> Sales
                          </p>
                          <p className="text-sm font-black text-foreground tabular-nums">{user.total_sales || 0}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 opacity-40">
                            <Star size={12} className="text-amber-500" /> Score
                          </p>
                          <p className="text-sm font-black text-foreground tabular-nums">{user.avg_rating || '0.0'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       {user.enrollment_number ? (
                         <div className="flex items-center gap-3">
                            <span className="text-[11px] font-black text-foreground font-mono tracking-tight bg-secondary/50 px-4 py-2 rounded-xl border border-border/50 shadow-inner">
                               {user.enrollment_number}
                            </span>
                            <button 
                              onClick={() => {
                                if (user.id_image_url) window.open(user.id_image_url, '_blank');
                                else alert('No ID image available');
                              }}
                              className="h-10 w-10 flex items-center justify-center bg-secondary text-primary hover:bg-primary hover:text-white rounded-xl transition-all shadow-sm active:scale-95"
                            >
                               <ExternalLink size={16} />
                            </button>
                         </div>
                       ) : (
                         <span className="text-[10px] font-black text-muted-foreground uppercase italic tracking-widest opacity-20">No Credential</span>
                       )}
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 -translate-x-2 group-hover:translate-x-0">
                          <button 
                            onClick={() => fetchUserDetails(user.id)}
                            className="h-11 w-11 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl transition-all flex items-center justify-center shadow-sm"
                            title="Detailed Inspection"
                          >
                             <Search size={16} />
                          </button>
                          <button 
                           onClick={() => handleBlockAction(user.id, user.is_blocked)}
                           disabled={processingId === user.id}
                           className={cn(
                             "h-11 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl active:scale-95",
                             user.is_blocked ? "bg-emerald-500 text-white hover:shadow-emerald-500/20" : "bg-destructive text-white hover:shadow-destructive/20"
                           )}
                         >
                             {user.is_blocked ? <UserCheck size={14} /> : <Ban size={14} />}
                             {user.is_blocked ? 'Reinstate' : 'Suspend'}
                          </button>
                          <button 
                           onClick={() => handleDeleteUser(user.id)}
                           disabled={processingId === user.id}
                           className="h-11 w-11 bg-secondary text-destructive hover:bg-destructive hover:text-white rounded-xl transition-all flex items-center justify-center shadow-sm"
                           title="Purge Account"
                         >
                             <Trash2 size={16} />
                          </button>
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
              Registry segment <b className="text-foreground">{(page-1)*20+1}-{Math.min(page*20, total)}</b> of <b className="text-foreground">{total}</b> active profiles
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

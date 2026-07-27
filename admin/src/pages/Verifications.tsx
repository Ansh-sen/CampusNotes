import { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Search,
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { API_URL } from '../config';
import { cn } from '../lib/utils';

export default function Verifications() {
  const [pending, setPending] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [search, setSearch] = useState('');
  const [programme, setProgramme] = useState('');
  const [branch, setBranch] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    if (activeTab === 'pending') fetchPending();
    else fetchHistory();
    setSelectedUser(null);
  }, [activeTab, programme, branch]);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/verifications/pending?search=${search}&programme=${programme}&branch=${branch}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('admin_token');
        window.location.href = '/login';
        return;
      }
      const data = await res.json();
      setPending(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setPending([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/verifications/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    if (!confirm('Approve this student verification?')) return;
    setProcessing(true);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/verifications/${userId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to approve');
      fetchPending();
      setSelectedUser(null);
    } catch (e) {
      alert('Approval failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason) return alert('Please provide a reason');
    setProcessing(true);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/verifications/${selectedUser.id}/reject`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ reason: rejectionReason })
      });
      if (!res.ok) throw new Error('Failed to reject');
      fetchPending();
      setSelectedUser(null);
      setIsRejectModalOpen(false);
      setRejectionReason('');
    } catch (e) {
      alert('Rejection failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleApproveAll = async () => {
    if (!confirm(`Are you sure you want to approve ALL ${pending.length} pending verifications?`)) return;
    setProcessing(true);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/verifications/approve-all`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Bulk approval failed');
      const data = await res.json();
      alert(data.message);
      fetchPending();
    } catch (e) {
      alert('Bulk approval failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tight">Identity Verification</h1>
          <p className="text-muted-foreground font-bold text-sm mt-1 uppercase tracking-widest opacity-60 italic">Reviewing pending enrollment credentials</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-secondary/50 rounded-2xl border border-border/50 p-1.5 shadow-inner">
             <button 
              onClick={() => setActiveTab('pending')}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === 'pending' ? "bg-primary text-white shadow-xl" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
             >
              Pending ({pending.length})
             </button>
             <button 
              onClick={() => setActiveTab('history')}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === 'history' ? "bg-primary text-white shadow-xl" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
             >
              History
             </button>
          </div>
          {activeTab === 'pending' && pending.length > 0 && (
            <button 
              disabled={processing}
              onClick={handleApproveAll}
              className="flex items-center gap-3 px-6 py-3 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all active:scale-95 shadow-xl shadow-emerald-500/20 disabled:opacity-50"
            >
              <ShieldCheck size={18} />
              Bulk Approve All
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Table/List View */}
        <div className="lg:col-span-2 space-y-6">
          <div className="admin-card">
            <div className="p-8 border-b border-border/50 flex items-center justify-between bg-muted/5 sticky top-0 z-10">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors" />
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchPending()}
                  placeholder="Filter name, email, credentials..." 
                  className="w-full h-12 bg-card border border-border rounded-xl pl-12 pr-4 text-sm font-bold text-foreground focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted-foreground/50"
                />
              </div>
              <div className="flex items-center gap-3 ml-4">
                <button 
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={cn(
                    "h-12 px-5 border rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest",
                    isFilterOpen ? "bg-foreground text-background border-foreground shadow-xl" : "bg-card border-border text-muted-foreground hover:border-primary/50"
                  )}
                >
                  <Filter size={16} />
                  Programmes
                </button>
                <button 
                  onClick={fetchPending}
                  className="btn-primary h-12 flex items-center gap-2"
                >
                  <Search size={16} /> Search
                </button>
              </div>
            </div>

            {isFilterOpen && (
              <div className="p-8 bg-secondary/20 border-b border-border/50 grid grid-cols-2 gap-6 animate-fade-in">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 ml-1 block">Degree Course</label>
                  <select 
                    value={programme}
                    onChange={(e) => setProgramme(e.target.value)}
                    className="w-full h-11 bg-card border border-border rounded-xl px-4 text-xs font-black uppercase tracking-tight focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                  >
                    <option value="">All Streams</option>
                    <option value="B.Tech">B.Tech</option>
                    <option value="M.Tech">M.Tech</option>
                    <option value="BCA">BCA</option>
                    <option value="MCA">MCA</option>
                    <option value="MBA">MBA</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 ml-1 block">Specialization / Branch</label>
                  <input 
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="e.g. CSE, ECE..."
                    className="w-full h-11 bg-card border border-border rounded-xl px-4 text-xs font-black uppercase tracking-tight focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted-foreground/30"
                  />
                </div>
              </div>
            )}

            <div className="overflow-x-auto no-scrollbar">
              {loading ? (
                <div className="p-32 text-center space-y-6">
                   <div className="w-14 h-14 border-[6px] border-primary border-t-transparent rounded-full animate-spin mx-auto shadow-xl shadow-primary/20" />
                   <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-40">Polling verification queue...</p>
                </div>
              ) : (activeTab === 'pending' ? pending : history).length === 0 ? (
                <div className="p-32 text-center space-y-8">
                   <div className="h-24 w-24 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                      <CheckCircle2 size={48} />
                   </div>
                   <div className="space-y-2">
                     <h3 className="text-2xl font-black text-foreground tracking-tight">
                       {activeTab === 'pending' ? "Queue Restored" : "History Purged"}
                     </h3>
                     <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest opacity-40 italic">
                       {activeTab === 'pending' 
                          ? "No new applications requiring validation"
                          : "Verification log records are currently empty"}
                     </p>
                   </div>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-secondary/20">
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50">Student Profile</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50">Enrollment</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50">
                        {activeTab === 'pending' ? 'Timestamp' : 'Resolution'}
                      </th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {(activeTab === 'pending' ? pending : history).map((item, idx) => (
                      <tr 
                        key={item.id} 
                        className={cn(
                          "hover:bg-secondary/30 transition-all cursor-pointer group animate-fade-in",
                          selectedUser?.id === (activeTab === 'pending' ? item.id : item.user_id) && "bg-primary/5"
                        )}
                        style={{ animationDelay: `${idx * 30}ms` }}
                        onClick={() => setSelectedUser(activeTab === 'pending' ? item : { 
                          ...item, 
                          id: item.user_id, 
                          name: item.user_name, 
                          email: item.user_email 
                        })}
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-secondary rounded-2xl flex items-center justify-center font-black text-primary uppercase shadow-inner group-hover:bg-primary group-hover:text-white transition-all duration-300">
                              {(activeTab === 'pending' ? item.name : item.user_name).charAt(0)}
                            </div>
                            <div>
                              <h4 className="text-base font-black text-foreground truncate max-w-[180px] tracking-tight group-hover:text-primary transition-colors">
                                {activeTab === 'pending' ? item.name : item.user_name}
                              </h4>
                              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-50">
                                {activeTab === 'pending' ? item.email : item.user_email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-xs font-black text-foreground font-mono tracking-tight bg-secondary/50 px-3 py-1.5 rounded-xl border border-border/50 shadow-inner">
                             {item.enrollment_number}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                           {activeTab === 'pending' ? (
                             <div className="flex items-center gap-2">
                               <Clock size={12} className="text-primary" />
                               <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                                  {new Date(item.created_at).toLocaleDateString()}
                               </span>
                             </div>
                           ) : (
                             <div className="flex flex-col">
                               <span className={cn(
                                 "text-[10px] font-black uppercase tracking-[0.2em] mb-1",
                                 item.action === 'approved' ? "text-emerald-500" : "text-destructive"
                               )}>
                                  {item.action}
                               </span>
                               <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-40">
                                  {new Date(item.created_at).toLocaleDateString()}
                               </span>
                             </div>
                           )}
                        </td>
                        <td className="px-8 py-6 text-right">
                           <button className="h-10 w-10 flex items-center justify-center bg-secondary text-primary rounded-xl hover:bg-primary hover:text-white transition-all active:scale-95 shadow-sm">
                              <Eye size={18} />
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            <div className="p-10 border-t border-border/50 flex items-center justify-between text-[11px] font-black text-muted-foreground uppercase tracking-widest bg-secondary/10">
                <span className="opacity-40 italic">Queue intensity: <b className="text-foreground not-italic">{(activeTab === 'pending' ? pending : history).length}</b> applications</span>
                <div className="flex gap-4">
                   <button className="h-11 w-11 flex items-center justify-center border border-border rounded-xl bg-card hover:border-primary hover:bg-primary/5 transition-all active:scale-95 shadow-xl shadow-black/5"><ChevronLeft size={20} /></button>
                   <button className="h-11 w-11 flex items-center justify-center border border-border rounded-xl bg-card hover:border-primary hover:bg-primary/5 transition-all active:scale-95 shadow-xl shadow-black/5"><ChevronRight size={20} /></button>
                </div>
            </div>
          </div>
        </div>

        {/* Selected User Detail / Preview */}
        <div className="lg:col-span-1">
          <div className="admin-card bg-slate-900 border-none rounded-[3rem] p-10 text-white sticky top-28 shadow-3xl overflow-hidden h-[calc(100vh-160px)] flex flex-col group">
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none transition-transform duration-1000 group-hover:scale-125" />
            
            {!selectedUser ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 animate-fade-in">
                <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center text-slate-700 border border-white/5 shadow-inner">
                  <ShieldCheck size={48} />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-black tracking-tight">Active Inspector</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-loose px-6 opacity-60 italic">Select a record from the personnel queue to initiate credential validation.</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col animate-fade-in h-full overflow-y-auto pr-1 no-scrollbar">
                <div className="flex items-center gap-6 mb-10">
                   <div className="h-16 w-16 bg-primary rounded-[1.5rem] flex items-center justify-center font-black text-3xl shadow-2xl shadow-primary/30 uppercase">
                      {selectedUser.name.charAt(0)}
                   </div>
                   <div className="min-w-0">
                      <h3 className="text-2xl font-black truncate tracking-tighter leading-tight drop-shadow-md">{selectedUser.name}</h3>
                      <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-1">{selectedUser.programme} · {selectedUser.branch}</p>
                   </div>
                </div>

                <div className="flex-1 space-y-10">
                  <div className="bg-white/5 rounded-[2rem] p-8 border border-white/10 space-y-8 shadow-inner">
                     <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-slate-500 tracking-[0.3em]">Institutional ID</label>
                        <p className="text-lg font-black text-white font-mono tracking-tight tabular-nums">{selectedUser.enrollment_number}</p>
                     </div>
                     <div className="h-[1px] bg-white/5" />
                     <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-slate-500 tracking-[0.3em]">Academic Context</label>
                        <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Semester {selectedUser.semester} • {selectedUser.programme}</p>
                     </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                      <label className="text-[9px] font-black uppercase text-slate-500 tracking-[0.3em]">Document Evidence</label>
                      <button 
                        onClick={() => window.open(selectedUser.id_image_url, '_blank')}
                        className="text-[9px] font-black text-primary uppercase tracking-widest hover:text-primary/80 flex items-center gap-1 transition-colors"
                      >
                         <ExternalLink size={10} /> Full Resolution
                      </button>
                    </div>
                    <div className="aspect-[4/3] bg-black rounded-[2rem] overflow-hidden border border-white/10 group cursor-zoom-in relative shadow-2xl">
                       {selectedUser.id_image_url ? (
                         <img 
                          src={selectedUser.id_image_url} 
                          alt="ID Preview" 
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-80 group-hover:opacity-100" 
                        />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-slate-800 font-black uppercase tracking-widest text-[10px]">No Evidence Provided</div>
                       )}
                       <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye className="text-white w-10 h-10 drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]" />
                       </div>
                    </div>
                  </div>
                </div>

                {activeTab === 'pending' ? (
                  <div className="flex gap-4 mt-12 pt-10 border-t border-white/5">
                    <button 
                      disabled={processing}
                      onClick={() => handleApprove(selectedUser.id)}
                      className="flex-1 h-14 bg-primary hover:bg-primary/90 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <CheckCircle2 size={18} />
                        Validate
                    </button>
                    <button 
                      disabled={processing}
                      onClick={() => { setIsRejectModalOpen(true); }}
                      className="flex-1 h-14 bg-white/5 hover:bg-destructive/20 hover:text-destructive border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 group"
                    >
                        <XCircle size={18} className="group-hover:rotate-90 transition-transform" />
                        Revoke
                    </button>
                  </div>
                ) : (
                  <div className="mt-12 space-y-6 pt-10 border-t border-white/5">
                     <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 shadow-inner">
                        <p className="text-[9px] font-black uppercase text-slate-500 tracking-[0.3em] mb-6">Decision Audit</p>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                             <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Resolution</span>
                             <span className={cn(
                               "text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg",
                               selectedUser.action === 'approved' ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
                             )}>{selectedUser.action}</span>
                          </div>
                          <div className="flex items-center justify-between">
                             <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">By Moderator</span>
                             <span className="text-xs font-black text-white">{selectedUser.admin_name}</span>
                          </div>
                          {selectedUser.reason && (
                            <div className="mt-6 pt-6 border-t border-white/5">
                               <p className="text-[9px] font-black uppercase text-slate-500 tracking-[0.3em] mb-3">Rejection Log</p>
                               <p className="text-[11px] text-slate-300 font-bold italic leading-relaxed">"{selectedUser.reason}"</p>
                            </div>
                          )}
                        </div>
                     </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reject Reason Modal */}
      {isRejectModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-xl animate-fade-in">
          <div className="admin-card w-full max-w-lg p-12 shadow-3xl relative overflow-hidden scale-in-center">
             <div className="absolute top-0 right-0 w-48 h-48 bg-destructive/5 rounded-full blur-[80px] -mr-24 -mt-24 pointer-events-none" />
             
             <div className="flex flex-col items-center text-center space-y-8 relative z-10">
                <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-3xl flex items-center justify-center shadow-inner">
                   <AlertCircle size={40} />
                </div>
                <div className="space-y-3">
                   <h3 className="text-3xl font-black text-foreground tracking-tight">Revoke Credential</h3>
                   <p className="text-xs text-muted-foreground font-black uppercase tracking-widest opacity-60 leading-relaxed px-6 italic">Document the specific reason for denial. This notification will be synchronized to the student's profile.</p>
                </div>
                
                <div className="w-full space-y-4 text-left">
                   <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-3 block">Rejection Intelligence</label>
                   <textarea 
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Describe valid reasons: blurry image, incorrect enrollment ID, expired document..."
                    className="w-full h-40 bg-secondary/30 border border-border rounded-[2rem] p-6 text-sm font-bold placeholder:text-muted-foreground/30 focus:bg-card focus:border-destructive focus:ring-4 focus:ring-destructive/10 outline-none transition-all shadow-inner resize-none"
                   />
                </div>

                <div className="flex w-full gap-4 pt-4">
                  <button 
                    onClick={() => setIsRejectModalOpen(false)}
                    className="flex-1 h-14 bg-secondary text-muted-foreground rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-foreground transition-all active:scale-95"
                  >
                    Abort
                  </button>
                  <button 
                    onClick={handleReject}
                    disabled={processing || !rejectionReason}
                    className="flex-1 h-14 bg-destructive text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-destructive/30 hover:bg-destructive transition-all active:scale-95 disabled:opacity-50"
                  >
                    Confirm Revocation
                  </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

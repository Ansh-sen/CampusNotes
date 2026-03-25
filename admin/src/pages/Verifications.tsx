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
  ShieldCheck
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
      setProcessing(true); // Should be false but we re-fetch anyway
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Student Verifications</h1>
          <p className="text-slate-500 font-medium">Review and validate student identity submissions</p>
        </div>
        <div className="flex bg-white rounded-2xl border border-slate-200 p-1 shadow-sm">
           <button 
            onClick={() => setActiveTab('pending')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              activeTab === 'pending' ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"
            )}
           >
            Pending ({pending.length})
           </button>
           <button 
            onClick={() => setActiveTab('history')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              activeTab === 'history' ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"
            )}
           >
            History
           </button>
        </div>
        {activeTab === 'pending' && pending.length > 0 && (
          <button 
            disabled={processing}
            onClick={handleApproveAll}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-100 disabled:opacity-50"
          >
            <ShieldCheck size={16} />
            Approve All ({pending.length})
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Table/List View */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchPending()}
                  placeholder="Search by name, email, or enrollment..." 
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
                  onClick={fetchPending}
                  className="h-11 px-6 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-100"
                >
                  Apply
                </button>
              </div>
            </div>

            {isFilterOpen && (
              <div className="p-6 bg-slate-50 border-b border-slate-100 grid grid-cols-2 gap-4 animate-in slide-in-from-top-4 duration-300">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Programme</label>
                  <select 
                    value={programme}
                    onChange={(e) => setProgramme(e.target.value)}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-4 text-xs font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  >
                    <option value="">All Programmes</option>
                    <option value="B.Tech">B.Tech</option>
                    <option value="M.Tech">M.Tech</option>
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

            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-12 text-center space-y-4">
                   <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                   <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading applications...</p>
                </div>
              ) : (activeTab === 'pending' ? pending : history).length === 0 ? (
                <div className="p-20 text-center space-y-4">
                   <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 size={40} />
                   </div>
                   <h3 className="text-xl font-black text-slate-900">
                     {activeTab === 'pending' ? "All caught up!" : "No history found"}
                   </h3>
                   <p className="text-sm text-slate-500 font-medium">
                     {activeTab === 'pending' 
                        ? "There are no pending student verifications at the moment."
                        : "Verification activity logs will appear here."}
                   </p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Student</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Enrollment</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {activeTab === 'pending' ? 'Submitted' : 'Status / Date'}
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(activeTab === 'pending' ? pending : history).map((item) => (
                      <tr 
                        key={item.id} 
                        className={cn(
                          "hover:bg-blue-50/30 transition-colors cursor-pointer group",
                          selectedUser?.id === (activeTab === 'pending' ? item.id : item.user_id) && "bg-blue-50/50"
                        )}
                        onClick={() => setSelectedUser(activeTab === 'pending' ? item : { 
                          ...item, 
                          id: item.user_id, 
                          name: item.user_name, 
                          email: item.user_email 
                        })}
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400 uppercase">
                              {(activeTab === 'pending' ? item.name : item.user_name).charAt(0)}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-900 truncate max-w-[150px]">
                                {activeTab === 'pending' ? item.name : item.user_name}
                              </h4>
                              <p className="text-[10px] font-medium text-slate-500">
                                {activeTab === 'pending' ? item.email : item.user_email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-xs font-black text-slate-700 font-mono tracking-tighter bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                             {item.enrollment_number}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                           {activeTab === 'pending' ? (
                             <span className="text-xs font-bold text-slate-500">
                                {new Date(item.created_at).toLocaleDateString()}
                             </span>
                           ) : (
                             <div className="flex flex-col">
                               <span className={cn(
                                 "text-[10px] font-black uppercase tracking-widest mb-0.5",
                                 item.action === 'approved' ? "text-emerald-500" : "text-red-500"
                               )}>
                                  {item.action}
                               </span>
                               <span className="text-[10px] font-bold text-slate-400">
                                  {new Date(item.created_at).toLocaleDateString()}
                               </span>
                             </div>
                           )}
                        </td>
                        <td className="px-6 py-5 text-right">
                           <button className="p-2 hover:bg-white rounded-lg transition-all text-slate-400 hover:text-blue-600">
                              <Eye size={18} />
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            <div className="p-6 border-t border-slate-50 flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Showing {pending.length} results</span>
                <div className="flex gap-2">
                   <button className="p-2 border border-slate-100 rounded-lg hover:bg-slate-50 transition-all"><ChevronLeft size={16} /></button>
                   <button className="p-2 border border-slate-100 rounded-lg hover:bg-slate-50 transition-all"><ChevronRight size={16} /></button>
                </div>
            </div>
          </div>
        </div>

        {/* Selected User Detail / Preview */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white sticky top-8 shadow-2xl relative overflow-hidden h-[calc(100vh-160px)] flex flex-col">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
            
            {!selectedUser ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center text-slate-600 border border-slate-700">
                  <ShieldCheck size={40} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black tracking-tight">Select Application</h3>
                  <p className="text-xs text-slate-500 font-medium">Pick a student from the list to review their details and ID document.</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col animate-in slide-in-from-right-4 duration-500 h-full overflow-y-auto pr-1 no-scrollbar">
                <div className="flex items-center gap-4 mb-8">
                   <div className="h-14 w-14 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg shadow-blue-600/20 uppercase">
                      {selectedUser.name.charAt(0)}
                   </div>
                   <div>
                      <h3 className="text-xl font-black truncate max-w-[180px] tracking-tight leading-tight">{selectedUser.name}</h3>
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{selectedUser.programme} · {selectedUser.branch}</p>
                   </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 space-y-4">
                     <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Enrollment ID</label>
                        <p className="text-sm font-black text-white font-mono tracking-tight">{selectedUser.enrollment_number}</p>
                     </div>
                     <div className="h-[1px] bg-slate-700/50" />
                     <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Departmental Data</label>
                        <p className="text-xs font-bold text-slate-300">Semester {selectedUser.semester} · {selectedUser.programme}</p>
                     </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Student ID Photo</label>
                      <button className="text-[9px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 flex items-center gap-1">
                         <ExternalLink size={10} /> Full View
                      </button>
                    </div>
                    <div className="aspect-[4/3] bg-slate-800 rounded-3xl overflow-hidden border border-slate-700 group cursor-zoom-in relative">
                       {selectedUser.id_image_url ? (
                         <img 
                          src={selectedUser.id_image_url} 
                          alt="ID Preview" 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-slate-700">No Image provided</div>
                       )}
                       <div className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye className="text-white w-8 h-8 drop-shadow-lg" />
                       </div>
                    </div>
                  </div>
                </div>

                {activeTab === 'pending' ? (
                  <div className="flex gap-3 mt-auto pt-10">
                    <button 
                      disabled={processing}
                      onClick={() => handleApprove(selectedUser.id)}
                      className="flex-1 h-12 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <CheckCircle2 size={16} />
                        Approve
                    </button>
                    <button 
                      disabled={processing}
                      onClick={() => { setIsRejectModalOpen(true); }}
                      className="flex-1 h-12 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 border border-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <XCircle size={16} />
                        Reject
                    </button>
                  </div>
                ) : (
                  <div className="mt-8 space-y-4">
                     <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                        <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-2">History Info</p>
                        <div className="flex items-center justify-between mb-2">
                           <span className="text-xs font-bold text-slate-300">Action</span>
                           <span className={cn(
                             "text-xs font-black uppercase",
                             selectedUser.action === 'approved' ? "text-emerald-500" : "text-red-500"
                           )}>{selectedUser.action}</span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                           <span className="text-xs font-bold text-slate-300">Admin</span>
                           <span className="text-xs font-black text-white">{selectedUser.admin_name}</span>
                        </div>
                        {selectedUser.reason && (
                          <div className="mt-4 pt-4 border-t border-slate-700/50">
                             <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1">Reason</p>
                             <p className="text-xs text-slate-300 italic">"{selectedUser.reason}"</p>
                          </div>
                        )}
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
             <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full blur-3xl -mr-16 -mt-16" />
             
             <div className="flex flex-col items-center text-center space-y-6 relative z-10">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
                   <AlertCircle size={32} />
                </div>
                <div className="space-y-1">
                   <h3 className="text-2xl font-black text-slate-900 tracking-tight">Reject Application</h3>
                   <p className="text-sm text-slate-500 font-medium px-4">Provide a reason for the student. This will be shown to them in their profile.</p>
                </div>
                
                <div className="w-full space-y-2">
                   <label className="flex text-[10px] font-black uppercase tracking-widest text-slate-400 pl-2">Rejection Reason</label>
                   <textarea 
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. ID image is blurred or invalid."
                    className="w-full h-32 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold placeholder:text-slate-300 focus:bg-white focus:border-red-500 outline-none transition-all resize-none shadow-inner"
                   />
                </div>

                <div className="flex w-full gap-3 pt-4">
                  <button 
                    onClick={() => setIsRejectModalOpen(false)}
                    className="flex-1 h-14 bg-slate-50 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleReject}
                    disabled={processing || !rejectionReason}
                    className="flex-1 h-14 bg-red-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all active:scale-95 disabled:opacity-50"
                  >
                    Confirm Rejection
                  </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import {
  Plus,
  Trash2,
  Upload,
  ChevronRight,
  Layers,
  FileSpreadsheet,
  AlertCircle,
  X,
  Database,
  GraduationCap
} from 'lucide-react';
import { API_URL } from '../config';
import { cn } from '../lib/utils';

export default function Academic() {
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  const [selectedProg, setSelectedProg] = useState<any>(null);
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [selectedSem, setSelectedSem] = useState(1);

  const [loading, setLoading] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResults, setImportResults] = useState<any>(null);

  useEffect(() => {
    fetchProgrammes();
  }, []);

  const fetchProgrammes = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/academic/programmes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setProgrammes(data);
    } catch (e) { console.error(e); }
  };

  const fetchBranches = async (progId: number) => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/academic/branches?programme_id=${progId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setBranches(data);
    } catch (e) { console.error(e); }
  };

  const fetchSubjects = async (branchId: number, sem: number) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/academic/subjects?branch_id=${branchId}&semester=${sem}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSubjects(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleProgClick = (prog: any) => {
    setSelectedProg(prog);
    setSelectedBranch(null);
    setSubjects([]);
    fetchBranches(prog.id);
  };

  const handleBranchClick = (branch: any) => {
    setSelectedBranch(branch);
    fetchSubjects(branch.id, selectedSem);
  };

  const handleSemChange = (sem: number) => {
    setSelectedSem(sem);
    if (selectedBranch) fetchSubjects(selectedBranch.id, sem);
  };

  const handleBulkImport = async () => {
    if (!importFile) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', importFile);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/academic/subjects/bulk-import`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      setImportResults(data);
      if (selectedBranch) fetchSubjects(selectedBranch.id, selectedSem);
    } catch (e) { alert('Import failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tight">Academic Registry</h1>
          <p className="text-muted-foreground font-bold text-sm mt-1 uppercase tracking-widest opacity-60 italic">Institutional hierarchy & curriculum management</p>
        </div>
        <button
          onClick={() => setShowImport(true)}
          className="btn-primary flex items-center gap-3 px-8 h-14"
        >
          <Upload size={18} />
          Bulk Syllabus Import
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Programmes Column */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-50">Programmes</h3>
            <button className="h-8 w-8 rounded-xl bg-secondary flex items-center justify-center text-primary group hover:bg-primary hover:text-white transition-all">
              <Plus size={16} className="transition-transform group-hover:rotate-90" />
            </button>
          </div>
          <div className="space-y-3">
            {programmes.map((prog, idx) => (
              <button
                key={prog.id}
                onClick={() => handleProgClick(prog)}
                className={cn(
                  "w-full flex items-center justify-between p-5 rounded-[1.5rem] border transition-all text-left group animate-fade-in",
                  selectedProg?.id === prog.id
                    ? "bg-primary text-white border-primary shadow-2xl shadow-primary/20 scale-[1.02]"
                    : "bg-card text-foreground border-border hover:border-primary/50 hover:bg-secondary/30"
                )}
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs shadow-inner transition-colors", 
                    selectedProg?.id === prog.id ? "bg-white/20" : "bg-secondary text-primary"
                  )}>
                    {prog.code}
                  </div>
                  <span className="text-sm font-black truncate max-w-[120px] tracking-tight">{prog.name}</span>
                </div>
                <ChevronRight size={16} className={cn("transition-transform", selectedProg?.id === prog.id ? "text-white translate-x-1" : "text-muted-foreground opacity-30 group-hover:opacity-100 group-hover:translate-x-1")} />
              </button>
            ))}
          </div>
        </div>

        {/* Branches Column */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-50">Branches</h3>
            {selectedProg && (
              <button className="h-8 w-8 rounded-xl bg-secondary flex items-center justify-center text-primary group hover:bg-primary hover:text-white transition-all">
                <Plus size={16} className="transition-transform group-hover:rotate-90" />
              </button>
            )}
          </div>
          {!selectedProg ? (
            <div className="admin-card border-dashed py-20 flex flex-col items-center justify-center text-center px-8 opacity-40">
              <GraduationCap size={48} className="text-muted-foreground mb-4" />
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-relaxed">Select a programme<br />to reveal branches</p>
            </div>
          ) : (
            <div className="space-y-3">
              {branches.length === 0 ? (
                <div className="text-center py-10">
                   <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-30 italic">No branches mapped</p>
                </div>
              ) : (
                branches.map((branch, idx) => (
                  <button
                    key={branch.id}
                    onClick={() => handleBranchClick(branch)}
                    className={cn(
                      "w-full p-5 rounded-[1.5rem] border transition-all text-left animate-fade-in group",
                      selectedBranch?.id === branch.id
                        ? "bg-foreground text-background border-foreground shadow-2xl shadow-black/20"
                        : "bg-card text-foreground border-border hover:border-foreground/30 hover:bg-secondary"
                    )}
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    <p className={cn(
                      "text-[9px] font-black uppercase tracking-[0.2em] mb-1.5 transition-colors",
                      selectedBranch?.id === branch.id ? "text-background/50" : "text-primary"
                    )}>{branch.code}</p>
                    <span className="text-sm font-black truncate block tracking-tight">{branch.name}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Subjects Column */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-50 px-3">Curriculum Taxonomy</h3>
            {selectedBranch && (
              <div className="flex bg-secondary/50 rounded-2xl border border-border/50 p-1.5 shadow-inner overflow-x-auto no-scrollbar max-w-full">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                  <button
                    key={sem}
                    onClick={() => handleSemChange(sem)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-black transition-all whitespace-nowrap uppercase tracking-widest",
                      selectedSem === sem ? "bg-primary text-white shadow-xl shadow-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                  >
                    SEM {sem}
                  </button>
                ))}
              </div>
            )}
          </div>

          {!selectedBranch ? (
            <div className="admin-card border-dashed py-32 flex flex-col items-center justify-center text-center space-y-8 opacity-40">
              <div className="w-24 h-24 bg-secondary text-muted-foreground rounded-[2.5rem] flex items-center justify-center shadow-inner">
                <Layers size={48} />
              </div>
              <div className="space-y-3">
                <h4 className="text-2xl font-black text-foreground tracking-tight uppercase">Structure Preview</h4>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest leading-loose px-12">Select branch and semantic cycle to analyze curriculum distribution.</p>
              </div>
            </div>
          ) : (
            <div className="admin-card overflow-hidden">
              <div className="p-8 border-b border-border/50 flex items-center justify-between bg-muted/5 sticky top-0 z-10">
                <div className="min-w-0">
                  <h4 className="text-xl font-black text-foreground tracking-tight truncate leading-none">{selectedBranch.name}</h4>
                  <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mt-3">{selectedProg.name} · Cycle {selectedSem}</p>
                </div>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all active:scale-95 shadow-xl shadow-primary/20">
                  <Plus size={16} /> Add Course
                </button>
              </div>

              <div className="divide-y divide-border/30">
                {loading ? (
                  <div className="p-32 text-center">
                    <div className="h-12 w-12 border-[5px] border-primary border-t-transparent rounded-full animate-spin mx-auto shadow-xl shadow-primary/20" />
                  </div>
                ) : subjects.length === 0 ? (
                  <div className="p-32 text-center opacity-30">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] italic">No courses indexed for this segment</p>
                  </div>
                ) : (
                  subjects.map((subject, idx) => (
                    <div 
                      key={subject.id} 
                      className="p-6 flex items-center justify-between group hover:bg-secondary/30 transition-all animate-fade-in"
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      <div className="flex items-center gap-5">
                        <div className="h-12 w-12 bg-secondary text-primary rounded-2xl flex flex-col items-center justify-center font-black shadow-inner group-hover:bg-primary group-hover:text-white transition-colors">
                          <span className="text-sm leading-none">{subject.credits || 4}</span>
                          <span className="text-[7px] uppercase tracking-tighter mt-1 opacity-60">CRDT</span>
                        </div>
                        <div>
                          <h5 className="text-base font-black text-foreground leading-tight tracking-tight group-hover:text-primary transition-colors">{subject.subject_name}</h5>
                          <div className="flex items-center gap-3 mt-1.5 opacity-50 group-hover:opacity-100 transition-opacity">
                             <span className="text-[10px] font-black text-muted-foreground font-mono tracking-tight uppercase px-1.5 py-0.5 bg-secondary/50 rounded-md border border-border/50">{subject.subject_code}</span>
                             <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">{subject.type || 'Mandatory'} Course</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                         <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-secondary text-muted-foreground hover:bg-destructive hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-sm active:scale-95">
                           <Trash2 size={18} />
                         </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-xl animate-fade-in">
          <div className="admin-card w-full max-w-2xl p-12 shadow-3xl relative overflow-hidden scale-in-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
            
            <button
              onClick={() => { setShowImport(false); setImportResults(null); }}
              className="absolute top-10 right-10 p-3 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-2xl transition-all z-20"
            >
              <X size={20} />
            </button>

            <div className="space-y-10 relative z-10">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-primary/10 text-primary rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <FileSpreadsheet size={36} />
                </div>
                <h3 className="text-3xl font-black text-foreground tracking-tight">Digital Syllabus Importer</h3>
                <p className="text-xs text-muted-foreground font-black uppercase tracking-widest opacity-60 italic leading-loose px-12">Synchronize institutional curriculum assets via standardized CSV serialization.</p>
              </div>

              {!importResults ? (
                <div className="space-y-10">
                  <div
                    className={cn(
                      "h-56 border-2 border-dashed rounded-[3rem] flex flex-col items-center justify-center space-y-6 transition-all relative overflow-hidden group cursor-pointer",
                      importFile ? "bg-primary/5 border-primary/30" : "bg-muted/5 border-border hover:bg-secondary/30 hover:border-primary/50"
                    )}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); setImportFile(e.dataTransfer.files[0]); }}
                    onClick={() => document.getElementById('csv-upload')?.click()}
                  >
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Database size={40} className={cn("transition-colors", importFile ? "text-primary" : "text-muted-foreground/20")} />
                    <div className="text-center relative z-10">
                      <p className="text-sm font-black text-foreground tracking-tight">{importFile ? importFile.name : 'Drag & drop curriculum source'}</p>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-2 opacity-50">Syllabus.csv · max 10MB</p>
                    </div>
                    <input
                      type="file"
                      id="csv-upload"
                      className="hidden"
                      accept=".csv"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    />
                  </div>

                  <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[60px] -mr-16 -mt-16 pointer-events-none" />
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-3">
                      <AlertCircle size={14} /> Schema Protocols
                    </h4>
                    <div className="grid grid-cols-2 gap-8 text-[11px] font-bold text-slate-400">
                      <div className="space-y-2">
                        <p className="text-white font-black uppercase tracking-widest text-[9px]">Subject Mapping</p>
                        <p className="opacity-60 italic leading-relaxed">course_name, course_code, branch_id, semester_idx</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-white font-black uppercase tracking-widest text-[9px]">Requirements</p>
                        <p className="opacity-60 italic leading-relaxed">UTF-8 Encoding · Comma Separated · No Headers</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleBulkImport}
                    disabled={loading || !importFile}
                    className="w-full h-16 bg-primary text-white rounded-[2rem] font-black text-[11px] tracking-[0.2em] uppercase shadow-2xl shadow-primary/30 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {loading ? 'Analyzing Data...' : 'Initiate Curriculum Sync'}
                  </button>
                </div>
              ) : (
                <div className="animate-fade-in space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-8 bg-emerald-500/5 border border-emerald-500/10 rounded-[2.5rem] flex items-center gap-6 shadow-inner relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-3xl -mr-12 -mt-12" />
                      <div className="h-16 w-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl shadow-emerald-500/20">{importResults.imported}</div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none">Accepted</p>
                        <p className="text-sm font-black text-foreground mt-2 truncate">Assets Merged</p>
                      </div>
                    </div>
                    <div className="p-8 bg-destructive/5 border border-destructive/10 rounded-[2.5rem] flex items-center gap-6 shadow-inner relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-destructive/5 rounded-full blur-3xl -mr-12 -mt-12" />
                      <div className="h-16 w-16 bg-destructive text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl shadow-destructive/20">{importResults.failed}</div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-destructive uppercase tracking-widest leading-none">Restricted</p>
                        <p className="text-sm font-black text-foreground mt-2 truncate">Integrity Faults</p>
                      </div>
                    </div>
                  </div>

                  {importResults.errors?.length > 0 && (
                    <div className="max-h-56 overflow-y-auto bg-secondary/30 border border-border/50 rounded-[2rem] p-6 space-y-3 no-scrollbar shadow-inner">
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">Error Intelligence</p>
                      {importResults.errors.map((err: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-4 p-4 bg-card/50 rounded-xl border border-border/30">
                          <AlertCircle size={14} className="text-destructive shrink-0 mt-0.5" />
                          <div className="min-w-0">
                             <p className="text-[10px] font-black text-foreground uppercase tracking-tight">Sequence Fault #{err.row}</p>
                             <p className="text-[11px] text-muted-foreground font-bold mt-1 leading-relaxed italic opacity-60">"{err.reason}"</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center gap-4 pt-6">
                    <button
                      onClick={() => { setImportResults(null); setImportFile(null); }}
                      className="w-full sm:flex-1 h-16 bg-secondary text-muted-foreground rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-foreground transition-all"
                    >
                      Revised Upload
                    </button>
                    <button
                      onClick={() => { setShowImport(false); setImportResults(null); }}
                      className="w-full sm:flex-1 h-16 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-primary/30 hover:bg-primary/90 transition-all"
                    >
                      Exit Inspector
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

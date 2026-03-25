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
  Database
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Academic Repository</h1>
          <p className="text-slate-500 font-medium">Manage institutional hierarchy and course structures</p>
        </div>
        <button
          onClick={() => setShowImport(true)}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/20 hover:scale-105 transition-all"
        >
          <Upload size={14} />
          Bulk Import Subjects
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Programmes Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Programmes</h3>
            <Plus size={14} className="text-slate-300 hover:text-blue-600 cursor-pointer" />
          </div>
          <div className="space-y-2">
            {programmes.map(prog => (
              <button
                key={prog.id}
                onClick={() => handleProgClick(prog)}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left",
                  selectedProg?.id === prog.id
                    ? "bg-blue-600 text-white border-blue-500 shadow-xl shadow-blue-900/10"
                    : "bg-white text-slate-900 border-slate-100 hover:border-blue-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center font-black text-xs", selectedProg?.id === prog.id ? "bg-white/20" : "bg-slate-100 text-slate-400")}>
                    {prog.code}
                  </div>
                  <span className="text-sm font-bold truncate max-w-[120px]">{prog.name}</span>
                </div>
                <ChevronRight size={14} className={cn(selectedProg?.id === prog.id ? "text-white" : "text-slate-300")} />
              </button>
            ))}
          </div>
        </div>

        {/* Branches Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Branches</h3>
            {selectedProg && <Plus size={14} className="text-slate-300 hover:text-blue-600 cursor-pointer" />}
          </div>
          {!selectedProg ? (
            <div className="bg-slate-50 border border-slate-100 border-dashed rounded-[2.5rem] p-8 text-center">
              <p className="text-[10px] font-black text-slate-300 uppercase leading-loose">Select a programme<br />to view branches</p>
            </div>
          ) : (
            <div className="space-y-2">
              {branches.length === 0 ? (
                <p className="text-center py-8 text-[10px] font-bold text-slate-400 uppercase">No branches found</p>
              ) : (
                branches.map(branch => (
                  <button
                    key={branch.id}
                    onClick={() => handleBranchClick(branch)}
                    className={cn(
                      "w-full p-4 rounded-2xl border transition-all text-left group",
                      selectedBranch?.id === branch.id
                        ? "bg-slate-900 text-white border-slate-800 shadow-xl shadow-slate-900/20"
                        : "bg-white text-slate-900 border-slate-100 hover:border-slate-300"
                    )}
                  >
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter mb-1 group-hover:text-blue-400 transition-colors">{branch.code}</p>
                    <span className="text-sm font-bold truncate block">{branch.name}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Subjects Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Curriculum Structure</h3>
            {selectedBranch && (
              <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm overflow-x-auto no-scrollbar max-w-[300px]">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                  <button
                    key={sem}
                    onClick={() => handleSemChange(sem)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-black transition-all whitespace-nowrap",
                      selectedSem === sem ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    SEM {sem}
                  </button>
                ))}
              </div>
            )}
          </div>

          {!selectedBranch ? (
            <div className="flex-1 flex flex-col items-center justify-center p-20 bg-white border border-slate-100 rounded-[2.5rem] text-center space-y-6 border-dashed">
              <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center">
                <Layers size={40} />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-black text-slate-900 tracking-tight">Curriculum Preview</h4>
                <p className="text-sm text-slate-400 font-medium">Please select a branch and semester to manage its subjects catalogue.</p>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h4 className="text-base font-black text-slate-900 tracking-tight leading-none">{selectedBranch.name}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Semester {selectedSem} Syllabus</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">
                  <Plus size={14} /> Add Subject
                </button>
              </div>

              <div className="divide-y divide-slate-50">
                {loading ? (
                  <div className="p-20 text-center">
                    <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : subjects.length === 0 ? (
                  <div className="p-20 text-center">
                    <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No subjects defined for this semester</p>
                  </div>
                ) : (
                  subjects.map(subject => (
                    <div key={subject.id} className="p-5 flex items-center justify-between group hover:bg-slate-50 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex flex-col items-center justify-center font-black">
                          <span className="text-[10px] leading-none">{subject.credits || 0}</span>
                          <span className="text-[8px] uppercase">LTP</span>
                        </div>
                        <div>
                          <h5 className="text-sm font-bold text-slate-900 leading-tight">{subject.subject_name}</h5>
                          <p className="text-[10px] font-bold text-slate-400 font-mono tracking-tighter uppercase">{subject.subject_code} · {subject.type || 'Core'}</p>
                        </div>
                      </div>
                      <button className="p-2 text-slate-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 size={16} />
                      </button>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl p-10 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
            <button
              onClick={() => { setShowImport(false); setImportResults(null); }}
              className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
            >
              <X size={20} />
            </button>

            <div className="space-y-8">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <FileSpreadsheet size={32} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Bulk Syllabus Import</h3>
                <p className="text-sm text-slate-500 font-medium">Upload a CSV file to populate subjects across multiple branches.</p>
              </div>

              {!importResults ? (
                <div className="space-y-6">
                  <div
                    className={cn(
                      "h-48 border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center space-y-4 transition-all",
                      importFile ? "bg-blue-50 border-blue-200" : "bg-slate-50 border-slate-100 hover:bg-white hover:border-blue-200 hover:shadow-inner"
                    )}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); setImportFile(e.dataTransfer.files[0]); }}
                  >
                    <Database size={32} className="text-slate-200" />
                    <div className="text-center">
                      <p className="text-sm font-bold text-slate-900">{importFile ? importFile.name : 'Drop your syllabus.csv here'}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Maximum file size: 5MB</p>
                    </div>
                    <input
                      type="file"
                      id="csv-upload"
                      className="hidden"
                      accept=".csv"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    />
                    <label htmlFor="csv-upload" className="px-6 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 cursor-pointer hover:shadow-md transition-all">
                      Browse Files
                    </label>
                  </div>

                  <div className="bg-slate-900 rounded-[2rem] p-6 text-white space-y-4 shadow-xl">
                    <h4 className="text-xs font-black uppercase tracking-widest text-blue-400 flex items-center gap-2">
                      <AlertCircle size={14} /> CSV Format Requirements
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-[10px] font-mono text-slate-400">
                      <div className="space-y-1">
                        <p className="text-white font-bold">1. subject_name</p>
                        <p>e.g. Operating Systems</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-white font-bold">2. subject_code</p>
                        <p>e.g. CS-301</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-white font-bold">3. branch_code</p>
                        <p>e.g. CSE-BTECH</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-white font-bold">4. semester</p>
                        <p>e.g. 5 (Number 1-10)</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleBulkImport}
                    disabled={loading || !importFile}
                    className="w-full h-14 bg-blue-600 text-white rounded-[1.5rem] font-black text-sm tracking-widest uppercase shadow-lg shadow-blue-600/20 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Initialize Import'}
                  </button>
                </div>
              ) : (
                <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-[2rem] flex items-center gap-4">
                      <div className="h-12 w-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center font-black text-xl">{importResults.imported}</div>
                      <div>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">Successful</p>
                        <p className="text-sm font-bold text-emerald-900 mt-1">Records Imported</p>
                      </div>
                    </div>
                    <div className="p-6 bg-red-50 border border-red-100 rounded-[2rem] flex items-center gap-4">
                      <div className="h-12 w-12 bg-red-500 text-white rounded-2xl flex items-center justify-center font-black text-xl">{importResults.failed}</div>
                      <div>
                        <p className="text-[10px] font-black text-red-600 uppercase tracking-widest leading-none">Failures</p>
                        <p className="text-sm font-bold text-red-900 mt-1">Validation Errors</p>
                      </div>
                    </div>
                  </div>

                  {importResults.errors?.length > 0 && (
                    <div className="max-h-48 overflow-y-auto bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2 no-scrollbar shadow-inner">
                      {importResults.errors.map((err: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 text-[10px] font-bold text-red-400">
                          <AlertCircle size={10} />
                          <strong>{err.row}:</strong> {err.reason}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 pt-4">
                    <button
                      onClick={() => { setImportResults(null); setImportFile(null); }}
                      className="flex-1 h-14 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                    >
                      Try Another File
                    </button>
                    <button
                      onClick={() => { setShowImport(false); setImportResults(null); }}
                      className="flex-1 h-14 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:scale-[1.02] transition-all"
                    >

                      Close Window
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

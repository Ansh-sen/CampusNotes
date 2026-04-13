import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '@/config';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast-provider';
import { 
  ArrowRight, ArrowLeft, Send, 
  CheckCircle2, Sparkles, X, Camera,
  History, Trash2, Shield
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AcademicSelector } from '@/components/domain/AcademicSelector';
import { ListingImageGrid } from '@/components/domain/ListingImageGrid';
import { listingService } from '@/services/listingService';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const MATERIAL_TYPES = [
  'Lecture Notes', 'Practice Exams', 'Lab Manuals', 
  'Course Books', 'Projects', 'Tutoring'
];

export function CreateListing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { jwt, profile } = useAuth();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [requestCount, setRequestCount] = useState(0);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [tagLoading, setTagLoading] = useState(false);
  const [priceData, setPriceData] = useState<{ min: number, max: number, median: number, count: number } | null>(null);
  
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<any>(null);

  // Unified Form State
  const [formData, setFormData] = useState({
    id: '', 
    title: '',
    description: '',
    programme: profile?.programme || '',
    branch: profile?.branch || '',
    semester: profile?.semester?.toString() || '',
    subject_code: '',
    subject_name: '',
    material_type: '',
    price: 0,
    tags: [] as string[],
    images: [] as Array<{ url: string; is_cover: boolean }>,
    ai_score: null as number | null,
    ai_reasons: [] as string[],
    is_draft: false
  });

  // 1. Initial Draft Recovery Check
  useEffect(() => {
    if (jwt) {
      const editId = searchParams.get('edit');
      const draftId = searchParams.get('draft');

      if (editId || draftId) {
        const id = (editId || draftId)!;
        setLoading(true);
        listingService.getListing(id).then(res => {
          if (res.data) {
            setFormData({
              ...formData,
              ...res.data,
              images: res.data.listing_images || [],
              tags: res.data.tags || []
            });
            // If it's a draft, maybe we want to go to the last step?
            // For now, we go to step 1 to allow full review.
          }
        }).finally(() => setLoading(false));
      } else {
        // Only show general draft recovery if not explicitly editing a specific one
        listingService.getMyDraft(jwt).then(res => {
          if (res.data) {
            setPendingDraft(res.data);
            setShowDraftModal(true);
          }
        });
      }
    }
  }, [jwt, searchParams]);

  const resumeDraft = () => {
    if (pendingDraft) {
      setFormData({
        ...formData,
        ...pendingDraft,
        images: pendingDraft.listing_images || [],
        tags: pendingDraft.tags || []
      });
    }
    setShowDraftModal(false);
  };

  const discardDraft = () => {
    // In a real app we'd call a DELETE /draft. 
    // Here we just close the modal and start fresh.
    setShowDraftModal(false);
  };

  // 2. Fetch Demand Alert
  useEffect(() => {
    if (formData.subject_code && jwt) {
      listingService.getRequestCount(formData.subject_code, jwt)
        .then(res => setRequestCount(res.count || 0));
    }
  }, [formData.subject_code, jwt]);

  // 3. AI Tag Suggestions
  const fetchTags = useCallback(async () => {
    if (!formData.subject_name || !formData.material_type || !jwt) return;
    setTagLoading(true);
    try {
      const res = await listingService.suggestTags({
        subject_name: formData.subject_name,
        material_type: formData.material_type,
        programme: formData.programme,
        branch: formData.branch,
        semester: formData.semester
      }, jwt);
      setSuggestedTags(res.tags || []);
    } finally {
      setTagLoading(false);
    }
  }, [formData.subject_name, formData.material_type, jwt, formData.programme, formData.branch, formData.semester]);

  useEffect(() => {
    fetchTags();
  }, [formData.subject_name, formData.material_type, fetchTags]);

  // 4. Fetch Price Range
  const fetchPriceRange = useCallback(async () => {
    if (!formData.subject_code || !formData.material_type || !jwt) return;
    const res = await listingService.getPriceRange(formData.subject_code, formData.material_type, jwt);
    setPriceData(res);
  }, [formData.subject_code, formData.material_type, jwt]);

  useEffect(() => {
    fetchPriceRange();
  }, [formData.subject_code, formData.material_type, fetchPriceRange]);

  // 5. Final Publish
  const handlePublish = async () => {
    setLoading(true);
    try {
      const res = await listingService.createListing({
        ...formData,
        is_draft: false
      }, jwt!);
      toast({ title: 'Success!', description: 'Your notes are now live.', type: 'success' });
      navigate(`/listing/${res.id}`);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Background Draft Saving
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (jwt && formData.title && step > 0) {
        try {
          const res = await listingService.saveDraft(formData, jwt);
          if (res.success && res.id && res.id !== formData.id) {
            setFormData(prev => ({ ...prev, id: res.id }));
          }
        } catch (e) {
          console.error("Background auto-save failed", e);
        }
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [formData, jwt, step]);

  const handleNext = () => setStep(s => Math.min(s + 1, 3));
  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const addTag = (tag: string) => {
    if (!formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: [...formData.tags, tag] });
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const steps = [
    { num: 1, label: 'Basic Info' },
    { num: 2, label: 'Photos' },
    { num: 3, label: 'Pricing' }
  ];

  if (profile && profile.verification_status !== 'verified') {
    return (
    <div className="max-w-2xl mx-auto px-6 pb-40 pt-16 text-center flex flex-col items-center justify-center min-h-[70vh]">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-primary/10 rounded-[2rem] flex items-center justify-center mb-8 border border-primary/20 shadow-xl shadow-primary/5"
        >
          <Shield className="w-12 h-12 text-primary" />
        </motion.div>
        <h1 className="text-3xl font-black text-foreground mb-4 tracking-tighter uppercase">Protocol Restricted</h1>
        <p className="text-muted-foreground font-medium mb-10 max-w-sm opacity-60">
          {profile.verification_status === 'pending' 
            ? "Your authentication sequence is currently being verified. We'll notify you once access is granted."
            : "To maintain marketplace integrity, only verified students can publish."}
        </p>
        
        {profile.verification_status === 'pending' ? (
          <button 
            onClick={() => navigate('/')} 
            className="h-16 px-10 bg-muted text-foreground rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-muted/80 transition-all active:scale-95"
          >
            Cancel & Return
          </button>
        ) : (
          <button 
            onClick={() => navigate('/profile?action=verify')}
            className="h-16 px-10 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20 hover:scale-105 transition-all active:scale-95"
          >
            Initiate Verification
          </button>
        )}

        {profile.verification_status === 'rejected' && (
           <div className="mt-10 p-6 bg-danger/10 rounded-[2rem] border border-danger/20 max-w-sm">
             <p className="text-[9px] font-black text-danger uppercase tracking-widest mb-2 opacity-60">Verification Failed</p>
             <p className="text-sm font-bold text-danger leading-tight uppercase tracking-tight">System Message: {profile.verification_rejected_reason || "Authentication image invalid."}</p>
           </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pb-16 pt-6">
      {/* Draft Modal */}
      <AnimatePresence>
        {showDraftModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-card rounded-[3rem] p-10 max-w-sm w-full shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] border border-border/50 space-y-8 text-center"
            >
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto border border-primary/20 shadow-inner">
                <History className="w-10 h-10 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Restore Asset?</h3>
                <p className="text-xs font-bold text-muted-foreground uppercase opacity-40">Previous cache detected:</p>
                <p className="text-base font-black text-primary leading-tight italic">"{pendingDraft?.title}"</p>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={resumeDraft}
                  className="w-full h-16 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
                >
                  <Sparkles className="w-5 h-5" /> Resume Build
                </button>
                <button 
                  onClick={discardDraft}
                  className="w-full h-16 bg-muted text-muted-foreground rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all hover:bg-danger/10 hover:text-danger active:scale-95 flex items-center justify-center gap-3"
                >
                  <Trash2 className="w-5 h-5" /> Wipe Cache
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="mb-14 text-center relative px-4">
        <h1 className="text-3xl font-black text-foreground mb-10 tracking-tighter uppercase">Sell Your Notes</h1>
        
        <div className="flex items-center justify-between max-w-sm mx-auto relative">
          <div className="absolute top-[20px] left-[50px] right-[50px] h-[2px] bg-muted -z-10 rounded-full" />
          <div 
            className="absolute top-[20px] left-[50px] h-[2px] bg-primary transition-all duration-1000 ease-out rounded-full -z-10 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
            style={{ width: `${(step - 1) * 50}%` }}
          />

          {steps.map((s, idx) => (
            <div key={idx} className="flex flex-col items-center gap-3 relative">
              <div className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs transition-all duration-700 border-2",
                step >= s.num ? "bg-primary border-primary shadow-xl shadow-primary/20 text-white scale-110" : "bg-card border-border/50 text-muted-foreground/40"
              )}>
                {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
              </div>
              <span className={cn(
                "text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-700",
                step >= s.num ? "text-primary" : "text-muted-foreground opacity-60 font-bold"
              )}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {requestCount > 0 && (
              <div className="bg-primary text-white p-6 rounded-[2.5rem] flex items-center gap-6 shadow-2xl shadow-primary/10 relative overflow-hidden group/alert">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover/alert:scale-150 transition-transform duration-1000" />
                <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner shrink-0 leading-none">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="space-y-1 relative z-10">
                  <p className="text-base font-black tracking-tight leading-none uppercase">{requestCount} Targets Acquired!</p>
                  <p className="text-[9px] text-white/60 font-black uppercase tracking-[0.2em]">High Conversion Velocity Predicted</p>
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 ml-2">Manifest Identity</label>
                <input 
                  type="text"
                  placeholder="e.g. Unit 3 Architectural Patterns"
                  className="w-full h-16 px-6 rounded-2xl bg-card border border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-black text-foreground shadow-sm placeholder:opacity-30"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 ml-2">Asset Intelligence</label>
                <textarea 
                  placeholder="Key features (e.g. Visual Mnemonics, Lab Results)"
                  className="w-full h-40 p-6 rounded-3xl bg-card border border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold text-foreground resize-none shadow-sm placeholder:opacity-30"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <AcademicSelector 
                values={{
                  programme: formData.programme,
                  branch: formData.branch,
                  semester: formData.semester,
                  subject_code: formData.subject_code,
                  subject_name: formData.subject_name
                }}
                onChange={(data) => setFormData(prev => ({ ...prev, ...data }))}
              />

              <div className="space-y-4 pt-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 ml-2">Material Blueprint</label>
                <div className="flex flex-wrap gap-3">
                  {MATERIAL_TYPES.map(m => (
                    <button
                      key={m}
                      onClick={() => setFormData({ ...formData, material_type: m })}
                      className={cn(
                        "px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2",
                        formData.material_type === m 
                          ? "bg-primary border-primary text-white shadow-2xl shadow-primary/20 scale-105" 
                          : "bg-card border-border/50 text-muted-foreground hover:border-primary/50"
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {(suggestedTags.length > 0 || tagLoading) && (
                <div className="space-y-4 pt-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
                  <div className="flex items-center justify-between px-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Semantic Context</label>
                    <span className="text-[9px] font-black text-primary flex items-center gap-2 uppercase tracking-widest">
                      <Sparkles className="w-3.5 h-3.5" /> AI Synthesis
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tagLoading ? Array(5).fill(0).map((_, i) => <div key={i} className="h-10 w-24 bg-muted/30 animate-pulse rounded-full border border-border/50" />) : 
                      suggestedTags.map(tag => (
                        <button key={tag} onClick={() => addTag(tag)} disabled={formData.tags.includes(tag)}
                          className={cn("px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
                            formData.tags.includes(tag) ? "bg-muted text-muted-foreground/30 border border-border/50 cursor-not-allowed" : "bg-primary/5 text-primary border border-primary/20 hover:bg-primary/10 hover:border-primary/40 active:scale-95")}>
                          + {tag}
                        </button>
                      ))
                    }
                  </div>
                </div>
              )}
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-4">
                  {formData.tags.map(tag => (
                    <span key={tag} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-primary/10 border border-white/10 animate-in zoom-in duration-300">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:scale-125 transition-transform">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-foreground uppercase tracking-tight leading-none">Upload Photos</h2>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-60">Step 2: Add clear pictures of your notes</p>
            </div>
            <ListingImageGrid 
              images={formData.images}
              onChange={(imgs) => setFormData({ ...formData, images: imgs })}
              aiScore={formData.ai_score}
              aiReasons={formData.ai_reasons}
              setAiScore={(s) => setFormData({ ...formData, ai_score: s })}
              setAiReasons={(r) => setFormData({ ...formData, ai_reasons: r })}
            />
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-foreground uppercase tracking-tight leading-none">Pricing & Terms</h2>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-40">Phase 3: Valuation & Finalization</p>
            </div>

            <Card className="rounded-[3rem] border border-border/50 bg-card shadow-2xl shadow-black/5 overflow-hidden group/pricing">
              <CardContent className="p-10 space-y-10">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-40 leading-none">Valuation AI</h3>
                    <h4 className="text-sm font-black text-foreground uppercase tracking-tight mt-1">Market Equilibrium Index</h4>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 relative">
                  <div className="absolute inset-0 bg-primary/5 blur-2xl -z-10 rounded-full" />
                  <div className="text-center space-y-1">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Min Floor</p>
                    <p className="text-xl font-black text-foreground tracking-tighter tabular-nums">₹{priceData?.min || 20}</p>
                  </div>
                  <div className="text-center space-y-1 border-x border-border/50">
                    <p className="text-[9px] font-black text-primary uppercase tracking-widest leading-none">Prime</p>
                    <p className="text-3xl font-black text-primary drop-shadow-[0_0_15px_rgba(59,130,246,0.3)] tracking-tighter tabular-nums">₹{priceData?.median || 50}</p>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Peak cap</p>
                    <p className="text-xl font-black text-foreground tracking-tighter tabular-nums">₹{priceData?.max || 150}</p>
                  </div>
                </div>

                <div className="space-y-6 pt-6 border-t border-border/50">
                  <div className="flex justify-between items-center px-2">
                    <label className="text-[10px] font-black text-foreground uppercase tracking-widest">Asset Valuation</label>
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border shadow-xl shadow-black/5",
                      formData.price <= (priceData?.median || 50) 
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                        : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                    )}>
                      {formData.price <= (priceData?.median || 50) ? 'Optimum Flow' : 'Premium Positioning'}
                    </span>
                  </div>
                  <div className="relative group/input">
                    <span className="absolute left-8 top-1/2 -translate-y-1/2 text-4xl font-black text-muted-foreground/20 group-focus-within/input:text-primary/30 transition-colors">₹</span>
                    <input 
                      type="number"
                      placeholder="00"
                      className="w-full h-24 pl-16 pr-10 text-5xl font-black bg-muted/30 rounded-[2rem] border border-border/50 focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all text-foreground tabular-nums placeholder:opacity-5"
                      value={formData.price || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setFormData({ ...formData, price: 0 });
                        } else {
                          const parsed = parseInt(val, 10);
                          setFormData({ ...formData, price: isNaN(parsed) ? 0 : parsed });
                        }
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6 pt-6">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 ml-2">Marketplace Echo (Preview)</label>
              <div className="scale-[0.98] origin-top opacity-70 grayscale-[0.5] transition-all hover:opacity-100 hover:grayscale-0 duration-700">
                <div className="bg-card rounded-[2.5rem] border border-border/50 p-6 shadow-xl shadow-black/5">
                   <div className="aspect-[4/3] rounded-[2rem] bg-muted mb-6 overflow-hidden relative border border-border/50 shadow-inner">
                      {formData.images[0] ? (
                        <img src={`${API_BASE_URL}${formData.images[0].url}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Camera className="w-10 h-10 text-muted-foreground/20" /></div>
                      )}
                      <div className="absolute top-6 right-6 bg-primary text-white text-[14px] font-black px-4 py-2 rounded-2xl shadow-xl shadow-primary/20">₹{formData.price}</div>
                   </div>
                   <h4 className="text-xl font-black text-foreground truncate uppercase tracking-tight leading-none">{formData.title || 'Untitled Protocol'}</h4>
                   <p className="text-[10px] font-black text-muted-foreground mt-2 uppercase tracking-[0.15em] opacity-40">{formData.subject_code || 'GEN'} • {formData.material_type || 'Archive'}</p>
                   <div className="flex items-center justify-between mt-8 pt-8 border-t border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center text-xs font-black shadow-lg shadow-primary/10">
                          {profile?.full_name?.charAt(0)}
                        </div>
                        <span className="text-[10px] font-black text-foreground uppercase tracking-widest">{profile?.full_name}</span>
                      </div>
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-4 py-2 rounded-xl text-[9px] font-black tracking-widest uppercase">Validated node</Badge>
                   </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 right-0 p-6 glass border-t border-border/50 z-[60] pb-[calc(1.5rem+env(safe-area-inset-bottom))] w-full max-w-2xl flex flex-col items-center justify-center gap-4">
        <div className="w-full flex gap-4">
          {step > 1 ? (
            <button onClick={handleBack} className="flex-1 h-16 rounded-2xl bg-card border border-border/50 flex items-center justify-center font-black text-muted-foreground uppercase tracking-widest text-[10px] hover:bg-muted transition-all active:scale-95 shadow-xl shadow-black/5">
              <ArrowLeft className="w-5 h-5 mr-3" /> Back
            </button>
          ) : (
            <button onClick={() => navigate('/')} className="flex-1 h-16 rounded-2xl bg-card border border-border/50 flex items-center justify-center font-black text-muted-foreground uppercase tracking-widest text-[10px] hover:bg-muted transition-all active:scale-95 shadow-xl shadow-black/5">
              Cancel
            </button>
          )}

          <button 
            onClick={step < 3 ? handleNext : handlePublish}
            disabled={
              (step === 1 && (!formData.title || !formData.subject_code || !formData.material_type)) ||
              (step === 2 && formData.images.length === 0) ||
              (step === 3 && (formData.price < 10 || loading))
            }
            className={cn(
              "flex-[2.5] h-16 rounded-2xl bg-primary text-white flex items-center justify-center font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-primary/30 transition-all active:scale-95 hover:scale-[1.02] disabled:opacity-40 disabled:grayscale disabled:pointer-events-none disabled:shadow-none",
              step === 3 && "bg-foreground text-background"
            )}
          >
            {step < 3 ? (<>Next <ArrowRight className="w-5 h-5 ml-3" /></>) : (
              <>{loading ? 'Publishing...' : <><Send className="w-6 h-6 mr-3" /> Publish Notes</>}</>
            )}
          </button>
        </div>
        
        {step === 2 && formData.images.length === 0 && (
          <p className="text-[10px] font-black text-danger uppercase tracking-widest animate-in fade-in slide-in-from-bottom-2">
            Upload at least one photo to proceed.
          </p>
        )}
      </div>
    </div>
  );
}

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
      <div className="max-w-2xl mx-auto px-4 pb-32 pt-12 text-center flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
          <Shield className="w-12 h-12 text-blue-600" />
        </div>
        <h1 className="text-3xl font-black text-[#1a2744] mb-4">Verification Required</h1>
        <p className="text-gray-500 font-medium mb-8 max-w-sm">
          {profile.verification_status === 'pending' 
            ? "Your student ID is currently being reviewed. You'll be notified once approved."
            : "To maintain a safe marketplace, only verified students can sell notes."}
        </p>
        
        {profile.verification_status === 'pending' ? (
          <button onClick={() => navigate('/')} className="h-14 px-8 bg-gray-100 text-[#1a2744] rounded-2xl font-black hover:bg-gray-200 transition-all">
            Back to Home
          </button>
        ) : (
          <button 
            onClick={() => navigate('/profile?action=verify')}
            className="h-14 px-8 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 hover:translate-y-[-2px] transition-all active:scale-95"
          >
            Verify My Student ID
          </button>
        )}

        {profile.verification_status === 'rejected' && (
           <div className="mt-8 p-5 bg-red-50 rounded-[2rem] border border-red-100 max-w-sm">
             <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1.5">Verification Rejected</p>
             <p className="text-sm font-bold text-red-500 leading-tight">Reason: {profile.verification_rejected_reason || "Invalid ID image."}</p>
           </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pb-32 pt-6">
      {/* Draft Modal */}
      <AnimatePresence>
        {showDraftModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1a2744]/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl space-y-6 text-center"
            >
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                <History className="w-10 h-10 text-blue-600" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-[#1a2744]">Recover Draft?</h3>
                <p className="text-sm font-medium text-gray-500 mt-2">We found an unfinished listing: <br/> <span className="text-[#1a2744] font-black">"{pendingDraft?.title}"</span></p>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={resumeDraft}
                  className="w-full h-14 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 transition-all hover:translate-y-[-2px] active:scale-95 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" /> Resume Draft
                </button>
                <button 
                  onClick={discardDraft}
                  className="w-full h-14 bg-gray-50 text-gray-400 rounded-2xl font-black transition-all hover:bg-red-50 hover:text-red-500 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-5 h-5" /> Start Fresh
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="mb-10 text-center relative">
        <h1 className="text-3xl font-black text-[#1a2744] mb-8 tracking-tight">List Your Notes</h1>
        
        <div className="flex items-center justify-between max-w-sm mx-auto relative px-4">
          <div className="absolute top-[18px] left-[40px] right-[40px] h-[3px] bg-gray-100 -z-10 rounded-full" />
          <div 
            className="absolute top-[18px] left-[40px] h-[3px] bg-blue-600 transition-all duration-500 rounded-full -z-10"
            style={{ width: `${(step - 1) * 50}%` }}
          />

          {steps.map((s, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2">
              <div className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center font-black text-sm transition-all duration-300 border-4",
                step >= s.num ? "bg-blue-600 border-blue-100 text-white" : "bg-white border-gray-100 text-gray-400"
              )}>
                {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
              </div>
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest",
                step >= s.num ? "text-blue-600" : "text-gray-400"
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
              <div className="bg-[#1a2744] text-white p-4 rounded-3xl flex items-center gap-4 shadow-xl shadow-blue-900/10">
                <div className="p-3 bg-blue-50 rounded-2xl"><Sparkles className="w-5 h-5 text-blue-600" /></div>
                <div>
                  <p className="text-sm font-black tracking-tight">{requestCount} students are looking for this!</p>
                  <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest">High Demand • Predicted Sale in 24h</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[#1a2744]/40 ml-1">Title</label>
                <input 
                  type="text"
                  placeholder="e.g. Unit 3 Handwritten Notes"
                  className="w-full h-14 px-5 rounded-2xl bg-white border-2 border-gray-50 focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all font-bold text-[#1a2744]"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[#1a2744]/40 ml-1">Description</label>
                <textarea 
                  placeholder="What's special? (e.g. Includes PYQs, Diagrams)"
                  className="w-full h-32 p-5 rounded-2xl bg-white border-2 border-gray-50 focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all font-bold text-[#1a2744] resize-none"
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

              <div className="space-y-3 pt-2">
                <label className="text-xs font-black uppercase tracking-widest text-[#1a2744]/40 ml-1">Material Type</label>
                <div className="flex flex-wrap gap-2">
                  {MATERIAL_TYPES.map(m => (
                    <button
                      key={m}
                      onClick={() => setFormData({ ...formData, material_type: m })}
                      className={cn(
                        "px-5 py-3 rounded-2xl text-xs font-black transition-all border-2",
                        formData.material_type === m 
                          ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200" 
                          : "bg-white border-gray-50 text-gray-500 hover:border-gray-100"
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {(suggestedTags.length > 0 || tagLoading) && (
                <div className="space-y-3 pt-2 animate-in fade-in duration-500">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-widest text-[#1a2744]/40 ml-1">Related Topics</label>
                    <span className="text-[10px] font-black text-blue-600 flex items-center gap-1 uppercase tracking-tighter">
                      <Sparkles className="w-3 h-3" /> AI Suggested
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tagLoading ? Array(5).fill(0).map((_, i) => <div key={i} className="h-8 w-20 bg-gray-50 animate-pulse rounded-full" />) : 
                      suggestedTags.map(tag => (
                        <button key={tag} onClick={() => addTag(tag)} disabled={formData.tags.includes(tag)}
                          className={cn("px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-tight transition-all",
                            formData.tags.includes(tag) ? "bg-gray-100 text-gray-300 cursor-not-allowed" : "bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100")}>
                          + {tag}
                        </button>
                      ))
                    }
                  </div>
                </div>
              )}
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {formData.tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-tight border border-blue-100">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-blue-800">
                        <X className="w-3 h-3" />
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
            <div className="space-y-1">
              <h2 className="text-xl font-black text-[#1a2744]">Showcase Your Material</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Step 2: Upload & AI Quality Check</p>
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
            <div className="space-y-1">
              <h2 className="text-xl font-black text-[#1a2744]">Set Your Price</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Step 3: Smart Pricing & Final Review</p>
            </div>

            <Card className="rounded-[2.5rem] border-2 border-blue-50 bg-blue-50/30 overflow-hidden">
              <CardContent className="p-8">
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-black text-[#1a2744] uppercase tracking-tight">Market Insights</h3>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Lowest</p>
                    <p className="text-lg font-black text-[#1a2744]">₹{priceData?.min || 20}</p>
                  </div>
                  <div className="text-center border-x border-blue-100">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Median</p>
                    <p className="text-2xl font-black text-blue-600">₹{priceData?.median || 50}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Highest</p>
                    <p className="text-lg font-black text-[#1a2744]">₹{priceData?.max || 150}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-xs font-black text-[#1a2744] uppercase tracking-widest">Your Price</label>
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full",
                      formData.price <= (priceData?.median || 50) ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                    )}>
                      {formData.price <= (priceData?.median || 50) ? 'Fast Sale Likely' : 'Premium Entry'}
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-black text-gray-300">₹</span>
                    <input 
                      type="number"
                      className="w-full h-20 pl-14 pr-6 text-4xl font-black bg-white rounded-[1.5rem] border-2 border-transparent focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-[#1a2744]"
                      value={formData.price || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setFormData({ ...formData, price: 0 });
                        } else {
                          // Prevent leading zeros by parsing and converting back to number
                          const parsed = parseInt(val, 10);
                          setFormData({ ...formData, price: isNaN(parsed) ? 0 : parsed });
                        }
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-[#1a2744]/40 ml-1">Live Preview</label>
              <div className="scale-[0.98] origin-top opacity-90 transition-all hover:opacity-100">
                <div className="bg-white rounded-[2rem] border-2 border-gray-100 p-5 shadow-sm">
                   <div className="aspect-[4/3] rounded-[1.5rem] bg-gray-50 mb-4 overflow-hidden relative border border-gray-100">
                      {formData.images[0] ? (
                        <img src={`${API_BASE_URL}${formData.images[0].url}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Camera className="w-10 h-10 text-gray-200" /></div>
                      )}
                      <div className="absolute top-4 right-4 bg-blue-600 text-white text-[12px] font-black px-3 py-1.5 rounded-xl shadow-lg">₹{formData.price}</div>
                   </div>
                   <h4 className="text-lg font-black text-[#1a2744] truncate">{formData.title || 'Untitled Material'}</h4>
                   <p className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-wider">{formData.subject_code} • {formData.material_type}</p>
                   <div className="flex items-center justify-between mt-5 pt-5 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-black text-blue-600">
                          {profile?.full_name?.charAt(0)}
                        </div>
                        <span className="text-[11px] font-black text-[#1a2744] uppercase tracking-tighter">{profile?.full_name}</span>
                      </div>
                      <Badge className="bg-blue-50 text-blue-600 border-none px-3 py-1 text-[9px] font-black tracking-widest uppercase">Verified Seller</Badge>
                   </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-[60]">
        <div className="max-w-xl mx-auto flex gap-3">
          {step > 1 ? (
            <button onClick={handleBack} className="flex-1 h-16 rounded-2xl border-2 border-gray-50 flex items-center justify-center font-black text-gray-400 hover:bg-gray-50 transition-all active:scale-95">
              <ArrowLeft className="w-6 h-6 mr-2" /> Back
            </button>
          ) : (
            <button onClick={() => navigate('/')} className="flex-1 h-16 rounded-2xl border-2 border-gray-50 flex items-center justify-center font-black text-gray-400 hover:bg-gray-50 transition-all active:scale-95">
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
              "flex-[2] h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-xl shadow-blue-200 transition-all active:scale-95 hover:translate-y-[-2px] disabled:opacity-30 disabled:pointer-events-none",
              step === 3 && "bg-[#1a2744]"
            )}
          >
            {step < 3 ? (<>Continue <ArrowRight className="w-6 h-6 ml-2" /></>) : (
              <>{loading ? 'Listing...' : <><Send className="w-6 h-6 mr-2" /> List Now</>}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

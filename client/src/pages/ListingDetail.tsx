import { useEffect, useState } from 'react';
import { API_URL, API_BASE_URL } from '@/config';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { MessageSquare, ShieldAlert, ArrowLeft, Trash2, FileText, Sparkles, Share2, Copy, MessageCircle, ChevronRight, MessageCircleCode } from 'lucide-react';
import { useToast } from '@/components/ui/toast-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { listingService } from '@/services/listingService';
import { cn } from '@/lib/utils';
import { RatingStars } from '@/components/ui/RatingStars';
import { ReviewForm } from '@/components/domain/ReviewForm';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';

export function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, jwt, profile } = useAuth() as any;
  const { toast } = useToast();
  
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [reviews, setReviews] = useState<any[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (id) fetchListing();
  }, [id, jwt]);


  const fetchReviews = async (sellerId?: string, type?: string) => {
    if (!id) return;
    try {
      const url = (type === 'Tutoring' && sellerId) 
        ? `${API_URL}/reviews/user/${sellerId}`
        : `${API_URL}/reviews/listing/${id}`;
        
      const response = await fetch(url);
      const json = await response.json();
      if (response.ok) {
        setReviews(json.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch reviews', e);
    }
  };

  const fetchListing = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/listings/${id}`);
      const json = await response.json();
      
      if (response.ok && json.data) {
        const data = json.data;
        data.profiles = {
          full_name: data.seller_name,
          avatar_url: data.seller_avatar,
          rating_avg: data.rating_avg || 0
        };
        setListing(data);
        saveToCache(data);
        fetchReviews(data.seller_id, data.type);
      } else {
        const cached = await getFromCache(id);
        if (cached) setListing(cached);
        else throw new Error(json.error || 'Failed to load listing');
      }
    } catch (error) {
      const cached = await getFromCache(id);
      if (cached) setListing(cached);
      else console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('campusnotes-db', 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('recent-listings', { keyPath: 'id' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  const saveToCache = async (data: any) => {
    try {
      const db = await openDB();
      const tx = db.transaction('recent-listings', 'readwrite');
      const store = tx.objectStore('recent-listings');
      store.put(data);

      const countRequest = store.count();
      countRequest.onsuccess = () => {
        if (countRequest.result > 20) {
          const getAllRequest = store.getAllKeys();
          getAllRequest.onsuccess = () => {
            if (getAllRequest.result.length > 0) {
              store.delete(getAllRequest.result[0]);
            }
          };
        }
      };
    } catch (e) {
      console.error('Failed to cache listing:', e);
    }
  };

  const getFromCache = async (listingId: string): Promise<any> => {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const request = db.transaction('recent-listings').objectStore('recent-listings').get(listingId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (e) { return null; }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing.title,
          text: `Check out these notes: ${listing.title} for ₹${listing.price || 'Free'} on CampusNotes!`,
          url: window.location.href,
        });
      } catch (err) { console.log('Share failed'); }
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`Check out these notes: ${listing.title} for ₹${listing.price || 'Free'} on CampusNotes! ${window.location.href}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    toast({ title: 'Link copied!', description: 'Listing URL copied to clipboard.', type: 'success' });
  };

  const handleContactSeller = async () => {
    if (!user || !listing || !jwt) return;
    
    if (profile?.verification_status !== 'verified') {
      toast({ 
        title: 'Verification Required', 
        description: 'You must verify your student ID to contact sellers.',
        type: 'error'
      });
      navigate('/profile?action=verify');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/messages/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify({
          listing_id: listing.id,
          seller_id: listing.seller_id
        })
      });

      const json = await response.json();
      if (!response.ok) throw new Error(json.error);
      
      const conv = json.data;
      if (conv?.id) {
        navigate(`/messages?conv=${conv.id}`);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Could not start chat', type: 'error' });
    }
  };


  const handleDownload = async () => {
    if (!jwt || !id) return;
    
    if (profile?.verification_status !== 'verified') {
      toast({ 
        title: 'Verification Required', 
        description: 'You must verify your student ID to download notes.',
        type: 'error'
      });
      navigate('/profile?action=verify');
      return;
    }
    try {
      window.open(`${API_URL}/listings/download/${id}?token=${jwt}`, '_blank');
    } catch (e) {
      toast({ title: 'Download Failed', description: 'Could not access the file.', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="w-full aspect-square rounded-2xl" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-32 w-full mt-6" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-md mx-auto p-12 text-center space-y-6">
        <div className="h-20 w-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="h-10 w-10 text-red-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-[#1a2744]">
            {isOffline ? 'You are offline' : 'Oops!'}
          </h2>
          <p className="text-gray-500 text-sm">
            {isOffline 
              ? 'This listing is not cached yet. Connect to the internet to view it.' 
              : 'Listing not found'}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Button onClick={() => window.location.reload()} className="w-full bg-[#1a2744] text-white font-bold h-14 rounded-2xl">
            Retry
          </Button>
          <Button variant="ghost" onClick={() => navigate('/')} className="w-full text-gray-500 font-bold h-14 rounded-2xl">
            Go back home
          </Button>
        </div>
      </div>
    );
  }

  const images = listing?.listing_images || [];
  const firstImageUrl = images[0]?.image_url ? `${API_BASE_URL}${images[0].image_url}` : null;
  const activeImageUrl = images[activeImageIdx]?.image_url ? `${API_BASE_URL}${images[activeImageIdx].image_url}` : null;

  const handleDelete = async () => {
    if (!id || !jwt) return;
    if (!window.confirm("Are you sure you want to delete this listing? This action cannot be undone.")) return;

    try {
      const res = await listingService.deleteListing(id, jwt);
      if (res.error) {
        toast({ title: 'Error', description: res.error, type: 'error' });
      } else {
        toast({ title: 'Listing Deleted', type: 'success' });
        navigate('/my-listings');
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, type: 'error' });
    }
  };

  const isOwner = user?.id === listing.seller_id;

  return (
    <div className="space-y-8 pb-32 lg:pb-16 animate-in fade-in duration-500 w-full px-4 max-w-7xl mx-auto">
      <Helmet>
        <title>{listing.title} | CampusNotes</title>
        <meta name="description" content={`${listing.subject_code} · ₹${listing.price || 'Free'}`} />
        <meta property="og:title" content={`${listing.title} - ₹${listing.price || 'Free'}`} />
        <meta property="og:description" content={`Check out these notes for ${listing.subject_name} (${listing.subject_code}) on CampusNotes.`} />
        {firstImageUrl && <meta property="og:image" content={firstImageUrl} />}
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="website" />
      </Helmet>
      
      {/* Back Button */}
      <div className="pt-6">
        <button 
          onClick={() => navigate(-1)} 
          className="h-12 px-6 flex items-center gap-3 bg-card hover:bg-muted text-foreground/60 hover:text-foreground text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all border border-border/50 shadow-xl active:scale-95 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Discover
        </button>
      </div>

      <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-start">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-6">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square w-full overflow-hidden rounded-[2.5rem] bg-muted border border-border/50 shadow-2xl flex items-center justify-center group/main">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeImageIdx}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4 }}
                  className="h-full w-full"
                >
                  {activeImageUrl ? (
                    <img src={activeImageUrl} alt={listing.title} className="h-full w-full object-cover transition-all duration-700" />
                  ) : (
                    <div className="flex flex-col items-center gap-4 py-20">
                      <div className="p-8 bg-card rounded-3xl shadow-inner border border-border/50">
                        <FileText className="h-16 w-16 text-muted-foreground/30" />
                      </div>
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">No Preview Image</span>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
              
              <div className="absolute top-6 right-6 lg:block hidden">
                 <div className={cn(
                   "px-6 py-3 rounded-2xl text-lg font-black shadow-2xl backdrop-blur-xl border-2 scale-110",
                   Number(listing.price) === 0 
                    ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/30" 
                    : "bg-primary/20 text-white border-primary/30"
                 )}>
                    {Number(listing.price) === 0 ? 'FREE' : `₹${listing.price}`}
                 </div>
              </div>
              
              <div className="absolute bottom-6 left-6 flex gap-3">
                <div className="bg-background/40 backdrop-blur-md px-5 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase text-white border border-white/20 shadow-2xl">
                    {listing.type || 'Study Notes'}
                </div>
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-4 px-1 no-scrollbar">
                {images.map((img: any, idx: number) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={cn(
                      "relative h-16 w-16 rounded-2xl overflow-hidden flex-shrink-0 border-2 transition-all duration-500 shadow-lg",
                      activeImageIdx === idx ? "border-primary scale-110 shadow-primary/20" : "border-border/50 opacity-40 hover:opacity-100"
                    )}
                  >
                    <img src={`${API_BASE_URL}${img.image_url}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mobile-only Title Section - NOW AT TOP */}
          <div className="space-y-4 lg:hidden">
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-3xl font-black tracking-tighter text-foreground uppercase leading-tight">{listing.title}</h1>
                <div className="text-4xl font-black text-emerald-500 tracking-tighter tabular-nums shrink-0">₹{listing.price > 0 ? listing.price : '0'}</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {listing.subject_code && (
                  <div className="px-3 py-1 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-primary/20">
                    {listing.subject_code}
                  </div>
                )}
                <div className="flex items-center gap-1.5 px-3 py-1 bg-muted text-foreground/60 text-[9px] font-black uppercase tracking-widest rounded-lg border border-border/50">
                  <Share2 className="h-3 w-3" /> Utility
                </div>
              </div>
            </div>

            <div className="h-[1px] bg-border/30 w-full" />
            
            {/* Compact Action Toolbar */}
            <div className="flex items-center gap-2">
               <button onClick={handleWhatsAppShare} className="h-10 w-10 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-500/20 active:scale-90 transition-all">
                 <MessageCircle className="h-4 w-4 fill-current" />
               </button>
               <button onClick={handleCopyLink} className="h-10 w-10 bg-primary/10 text-primary rounded-full flex items-center justify-center border border-primary/20 active:scale-90 transition-all">
                 <Copy className="h-4 w-4" />
               </button>
               <button onClick={handleShare} className="h-10 w-10 bg-muted text-foreground rounded-full flex items-center justify-center border border-border/50 active:scale-90 transition-all">
                 <Share2 className="h-4 w-4" />
               </button>
               <div className="ml-auto flex items-center gap-2">
                  <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Listed In {listing.subject_name || 'General Archive'}</span>
               </div>
            </div>

            <div className="h-[1px] bg-border/30 w-full" />
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h3 className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-40">Project Description</h3>
            <p className="text-foreground font-semibold text-base leading-relaxed opacity-90">
              {listing.description || 'No detailed description provided by the seller.'}
            </p>
          </div>

          {/* AI Quality Score */}
          {listing.ai_score && (
            <div className="bg-card rounded-[2.5rem] p-8 space-y-6 shadow-2xl shadow-black/5 relative overflow-hidden group border border-border/50">
              <div className="absolute -right-6 -top-6 opacity-10 group-hover:rotate-12 group-hover:scale-125 transition-all duration-1000">
                <Sparkles className="h-32 w-32 text-primary" />
              </div>
              
              <div className="flex items-center justify-between relative z-10">
                <div className="space-y-2">
                  <div className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full inline-flex items-center gap-2 text-[8px] font-black uppercase tracking-widest">
                    <Sparkles className="h-3 w-3 fill-primary" />
                    AI Validation
                  </div>
                  <h3 className="text-xl font-black text-foreground tracking-tight">Quality Audit</h3>
                </div>
                <div className="flex items-baseline gap-1 bg-muted/50 p-4 rounded-3xl border border-border/50 shadow-inner">
                  <span className={cn("text-4xl font-black tracking-tighter tabular-nums", 
                    listing.ai_score >= 8 ? "text-emerald-500" : listing.ai_score >= 6 ? "text-amber-500" : "text-danger"
                  )}>
                    {listing.ai_score}
                  </span>
                  <span className="text-[10px] font-black text-muted-foreground opacity-40">/ 10</span>
                </div>
              </div>

              {listing.ai_reasons && (
                <div className="grid grid-cols-1 gap-4 relative z-10 border-t border-border/50 pt-6">
                  {(() => {
                    let reasons = [];
                    try {
                      reasons = typeof listing.ai_reasons === 'string' ? JSON.parse(listing.ai_reasons) : listing.ai_reasons;
                    } catch(e) {
                      reasons = [];
                    }
                    return Array.isArray(reasons) && reasons.map((reason: string, i: number) => (
                      <div key={i} className="flex items-start gap-4 p-4 bg-muted/20 rounded-2xl border border-border/5 hover:border-border transition-colors">
                        <div className="h-5 w-5 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        </div>
                        <p className="text-[11px] font-bold text-foreground leading-relaxed italic opacity-80">"{reason}"</p>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Info - Desktop Only */}
        <div className="hidden lg:col-span-4 lg:block space-y-8 sticky top-6">
          <div className="bg-card rounded-[2.5rem] p-8 border border-border/50 shadow-2xl space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase leading-[0.9]">{listing.title}</h1>
              <div className="flex items-center justify-between">
                 <div className="text-3xl font-black text-primary tracking-tighter tabular-nums">₹{listing.price}</div>
                 <div className="px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full border border-primary/20">
                    {listing.subject_code || 'General'}
                 </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-border/50">
               {isOwner ? (
                 <div className="flex flex-col gap-3">
                   <Button onClick={() => navigate(`/sell?edit=${listing.id}`)} className="h-16 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-xl">Modify Listing</Button>
                   <Button onClick={handleDelete} variant="destructive" className="h-16 rounded-2xl font-black uppercase tracking-widest text-[10px]">Delete Asset</Button>
                 </div>
               ) : (
                 <div className="flex flex-col gap-3">
                    {listing.file_url && (
                      <Button onClick={handleDownload} className="h-16 rounded-2xl bg-emerald-500 text-white font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-emerald-600">
                        <FileText className="mr-3 h-5 w-5" /> Grab Access Now
                      </Button>
                    )}
                    <Button onClick={handleContactSeller} className="h-16 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-xl">
                       <MessageSquare className="mr-3 h-5 w-5" /> {profile?.verification_status !== 'verified' ? 'Verify ID to Contact' : 'Message Seller'}
                    </Button>
                 </div>
               )}
            </div>

            <div className="pt-6 space-y-4">
               <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Quick Share</h4>
               <div className="flex gap-4">
                  <button onClick={handleWhatsAppShare} className="h-12 w-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all">
                    <MessageCircle className="h-5 w-5 fill-current" />
                  </button>
                  <button onClick={handleCopyLink} className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all">
                    <Copy className="h-5 w-5" />
                  </button>
                  <button onClick={handleShare} className="h-12 w-12 bg-muted rounded-xl flex items-center justify-center text-foreground border border-border/50 hover:bg-foreground hover:text-background transition-all">
                    <Share2 className="h-5 w-5" />
                  </button>
               </div>
            </div>
          </div>

          <div className="bg-danger/5 border border-danger/10 p-8 rounded-[2rem] space-y-2">
            <div className="flex items-center gap-3 text-danger">
              <ShieldAlert className="h-5 w-5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Safety First</span>
            </div>
            <p className="text-[10px] font-bold text-foreground opacity-60 leading-relaxed uppercase">Meet in public campus zones like the library for physical exchanges.</p>
          </div>
        </div>
      </div>

      {/* Seller Card & Main Action Flow */}
      <div className="space-y-6">
        <div className="bg-card rounded-[2.5rem] p-6 border border-border/50 shadow-xl shadow-black/5 group hover:shadow-2xl transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="relative">
                <UserAvatar 
                  src={listing.seller_avatar} 
                  seed={listing.seller_id} 
                  size="lg"
                  className="h-16 w-16 border-4 border-card shadow-2xl ring-2 ring-primary/20"
                  alt="Seller"
                />
                <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-emerald-500 rounded-full border-4 border-card flex items-center justify-center">
                  <div className="h-1.5 w-1.5 bg-white rounded-full animate-pulse" />
                </div>
              </div>
              <div>
                <p className="text-lg font-black text-foreground tracking-tight">{listing.seller_name}</p>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center bg-muted/50 px-3 py-1 rounded-xl border border-border/10">
                     <RatingStars rating={Number(listing.seller_rating) || 0} size="sm" />
                     <span className="text-[10px] font-black text-foreground ml-3 tabular-nums">{listing.seller_rating ? Number(listing.seller_rating).toFixed(1) : 'NEW'}</span>
                  </div>
                </div>
              </div>
            </div>
            <button 
              onClick={() => navigate(`/user/${listing.seller_id}`)}
              className="h-12 w-12 bg-muted hover:bg-primary/20 text-muted-foreground hover:text-primary rounded-2xl flex items-center justify-center transition-all border border-border/50 group/arrow active:scale-90"
            >
              <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Primary CTA Block - Mobile Flow */}
        <div className="lg:hidden space-y-4 pt-2">
          {isOwner ? (
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleDelete}
                className="h-16 rounded-[1.5rem] bg-danger/10 text-danger font-black uppercase tracking-widest text-[10px] border border-danger/20 shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
              <button 
                onClick={() => navigate(`/sell?edit=${listing.id}`)}
                className="h-16 rounded-[1.5rem] bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                Modify
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {listing.file_url && (
                <Button 
                  onClick={handleDownload}
                  className="w-full h-16 rounded-[1.5rem] bg-emerald-500 text-white font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-[0.98] flex items-center justify-center"
                >
                  <FileText className="mr-3 h-5 w-5" /> Instant Access
                </Button>
              )}
              <Button 
                onClick={handleContactSeller}
                className="w-full h-16 rounded-[1.5rem] bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center"
              >
                <MessageSquare className="mr-3 h-5 w-5" /> 
                {profile?.verification_status !== 'verified' ? 'Verify to Contact' : 'Message Seller'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="space-y-8 pt-4">
        <div className="flex items-center justify-between relative overflow-hidden">
          <h3 className="text-2xl font-black text-foreground tracking-tighter uppercase">
            Reviews <span className="text-primary opacity-60 text-lg ml-2 tabular-nums">({reviews.length})</span>
          </h3>
          {!isOwner && user && !showReviewForm && (
            <button 
              onClick={() => setShowReviewForm(true)} 
              className="px-6 py-2.5 bg-primary/20 hover:bg-primary text-primary hover:text-white border-2 border-primary/40 rounded-2xl shadow-xl transition-all text-[10px] font-black uppercase tracking-widest active:scale-95"
            >
              Post Feedback
            </button>
          )}
        </div>

        {showReviewForm && (
          <div className="bg-card rounded-[2.5rem] p-8 border border-border shadow-3xl animate-in slide-in-from-top duration-500">
            <ReviewForm 
              listingId={listing.id} 
              revieweeId={listing.seller_id} 
              onSuccess={(newAvg) => {
                setShowReviewForm(false);
                fetchReviews(listing.seller_id, listing.type);
                setListing((prev: any) => ({
                  ...prev,
                  seller_rating: newAvg
                }));
              }}
              onCancel={() => setShowReviewForm(false)}
            />
          </div>
        )}

        {reviews.length === 0 ? (
          <div className="text-center py-10 bg-muted/10 rounded-[3rem] border-2 border-dashed border-border/50 text-muted-foreground/40 flex flex-col items-center gap-4">
            <MessageSquare size={48} strokeWidth={1.5} className="opacity-80" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">No reviews yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence>
              {reviews.map((review, i) => (
                <motion.div 
                   key={review.id}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: i * 0.05 }}
                   className="p-8 rounded-[2.5rem] bg-card border border-border/50 space-y-6 shadow-xl relative group"
                >
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-4">
                       <UserAvatar 
                         src={review.reviewer_avatar} 
                         seed={review.reviewer_id} 
                         size="md"
                         className="h-10 w-10 border-2 border-card shadow-xl ring-1 ring-primary/10"
                         alt="Reviewer"
                       />
                       <div>
                         <span className="text-sm font-black text-foreground block tracking-tight">{review.reviewer_name}</span>
                         <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-30">
                           {new Date(review.created_at).toLocaleDateString()}
                         </span>
                       </div>
                     </div>
                     <div className="bg-muted/50 p-2 rounded-xl border border-border/50">
                        <RatingStars rating={review.rating} size="sm" />
                     </div>
                   </div>
                   <div className="p-1">
                     <p className="text-sm text-foreground font-semibold leading-relaxed opacity-90">
                       "{review.comment}"
                     </p>
                   </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Safety & Guide */}
      <div className="flex items-center gap-6 p-8 rounded-[2.5rem] bg-danger/5 border border-danger/10 shadow-xl shadow-danger/5 relative overflow-hidden group">
        <div className="h-16 w-16 bg-danger/10 rounded-2xl flex items-center justify-center shrink-0 border border-danger/20 group-hover:rotate-12 transition-all duration-500 shadow-inner">
          <ShieldAlert className="h-8 w-8 text-danger" />
        </div>
        <div className="space-y-1 relative z-10">
          <p className="text-[10px] font-black text-danger uppercase tracking-[0.3em]">Guardian Protocol</p>
          <p className="text-xs font-bold text-foreground opacity-80 leading-relaxed">Exchange assets in high-visibility zones. Verify note quality before digital confirmation.</p>
        </div>
        <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-danger/5 rounded-full blur-3xl pointer-events-none" />
      </div>
    </div>
  );
}

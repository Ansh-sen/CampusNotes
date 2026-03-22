import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, ShieldAlert, ArrowLeft, Trash2, FileText, Sparkles, Share2, Copy, MessageCircle } from 'lucide-react';
import { useToast } from '@/components/ui/toast-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { listingService } from '@/services/listingService';
import { cn } from '@/lib/utils';
import { RatingStars } from '@/components/ui/RatingStars';
import { ReviewForm } from '@/components/domain/ReviewForm';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Helmet } from 'react-helmet-async';

export function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, jwt } = useAuth() as any;
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
      // For Tutoring, we show all reviews of the tutor to build trust
      const url = (type === 'Tutoring' && sellerId) 
        ? `http://localhost:3001/api/reviews/user/${sellerId}`
        : `http://localhost:3001/api/reviews/listing/${id}`;
        
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
      const response = await fetch(`http://localhost:3001/api/listings/${id}`);
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
    
    try {
      const response = await fetch('http://localhost:3001/api/messages/conversations', {
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
    try {
      // Use the secure download route which returns the file - since it's free, any authenticated user can download
      window.open(`http://localhost:3001/api/listings/download/${id}?token=${jwt}`, '_blank');
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
      <div className="max-w-screen-sm mx-auto p-12 text-center space-y-6">
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
  const firstImageUrl = images[0]?.image_url ? `http://localhost:3001${images[0].image_url}` : null;
  const activeImageUrl = images[activeImageIdx]?.image_url ? `http://localhost:3001${images[activeImageIdx].image_url}` : null;

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
    <div className="space-y-6 pb-24 animate-in fade-in duration-300">
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
      <button onClick={() => navigate(-1)} className="flex items-center text-sm font-medium text-[hsl(var(--text-muted))] mb-2 hover:text-[hsl(var(--text))]">
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to listings
      </button>

      {/* Image Gallery */}
      <div className="space-y-3">
        <div className="relative aspect-square sm:aspect-video w-full overflow-hidden rounded-3xl bg-slate-100 border border-gray-100 shadow-inner flex items-center justify-center">
          {activeImageUrl ? (
            <img src={activeImageUrl} alt={listing.title} className="h-full w-full object-cover transition-all duration-500" />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <FileText className="h-16 w-16 text-slate-400" />
              <span className="text-sm font-bold text-slate-400">No images available</span>
            </div>
          )}
          <div className="absolute top-4 right-4">
             <Badge variant={Number(listing.price) === 0 ? "success" : "secondary"} className="text-sm px-3 py-1 shadow-lg scale-110 origin-top-right">
                {Number(listing.price) === 0 ? 'Free' : `₹${listing.price}`}
             </Badge>
          </div>
          
          {/* Status Badges */}
          <div className="absolute bottom-4 left-4 flex gap-2">
            <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase text-[#1a2744] shadow-sm">
                {listing.type || 'Notes'}
            </span>
            {listing.item_condition && (
               <span className="bg-black/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase text-white shadow-sm">
                  {listing.item_condition}
               </span>
            )}
          </div>
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 px-1 scrollbar-hide">
            {images.map((img: any, idx: number) => (
              <button 
                key={idx}
                onClick={() => setActiveImageIdx(idx)}
                className={cn(
                  "relative h-16 w-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all",
                  activeImageIdx === idx ? "border-[#1a2744] scale-105 shadow-md" : "border-transparent opacity-60"
                )}
              >
                <img src={`http://localhost:3001${img.image_url}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* AI Quality Score */}
      {listing.ai_score && (
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-3xl p-6 space-y-4 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 opacity-10 group-hover:rotate-12 transition-transform duration-700">
            <Sparkles className="h-24 w-24 text-indigo-600" />
          </div>
          
          <div className="flex items-center justify-between relative z-10">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="h-4 w-4 fill-indigo-600 text-indigo-600" />
                AI Quality Score
              </h3>
              <p className="text-[10px] font-bold text-indigo-400 uppercase">Powered by Claude Vision</p>
            </div>
            <div className="flex items-baseline gap-1">
            <span className={cn("text-4xl font-black tracking-tighter", 
              listing.ai_score >= 8 ? "text-green-600" : listing.ai_score >= 6 ? "text-amber-500" : "text-red-500"
            )}>
              {listing.ai_score}
            </span>
            <span className="text-sm font-bold text-gray-300">/10</span>
          </div>
          </div>

          {listing.ai_reasons && (
            <div className="space-y-2 relative z-10">
              {(() => {
                let reasons = [];
                try {
                  reasons = typeof listing.ai_reasons === 'string' ? JSON.parse(listing.ai_reasons) : listing.ai_reasons;
                } catch(e) {
                  reasons = [];
                }
                return Array.isArray(reasons) && reasons.map((reason: string, i: number) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="h-4 w-4 rounded-full bg-indigo-200/50 flex items-center justify-center shrink-0 mt-0.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                    </div>
                    <p className="text-xs font-medium text-indigo-800 leading-relaxed opacity-80">{reason}</p>
                  </div>
                ));
              })()}
            </div>
          )}
        </div>
      )}

      {/* Share Actions */}
      <div className="px-6 space-y-4">
        <div className="h-[1px] bg-gray-100 w-full" />
        <div className="flex items-center justify-between gap-3">
          <button 
            onClick={handleWhatsAppShare}
            className="flex-1 flex flex-col items-center justify-center gap-2 p-4 bg-green-50 rounded-[2rem] border border-green-100 hover:bg-green-100 transition-all group"
          >
            <div className="h-10 w-10 bg-white rounded-2xl flex items-center justify-center text-green-600 shadow-sm group-hover:scale-110 transition-transform">
              <MessageCircle className="h-5 w-5 fill-green-600" />
            </div>
            <span className="text-[10px] font-black text-green-800 uppercase">WhatsApp</span>
          </button>
          <button 
            onClick={handleCopyLink}
            className="flex-1 flex flex-col items-center justify-center gap-2 p-4 bg-blue-50 rounded-[2rem] border border-blue-100 hover:bg-blue-100 transition-all group"
          >
            <div className="h-10 w-10 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
              <Copy className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-black text-blue-800 uppercase">{isCopied ? 'Copied!' : 'Copy Link'}</span>
          </button>
          <button 
            onClick={handleShare}
            className="flex-1 flex flex-col items-center justify-center gap-2 p-4 bg-gray-50 rounded-[2rem] border border-gray-100 hover:bg-gray-100 transition-all group"
          >
            <div className="h-10 w-10 bg-white rounded-2xl flex items-center justify-center text-gray-600 shadow-sm group-hover:scale-110 transition-transform">
              <Share2 className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-black text-gray-800 uppercase">Share</span>
          </button>
        </div>
        <div className="h-[1px] bg-gray-100 w-full" />
      </div>

      {/* Title & Tags */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-2xl font-black tracking-tight text-[#1a2744] uppercase leading-tight">{listing.title}</h1>
            <span className="text-2xl font-black text-emerald-600 shrink-0">₹{listing.price}</span>
          </div>
          <div className="flex items-center space-x-2 mt-2">
            {listing.course_code && (
              <span className="font-semibold text-[hsl(var(--primary))] uppercase">{listing.course_code}</span>
            )}
            {listing.course_code && listing.subject && <span className="text-[hsl(var(--muted))]">•</span>}
            {listing.subject && (
              <span className="text-sm text-[hsl(var(--text-muted))]">{listing.subject}</span>
            )}
          </div>
        </div>

        {listing.file_url && jwt && (
          <Button 
            variant="outline" 
            className="rounded-2xl h-12 px-6 border-[#1a2744] text-[#1a2744] font-bold shadow-sm"
            onClick={handleDownload}
          >
            <FileText className="mr-2 h-5 w-5" /> Download Notes
          </Button>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <h3 className="font-semibold text-lg border-b border-[hsl(var(--muted))] pb-2">Description</h3>
        <p className="text-[hsl(var(--text))] text-sm whitespace-pre-wrap leading-relaxed">
          {listing.description || 'No description provided.'}
        </p>
      </div>

      {/* Seller Card */}
      <Card className="bg-[hsl(var(--muted))/50]">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <UserAvatar 
              src={listing.seller_avatar} 
              seed={listing.seller_id} 
              size="md"
              className="border-2 border-white shadow-sm"
              alt="Seller"
            />
            <div>
              <p className="font-semibold text-[hsl(var(--text))]">{listing.seller_name}</p>
              <div className="flex items-center text-xs text-[hsl(var(--text-muted))] space-x-2 mt-0.5">
                <div className="flex items-center">
                  <RatingStars rating={Number(listing.seller_rating) || 0} size="sm" className="mr-2" />
                  <span className="font-bold">{listing.seller_rating ? Math.round(Number(listing.seller_rating) * 10) / 10 : 'New'}</span>
                  {listing.type === 'Tutoring' && (
                    <span className="ml-2 bg-[hsl(var(--warning))/10] text-[hsl(var(--warning))] text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-[hsl(var(--warning))/20]">Tutor Rating</span>
                  )}
                </div>
                <span>•</span>
                <span>{listing.seller_major || 'Student'}</span>
              </div>
            </div>
          </div>
          {/* Navigate to member profile (not in MVP, but could be) */}
        </CardContent>
      </Card>

      {/* Reviews Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[hsl(var(--muted))] pb-2">
          <h3 className="font-semibold text-lg">
            {listing.type === 'Tutoring' ? 'Tutor Reviews' : 'Listing Reviews'} ({reviews.length})
          </h3>
          {!isOwner && user && !showReviewForm && (
            <Button variant="ghost" size="sm" onClick={() => setShowReviewForm(true)} className="text-[#1a2744] font-bold">
              Write a Review
            </Button>
          )}
        </div>

        {showReviewForm && (
          <ReviewForm 
            listingId={listing.id} 
            revieweeId={listing.seller_id} 
            onSuccess={(newAvg) => {
              setShowReviewForm(false);
              fetchReviews(listing.seller_id, listing.type);
              setListing((prev: any) => ({
                ...prev,
                profiles: { ...prev.profiles, rating_avg: newAvg }
              }));
            }}
            onCancel={() => setShowReviewForm(false)}
          />
        )}

        {reviews.length === 0 ? (
          <p className="text-sm text-[hsl(var(--text-muted))] text-center py-4 bg-[hsl(var(--muted))/20] rounded-2xl border border-dashed border-[hsl(var(--muted))]">
            No reviews for this listing yet.
          </p>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div key={review.id} className="p-4 rounded-2xl bg-[hsl(var(--muted))/30] border border-[hsl(var(--muted))] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <UserAvatar 
                      src={review.reviewer_avatar} 
                      seed={review.reviewer_id} 
                      size="sm"
                      alt="Reviewer"
                    />
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold">{review.reviewer_name}</span>
                      <span className="text-[10px] text-[hsl(var(--text-muted))]">•</span>
                      <span className="text-[10px] text-[hsl(var(--text-muted))]">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <RatingStars rating={review.rating} size="sm" />
                </div>
                {review.comment && (
                  <p className="text-sm text-[hsl(var(--text))] leading-relaxed">
                    {review.comment}
                  </p>
                )}
                {review.listing_title && listing.type === 'Tutoring' && (
                  <p className="text-[10px] font-bold text-[hsl(var(--primary))] uppercase tracking-tighter">
                    Service: {review.listing_title}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Safety Banner */}
      <div className="flex items-start space-x-3 rounded-2xl bg-[hsl(var(--accent))/10] p-4 border border-[hsl(var(--accent))/20]">
        <ShieldAlert className="h-6 w-6 text-[hsl(var(--accent))] shrink-0 mt-0.5" />
        <div className="text-sm text-[hsl(var(--text))]">
          <p className="font-semibold text-[hsl(var(--accent))]">Safety First</p>
          <p className="opacity-90 mt-0.5">Always meet in public campus locations like the library, student union, or a campus cafe for exchanges.</p>
        </div>
      </div>

      {/* Fixed Sticky Footer for Contact/Download Buttons */}
      <div className="fixed bottom-20 sm:bottom-0 left-0 right-0 p-4 glass border-t border-gray-100 z-[60] max-w-screen-sm mx-auto flex gap-3 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        {isOwner ? (
          <>
            <Button 
              className="flex-1 h-14 rounded-2xl shadow-lg border-red-100 text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 font-bold" 
              variant="outline"
              onClick={handleDelete}
            >
              <Trash2 className="mr-2 h-5 w-5" />
              Delete Listing
            </Button>
            <Button 
              className="flex-1 h-14 rounded-2xl shadow-lg font-bold" 
              onClick={() => navigate(`/sell?edit=${listing.id}`)}
            >
              Edit Listing
            </Button>
          </>
        ) : (
          <>
            {listing.file_url && (
              <Button 
                onClick={handleDownload}
                className="flex-1 h-14 rounded-2xl bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all"
              >
                <FileText className="mr-2 h-5 w-5" /> Get Notes
              </Button>
            )}
            <Button 
              className={cn(
                "h-14 rounded-2xl shadow-lg font-bold",
                listing.file_url ? "flex-[0.6] bg-white border border-gray-200 text-[#1a2744]" : "flex-1 bg-[#1a2744] text-white"
              )}
              onClick={handleContactSeller}
            >
              <MessageSquare className="mr-2 h-5 w-5" />
              {listing.file_url ? 'Message' : 'Contact Seller'}
            </Button>
          </>
        )}
      </div>
      
    </div>
  );
}

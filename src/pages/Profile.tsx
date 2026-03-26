import React, { useState, useEffect, useMemo } from 'react';
import { API_URL } from '@/config';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { 
  LogOut, BookOpen, MessageSquare, Check, X, 
  Pencil, Dices, Upload, Camera, CheckCircle, 
  Share2, ChevronRight, Star, Copy, Shield, Bell,
  ChevronDown, History as HistoryIcon
} from 'lucide-react';
import { RatingStars } from '@/components/ui/RatingStars';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast-provider';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProgrammes, useBranches, useSemesters } from '@/hooks/useAcademicData';
import { userService } from '@/services/userService';
import { useTheme } from '@/context/ThemeContext';

interface NotificationPrefs {
  messages: boolean;
  reviews: boolean;
  exams: boolean;
  [key: string]: boolean;
}

export function Profile() {
  const { toast } = useToast();
  const { profile, stats, signOut, updateProfile, isLoading, jwt } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'reviews' | 'settings'>('overview');
  const [enrollmentNumber, setEnrollmentNumber] = useState(profile?.enrollment_number || '');
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [userReviews, setUserReviews] = useState<any[]>([]);
  const [myListings, setMyListings] = useState<any[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  // Local Academic State
  const [localAcademic, setLocalAcademic] = useState({
    programme: profile?.programme || '',
    branch: profile?.branch || '',
    semester: profile?.semester || 0
  });

  // Sync with profile if it changes (e.g., on first load)
  useEffect(() => {
    if (profile) {
      setLocalAcademic({
        programme: profile.programme || '',
        branch: profile.branch || '',
        semester: profile.semester || 0
      });
    }
  }, [profile?.programme, profile?.branch, profile?.semester]);

  const { programmes } = useProgrammes();
  const { branches } = useBranches(localAcademic.programme);
  const { semesters } = useSemesters(localAcademic.programme, localAcademic.branch);

  const hasAcademicChanges = useMemo(() => {
    return localAcademic.programme !== (profile?.programme || '') ||
           localAcademic.branch !== (profile?.branch || '') ||
           localAcademic.semester !== (profile?.semester || 0);
  }, [localAcademic, profile]);

  const handleSaveAcademic = async () => {
    try {
      await updateProfile({
        programme: localAcademic.programme,
        branch: localAcademic.branch,
        semester: localAcademic.semester
      });
      toast({ title: 'Academic career updated!', type: 'success' });
    } catch (err: any) {
      toast({ title: 'Update failed', description: err.message, type: 'error' });
    }
  };

  // Stats Logic
  const salesCount = stats?.sold || 0;
  const avgRating = Number(stats?.rating || 0);
  const isTopper = salesCount >= 10 && avgRating >= 4.5;

  const prefs = (profile?.notification_prefs as unknown as NotificationPrefs) || { 
    messages: true, 
    reviews: true, 
    exams: true 
  };

  // Profile Completeness Logic
  const completenessItems = useMemo(() => [
    { label: 'Profile Photo', done: !!profile?.avatar_url, action: () => setIsAvatarModalOpen(true) },
    { label: 'Bio', done: !!profile?.bio, action: () => setActiveTab('settings') },
    { label: 'Academic Details', done: !!(profile?.programme && profile?.branch && profile?.semester), action: () => setActiveTab('settings') },
    { label: 'Email Verified', done: true, action: () => {} },
    { label: 'Student ID Uploaded', done: !!profile?.is_student_verified, action: () => setActiveTab('settings') },
  ], [profile]);

  const completenessPercentage = Math.round(
    (completenessItems.filter(i => i.done).length / completenessItems.length) * 100
  );

  useEffect(() => {
    if (searchParams.get('action') === 'verify') {
      setActiveTab('settings');
      // Scroll to verification section if needed or just switch tab
    }
  }, [searchParams]);

  const fetchUserReviews = async (userId: string) => {
    try {
      const response = await fetch(`${API_URL}/reviews/user/${userId}`);
      const data = await response.json();
      if (response.ok) {
        setUserReviews(data.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch user reviews', e);
    }
  };

  const fetchMyListings = async () => {
    try {
      setLoadingListings(true);
      const response = await fetch(`${API_URL}/listings/me`, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      const data = await response.json();
      if (response.ok) {
        setMyListings(data.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch user listings', e);
    } finally {
      setLoadingListings(false);
    }
  };

  useEffect(() => {
    if (profile?.id) {
      fetchUserReviews(profile.id);
    }
    if (jwt) {
      fetchMyListings();
    }
  }, [profile?.id, jwt]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'college_id') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        if (type === 'avatar') {
          await updateProfile({ avatar_url: base64String });
          setIsAvatarModalOpen(false);
          toast({ title: 'Avatar updated!', type: 'success' });
        } else {
          // If it's college ID, we need enrollment number too
          if (!enrollmentNumber) {
            toast({ title: 'Please enter enrollment number first', type: 'error' });
            return;
          }
          try {
            await userService.submitVerification({
              id_image_url: base64String,
              enrollment_number: enrollmentNumber
            }, jwt!);
            toast({ title: 'Verification submitted!', description: 'Admin will review it soon.', type: 'success' });
            // Profile will be re-fetched or we can optimistically update
            await updateProfile({ verification_status: 'pending' });
          } catch (err: any) {
            toast({ title: 'Failed to submit', description: err.message, type: 'error' });
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopyReferral = () => {
    const code = profile?.referral_code || 'REFER-' + profile?.id?.substring(0, 6).toUpperCase();
    navigator.clipboard.writeText(code);
    toast({ title: 'Referral code copied!', type: 'success' });
  };

  const handleToggleNotify = (type: string) => {
    const updated = { ...prefs, [type]: !prefs[type] };
    updateProfile({ notification_prefs: updated as any });
    toast({ title: 'Preferences updated', type: 'success' });
  };

  const handleToggleListingStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'available' ? 'paused' : 'available';
    try {
      const response = await fetch(`${API_URL}/listings/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}` 
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        setMyListings(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
        toast({ title: `Listing ${newStatus === 'available' ? 'resumed' : 'paused'}`, type: 'success' });
      }
    } catch (e) {
      console.error('Status toggle failed', e);
    }
  };

  if (isLoading || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-bold animate-pulse">Loading Your Profile...</p>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      
      {/* 1. Dark Navy Header (Matches Image) */}
      <div className="bg-primary premium-gradient text-white pt-10 pb-16 px-6 rounded-b-[3.5rem] relative shadow-2xl shadow-primary/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -mr-24 -mt-24 pointer-events-none animate-pulse" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-3xl -ml-12 -mb-12 pointer-events-none" />
        
        {/* Title Bar */}
        <div className="flex justify-between items-center mb-8 relative z-10">
          <h1 className="text-2xl font-black tracking-tight uppercase tracking-widest text-[10px] opacity-60">My Profile</h1>
          <button onClick={() => setActiveTab('settings')} className="h-11 w-11 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center transition-all border border-white/10 backdrop-blur-md active:scale-95">
            <Pencil size={20} className="text-white" />
          </button>
        </div>

        {/* Profile Info Row: Avatar Left, Info Right */}
        <div className="flex items-center gap-6 mb-12 relative z-10">
          <div className="relative shrink-0 group">
             <div className="p-1.5 rounded-full bg-gradient-to-tr from-blue-400 to-indigo-400 ring-4 ring-primary shadow-2xl">
               <UserAvatar 
                 src={profile?.avatar_url} 
                 alt={profile?.full_name || 'User'} 
                 size="lg"
                 className="h-24 w-24 border-4 border-primary"
               />
             </div>
             <button 
               onClick={() => setIsAvatarModalOpen(true)}
               className="absolute bottom-1 right-1 h-10 w-10 bg-white text-primary rounded-full flex items-center justify-center border-4 border-primary shadow-xl active:scale-90 transition-all hover:scale-110"
             >
               <Camera size={18} />
             </button>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h2 className="text-2xl font-black truncate tracking-tight">{profile?.full_name}</h2>
              {!!profile?.is_student_verified && (
                 <CheckCircle size={22} fill="#fbbf24" className="text-primary animate-in zoom-in duration-500" />
              )}
            </div>
            <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.1em] mb-4 leading-relaxed">
              {profile?.programme || 'Course'} • {profile?.branch || 'Major'} • Sem {profile?.semester || '0'} <br/> 
              <span className="opacity-40">{profile?.university || 'Campus Institute'}</span>
            </p>
            
            <div className="flex flex-wrap gap-2">
              {isTopper && (
                <div className="px-3.5 py-1.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md shadow-lg">
                   Verified Topper
                </div>
              )}
              {profile?.verification_status === 'verified' && (
                <div className="px-3.5 py-1.5 bg-white/10 text-white border border-white/20 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md shadow-lg">
                   Verified Student
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. Integrated 4-Stat Summary Bar */}
        <div className="grid grid-cols-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-[2rem] py-5 relative z-10 divide-x divide-white/10 shadow-2xl">
          <StatItem label="Sales" value={stats?.sold || 0} />
          <StatItem label="Rating" value={avgRating.toFixed(1)} />
          <StatItem label="Earned" value={`₹${(Number(stats?.earned || 0) / 1000).toFixed(1)}k`} />
          <StatItem label="Listings" value={stats?.total || 0} />
        </div>
      </div>

      {/* 3. Tab Navigation (Pill Style) */}
      <div className="px-6 -mt-8 relative z-20">
        <div className="flex bg-card/80 backdrop-blur-xl p-1.5 rounded-[2rem] shadow-2xl border border-border/50 overflow-x-auto scrollbar-hide no-scrollbar max-w-sm mx-auto">
          <TabButton label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
          <TabButton label="Listings" active={activeTab === 'listings'} onClick={() => setActiveTab('listings')} />
          <TabButton label="Reviews" active={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')} />
          <TabButton label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </div>
      </div>

      {/* 4. Tab Content */}
      <div className="p-5 pt-8 pb-32 max-w-md mx-auto overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && (
              <div className="space-y-6 text-left">
                {/* Profile Completeness */}
                <div className="bg-card rounded-[2.5rem] p-8 border border-border/50 shadow-xl shadow-black/5 relative overflow-hidden group">
                  <div className="flex justify-between items-center mb-8 relative z-10">
                    <h3 className="text-xl font-black text-foreground tracking-tight">Profile Completeness</h3>
                    <span className="text-primary font-black text-2xl tabular-nums">{completenessPercentage}%</span>
                  </div>
                  <div className="h-4 bg-muted rounded-full overflow-hidden mb-10 shadow-inner relative z-10">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${completenessPercentage}%` }}
                      className="h-full bg-primary shadow-[0_0_20px_var(--primary-glow)] relative overflow-hidden" 
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                    </motion.div>
                  </div>
                  <div className="space-y-3 relative z-10">
                    {completenessItems.map((item, idx) => (
                      <button 
                        key={idx} 
                        onClick={item.action}
                        disabled={item.done}
                        className="flex items-center justify-between w-full p-5 rounded-2xl hover:bg-muted/50 transition-all text-left border border-transparent hover:border-border/50 group/item active:scale-[0.98]"
                      >
                        <div className="flex items-center gap-5">
                          <div className={cn(
                            "h-8 w-8 rounded-xl flex items-center justify-center border-2 transition-all duration-500",
                            item.done ? "bg-emerald-500 border-emerald-500 text-white shadow-xl shadow-emerald-500/20 scale-110" : "border-border text-transparent"
                          )}>
                            <Check size={18} strokeWidth={4} />
                          </div>
                          <span className={cn("font-black text-xs uppercase tracking-widest transition-colors", item.done ? "text-muted-foreground line-through opacity-40" : "text-foreground group-hover/item:text-primary")}>
                            {item.label}
                          </span>
                        </div>
                        {!item.done && <ChevronRight size={18} className="text-muted-foreground group-hover/item:text-primary transition-transform group-hover/item:translate-x-1" />}
                      </button>
                    ))}
                  </div>
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                </div>

                {/* Referral Card */}
                <div className="bg-gradient-to-br from-[#1a2744] to-[#2563eb] rounded-[1.5rem] p-6 text-white shadow-xl relative overflow-hidden group">
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className="h-14 w-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-xl group-hover:rotate-12 transition-transform">
                        <Share2 size={28} />
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-60">Partner Program</p>
                        <h4 className="text-2xl font-black">Topper Boost</h4>
                      </div>
                    </div>
                    <p className="text-sm opacity-90 mb-8 font-medium leading-relaxed">
                      Refer a classmate and unlock <span className="font-black text-blue-200 underline underline-offset-4 decoration-white/30">3 Days Boost</span> for your notes rank!
                    </p>
                    
                    <div className="flex items-center gap-4 bg-white/10 border border-white/20 rounded-xl p-4 backdrop-blur-md shadow-inner">
                      <div className="flex-1">
                        <p className="text-[10px] font-black uppercase opacity-50 mb-1 tracking-widest">Unique Code</p>
                        <p className="font-mono text-xl font-bold tracking-[0.1em]">REFER-ANS-42</p>
                      </div>
                      <button 
                        onClick={handleCopyReferral}
                        className="h-14 w-14 flex items-center justify-center bg-white text-blue-600 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-2xl"
                      >
                        <Copy size={24} />
                      </button>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                </div>
              </div>
            )}

            {activeTab === 'listings' && (
              <div className="space-y-4 text-left">
                {loadingListings ? (
                   <div className="space-y-4 text-left">
                      {[1,2,3].map(i => <div key={i} className="h-28 bg-card rounded-[2.5rem] animate-pulse border border-border/50 shadow-sm" />)}
                   </div>
                ) : myListings.length === 0 ? (
                  <div className="text-center py-24 bg-card rounded-[3rem] border-2 border-dashed border-border/50 shadow-inner">
                    <div className="h-20 w-20 bg-muted rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                      <BookOpen size={40} className="text-muted-foreground/30" />
                    </div>
                    <h3 className="text-2xl font-black text-foreground mb-2 tracking-tight">No active listings</h3>
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest opacity-60 mb-10">Share your knowledge with others</p>
                    <Button onClick={() => navigate('/create')} className="rounded-[1.5rem] h-14 px-10 font-black bg-primary text-white shadow-2xl shadow-primary/20 uppercase tracking-widest text-[10px] active:scale-95 transition-all">Create Listing</Button>
                  </div>
                ) : (
                  myListings.map(listing => (
                    <div key={listing.id} className="bg-card rounded-[2.5rem] p-5 border border-border/50 shadow-xl shadow-black/5 hover:shadow-2xl transition-all flex items-center gap-5 group active:scale-[0.98]">
                       <div className="h-20 w-20 bg-muted rounded-[2rem] flex items-center justify-center shrink-0 border border-border/50 group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner">
                          <BookOpen size={32} />
                       </div>
                       <div className="flex-1 min-w-0">
                          <h4 className="font-black text-foreground truncate mb-1.5 text-lg tracking-tight">{listing.title}</h4>
                          <span className={cn(
                            "px-4 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border",
                            listing.status === 'available' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-muted text-muted-foreground border-border"
                          )}>
                            {listing.status}
                          </span>
                       </div>
                       <div className="flex flex-col gap-2">
                          <button onClick={() => navigate(`/create?edit=${listing.id}`)} className="h-11 w-11 bg-muted/50 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-2xl flex items-center justify-center transition-all border border-border/50 active:scale-90">
                            <Pencil size={18} />
                          </button>
                          <button onClick={() => handleToggleListingStatus(listing.id, listing.status)} className="h-11 w-11 bg-muted/50 hover:bg-danger/10 text-muted-foreground hover:text-danger rounded-2xl flex items-center justify-center transition-all border border-border/50 active:scale-90">
                             {listing.status === 'available' ? <X size={18} /> : <Check size={18} className="text-emerald-500" />}
                          </button>
                       </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6 text-left">
                {/* Aggregate Summary */}
                <div className="bg-card rounded-[2.5rem] p-8 border border-border/50 shadow-xl shadow-black/5 flex justify-between items-center relative overflow-hidden group">
                  <div className="relative z-10">
                    <h3 className="text-2xl font-black text-foreground tracking-tight mb-2">Verified Reviews</h3>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">Verified Feedbacks</p>
                  </div>
                  <div className="flex items-center gap-4 relative z-10 bg-background/50 backdrop-blur-md p-4 rounded-3xl border border-border/50 shadow-inner">
                     <Star size={32} fill="var(--primary)" className="text-primary animate-pulse" />
                     <div className="text-right">
                        <div className="text-3xl font-black text-foreground tabular-nums leading-none tracking-tighter">{avgRating.toFixed(1)}</div>
                        <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">({userReviews.length})</div>
                     </div>
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                </div>

                <div className="space-y-5">
                  {userReviews.length === 0 ? (
                    <div className="text-center py-24 bg-card rounded-[3rem] border-2 border-dashed border-border/50 shadow-inner">
                      <div className="h-20 w-20 bg-muted rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                        <MessageSquare size={40} className="text-muted-foreground/30" />
                      </div>
                      <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.3em] opacity-40">No feedback yet</p>
                    </div>
                  ) : (
                    userReviews.map(review => (
                      <div key={review.id} className="bg-card rounded-[2.5rem] p-6 border border-border/50 shadow-xl hover:shadow-2xl transition-all space-y-5 relative group active:scale-[0.99]">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-4">
                            <UserAvatar src={review.reviewer_avatar} seed={review.reviewer_id} size="lg" className="h-14 w-14 shadow-2xl shadow-black/10 ring-2 ring-primary/20" />
                            <div>
                               <p className="font-black text-foreground tracking-tight">{review.reviewer_name}</p>
                               <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-40 mt-1">
                                  {new Date(review.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                               </p>
                            </div>
                          </div>
                          <div className="bg-muted/50 p-2 rounded-xl border border-border/50 backdrop-blur-sm">
                             <RatingStars rating={review.rating} size="sm" />
                          </div>
                        </div>
                        <div className="bg-muted/30 p-5 rounded-[1.5rem] border border-border/20 shadow-inner relative">
                          <p className="text-[9px] text-primary font-black uppercase tracking-[0.2em] mb-3 opacity-60">
                             {review.listing_title}
                          </p>
                          <p className="text-foreground font-bold text-sm leading-relaxed italic opacity-90">"{review.comment}"</p>
                          <div className="absolute top-4 right-4 text-primary opacity-5">
                            <MessageSquare size={40} />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6 text-left">
                {/* ID Verification */}
                <div className="bg-card rounded-[2.5rem] p-8 border border-border/50 shadow-xl shadow-black/5 relative overflow-hidden group">
                  <div className="flex items-center gap-6 mb-12 relative z-10">
                    <div className={cn(
                      "h-20 w-20 rounded-[2rem] flex items-center justify-center transition-all duration-500 shadow-2xl relative",
                      profile?.is_student_verified ? "bg-primary text-white shadow-primary/20 scale-110" : "bg-muted text-muted-foreground"
                    )}>
                      <Shield size={36} />
                      {profile?.is_student_verified && (
                        <div className="absolute -top-2 -right-2 h-8 w-8 bg-amber-400 rounded-full flex items-center justify-center border-4 border-card animate-in zoom-in duration-700">
                          <Check size={16} strokeWidth={4} className="text-primary" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-foreground tracking-tight">Trust Badge</h3>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60 mt-1">Campus Verification</p>
                    </div>
                  </div>

                  {profile?.verification_status === 'verified' ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 flex items-center gap-5 text-emerald-500 font-black relative z-10 shadow-inner backdrop-blur-md">
                      <div className="h-10 w-10 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <CheckCircle size={24} fill="white" className="text-emerald-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs">Partner Level Account</p>
                        <p className="text-[10px] opacity-60 font-black uppercase tracking-widest mt-0.5">Verified Institutional Access</p>
                      </div>
                    </div>
                  ) : profile?.verification_status === 'pending' ? (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-6 flex flex-col gap-3 relative z-10 shadow-inner backdrop-blur-md">
                      <div className="flex items-center gap-5 text-amber-700 font-black">
                        <div className="h-10 w-10 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                          <HistoryIcon size={24} className="text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs tracking-tight">System Review In Progress</p>
                          <p className="text-[10px] opacity-60 font-black uppercase tracking-widest mt-0.5">Wait approx 24 hours</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6 relative z-10">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] pl-1 opacity-60">Enrollment ID</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 0101CS211001"
                          value={enrollmentNumber}
                          onChange={(e) => setEnrollmentNumber(e.target.value)}
                          className="w-full h-14 bg-muted/30 border border-border/50 rounded-2xl px-6 text-sm font-black text-foreground focus:bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none shadow-inner placeholder:text-muted-foreground/20"
                        />
                      </div>
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-[3rem] py-16 hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all group/btn bg-muted/20 shadow-inner relative overflow-hidden active:scale-[0.98]">
                        <div className="h-20 w-20 bg-card rounded-3xl flex items-center justify-center mb-6 group-hover/btn:bg-primary group-hover/btn:text-white transition-all shadow-xl border border-border/50">
                            <Upload size={36} />
                        </div>
                        <span className="text-xl font-black text-foreground mb-1.5 tracking-tight group-hover/btn:text-primary">Upload Institution ID</span>
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-40">JPG, PNG up to 5MB</span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'college_id')} />
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                      </label>
                      {profile?.verification_status === 'rejected' && (
                        <div className="p-6 bg-danger/10 border border-danger/20 rounded-3xl shadow-inner animate-in shake duration-500">
                          <p className="text-[10px] font-black text-danger uppercase tracking-[0.2em] mb-2">Submission Rejected</p>
                          <p className="text-xs font-bold text-danger leading-relaxed">{profile.verification_rejected_reason || "ID image was not clear. Please try again."}</p>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
                </div>

                {/* Academic Profile */}
                <div className="bg-card rounded-[2.5rem] p-8 border border-border/50 shadow-xl shadow-black/5 space-y-8 relative overflow-hidden group">
                   <div className="flex items-center gap-4 relative z-10">
                      <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center shadow-inner border border-primary/20">
                        <BookOpen size={24} className="text-primary" />
                      </div>
                      <h3 className="text-xl font-black text-foreground tracking-tight">Academic Profile</h3>
                   </div>
                   <div className="space-y-6 relative z-10">
                      <AcademicSelect 
                        label="Academic Programme" 
                        value={localAcademic.programme} 
                        options={programmes}
                        onChange={(val: string) => {
                          setLocalAcademic(prev => ({ 
                            ...prev, 
                            programme: val, 
                            branch: '', 
                            semester: 0 
                          }));
                        }} 
                      />
                      
                      <AcademicSelect 
                        label="Degree / Specialization" 
                        value={localAcademic.branch} 
                        options={branches}
                        disabled={!localAcademic.programme}
                        onChange={(val: string) => {
                          setLocalAcademic(prev => ({ 
                            ...prev, 
                            branch: val, 
                            semester: 0 
                          }));
                        }} 
                      />

                      <AcademicSelect 
                        label="Active Semester" 
                        value={localAcademic.semester?.toString() || ''} 
                        options={semesters.map(String)}
                        disabled={!localAcademic.branch}
                        onChange={(val: string) => {
                          setLocalAcademic(prev => ({ 
                            ...prev, 
                            semester: parseInt(val) || 0 
                          }));
                        }} 
                      />

                      {hasAcademicChanges && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="pt-4"
                        >
                          <Button 
                            onClick={handleSaveAcademic}
                            className="w-full h-16 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[10px] rounded-[1.5rem] shadow-2xl shadow-primary/20 transition-all active:scale-[0.98]"
                          >
                            Update Academic Journey
                          </Button>
                        </motion.div>
                      )}

                      <AcademicInput 
                        label="Biographical Note" 
                        value={profile?.bio} 
                        onSave={(val) => updateProfile({ bio: val })} 
                      />
                   </div>
                   <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                </div>

                {/* Theme Settings */}
                <div className="bg-card rounded-[2.5rem] p-8 border border-border/50 shadow-xl shadow-black/5 space-y-8 relative overflow-hidden group">
                   <div className="flex items-center gap-4 relative z-10">
                      <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center shadow-inner border border-primary/20">
                        {theme === 'system' ? <Dices size={24} className="text-primary" /> : theme === 'dark' ? <Shield size={24} className="text-primary" /> : <Star size={24} className="text-primary" />}
                      </div>
                      <h3 className="text-xl font-black text-foreground tracking-tight">Focus Theme</h3>
                   </div>
                   <div className="grid grid-cols-3 gap-3 relative z-10">
                      <ThemeOption label="Light" active={theme === 'light'} onClick={() => setTheme('light')} />
                      <ThemeOption label="Dark" active={theme === 'dark'} onClick={() => setTheme('dark')} />
                      <ThemeOption label="Auto" active={theme === 'system'} onClick={() => setTheme('system')} />
                   </div>
                   <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                </div>

                {/* Notify Settings */}
                <div className="bg-card rounded-[2.5rem] p-8 border border-border/50 shadow-xl shadow-black/5 space-y-8 relative overflow-hidden group">
                   <div className="flex items-center gap-4 relative z-10">
                      <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center shadow-inner border border-primary/20">
                        <Bell size={24} className="text-primary" />
                      </div>
                      <h3 className="text-xl font-black text-foreground tracking-tight">System Preferences</h3>
                   </div>
                   <div className="space-y-4 divide-y divide-border/50 relative z-10">
                      <NotifyToggle label="Real-time Chat" enabled={prefs.messages ?? true} onToggle={() => handleToggleNotify('messages')} />
                      <NotifyToggle label="Market Feedback" enabled={prefs.reviews ?? true} onToggle={() => handleToggleNotify('reviews')} />
                      <NotifyToggle label="Campus Updates" enabled={prefs.exams ?? true} onToggle={() => handleToggleNotify('exams')} />
                   </div>
                   <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                </div>

                {/* Logout Button */}
                <button 
                  onClick={signOut}
                  className="w-full h-16 rounded-[2rem] bg-danger/10 text-danger font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-4 hover:bg-danger hover:text-white transition-all duration-500 border border-danger/20 shadow-xl shadow-danger/10 active:scale-95 group mb-10"
                >
                  <LogOut size={22} className="group-hover:-translate-x-1 transition-transform" /> Log out CampusNotes
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Avatar Edit Modal (Premium Design) */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 p-6 backdrop-blur-xl animate-in fade-in duration-500">
           <motion.div 
             initial={{ scale: 0.9, opacity: 0, rotateX: 20 }}
             animate={{ scale: 1, opacity: 1, rotateX: 0 }}
             className="bg-card rounded-[4rem] p-10 w-full max-w-sm space-y-10 shadow-3xl relative border border-border/50 shadow-black/20"
           >
             <button 
               onClick={() => setIsAvatarModalOpen(false)}
               className="absolute top-10 right-10 h-12 w-12 bg-muted hover:bg-muted/80 rounded-2xl flex items-center justify-center transition-all active:scale-90 shadow-inner"
             >
               <X size={20} className="text-muted-foreground" />
             </button>

             <div className="text-center">
               <div className="mx-auto h-24 w-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner border border-primary/20">
                  <Camera size={44} className="text-primary" />
               </div>
               <h2 className="text-3xl font-black text-foreground mb-3 tracking-tight">Identity View</h2>
               <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Customize your presence</p>
             </div>

             <div className="grid grid-cols-1 gap-5">
                <label className="flex items-center gap-6 p-6 bg-primary/10 border border-primary/20 rounded-[2.5rem] cursor-pointer hover:bg-primary hover:text-white transition-all duration-500 group relative overflow-hidden shadow-xl active:scale-[0.98]">
                   <div className="h-16 w-16 bg-card rounded-2xl flex items-center justify-center shadow-2xl group-hover:rotate-6 transition-all duration-500 relative z-10">
                      <Upload size={32} className="text-primary" />
                   </div>
                   <span className="text-xl font-black relative z-10">Upload Photo</span>
                   <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'avatar')} />
                   <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </label>

                <button 
                  onClick={async () => {
                    const seed = Math.random().toString(36).substring(7);
                    const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
                    await updateProfile({ avatar_url: url });
                    setIsAvatarModalOpen(false);
                    toast({ title: 'Avatar randomized!', type: 'success' });
                  }}
                  className="flex items-center gap-6 p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-[2.5rem] hover:bg-indigo-500 hover:text-white transition-all duration-500 group relative overflow-hidden shadow-xl active:scale-[0.98]"
                >
                   <div className="h-16 w-16 bg-card rounded-2xl flex items-center justify-center shadow-2xl group-hover:rotate-12 transition-all duration-500 relative z-10">
                      <Dices size={32} className="text-indigo-500" />
                   </div>
                   <span className="text-xl font-black relative z-10">Roll Magic Dice</span>
                   <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
             </div>
           </motion.div>
        </div>
      )}
    </div>
  );
}

// Fixed StatItem for Dark Navy Header
function StatItem({ label, value }: { label: string, value: string | number }) {
  return (
    <div className="flex flex-col items-center justify-center px-4">
      <div className="text-2xl font-black text-white mb-1.5 tracking-tighter tabular-nums">{value}</div>
      <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{label}</div>
    </div>
  );
}

// Refined Tab Button (Pill Style)
function TabButton({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex-1 py-4 text-[10px] font-black rounded-2xl transition-all duration-500 relative z-10 flex items-center justify-center uppercase tracking-[0.1em] mx-1",
        active ? "text-white" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <span className="relative z-20">{label}</span>
      {active && (
        <motion.div 
          layoutId="tab-active-refine"
          className="absolute inset-0 bg-primary rounded-2xl shadow-xl shadow-primary/20 z-10" 
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
    </button>
  );
}

function NotifyToggle({ label, enabled, onToggle }: { label: string, enabled: boolean, onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between py-5 group/toggle">
      <span className="text-sm font-black text-foreground tracking-tight group-hover/toggle:text-primary transition-colors">{label}</span>
      <button 
        onClick={onToggle}
        className={cn(
          "w-14 h-8 rounded-full p-1.5 transition-all duration-500 relative shadow-inner overflow-hidden",
          enabled ? "bg-primary" : "bg-muted"
        )}
      >
        <motion.div 
          animate={{ x: enabled ? 22 : 0 }}
          className="w-5 h-5 bg-white rounded-full shadow-2xl relative z-10"
          transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
        />
        <div className={cn("absolute inset-0 transition-opacity duration-700", enabled ? "opacity-20 bg-white" : "opacity-0")} />
      </button>
    </div>
  );
}

function AcademicInput({ label, value, onSave, type = 'text' }: { label: string, value?: string | null, onSave: (val: string) => void, type?: string }) {
  const [val, setVal] = useState(value || '');

  useEffect(() => {
    setVal(value || '');
  }, [value]);

  return (
    <div className="relative">
      <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] pl-1 mb-2 block opacity-60">{label}</label>
      <div className="relative group">
        <input 
          type={type}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={() => {
            if (val !== value) onSave(val);
          }}
          className="w-full h-14 bg-muted/30 border border-border/50 rounded-2xl px-6 text-sm font-black text-foreground focus:bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none shadow-inner placeholder:text-muted-foreground/20"
        />
      </div>
    </div>
  );
}

function ThemeOption({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex-1 h-14 rounded-2xl flex flex-col items-center justify-center transition-all border font-black text-[10px] uppercase tracking-widest relative overflow-hidden",
        active 
          ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105" 
          : "bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted"
      )}
    >
      <span className="relative z-10">{label}</span>
      {active && <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />}
    </button>
  );
}

// Cascading Academic Select Component
function AcademicSelect({ 
  label, value, options, onChange, disabled = false 
}: { 
  label: string, value: string, options: string[], onChange: (val: string) => void, disabled?: boolean 
}) {
  return (
    <div className="relative">
      <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] pl-1 mb-2 block opacity-60">
        {label}
      </label>
      <div className="relative group">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={cn(
            "w-full h-14 pl-6 pr-12 bg-muted/30 border border-border/50 rounded-2xl text-[13px] font-black outline-none transition-all appearance-none cursor-pointer shadow-inner",
            disabled ? "opacity-30 cursor-not-allowed" : "text-foreground focus:bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-primary/30"
          )}
        >
          <option value="">{disabled ? '-- Locked --' : `Select ${label.split(' / ')[0]}`}</option>
          {options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <ChevronDown 
          size={18} 
          className={cn(
            "absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-500",
            disabled ? "text-muted-foreground/20" : "text-muted-foreground group-focus-within:rotate-180 group-focus-within:text-primary"
          )} 
        />
      </div>
    </div>
  );
}

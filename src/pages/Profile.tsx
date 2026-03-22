import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { 
  LogOut, BookOpen, MessageSquare, Check, X, 
  Pencil, Dices, Upload, Camera, CheckCircle, 
  Share2, ChevronRight, Star, Copy, Shield, Bell
} from 'lucide-react';
import { RatingStars } from '@/components/ui/RatingStars';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast-provider';
import { useNavigate } from 'react-router-dom';

interface NotificationPrefs {
  messages: boolean;
  reviews: boolean;
  exams: boolean;
  [key: string]: boolean;
}

export function Profile() {
  const { toast } = useToast();
  const { profile, stats, signOut, updateProfile, isLoading, jwt } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'reviews' | 'settings'>('overview');
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [userReviews, setUserReviews] = useState<any[]>([]);
  const [myListings, setMyListings] = useState<any[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);

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

  const fetchUserReviews = async (userId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/reviews/user/${userId}`);
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
      const response = await fetch('http://localhost:3001/api/listings/me', {
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
          await updateProfile({ college_id_url: base64String });
          toast({ title: 'College ID uploaded for verification', type: 'success' });
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
      const response = await fetch(`http://localhost:3001/api/listings/${id}`, {
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
    <div className="bg-[#f0f4f8] min-h-screen">
      
      {/* 1. Dark Navy Header (Matches Image) */}
      <div className="bg-[#1a2744] text-white pt-8 pb-14 px-6 rounded-b-[3rem] relative shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
        
        {/* Title Bar */}
        <div className="flex justify-between items-center mb-10 relative z-10">
          <h1 className="text-2xl font-black tracking-tight">My Profile</h1>
          <button onClick={() => setActiveTab('settings')} className="h-11 w-11 bg-white/5 hover:bg-white/15 rounded-xl flex items-center justify-center transition-all border border-white/10">
            <Pencil size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Profile Info Row: Avatar Left, Info Right */}
        <div className="flex items-center gap-6 mb-10 relative z-10">
          <div className="relative shrink-0 group">
             <div className="p-1 rounded-full bg-gradient-to-tr from-blue-400 to-indigo-400 ring-2 ring-[#1a2744] shadow-xl">
               <UserAvatar 
                 src={profile?.avatar_url} 
                 alt={profile?.full_name || 'User'} 
                 size="xl"
                 className="border-2 border-[#1a2744]"
               />
             </div>
             <button 
               onClick={() => setIsAvatarModalOpen(true)}
               className="absolute bottom-1 right-1 h-8 w-8 bg-blue-600 text-white rounded-full flex items-center justify-center border-2 border-[#1a2744] shadow-lg active:scale-90 transition-transform"
             >
               <Camera size={14} />
             </button>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 className="text-2xl font-black truncate">{profile?.full_name}</h2>
              {!!profile?.is_student_verified && (
                 <CheckCircle size={20} fill="#f59e0b" className="text-[#1a2744]" />
              )}
            </div>
            <p className="text-blue-200/60 text-xs font-black uppercase tracking-widest mb-4 leading-relaxed">
              {profile?.programme || 'Branch'} • {profile?.branch || 'Major'} • Sem {profile?.semester || '0'} <br/> {profile?.university || 'Campus Institute'}
            </p>
            
            <div className="flex flex-wrap gap-2">
              {isTopper && (
                <div className="px-3 py-1 bg-[#fef3c7] text-[#92400e] rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm border border-[#fde68a]">
                   Verified Topper
                </div>
              )}
              {!!profile?.is_student_verified && (
                <div className="px-3 py-1 bg-white/10 text-white border border-white/20 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-sm">
                   Verified Student
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. Integrated 4-Stat Summary Bar */}
        <div className="grid grid-cols-4 bg-white/5 border border-white/10 rounded-3xl py-6 relative z-10 divide-x divide-white/10">
          <StatItem label="Sales" value={stats?.sold || 0} />
          <StatItem label="Rating" value={avgRating.toFixed(1)} />
          <StatItem label="Earned" value={`₹${(Number(stats?.earned || 0) / 1000).toFixed(1)}k`} />
          <StatItem label="Listings" value={stats?.total || 0} />
        </div>
      </div>

      {/* 3. Tab Navigation (Pill Style) */}
      <div className="px-6 -mt-7 relative z-20">
        <div className="flex bg-white p-1.5 rounded-[1.5rem] shadow-xl border border-gray-100/50 overflow-x-auto scrollbar-hide">
          <TabButton label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
          <TabButton label="Listings" active={activeTab === 'listings'} onClick={() => setActiveTab('listings')} />
          <TabButton label="Reviews" active={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')} />
          <TabButton label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </div>
      </div>

      {/* 4. Tab Content */}
      <div className="p-6 pt-8 pb-32 max-w-lg mx-auto overflow-x-hidden">
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
                <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm relative overflow-hidden">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-black text-gray-900">Profile Completeness</h3>
                    <span className="text-blue-600 font-black text-xl">{completenessPercentage}%</span>
                  </div>
                  <div className="h-3.5 bg-gray-100 rounded-full overflow-hidden mb-8 shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${completenessPercentage}%` }}
                      className="h-full bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]" 
                    />
                  </div>
                  <div className="space-y-4">
                    {completenessItems.map((item, idx) => (
                      <button 
                        key={idx} 
                        onClick={item.action}
                        disabled={item.done}
                        className="flex items-center justify-between w-full p-5 rounded-2xl hover:bg-gray-50 transition-all text-left border border-transparent hover:border-gray-100 group"
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "h-7 w-7 rounded-xl flex items-center justify-center border-2 transition-all",
                            item.done ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200" : "border-gray-200 text-transparent"
                          )}>
                            <Check size={16} strokeWidth={4} />
                          </div>
                          <span className={cn("font-bold text-sm", item.done ? "text-gray-400" : "text-gray-800")}>
                            {item.label}
                          </span>
                        </div>
                        {!item.done && <ChevronRight size={20} className="text-gray-300 group-hover:text-blue-600" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Referral Card */}
                <div className="bg-gradient-to-br from-[#1a2744] to-[#2563eb] rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden group">
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
                    
                    <div className="flex items-center gap-4 bg-white/10 border border-white/20 rounded-2xl p-5 backdrop-blur-md shadow-inner">
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
                      {[1,2,3].map(i => <div key={i} className="h-28 bg-white rounded-[2rem] animate-pulse border border-gray-100" />)}
                   </div>
                ) : myListings.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-gray-100">
                    <BookOpen size={64} className="mx-auto text-gray-200 mb-4" />
                    <h3 className="text-xl font-black text-gray-900 mb-2">No active listings</h3>
                    <p className="text-sm text-gray-500 mb-8">Share your knowledge with others</p>
                    <Button onClick={() => navigate('/create')} className="rounded-2xl h-14 px-10 font-black bg-blue-600 shadow-xl shadow-blue-200 uppercase tracking-widest text-xs">Create List</Button>
                  </div>
                ) : (
                  myListings.map(listing => (
                    <div key={listing.id} className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all flex items-center gap-5 group">
                       <div className="h-20 w-20 bg-blue-50 rounded-3xl flex items-center justify-center shrink-0 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <BookOpen size={32} />
                       </div>
                       <div className="flex-1 min-w-0">
                          <h4 className="font-black text-gray-900 truncate mb-1 text-lg">{listing.title}</h4>
                          <span className={cn(
                            "px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                            listing.status === 'available' ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"
                          )}>
                            {listing.status}
                          </span>
                       </div>
                       <div className="flex flex-col gap-2">
                          <button onClick={() => navigate(`/create?edit=${listing.id}`)} className="h-10 w-10 bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-xl flex items-center justify-center transition-all border border-gray-100">
                            <Pencil size={18} />
                          </button>
                          <button onClick={() => handleToggleListingStatus(listing.id, listing.status)} className="h-10 w-10 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl flex items-center justify-center transition-all border border-gray-100">
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
                {/* Aggregate Summary (Matches Image) */}
                <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-black text-gray-900 mb-1">Reviews received</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Verified Feedbacks</p>
                  </div>
                  <div className="flex items-center gap-3">
                     <Star size={24} fill="#f59e0b" className="text-[#f59e0b]" />
                     <div className="text-right">
                        <div className="text-2xl font-black text-gray-900 leading-none">{avgRating.toFixed(1)}</div>
                        <div className="text-[10px] font-black text-gray-400 uppercase">({userReviews.length})</div>
                     </div>
                  </div>
                </div>

                <div className="space-y-5">
                  {userReviews.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-gray-200">
                      <MessageSquare size={54} className="mx-auto text-gray-100 mb-4" />
                      <p className="text-gray-400 text-xs font-black uppercase tracking-[0.2em]">No feedback yet</p>
                    </div>
                  ) : (
                    userReviews.map(review => (
                      <div key={review.id} className="bg-white rounded-[2rem] p-7 border border-gray-100 shadow-sm space-y-5 relative group hover:shadow-xl transition-all">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-4">
                            <UserAvatar src={review.reviewer_avatar} seed={review.reviewer_id} size="lg" className="shadow-2xl shadow-gray-200" />
                            <div>
                               <p className="font-black text-gray-900 mb-0.5">{review.reviewer_name}</p>
                               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                  {new Date(review.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                               </p>
                            </div>
                          </div>
                          <div className="pt-1">
                             <RatingStars rating={review.rating} size="sm" />
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-blue-600 font-black uppercase tracking-widest mb-2 opacity-60">
                             {review.listing_title}
                          </p>
                          <p className="text-gray-700 font-medium text-sm leading-relaxed italic">"{review.comment}"</p>
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
                <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm relative overflow-hidden group">
                  <div className="flex items-center gap-5 mb-10 relative z-10">
                    <div className={cn(
                      "h-16 w-16 rounded-3xl flex items-center justify-center transition-all shadow-xl",
                      profile?.is_student_verified ? "bg-blue-600 text-white shadow-blue-200" : "bg-gray-100 text-gray-400"
                    )}>
                      <Shield size={32} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-gray-900">ID Verification</h3>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Campus Trust Badge</p>
                    </div>
                  </div>

                  {profile?.is_student_verified ? (
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex items-center gap-4 text-blue-700 font-black relative z-10">
                      <CheckCircle size={24} fill="currentColor" className="text-blue-500" />
                      Verified Institution Account
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-[2.5rem] py-14 hover:border-blue-500 hover:bg-blue-50/30 cursor-pointer transition-all relative z-10 group/btn">
                       <div className="h-16 w-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-5 group-hover/btn:bg-blue-600 group-hover/btn:text-white transition-all shadow-sm">
                          <Upload size={32} />
                       </div>
                       <span className="text-lg font-black text-gray-900 mb-1">Upload College ID</span>
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Get verified badge</span>
                       <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'college_id')} />
                    </label>
                  )}
                  <div className="absolute top-0 right-0 w-48 h-48 bg-blue-50 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />
                </div>

                {/* Academic Profile */}
                <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm space-y-8">
                   <div className="flex items-center gap-3">
                      <BookOpen size={20} className="text-blue-500" />
                      <h3 className="text-lg font-black text-gray-900">Academic Career</h3>
                   </div>
                   <div className="space-y-5">
                      <AcademicInput label="Department" value={profile?.programme} onSave={(val) => updateProfile({ programme: val })} />
                      <AcademicInput label="Degree / Main" value={profile?.branch} onSave={(val) => updateProfile({ branch: val })} />
                      <AcademicInput label="Semester" value={profile?.semester?.toString()} onSave={(val) => updateProfile({ semester: parseInt(val) || 0 })} type="number" />
                      <AcademicInput label="Short Bio" value={profile?.bio} onSave={(val) => updateProfile({ bio: val })} />
                   </div>
                </div>

                {/* Notify Settings */}
                <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm space-y-6">
                   <div className="flex items-center gap-3">
                      <Bell size={20} className="text-blue-500" />
                      <h3 className="text-lg font-black text-gray-900">Preferences</h3>
                   </div>
                   <div className="space-y-4 divide-y divide-gray-50">
                      <NotifyToggle label="Chat Notifications" enabled={prefs.messages ?? true} onToggle={() => handleToggleNotify('messages')} />
                      <NotifyToggle label="Rating Alerts" enabled={prefs.reviews ?? true} onToggle={() => handleToggleNotify('reviews')} />
                      <NotifyToggle label="System News" enabled={prefs.exams ?? true} onToggle={() => handleToggleNotify('exams')} />
                   </div>
                </div>

                {/* Logout Button */}
                <button 
                  onClick={signOut}
                  className="w-full h-18 rounded-[2rem] bg-red-50 text-red-500 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-red-100 transition-all border border-red-100/50 shadow-sm active:scale-95"
                >
                  <LogOut size={20} /> Log out current account
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Avatar Edit Modal (Premium Design) */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1a2744]/80 p-6 backdrop-blur-xl animate-in fade-in duration-500">
           <motion.div 
             initial={{ scale: 0.9, opacity: 0, rotateX: 20 }}
             animate={{ scale: 1, opacity: 1, rotateX: 0 }}
             className="bg-white rounded-[3.5rem] p-12 w-full max-w-sm space-y-12 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] relative border border-white/20"
           >
             <button 
               onClick={() => setIsAvatarModalOpen(false)}
               className="absolute top-10 right-10 h-11 w-11 bg-gray-50 rounded-2xl flex items-center justify-center hover:bg-gray-100 transition-colors"
             >
               <X size={20} className="text-gray-400" />
             </button>

             <div className="text-center">
               <div className="mx-auto h-24 w-24 bg-blue-50 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-inner">
                  <Camera size={44} className="text-blue-500" />
               </div>
               <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">Profile View</h2>
               <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Update your identity</p>
             </div>

             <div className="grid grid-cols-1 gap-4">
                <label className="flex items-center gap-5 p-6 bg-blue-50 border border-blue-100 rounded-3xl cursor-pointer hover:bg-blue-600 hover:text-white transition-all group">
                   <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
                      <Upload size={28} className="text-blue-600" />
                   </div>
                   <span className="text-lg font-black">Upload Photo</span>
                   <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'avatar')} />
                </label>

                <button 
                  onClick={async () => {
                    const seed = Math.random().toString(36).substring(7);
                    const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
                    await updateProfile({ avatar_url: url });
                    setIsAvatarModalOpen(false);
                    toast({ title: 'Avatar randomized!', type: 'success' });
                  }}
                  className="flex items-center gap-5 p-6 bg-indigo-50 border border-indigo-100 rounded-3xl hover:bg-indigo-600 hover:text-white transition-all group"
                >
                   <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                      <Dices size={28} className="text-indigo-600" />
                   </div>
                   <span className="text-lg font-black">Roll Magic Dice</span>
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
      <div className="text-2xl font-black text-white mb-0.5 tracking-tight">{value}</div>
      <div className="text-[10px] font-black text-blue-300 uppercase tracking-widest opacity-60">{label}</div>
    </div>
  );
}

// Refined Tab Button (Pill Style)
function TabButton({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex-1 py-4 text-[10px] font-black rounded-[1.2rem] transition-all relative z-10 flex items-center justify-center uppercase tracking-widest mx-1",
        active ? "text-white" : "text-gray-400 hover:text-gray-600"
      )}
    >
      {label}
      {active && (
        <motion.div 
          layoutId="tab-active-refine"
          className="absolute inset-0 bg-[#1a2744] rounded-[1.2rem] shadow-[0_10px_20px_-5px_rgba(26,35,58,0.4)] -z-10" 
        />
      )}
    </button>
  );
}

function NotifyToggle({ label, enabled, onToggle }: { label: string, enabled: boolean, onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm font-bold text-gray-700">{label}</span>
      <button 
        onClick={onToggle}
        className={cn(
          "w-11 h-6 rounded-full p-1 transition-colors relative",
          enabled ? "bg-blue-600" : "bg-gray-200"
        )}
      >
        <motion.div 
          animate={{ x: enabled ? 20 : 0 }}
          className="w-4 h-4 bg-white rounded-full shadow-sm"
        />
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
      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1 mb-1 block">{label}</label>
      <div className="relative group">
        <input 
          type={type}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={() => {
            if (val !== value) onSave(val);
          }}
          className="w-full h-12 bg-gray-50 border border-gray-100 rounded-2xl px-4 text-sm font-bold text-gray-900 focus:bg-white focus:border-blue-500 transition-all outline-none"
        />
        <Pencil size={12} className="absolute right-4 top-4 text-gray-300 group-hover:text-blue-500 transition-colors pointer-events-none" />
      </div>
    </div>
  );
}

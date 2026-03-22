import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { MessageSquare, Trash2, Search, X, ChevronUp, ChevronDown, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast-provider';
import { useUnreadCount } from '@/context/UnreadCountContext';
import { messageService, initSocket } from '@/services/messageService';
import { ChatHeader } from '@/components/domain/ChatHeader';
import { MessageBubble } from '@/components/domain/MessageBubble';
import { MessageInput } from '@/components/domain/MessageInput';
import { ListingContextBar } from '@/components/domain/ListingContextBar';
import { MeetupScheduler } from '@/components/domain/MeetupScheduler';
import { MeetupProposalCard } from '@/components/domain/MeetupProposalCard';
import { SafetyCheckinCard } from '@/components/domain/SafetyCheckinCard';
import { Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';

export function Messages() {
  const [searchParams] = useSearchParams();
  const convId = searchParams.get('conv');
  const { user, jwt } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshUnreadCount } = useUnreadCount();

  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentConv, setCurrentConv] = useState<any>(null);

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Buying' | 'Selling' | 'Unread' | 'Archived'>('All');
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [isTyping, setIsTyping] = useState(false);
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [safetyCheckin, setSafetyCheckin] = useState<any>(null);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [prefilledText, setPrefilledText] = useState('');

  // Chat search (within a thread)
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [chatSearchResults, setChatSearchResults] = useState<number[]>([]);
  const [currentChatSearchIndex, setCurrentChatSearchIndex] = useState(-1);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (user && jwt) {
      socketRef.current = initSocket(convId);

      if (!socketRef.current) return;

      socketRef.current.emit('join_user_room', user.id);

      socketRef.current.on('receive_message', (msg) => {
        if (msg.conversation_id === convId) {
          setMessages((prev) => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          if (convId && socketRef.current) {
            messageService.markAsRead(convId, jwt);
            const otherId = currentConv?.other_participant?.id;
            socketRef.current.emit('mark_read', { conversation_id: convId, reader_id: user?.id, other_id: otherId });
          }
        } else {
          // If not in this thread, reload inbox or update local unread count
          loadInbox();
        }
      });

      socketRef.current.on('unread_update', () => {
        loadInbox();
      });

      socketRef.current.on('messages_read', (data) => {
        if (data.conversation_id === convId && data.reader_id !== user?.id) {
          setMessages(prev => prev.map(m => ({ ...m, is_read: true })));
        }
      });

      socketRef.current.on('user_online', (data) => {
        setOnlineUsers(prev => new Set([...prev, data.userId]));
      });

      socketRef.current.on('user_offline', (data) => {
        setOnlineUsers(prev => {
          const next = new Set(prev);
          next.delete(data.userId);
          return next;
        });
      });

      socketRef.current.on('typing_status', (data) => {
        if (data.conversation_id === convId) {
          if (data.user_id !== user.id) setIsTyping(data.isTyping);
        } else {
          setTypingUsers(prev => ({ ...prev, [data.conversation_id]: data.isTyping }));
        }
      });

      socketRef.current.on('message_edited', (data) => {
        if (data.conversation_id === convId) {
          setMessages(prev => prev.map(m => m.id === data.id ? { ...m, content: data.content, is_edited: true } : m));
        }
      });

      socketRef.current.on('message_deleted', (data) => {
        if (data.conversation_id === convId) {
          setMessages(prev => prev.map(m => m.id === data.id ? { ...m, is_deleted: true } : m));
        }
      });

      if (convId) {
        loadThread(convId);
      } else {
        loadInbox();
      }

      // Heartbeat every 60s
      const hb = setInterval(() => {
        messageService.heartbeat(jwt);
      }, 60000);

      return () => {
        clearInterval(hb);
        socketRef.current?.off('receive_message');
        socketRef.current?.off('unread_update');
        socketRef.current?.off('messages_read');
        socketRef.current?.off('user_online');
        socketRef.current?.off('user_offline');
        socketRef.current?.off('typing_status');
        socketRef.current?.off('message_edited');
        socketRef.current?.off('message_deleted');
      };
    }
  }, [user, jwt, convId, activeTab]);

  useEffect(() => {
    if (!user || !jwt || !convId) return;

    const fetchDetailedConversation = async () => {
      try {
        const res = await messageService.getConversation(convId, jwt);
        if (res.data) {
          setCurrentConv(res.data);
          // Check for new conversation (quick replies)
          if (res.data.message_count < 3) setShowQuickReplies(true);
        }
      } catch (error) {
        console.error('Error fetching conversion details:', error);
      }
    };

    fetchDetailedConversation();
    loadMessages();
    markAsRead();
    fetchSafetyCheckin();
  }, [user, jwt, convId]);

  const fetchSafetyCheckin = async () => {
    if (!convId || !jwt) return;
    try {
      const res = await fetch(`http://localhost:3001/api/messages/conversations/${convId}/safety-checkin`, {
        headers: { 'Authorization': `Bearer ${jwt}` }
      });
      const json = await res.json();
      if (json.data) setSafetyCheckin(json.data);
    } catch (e) { console.error(e); }
  };

  const markAsRead = async () => {
    if (!convId || !jwt || !currentConv) return;
    try {
      await messageService.markAsRead(convId, jwt, currentConv.other_id);
      refreshUnreadCount();
      setConversations(prev => prev.map(c => c.id === convId ? { ...c, unread_count: 0, is_unread: false } : c));
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (!showChatSearch) scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadInbox = async () => {
    setLoading(true);
    try {
      const res = await messageService.getConversations(jwt!, activeTab === 'Archived');
      if (res.data) setConversations(res.data);
    } finally {
      setLoading(false);
    }
  };

  const loadThread = async (id: string) => {
    setLoading(true);
    try {
      const [convRes, msgRes] = await Promise.all([
        messageService.getConversation(id, jwt!),
        messageService.getMessages(id, jwt!)
      ]);
      
      if (convRes.data) setCurrentConv({ ...convRes.data, current_user_id: user?.id });
      if (msgRes.data) setMessages(msgRes.data);
      
      if (id && user) {
        messageService.markAsRead(id, jwt!);
        const otherId = convRes.data.buyer_id === user.id ? convRes.data.seller_id : convRes.data.buyer_id;
        socketRef.current?.emit('mark_read', { conversation_id: id, reader_id: user.id, other_id: otherId });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!convId || !jwt) return;
    try {
      const msgRes = await messageService.getMessages(convId, jwt);
      if (msgRes.data) setMessages(msgRes.data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async (text: string, file?: File) => {
    if (!convId || !jwt) return;

    let fileData = {};
    if (file) {
      const uploadRes = await messageService.uploadFile(file, jwt);
      if (uploadRes.url) {
        fileData = {
          file_url: uploadRes.url,
          file_name: uploadRes.name,
          file_type: uploadRes.type
        };
      }
    }

    const res = await messageService.sendMessage(convId!, text, jwt!, 'text', fileData);
    if (res.data) {
      setMessages(prev => {
        if (prev.some(m => m.id === res.data.id)) return prev;
        return [...prev, res.data];
      });
      const recipientId = currentConv.buyer_id === user?.id ? currentConv.seller_id : currentConv.buyer_id;
      socketRef.current?.emit('send_message', { ...res.data, recipient_id: recipientId });
    }
  };

  const handleEditMessage = async (id: string, content: string) => {
    const res = await messageService.editMessage(id, content, jwt!);
    if (res.message) {
      setMessages(prev => prev.map(m => m.id === id ? { ...m, content, is_edited: true } : m));
      socketRef.current?.emit('edit_message', { conversation_id: convId, id, content });
    }
  };

  const handleDeleteMessage = async (id: string) => {
    const res = await messageService.deleteMessage(id, jwt!);
    if (res.message) {
      setMessages((prev: any[]) => prev.map(m => m.id === id ? { ...m, is_deleted: true } : m));
      socketRef.current?.emit('delete_message', { conversation_id: convId, id });
    }
  };

  const handleScheduleMeet = () => {
    setIsSchedulerOpen(true);
  };

  const handleSendProposal = async (data: any) => {
    if (!convId || !jwt || !currentConv) return;
    
    // Check if proposal already pending
    const hasPending = messages.some(m => {
        if (m.message_type === 'meetup_proposal') {
            const p = JSON.parse(m.content);
            return p.status === 'pending';
        }
        return false;
    });

    if (hasPending) {
        toast({ 
            title: 'Action Denied', 
            description: 'You already have a pending proposal.',
            type: 'error'
        });
        return;
    }

    try {
      await messageService.sendMessage(convId, JSON.stringify({...data, status: 'pending'}), jwt, 'meetup_proposal');
      setIsSchedulerOpen(false);
      loadMessages();
    } catch (error) {
      console.error('Error sending proposal:', error);
    }
  };

  const handleUpdateProposal = async (msgId: string, status: 'accepted' | 'declined') => {
    try {
      await messageService.updateMeetupStatus(msgId, status, jwt!);
      loadMessages();
      if (status === 'accepted') {
          toast({ title: 'Meet-up Scheduled!', description: 'Check the safety banner for updates.', type: 'success' });
      }
    } catch (e) { console.error(e); }
  };

  const handleConfirmMeetup = async (id: string) => {
    try {
      await messageService.checkinMeetup(id, 'completed', jwt!);
      setSafetyCheckin(null);
      toast({ title: 'Success', description: 'Meet-up marked as completed!', type: 'success' });
    } catch (e) { console.error(e); }
  };

  const handleReportMeetup = () => {
    // Simplified: just toast for now
    toast({ title: 'Reported', description: 'Our team will review this session.', type: 'info' });
    setSafetyCheckin(null);
  };

  const handleMenuAction = async (action: string) => {
    if (!convId || !jwt) return;

    switch (action) {
      case 'view_profile':
        navigate(`/profile/${currentConv.other_id}`);
        break;
      case 'view_listing':
        navigate(`/listing/${currentConv.listing_id}`);
        break;
      case 'block':
        if (window.confirm('Block this user? All threads will be removed.')) {
            await messageService.blockUser(currentConv.other_id, jwt);
            toast({ title: 'User Blocked', description: 'They can no longer message you.', type: 'success' });
            navigate('/messages');
        }
        break;
      case 'report':
        // Simplified for now, just a toast
        toast({ title: 'User Reported', description: 'Thank you for keeping CampusNotes safe.', type: 'info' });
        break;
      case 'mute':
        const muteRes = await messageService.muteConversation(convId, jwt);
        if (muteRes.message) {
          setCurrentConv((prev: any) => ({ ...prev, is_muted: muteRes.is_muted }));
          toast({ title: muteRes.is_muted ? 'Conversation muted' : 'Conversation unmuted', type: 'success' });
        }
        break;
      case 'clear':
        if (!confirm('Clear all messages? This cannot be undone.')) return;
        const clearRes = await messageService.clearChat(convId, jwt);
        if (clearRes.message) {
          setMessages([]);
          toast({ title: 'Chat cleared', type: 'success' });
        }
        break;
      case 'archive':
      case 'unarchive':
        const archiveRes = await messageService.archiveConversation(convId, jwt);
        if (archiveRes.success) {
          toast({ title: archiveRes.is_archived ? 'Conversation archived' : 'Conversation unarchived', type: 'success' });
          if (activeTab !== 'Archived' || !archiveRes.is_archived) {
             setConversations(prev => prev.filter(c => c.id !== convId));
             navigate('/messages');
          } else {
             loadInbox();
          }
        }
        break;
      case 'mark_sold':
        if (!confirm('Mark this listing as sold to this buyer? This will archive the chat.')) return;
        const soldRes = await messageService.markAsSold(convId, jwt);
        if (soldRes.success) {
          toast({ title: 'Success', description: 'Listing marked as sold!', type: 'success' });
          setConversations(prev => prev.filter(c => c.id !== convId));
          navigate('/messages');
        }
        break;
      case 'delete':
        if (!confirm('Delete this conversation?')) return;
        const delRes = await messageService.deleteMessage(convId, jwt); // Reusing as per req
        if (delRes.message) {
          setConversations((prev: any[]) => prev.filter(c => c.id !== convId));
          navigate('/messages');
          toast({ title: 'Conversation deleted', type: 'success' });
        }
        break;
      default:
        toast({ title: 'Feature coming soon!', type: 'info' });
    }
  };

  const performChatSearch = (q: string) => {
    setChatSearchQuery(q);
    if (!q.trim()) {
      setChatSearchResults([]);
      setCurrentChatSearchIndex(-1);
      return;
    }
    const results = messages
      .map((m, idx) => m.content.toLowerCase().includes(q.toLowerCase()) ? idx : -1)
      .filter(idx => idx !== -1);
    setChatSearchResults(results);
    if (results.length > 0) {
      setCurrentChatSearchIndex(0);
      scrollMessageIntoView(results[0]);
    } else {
      setCurrentChatSearchIndex(-1);
    }
  };

  const scrollMessageIntoView = (index: number) => {
    const el = document.getElementById(`msg-${messages[index].id}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const nextChatSearch = () => {
    if (chatSearchResults.length === 0) return;
    const nextIdx = (currentChatSearchIndex + 1) % chatSearchResults.length;
    setCurrentChatSearchIndex(nextIdx);
    scrollMessageIntoView(chatSearchResults[nextIdx]);
  };

  const prevChatSearch = () => {
    if (chatSearchResults.length === 0) return;
    const prevIdx = (currentChatSearchIndex - 1 + chatSearchResults.length) % chatSearchResults.length;
    setCurrentChatSearchIndex(prevIdx);
    scrollMessageIntoView(chatSearchResults[prevIdx]);
  };

  if (convId) {
    return (
      <div className="flex flex-col h-[calc(100vh-56px-80px)] bg-white relative animate-in fade-in duration-300">
        <div className="sticky top-0 z-30">
          <ChatHeader 
            conversation={currentConv} 
            onBack={() => navigate('/messages')} 
            onAction={handleMenuAction} 
          />
        </div>

        <div className="sticky top-[64px] z-20">
          <ListingContextBar 
            listing={currentConv ? {
              id: currentConv.listing_id,
              title: currentConv.listing_title,
              subject_code: currentConv.listing_subject_code,
              price: currentConv.listing_price,
              status: currentConv.listing_status,
              image: currentConv.listing_image
            } : null}
            onScheduleMeet={handleScheduleMeet}
            isSeller={currentConv?.seller_id === user?.id}
            onAction={handleMenuAction}
          />
        </div>

        {safetyCheckin && (
          <div className="z-20 bg-white">
            <SafetyCheckinCard 
              meetupId={safetyCheckin.id} 
              onConfirm={handleConfirmMeetup} 
              onReport={handleReportMeetup} 
            />
          </div>
        )}

        {showChatSearch && (
          <div className="bg-white border-b border-gray-100 p-2 flex items-center gap-2 animate-in slide-in-from-top duration-200 z-10 sticky top-[128px]">
            <Search className="w-4 h-4 text-gray-400 ml-2" />
            <input 
              autoFocus
              type="text" 
              value={chatSearchQuery}
              onChange={(e) => performChatSearch(e.target.value)}
              placeholder="Search messages..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-1 font-bold"
            />
            {chatSearchResults.length > 0 && (
              <div className="flex items-center gap-1 text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                <span>{currentChatSearchIndex + 1}/{chatSearchResults.length}</span>
                <button onClick={prevChatSearch} className="p-1 hover:bg-gray-100 rounded-lg"><ChevronUp className="w-3 h-3" /></button>
                <button onClick={nextChatSearch} className="p-1 hover:bg-gray-100 rounded-lg"><ChevronDown className="w-3 h-3" /></button>
              </div>
            )}
            <button 
              onClick={() => { setShowChatSearch(false); setChatSearchQuery(''); setChatSearchResults([]); setCurrentChatSearchIndex(-1); }} 
              className="p-1.5 hover:bg-gray-100 rounded-full"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide bg-white">
          {loading ? (
             <div className="space-y-4">
                <Skeleton className="h-10 w-1/3 rounded-xl ml-auto" />
                <Skeleton className="h-16 w-1/2 rounded-xl" />
                <Skeleton className="h-10 w-1/4 rounded-xl ml-auto" />
             </div>
          ) : (
            <>

              {messages.map((msg, idx) => {
                const isMatch = showChatSearch && chatSearchQuery && msg.content.toLowerCase().includes(chatSearchQuery.toLowerCase());
                const isCurrentMatch = isMatch && chatSearchResults[currentChatSearchIndex] === idx;

                return (
                  <div key={msg.id} id={`msg-${msg.id}`} className={`transition-all duration-300 ${isCurrentMatch ? 'ring-4 ring-blue-100 rounded-[2rem] -mx-2 px-2' : ''}`}>
                    {msg.message_type === 'meetup_proposal' ? (
                      <div className={`flex w-full ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'} py-2`}>
                        <MeetupProposalCard 
                          message={msg} 
                          currentUserId={user?.id || ''} 
                          onAccept={(id) => handleUpdateProposal(id, 'accepted')}
                          onDecline={(id) => handleUpdateProposal(id, 'declined')}
                        />
                      </div>
                    ) : (
                      <MessageBubble 
                        message={msg}
                        isMe={msg.sender_id === user?.id}
                        onCopy={(text) => {
                          navigator.clipboard.writeText(text);
                          toast({ title: 'Copied!', type: 'success' });
                        }}
                        onEdit={handleEditMessage}
                        onDelete={handleDeleteMessage}
                      />
                    )}
                  </div>
                );
              })}
              
              {/* Typing Indicator Bubble */}
              {isTyping && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex gap-1.5 p-3.5 bg-gray-50 rounded-[2rem] rounded-bl-none border border-gray-100 shadow-sm">
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0s]" />
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {showQuickReplies && (
          <div className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide bg-white border-t border-gray-50 animate-in slide-in-from-bottom duration-300">
            {[
              "Is this available?", 
              `Best price ₹${Math.round((currentConv?.listing_price || 0) * 0.8 / 10) * 10}?`, 
              "Where should we meet?", 
              "Can I see more photos?"
            ].map(reply => (
              <button 
                key={reply}
                onClick={() => {
                  setPrefilledText(reply);
                  setShowQuickReplies(false);
                }}
                className="shrink-0 px-5 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-full border border-gray-100 text-[10px] font-black uppercase tracking-widest text-[#1a2744] transition-all active:scale-95 shadow-sm"
              >
                {reply}
              </button>
            ))}
          </div>
        )}

        <MessageInput 
          onSend={handleSendMessage} 
          conversationId={convId} 
          initialValue={prefilledText}
          onInputValueChange={setPrefilledText}
        />

        <MeetupScheduler 
          isOpen={isSchedulerOpen} 
          onClose={() => setIsSchedulerOpen(false)}
          onSubmit={handleSendProposal}
          listingPrice={currentConv?.listing_price || 0}
        />
      </div>
    );
  }

  // Smart date formatter
  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 60) return `${Math.max(1, diffMins)}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    
    // Yesterday check
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Avatar color helper
  const getAvatarColor = (name: string) => {
    const colors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-amber-500', 'bg-emerald-500', 'bg-indigo-500'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const filteredConversations = conversations.filter(conv => {
    // Search filter
    const q = debouncedSearchQuery.toLowerCase();
    const matchesSearch = !q || 
      conv.other_participant.name.toLowerCase().includes(q) ||
      conv.listing.title.toLowerCase().includes(q) ||
      (conv.last_message?.content || '').toLowerCase().includes(q);

    if (!matchesSearch) return false;

    // Tab filter
    if (activeTab === 'Buying') return conv.listing.seller_id !== user?.id;
    if (activeTab === 'Selling') return conv.listing.seller_id === user?.id;
    if (activeTab === 'Unread') return conv.unread_count > 0;
    
    return true;
  });

  return (
    <div className="w-full max-w-screen-sm mx-auto space-y-4 animate-in fade-in duration-300 px-4 pb-20">
      <div className="flex items-center justify-between py-2">
        <h1 className="text-3xl font-black text-[#1a2744]">Messages</h1>
        {conversations.length > 0 && (
          <div className="bg-[#1a2744]/5 px-4 py-2 rounded-2xl text-[#1a2744] text-[10px] font-black uppercase tracking-widest border border-[#1a2744]/10">
            {conversations.length} Threads
          </div>
        )}
      </div>

      {/* Search Input */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400 group-focus-within:text-[#1a2744] transition-colors" />
        </div>
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search name, listing, or message..."
          className="w-full h-14 bg-white border border-gray-100 rounded-2xl pl-12 pr-12 text-sm font-bold shadow-sm focus:ring-2 focus:ring-[#1a2744]/10 focus:border-[#1a2744]/20 transition-all outline-none"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-5 flex items-center"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-red-500 transition-colors" />
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 -mx-4 px-4">
        {(['All', 'Buying', 'Selling', 'Unread', 'Archived'] as const).map(tab => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                isActive 
                  ? 'bg-[#1a2744] text-white border-[#1a2744] shadow-lg shadow-[#1a2744]/20' 
                  : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>
      
      {loading ? (
        <div className="space-y-4">
          {[1,2,3,4].map(n => (
            <div key={n} className="h-24 bg-white border border-gray-100 rounded-[12px] p-4 flex gap-4">
              <Skeleton className="h-12 w-12 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[2rem] border border-gray-100 px-6 space-y-4">
          <div className="bg-[#1a2744]/5 h-20 w-20 rounded-full flex items-center justify-center mx-auto">
             <MessageSquare className="h-10 w-10 text-[#1a2744]/40" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-[#1a2744]">No conversations yet</h3>
            <p className="text-xs text-gray-400 font-bold max-w-[200px] mx-auto">Browse notes and contact a seller to get started</p>
          </div>
          <Button onClick={() => navigate('/browse')} className="bg-[#1a2744] hover:bg-[#1a2744]/90 text-white rounded-xl px-8 h-12 text-[10px] font-black uppercase tracking-widest">
            Browse Notes
          </Button>
        </div>
      ) : filteredConversations.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[2rem] border border-gray-100 px-6 space-y-4">
          <div className="bg-gray-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto">
             <AlertCircle className="h-8 w-8 text-gray-300" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-[#1a2744]">
              {activeTab === 'Unread' ? 'All caught up' : 
               activeTab === 'Buying' ? "No buying chats" :
               activeTab === 'Selling' ? "No selling chats" : "No results found"}
            </h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
              {activeTab === 'Unread' ? 'No unread messages' : 
               activeTab === 'Buying' ? "You haven't contacted any sellers yet" :
               activeTab === 'Selling' ? "No one has messaged you about your listings" : "Try a different search or clear filters"}
            </p>
          </div>
          <Button 
            onClick={() => {
              if (searchQuery) setSearchQuery('');
              else if (activeTab === 'Buying') navigate('/browse');
              else if (activeTab === 'Selling') navigate('/sell');
              else setActiveTab('All');
            }} 
            variant="outline"
            className="rounded-xl px-6 h-10 text-[10px] font-black uppercase tracking-widest border-gray-200"
          >
            {searchQuery ? 'Clear Search' : 
             activeTab === 'Buying' ? 'Find Notes' :
             activeTab === 'Selling' ? 'Sell Notes' : 'Show All'}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredConversations.map(conv => {
            const other = conv.other_participant;
            const isOnline = onlineUsers.has(other.id) || 
              (other.last_seen_at && (new Date().getTime() - new Date(other.last_seen_at).getTime()) < 300000);
            const isTyping = typingUsers[conv.id];
            const timestamp = formatTime(conv.last_message.created_at);
            const isSelling = conv.listing.seller_id === user?.id;

            return (
              <div 
                key={conv.id} 
                onClick={() => navigate(`/messages?conv=${conv.id}`)}
                className="group relative bg-white border border-gray-100 rounded-[12px] p-4 flex gap-4 hover:shadow-xl hover:shadow-[#1a2744]/5 hover:border-[#1a2744]/10 transition-all cursor-pointer active:scale-[0.98]"
              >
                {/* Avatar with Online Dot */}
                <div className="relative shrink-0">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-black text-lg ${getAvatarColor(other.name)} shadow-sm`}>
                    {other.name.charAt(0).toUpperCase()}
                  </div>
                  {isOnline && (
                    <div className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
                  )}
                </div>

                {/* Content Area */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  {/* Top Line: Name and Time */}
                  <div className="flex justify-between items-center mb-0.5">
                    <p className="font-black text-[#1a2744] text-sm truncate">{other.name}</p>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter whitespace-nowrap ml-2">
                      {timestamp}
                    </span>
                  </div>

                  {/* Second Line: Listing Info */}
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-tight truncate flex-1">
                      {conv.listing.title} • {conv.listing.subject_code}
                    </p>
                    {isSelling ? (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-md text-[8px] font-black uppercase tracking-widest border border-amber-100/50">Selling</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[8px] font-black uppercase tracking-widest border border-emerald-100/50">Buying</span>
                    )}
                  </div>

                  {/* Third Line: Message Preview / Typing / Last Seen */}
                  <div className="flex items-center justify-between gap-4">
                    <p className={`text-xs truncate flex-1 ${isTyping ? 'text-emerald-500 font-bold animate-pulse' : 'text-gray-400 font-medium'}`}>
                      {isTyping ? 'typing...' : 
                       (conv.unread_count === 0 && !conv.last_message.content ? 
                        `Last seen ${formatTime(other.last_seen_at) || 'recently'}` : 
                        conv.last_message.content || 'Start a conversation')}
                    </p>
                    
                    {/* Unread Badge */}
                    {conv.unread_count > 0 && (
                      <div className={`shrink-0 flex items-center justify-center bg-red-500 text-white font-black leading-none shadow-sm shadow-red-200 ${
                        conv.unread_count === 1 ? 'h-2 w-2 rounded-full' : 'h-5 px-2 rounded-full text-[10px]'
                      }`}>
                        {conv.unread_count > 1 && (conv.unread_count > 99 ? '99+' : conv.unread_count)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Delete Overlay (Hidden on Mobile usually, visible on hover) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if(confirm('Delete this conversation?')) {
                        messageService.deleteMessage(conv.id, jwt!).then(() => {
                            setConversations(prev => prev.filter(c => c.id !== conv.id));
                        });
                    }
                  }}
                  className="absolute -top-2 -right-2 p-2 bg-white text-gray-300 hover:text-red-500 hover:shadow-lg rounded-full border border-gray-100 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 z-10 shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { Copy, Edit2, Trash2, Check, CheckCheck, FileText } from 'lucide-react';
import { API_BASE_URL } from '@/config';

interface MessageBubbleProps {
  message: any;
  isMe: boolean;
  onCopy: (text: string) => void;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
}

export function MessageBubble({ message, isMe, onCopy, onEdit, onDelete }: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showActions, setShowActions] = useState(false);
  const longPressTimer = useRef<any>(null);

  useEffect(() => {
    setEditContent(message.content);
  }, [message.content]);

  // Long press for mobile
  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => setShowActions(true), 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit(message.id, editContent);
    }
    setIsEditing(false);
  };

  if (message.is_deleted) {
      return (
          <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} w-full`}>
              <div className="text-[10px] font-bold italic text-muted-foreground bg-muted/30 px-4 py-2 rounded-full border border-border/50 uppercase tracking-widest">
                  Message deleted
              </div>
          </div>
      );
  }

  return (
    <div 
      className={`flex ${isMe ? 'justify-end' : 'justify-start'} group relative w-full`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); if(!isEditing) setShowActions(false); }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      
      {/* Actions Toolbar */}
      {showActions && !isEditing && (
        <div className={`absolute -top-10 flex items-center gap-1 bg-card border border-border shadow-2xl rounded-full p-1.5 z-20 animate-in fade-in zoom-in duration-200 ${isMe ? 'right-0' : 'left-0'}`}>
          <button onClick={() => { onCopy(message.content); setShowActions(false); }} className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-all active:scale-90">
            <Copy className="w-4 h-4" />
          </button>
          {isMe && (
            <>
              <button onClick={() => { setIsEditing(true); setShowActions(false); }} className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-primary transition-all active:scale-90">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => { onDelete(message.id); setShowActions(false); }} className="p-2 hover:bg-danger/10 rounded-full text-muted-foreground hover:text-danger transition-all active:scale-90">
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      )}

      <div className={`max-w-[85%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
        <div className={`relative px-5 py-3 rounded-[2rem] text-sm shadow-md transition-all duration-300 ${
          isMe 
            ? 'bg-primary text-white rounded-tr-none shadow-primary/10' 
            : 'bg-card text-foreground rounded-tl-none border border-border/50 shadow-black/5'
        }`}>
          {/* File Rendering */}
          {(message.file_url || message.attachment_url) && (
            <div className="mb-3">
              {message.message_type === 'image' || message.file_type?.startsWith('image/') ? (
                <div className="relative group/image overflow-hidden rounded-2xl border border-white/10 shadow-lg">
                  <img 
                    src={`${API_BASE_URL}${message.file_url || message.attachment_url}`} 
                    alt="Attachment" 
                    className="max-w-full h-auto object-cover transition-transform duration-500 group-hover/image:scale-105"
                    onLoad={() => window.scrollTo(0, document.body.scrollHeight)}
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center">
                    <button className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white">
                      <FileText className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <a 
                  href={`${API_BASE_URL}${message.file_url || message.attachment_url}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className={`flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-[0.98] ${
                    isMe ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-muted hover:bg-muted/80 text-foreground'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl shadow-sm ${isMe ? 'bg-white/20' : 'bg-card border border-border'}`}>
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-black truncate max-w-[140px] tracking-tight">{message.file_name || 'Attached File'}</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Tap to download</span>
                  </div>
                </a>
              )}
            </div>
          )}

          {/* Text Content */}
          {isEditing ? (
            <div className="flex flex-col gap-3 min-w-[220px]">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="bg-primary-foreground/10 text-white border border-white/20 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 w-full min-h-[80px] resize-none"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 rounded-lg transition-colors">Cancel</button>
                <button onClick={handleSaveEdit} className="px-4 py-1.5 bg-white text-primary text-[10px] font-black uppercase tracking-widest rounded-lg shadow-xl active:scale-95 transition-all">Save</button>
              </div>
            </div>
          ) : (
            <span className="whitespace-pre-wrap leading-relaxed font-medium">{message.content}</span>
          )}

          {/* Status Row */}
          <div className={`flex items-center gap-1.5 mt-2 justify-end opacity-60 text-[9px] font-bold uppercase tracking-widest ${isMe ? 'text-white' : 'text-muted-foreground'}`}>
            {!!message.is_edited && <span className="text-[8px] italic">Edited</span>}
            <span className="tabular-nums">{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
            {isMe && (
              message.is_read 
                ? <CheckCheck className="w-3.5 h-3.5 text-blue-200" /> 
                : <Check className="w-3.5 h-3.5 opacity-50" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

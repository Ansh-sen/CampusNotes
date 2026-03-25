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
              <div className="text-[10px] italic text-[hsl(var(--text-muted))] bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
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
        <div className={`absolute -top-8 flex items-center gap-1 bg-white border border-[hsl(var(--muted))] shadow-xl rounded-full p-1 z-20 animate-in fade-in zoom-in duration-200 ${isMe ? 'right-0' : 'left-0'}`}>
          <button onClick={() => { onCopy(message.content); setShowActions(false); }} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-900 transition-colors">
            <Copy className="w-3.5 h-3.5" />
          </button>
          {isMe && (
            <>
              <button onClick={() => { setIsEditing(true); setShowActions(false); }} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 hover:text-[hsl(var(--primary))] transition-colors">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => { onDelete(message.id); setShowActions(false); }} className="p-1.5 hover:bg-red-50 rounded-full text-gray-500 hover:text-red-600 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      )}

      <div className={`max-w-[85%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
        <div className={`relative px-4 py-2.5 rounded-[1.25rem] text-sm shadow-sm transition-all ${
          isMe 
            ? 'bg-[hsl(var(--primary))] text-white rounded-tr-none' 
            : 'bg-white text-[hsl(var(--text))] rounded-tl-none border border-[hsl(var(--muted))]'
        }`}>
          {/* File Rendering */}
          {(message.file_url || message.attachment_url) && (
            <div className="mb-2">
              {message.message_type === 'image' || message.file_type?.startsWith('image/') ? (
                <img 
                  src={`${API_BASE_URL}${message.file_url || message.attachment_url}`} 
                  alt="Attachment" 
                  className="max-w-full rounded-lg border border-white/20 shadow-sm"
                  onLoad={() => window.scrollTo(0, document.body.scrollHeight)}
                />
              ) : (
                <a 
                  href={`${API_BASE_URL}${message.file_url || message.attachment_url}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    isMe ? 'bg-black/10 hover:bg-black/20 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${isMe ? 'bg-white/20' : 'bg-white shadow-sm'}`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold truncate max-w-[120px]">{message.file_name || 'Attached File'}</span>
                    <span className="text-[9px] opacity-70">Tap to download</span>
                  </div>
                </a>
              )}
            </div>
          )}

          {/* Text Content */}
          {isEditing ? (
            <div className="flex flex-col gap-2 min-w-[200px]">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="bg-white/10 text-white border border-white/20 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 w-full min-h-[60px] resize-none"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setIsEditing(false)} className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider hover:bg-white/10 rounded">Cancel</button>
                <button onClick={handleSaveEdit} className="px-3 py-1 bg-white text-[hsl(var(--primary))] text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-sm">Save</button>
              </div>
            </div>
          ) : (
            <span className="whitespace-pre-wrap leading-relaxed">{message.content}</span>
          )}

          {/* Status Row */}
          <div className={`flex items-center gap-1.5 mt-1.5 justify-end opacity-70 text-[10px] ${isMe ? 'text-white/80' : 'text-gray-400'}`}>
            {!!message.is_edited && <span>Edited</span>}
            <span>{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
            {isMe && (
              message.is_read ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

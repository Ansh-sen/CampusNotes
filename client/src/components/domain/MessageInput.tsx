import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSocket } from '@/services/messageService';
import { useAuth } from '@/hooks/useAuth';

interface MessageInputProps {
  onSend: (text: string, file?: File) => void;
  conversationId?: string;
  initialValue?: string;
  onInputValueChange?: (value: string) => void;
  isVerified?: boolean;
}

export function MessageInput({ onSend, conversationId, initialValue = '', onInputValueChange, isVerified = true }: MessageInputProps) {
  const [text, setText] = useState(initialValue);
  const [file, setFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null); // <--- FIXED TYPE HERE

  const { user, profile } = useAuth();
  const isActuallyVerified = isVerified && profile?.verification_status === 'verified';

  if (!isActuallyVerified) {
    return (
      <div className="p-6 border-t border-border/50 bg-card/80 backdrop-blur-xl sticky bottom-0 left-0 right-0 z-10 text-center flex flex-col items-center gap-4 shadow-2xl">
        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 leading-relaxed max-w-[240px]">
          Verification Required to send messages & interact with campus notes
        </div>
        <button 
          onClick={() => window.location.href = '/profile?action=verify'} 
          className="px-8 h-14 bg-primary text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all hover:bg-primary/90"
        >
          Verify My Student ID
        </button>
      </div>
    );
  }

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => {
    if (initialValue !== undefined && initialValue !== text) {
      setText(initialValue);
      adjustHeight();
    }
  }, [initialValue]);

  useEffect(() => {
    adjustHeight();
  }, [text]);

  const handleTextChange = (newText: string) => {
    setText(newText);
    onInputValueChange?.(newText);

    if (!conversationId || !user) return;

    const socket = getSocket();
    if (socket) {
      socket.emit('typing_status', {
        conversation_id: conversationId,
        user_id: user.id,
        isTyping: true
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing_status', {
          conversation_id: conversationId,
          user_id: user.id,
          isTyping: false
        });
      }, 2000);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isSending) return;

    if (text.trim() || file) {
      setIsSending(true);
      try {
        await onSend(text, file || undefined);
        setText('');
        setFile(null);

        // Stop typing immediately on send
        const socket = getSocket();
        if (socket && conversationId && user) {
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          socket.emit('typing_status', {
            conversation_id: conversationId,
            user_id: user.id,
            isTyping: false
          });
        }
      } finally {
        setIsSending(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-4 bg-background/80 backdrop-blur-xl border-t border-border/30 pb-[var(--chat-pb,calc(env(safe-area-inset-bottom)+12px))]">
      {/* File Preview */}
      {file && (
        <div className="mb-4 animate-in slide-in-from-bottom-2 duration-300">
          <div className="inline-flex items-center gap-3 bg-primary/5 border border-primary/20 p-3 rounded-[2rem] shadow-lg shadow-primary/5 backdrop-blur-md">
            {file.type.startsWith('image/') ? (
              <div className="h-12 w-12 rounded-xl overflow-hidden bg-muted shadow-inner">
                <img src={URL.createObjectURL(file)} alt="Preview" className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg">
                <ImageIcon className="h-6 w-6" />
              </div>
            )}
            <div className="flex flex-col pr-3">
              <span className="text-[10px] font-black truncate max-w-[150px] text-foreground tracking-tight">{file.name}</span>
              <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Ready to upload</span>
            </div>
            <button onClick={() => setFile(null)} className="p-2 hover:bg-muted rounded-full transition-all active:scale-90">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-end gap-3 max-w-full">
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])} 
        />
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-14 w-14 rounded-[1.5rem] bg-muted/50 text-muted-foreground hover:text-primary hover:bg-primary/10 shrink-0 transition-all active:scale-90 border border-border/50 shadow-inner" 
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        <div className="flex-1 bg-muted/10 border border-muted-foreground/10 rounded-[2rem] focus-within:bg-muted/20 focus-within:ring-4 focus-within:ring-primary/5 transition-all overflow-hidden flex items-end px-5 py-1.5 shadow-sm backdrop-blur-sm">
          <textarea 
            ref={textareaRef} 
            rows={1} 
            value={text} 
            onFocus={() => {
              window.scrollTo(0, 0);
              document.body.scrollTo(0, 0);
            }} 
            onChange={(e) => handleTextChange(e.target.value)} 
            onKeyDown={handleKeyDown} 
            placeholder="Type a message..." 
            className="w-full bg-transparent border-none focus:ring-0 py-3 text-sm font-medium text-foreground resize-none scrollbar-hide min-h-[48px] outline-none shadow-none placeholder:text-muted-foreground/30" 
          />
        </div>

        <Button 
          onClick={() => handleSubmit()} 
          disabled={(!text.trim() && !file) || isSending} 
          className={`h-14 w-14 rounded-[1.5rem] shrink-0 transition-all active:scale-90 flex items-center justify-center border border-transparent ${
            (text.trim() || file) && !isSending 
              ? 'bg-primary text-white shadow-xl shadow-primary/20 hover:bg-primary/90' 
              : 'bg-muted text-muted-foreground/30 cursor-not-allowed'
          }`}
        >
          <Send className={`h-5 w-5 transition-transform ${(text.trim() || file) && !isSending ? 'translate-x-0.5 -translate-y-0.5' : ''}`} />
        </Button>
      </div>
    </div>
  );
}

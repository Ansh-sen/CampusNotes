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
}

export function MessageInput({ onSend, conversationId, initialValue = '', onInputValueChange }: MessageInputProps) {
  const [text, setText] = useState(initialValue);
  const [file, setFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();

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
    <div className="p-3 border-t border-gray-100 bg-white/80 backdrop-blur-xl sticky bottom-0 left-0 right-0 z-10 pb-[calc(env(safe-area-inset-bottom)+12px)]">
      {/* File Preview */}
      {file && (
        <div className="mb-3 animate-in slide-in-from-bottom-2 duration-300">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 p-2 rounded-2xl shadow-sm">
            {file.type.startsWith('image/') ? (
              <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-200">
                <img src={URL.createObjectURL(file)} alt="Preview" className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-lg bg-[#1a2744] flex items-center justify-center text-white">
                <ImageIcon className="h-5 w-5" />
              </div>
            )}
            <div className="flex flex-col pr-2">
              <span className="text-[10px] font-bold truncate max-w-[150px]">{file.name}</span>
              <span className="text-[9px] text-gray-400 uppercase tracking-wider">Ready to send</span>
            </div>
            <button 
              onClick={() => setFile(null)}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-end gap-2 max-w-full">
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
        />
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-11 w-11 rounded-2xl bg-gray-50 text-gray-500 hover:text-[#1a2744] shrink-0 transition-all active:scale-90"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        <div className="flex-1 bg-gray-50 border border-gray-100 rounded-[1.5rem] focus-within:ring-2 focus-within:ring-blue-50 focus-within:border-blue-100 transition-all overflow-hidden flex items-end px-3 py-1">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="w-full bg-transparent border-none focus:ring-0 py-2.5 text-sm resize-none scrollbar-hide min-h-[44px] outline-none shadow-none"
          />
        </div>

        <Button 
          onClick={() => handleSubmit()}
          disabled={( !text.trim() && !file) || isSending}
          className={`h-11 w-11 rounded-2xl shrink-0 transition-all active:scale-90 flex items-center justify-center ${
            (text.trim() || file) && !isSending ? 'bg-[#1a2744] shadow-lg shadow-[#1a2744]/20' : 'bg-gray-100 text-gray-400'
          }`}
        >
          <Send className={`h-5 w-5 transition-transform ${(text.trim() || file) && !isSending ? 'translate-x-0.5 -translate-y-0.5' : ''}`} />
        </Button>
      </div>
    </div>
  );
}

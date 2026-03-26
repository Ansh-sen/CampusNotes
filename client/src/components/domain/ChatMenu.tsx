import { 
  User, 
  FileSearch, 
  Search, 
  BellOff, 
  Bell, 
  Trash2, 
  Eraser, 
  UserX, 
  AlertTriangle 
} from 'lucide-react';

interface ChatMenuProps {
  isMuted: boolean;
  onAction: (action: string) => void;
  onClose: () => void;
}

export function ChatMenu({ isMuted, onAction, onClose }: ChatMenuProps) {
  const menuItems = [
    { label: 'View User Profile', icon: User, action: 'view_profile' },
    { label: 'View Listing', icon: FileSearch, action: 'view_listing' },
    { label: 'Search Messages', icon: Search, action: 'search' },
    { label: isMuted ? 'Unmute' : 'Mute Conversation', icon: isMuted ? Bell : BellOff, action: 'mute' },
    { label: 'Clear Chat', icon: Eraser, action: 'clear', danger: false },
    { label: 'Delete Chat', icon: Trash2, action: 'delete', danger: true },
    { label: 'Block User', icon: UserX, action: 'block', danger: true },
    { label: 'Report User', icon: AlertTriangle, action: 'report', danger: true },
  ];

  return (
    <div className="absolute right-4 top-14 w-60 bg-white rounded-2xl shadow-xl border border-[hsl(var(--muted))] py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
      {menuItems.map((item, idx) => {
        const Icon = item.icon;
        return (
          <button
            key={idx}
            onClick={() => {
              onAction(item.action);
              onClose();
            }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 ${
              item.danger ? 'text-red-500 hover:text-red-600' : 'text-gray-700 hover:text-[hsl(var(--primary))]'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="font-semibold">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

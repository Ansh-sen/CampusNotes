import { Link, useLocation } from 'react-router-dom';
import { Home, MessageSquare, PlusSquare, List, User, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnreadCount } from '@/context/UnreadCountContext';

interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
  badge?: number;
}

export function BottomNav() {
  const location = useLocation();
  const { unreadCount } = useUnreadCount();

  const navItems: NavItem[] = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: MessageSquare, label: 'Messages', path: '/messages', badge: unreadCount },
    { icon: PlusSquare, label: 'Sell', path: '/create' },
    { icon: List, label: 'My Listings', path: '/my-listings' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  // Don't show bottom nav on login/signup pages
  if (['/login', '/signup'].includes(location.pathname)) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 pb-[env(safe-area-inset-bottom)] px-2">
      <div className="flex justify-around items-center h-20">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full pt-2 transition-all relative",
                isActive ? "text-[#1a2744]" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <div className="relative mb-1">
                <Icon className={cn("w-6 h-6 stroke-[1.5px]", isActive && "text-[#1a2744]")} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white ring-2 ring-white">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className={cn("text-[9px] font-bold tracking-tight px-0.5 text-center", isActive ? "text-[#1a2744]" : "text-gray-400")}>
                {item.label}
              </span>
              
              {/* Active Indicator Dot */}
              {isActive && (
                <div className="absolute bottom-1 h-1 w-1 bg-[#1a2744] rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/90 dark:bg-card/80 backdrop-blur-2xl border-t border-border/50 pb-[env(safe-area-inset-bottom)] px-4 shadow-[0_-8px_30px_rgb(0,0,0,0.1)]">
      <div className="flex justify-between items-center h-20 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center w-16 h-full transition-all relative group",
                isActive ? "text-primary scale-110" : "text-muted-foreground hover:text-foreground/80 focus:text-foreground"
              )}
            >
              <div className="relative mb-1 transition-transform group-active:scale-90">
                <Icon className={cn(
                  "w-6 h-6 stroke-[1.8px] transition-all", 
                  isActive ? "text-primary drop-shadow-[0_0_10px_rgba(var(--primary),0.3)] opacity-100" : "text-muted-foreground/80"
                )} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-black text-white ring-2 ring-card shadow-lg">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[8px] font-black uppercase tracking-widest transition-all", 
                isActive ? "text-primary opacity-100" : "text-muted-foreground/60"
              )}>
                {item.label}
              </span>
              
              {/* Active Indicator Dot */}
              {isActive && (
                <div className="absolute -bottom-1 h-1.5 w-1.5 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),1)] animate-in zoom-in duration-300" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

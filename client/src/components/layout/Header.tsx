import { Link, useLocation } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { UserAvatar } from '@/components/ui/UserAvatar';

export function Header() {
  const location = useLocation();
  const { profile } = useAuth();
  
  if (['/login', '/signup'].includes(location.pathname) || 
      (location.pathname === '/messages' && new URLSearchParams(location.search).get('conv'))) {
    return null;
  }

  return (
    <header className="sticky top-0 z-[60] bg-background/80 backdrop-blur-xl border-b border-border/40 shadow-[0_1px_10px_rgba(0,0,0,0.02)] pt-[env(safe-area-inset-top)]">
      <div className="flex h-16 items-center justify-between px-4 w-full">
        <Link to="/" className="flex items-center space-x-2.5">
          <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20 animate-float">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-black tracking-tighter text-foreground drop-shadow-sm">
            Campus<span className="text-primary">Notes</span>
          </span>
        </Link>
        <div className="flex items-center space-x-3">
          <Link to="/profile" className="active:scale-95 transition-transform">
            <UserAvatar 
              src={profile?.avatar_url} 
              seed={profile?.id || 'Felix'} 
              size="sm"
              className="border-2 border-primary/20 hover:border-primary/50 transition-colors"
            />
          </Link>
        </div>
      </div>
    </header>
  );
}

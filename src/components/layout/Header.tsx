import { Link, useLocation } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { UserAvatar } from '@/components/ui/UserAvatar';

export function Header() {
  const location = useLocation();
  const { profile } = useAuth();
  
  if (['/login', '/signup'].includes(location.pathname)) {
    return null;
  }

  return (
    <header className="sticky top-0 z-[60] glass border-b border-[hsl(var(--muted))] pt-[env(safe-area-inset-top)]">
      <div className="flex h-14 items-center justify-between px-4 max-w-md mx-auto w-full">
        <Link to="/" className="flex items-center space-x-2">
          <div className="bg-[hsl(var(--primary))] p-1.5 rounded-lg">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[hsl(var(--primary))]">
            CampusNotes
          </span>
        </Link>
        <div className="flex items-center space-x-2">
          <Link to="/profile">
            <UserAvatar 
              src={profile?.avatar_url} 
              seed={profile?.id || 'Felix'} 
              size="sm"
              className="border border-[hsl(var(--primary))/20]"
            />
          </Link>
        </div>
      </div>
    </header>
  );
}

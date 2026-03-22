import { cn } from '@/lib/utils';

interface UserAvatarProps {
  src?: string | null;
  seed?: string | null;
  alt?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-16 w-16',
  xl: 'h-24 w-24'
};

export function UserAvatar({ src, seed, alt = 'User Avatar', className, size = 'md' }: UserAvatarProps) {
  const initials = alt
    ? alt.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    : '??';

  if (!src && !seed) {
    return (
      <div className={cn(
        "relative rounded-full bg-blue-600 text-white flex items-center justify-center font-bold",
        size === 'sm' ? "text-xs" : size === 'md' ? "text-sm" : size === 'lg' ? "text-xl" : "text-3xl",
        sizeClasses[size],
        className
      )}>
        {initials}
      </div>
    );
  }

  const avatarUrl = src || `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed || 'default'}`;

  return (
    <div className={cn(
      "relative rounded-full overflow-hidden bg-gray-100 border border-gray-100 flex items-center justify-center shrink-0",
      sizeClasses[size],
      className
    )}>
      <img 
        src={avatarUrl} 
        alt={alt} 
        className="h-full w-full object-cover"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=fallback`;
        }}
      />
    </div>
  );
}

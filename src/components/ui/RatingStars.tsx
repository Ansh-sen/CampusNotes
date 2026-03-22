import React from 'react';
import { Star, StarHalf } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  rating: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
}

export function RatingStars({ 
  rating, 
  max = 5, 
  size = 'md', 
  interactive = false, 
  onRatingChange,
  className 
}: RatingStarsProps) {
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);

  const starSize = {
    sm: 'h-3 w-3',
    md: 'h-5 w-5',
    lg: 'h-8 w-8'
  };

  const getStarType = (index: number) => {
    const currentRating = hoverRating !== null ? hoverRating : rating;
    if (currentRating >= index + 1) return 'full';
    if (currentRating >= index + 0.5) return 'half';
    return 'empty';
  };

  return (
    <div className={cn("flex items-center space-x-1", className)}>
      {[...Array(max)].map((_, i) => {
        const starType = getStarType(i);
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onRatingChange?.(i + 1)}
            onMouseEnter={() => interactive && setHoverRating(i + 1)}
            onMouseLeave={() => interactive && setHoverRating(null)}
            className={cn(
              "focus:outline-none transition-transform hover:scale-110 disabled:hover:scale-100",
              interactive ? "cursor-pointer" : "cursor-default"
            )}
          >
            {starType === 'full' && (
              <Star className={cn(starSize[size], "fill-[hsl(var(--accent))] text-[hsl(var(--accent))]")} />
            )}
            {starType === 'half' && (
              <StarHalf className={cn(starSize[size], "fill-[hsl(var(--accent))] text-[hsl(var(--accent))]")} />
            )}
            {starType === 'empty' && (
              <Star className={cn(starSize[size], "text-[hsl(var(--muted-foreground))] opacity-30")} />
            )}
          </button>
        );
      })}
    </div>
  );
}

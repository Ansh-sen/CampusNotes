import React, { useState } from 'react';
import { API_URL } from '@/config';
import { Button } from '@/components/ui/button';
import { RatingStars } from '@/components/ui/RatingStars';
import { useToast } from '@/components/ui/toast-provider';
import { useAuth } from '@/hooks/useAuth';

interface ReviewFormProps {
  listingId?: string;
  revieweeId: string;
  onSuccess?: (newAverage: number) => void;
  onCancel?: () => void;
}

export function ReviewForm({ listingId, revieweeId, onSuccess, onCancel }: ReviewFormProps) {
  const { jwt } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast({ title: 'Error', description: 'Please select a rating', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify({
          listing_id: listingId,
          reviewee_id: revieweeId,
          rating,
          comment
        })
      });

      const json = await response.json();
      if (!response.ok) throw new Error(json.error);

      toast({ title: 'Success', description: 'Review submitted!', type: 'success' });
      onSuccess?.(json.average);
    } catch (error: any) {
      let message = error.message || 'Failed to submit review';
      if (message.includes('Forbidden') || message.includes('You can only review')) {
        message = 'You must have messaged the seller about this listing before you can review it.';
      }
      toast({ title: 'Submission Refused', description: message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 rounded-2xl bg-white border border-[hsl(var(--muted))] shadow-sm">
      <div className="space-y-2">
        <label className="text-sm font-bold text-[hsl(var(--text))] uppercase tracking-wider">Rate your experience</label>
        <RatingStars 
          rating={rating} 
          interactive 
          onRatingChange={setRating} 
          size="lg"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-[hsl(var(--text))] uppercase tracking-wider">Comment (optional)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What was it like dealing with this student?"
          className="w-full min-h-[100px] p-3 rounded-xl border border-[hsl(var(--muted))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm"
        />
      </div>

      <div className="flex gap-2">
        <Button 
          type="submit" 
          disabled={submitting} 
          className="flex-1 rounded-xl h-12 font-bold"
        >
          {submitting ? 'Submitting...' : 'Post Review'}
        </Button>
        {onCancel && (
          <Button 
            type="button" 
            variant="ghost" 
            onClick={onCancel}
            className="rounded-xl h-12"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

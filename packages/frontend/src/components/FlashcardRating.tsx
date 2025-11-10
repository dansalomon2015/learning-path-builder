import { useState } from 'react';
import { Star, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent } from './ui/card';
import { cn } from '@/lib/utils';

interface FlashcardRatingProps {
  flashcardId: string;
  onRatingChange?: (rating: number, comment: string) => void;
}

export function FlashcardRating({
  flashcardId: _flashcardId,
  onRatingChange,
}: FlashcardRatingProps): JSX.Element {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [showComment, setShowComment] = useState(false);

  const handleRatingClick = (value: number): void => {
    setRating(value);
    if (onRatingChange != null) {
      onRatingChange(value, comment);
    }
  };

  const handleCommentSave = (): void => {
    if (onRatingChange != null) {
      onRatingChange(rating, comment);
    }
    setShowComment(false);
  };

  return (
    <Card className="border-2">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Rate this card</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(
              (value): JSX.Element => (
                <button
                  key={value}
                  type="button"
                  onClick={(): void => handleRatingClick(value)}
                  onMouseEnter={(): void => setHoveredRating(value)}
                  onMouseLeave={(): void => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      'h-5 w-5 transition-colors',
                      (hoveredRating > 0 ? hoveredRating : rating) >= value
                        ? 'fill-yellow-500 text-yellow-500'
                        : 'text-muted-foreground'
                    )}
                  />
                </button>
              )
            )}
          </div>
        </div>

        {!showComment ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full bg-transparent"
            onClick={(): void => setShowComment(true)}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Add Comment
          </Button>
        ) : (
          <div className="space-y-2">
            <Textarea
              placeholder="Share your thoughts on this card..."
              value={comment}
              onChange={(e): void => setComment(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCommentSave}>
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={(): void => setShowComment(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {comment !== '' && !showComment && (
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
            <p className="font-medium mb-1">Votre commentaire:</p>
            <p>{comment}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

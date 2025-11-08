"use client"

import { useState } from "react"
import { Star, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface FlashcardRatingProps {
  flashcardId: string
  onRatingChange?: (rating: number, comment: string) => void
}

export function FlashcardRating({ flashcardId, onRatingChange }: FlashcardRatingProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState("")
  const [showComment, setShowComment] = useState(false)

  const handleRatingClick = (value: number) => {
    setRating(value)
    if (onRatingChange) {
      onRatingChange(value, comment)
    }
  }

  const handleCommentSave = () => {
    if (onRatingChange) {
      onRatingChange(rating, comment)
    }
    setShowComment(false)
  }

  return (
    <Card className="border-2">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Évaluer cette carte</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                onClick={() => handleRatingClick(value)}
                onMouseEnter={() => setHoveredRating(value)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    "h-5 w-5 transition-colors",
                    (hoveredRating || rating) >= value ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground",
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        {!showComment ? (
          <Button variant="outline" size="sm" className="w-full bg-transparent" onClick={() => setShowComment(true)}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Ajouter un commentaire
          </Button>
        ) : (
          <div className="space-y-2">
            <Textarea
              placeholder="Partagez vos réflexions sur cette carte..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCommentSave}>
                Enregistrer
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowComment(false)}>
                Annuler
              </Button>
            </div>
          </div>
        )}

        {comment && !showComment && (
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
            <p className="font-medium mb-1">Votre commentaire:</p>
            <p>{comment}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

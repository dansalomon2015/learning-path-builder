"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Flame, Trophy, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

interface StreakCardProps {
  userId: string
}

export function StreakCard({ userId }: StreakCardProps) {
  const [currentStreak, setCurrentStreak] = useState(0)
  const [longestStreak, setLongestStreak] = useState(0)
  const [lastStudyDate, setLastStudyDate] = useState<Date | null>(null)
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false)
  const [missedDays, setMissedDays] = useState(0)

  useEffect(() => {
    // TODO: Fetch streak data from Firestore
    // Mock data for now
    const mockLastStudy = new Date()
    mockLastStudy.setDate(mockLastStudy.getDate() - 2) // 2 days ago

    setCurrentStreak(5)
    setLongestStreak(12)
    setLastStudyDate(mockLastStudy)

    // Calculate missed days
    const today = new Date()
    const daysSinceLastStudy = Math.floor((today.getTime() - mockLastStudy.getTime()) / (1000 * 60 * 60 * 24))
    if (daysSinceLastStudy > 1) {
      setMissedDays(daysSinceLastStudy - 1)
    }
  }, [userId])

  const handleRecoverStreak = () => {
    setShowRecoveryDialog(true)
  }

  const handleRecoveryTestComplete = (passed: boolean) => {
    if (passed) {
      // TODO: Update streak in Firestore
      setMissedDays(0)
      setCurrentStreak(currentStreak + missedDays)
    }
    setShowRecoveryDialog(false)
  }

  return (
    <>
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-full blur-3xl" />
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Série d'apprentissage</CardTitle>
          <Flame className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div>
              <div className="text-3xl font-bold flex items-center gap-2">
                <Flame className={cn("h-8 w-8", currentStreak > 0 ? "text-orange-500" : "text-muted-foreground")} />
                {currentStreak}
              </div>
              <p className="text-xs text-muted-foreground">Jours consécutifs</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Trophy className="h-4 w-4" />
              <span>Record: {longestStreak}</span>
            </div>
          </div>

          {missedDays > 0 && (
            <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-orange-500" />
                  <span>{missedDays} jour(s) manqué(s)</span>
                </div>
                <Button size="sm" variant="outline" onClick={handleRecoverStreak}>
                  Récupérer
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showRecoveryDialog} onOpenChange={setShowRecoveryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Récupérer votre série</DialogTitle>
            <DialogDescription>
              Passez un test pour prouver que vous avez étudié et récupérer vos {missedDays} jour(s) manqué(s)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Ce test contient 10 questions sur vos modules récents. Vous devez obtenir au moins 70% pour récupérer
              votre série.
            </p>
            <Button className="w-full" onClick={() => handleRecoveryTestComplete(true)}>
              Commencer le test
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

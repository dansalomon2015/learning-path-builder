"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, Plus, Target, TrendingUp, LogOut, Loader2, User } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { CreateObjectiveDialog } from "@/components/create-objective-dialog"
import { ObjectiveCard } from "@/components/objective-card"
import { StreakCard } from "@/components/streak-card"

export default function DashboardPage() {
  const { user, signOut, loading: authLoading } = useAuth()
  const router = useRouter()
  const [objectives, setObjectives] = useState<any[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    } else if (user) {
      // TODO: Fetch objectives from Firestore
      // For now, using mock data
      setObjectives([])
      setLoading(false)
    }
  }, [user, authLoading, router])

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  const handleCreateObjective = (objective: any) => {
    setObjectives([...objectives, { ...objective, id: Date.now().toString() }])
    setShowCreateDialog(false)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">FlashLearn AI</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">{user?.email}</span>
            <Button variant="ghost" size="icon" onClick={() => router.push("/profile")}>
              <User className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-balance">Tableau de bord</h1>
          <p className="text-muted-foreground text-lg">
            Gérez vos objectifs d'apprentissage et suivez votre progression
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid md:grid-cols-3 md:grid-rows-2 gap-6 mb-8">
          <div className="md:row-span-2">
            <StreakCard userId={user?.uid || ""} />
          </div>

          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Objectifs actifs</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{objectives.length}</div>
              <p className="text-xs text-muted-foreground">En cours d'apprentissage</p>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Modules complétés</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Sur tous vos parcours</p>
            </CardContent>
          </Card>
        </div>

        {/* Objectives Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Mes objectifs</h2>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvel objectif
            </Button>
          </div>

          {objectives.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Target className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Aucun objectif pour le moment</h3>
                <p className="text-muted-foreground text-center mb-6 max-w-md">
                  Créez votre premier objectif d'apprentissage pour commencer votre parcours avec FlashLearn AI
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer mon premier objectif
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {objectives.map((objective) => (
                <ObjectiveCard key={objective.id} objective={objective} />
              ))}
            </div>
          )}
        </div>
      </main>

      <CreateObjectiveDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreateObjective={handleCreateObjective}
      />
    </div>
  )
}

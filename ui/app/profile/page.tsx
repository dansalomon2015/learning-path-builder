"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Brain, User, Mail, Calendar, Target, BookOpen, Flame, Award, ArrowLeft, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")

  // Mock user stats
  const [stats, setStats] = useState({
    totalObjectives: 3,
    completedModules: 12,
    totalFlashcards: 156,
    currentStreak: 7,
    longestStreak: 15,
    totalStudyDays: 42,
    averageScore: 85,
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    } else if (user) {
      setEmail(user.email)
      setName(user.email.split("@")[0])
      setLoading(false)
    }
  }, [user, authLoading, router])

  const handleSaveProfile = () => {
    // TODO: Save to backend
    toast({
      title: "Profil mis à jour",
      description: "Vos informations ont été enregistrées avec succès.",
    })
    setEditing(false)
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
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Brain className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">FlashLearn AI</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-balance">Mon Profil</h1>
          <p className="text-muted-foreground text-lg">Gérez vos informations et consultez vos statistiques</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle>Informations personnelles</CardTitle>
                <CardDescription>Gérez vos informations de compte</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center gap-4 pb-4 border-b">
                  <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <User className="h-12 w-12 text-primary-foreground" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-lg">{name}</h3>
                    <p className="text-sm text-muted-foreground">{email}</p>
                  </div>
                </div>

                {editing ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nom</Label>
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveProfile} className="flex-1">
                        Enregistrer
                      </Button>
                      <Button variant="outline" onClick={() => setEditing(false)} className="flex-1">
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Membre depuis janvier 2025</span>
                    </div>
                    <Button variant="outline" onClick={() => setEditing(true)} className="w-full mt-4">
                      Modifier le profil
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Achievements Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Réalisations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Flame className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Série de feu</p>
                    <p className="text-xs text-muted-foreground">7 jours consécutifs</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Target className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Objectif atteint</p>
                    <p className="text-xs text-muted-foreground">3 objectifs créés</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Étudiant assidu</p>
                    <p className="text-xs text-muted-foreground">156 flashcards étudiées</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Statistics */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Stats */}
            <div className="grid sm:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Objectifs totaux</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalObjectives}</div>
                  <p className="text-xs text-muted-foreground mt-1">Parcours d'apprentissage</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Modules complétés</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.completedModules}</div>
                  <p className="text-xs text-muted-foreground mt-1">Avec succès</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Flashcards étudiées</CardTitle>
                  <Brain className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalFlashcards}</div>
                  <p className="text-xs text-muted-foreground mt-1">Cartes mémorisées</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Score moyen</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.averageScore}%</div>
                  <p className="text-xs text-muted-foreground mt-1">Sur tous les quiz</p>
                </CardContent>
              </Card>
            </div>

            {/* Streak Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-primary" />
                  Statistiques de série
                </CardTitle>
                <CardDescription>Votre progression d'apprentissage quotidien</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Série actuelle</p>
                    <p className="text-3xl font-bold text-primary">{stats.currentStreak}</p>
                    <p className="text-xs text-muted-foreground">jours consécutifs</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Meilleure série</p>
                    <p className="text-3xl font-bold text-secondary">{stats.longestStreak}</p>
                    <p className="text-xs text-muted-foreground">jours maximum</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Total d'étude</p>
                    <p className="text-3xl font-bold text-accent">{stats.totalStudyDays}</p>
                    <p className="text-xs text-muted-foreground">jours au total</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Learning Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Activité récente</CardTitle>
                <CardDescription>Vos dernières sessions d'apprentissage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { date: "Aujourd'hui", activity: "Module JavaScript avancé complété", score: "92%" },
                    { date: "Hier", activity: "25 flashcards étudiées en React", score: "88%" },
                    { date: "Il y a 2 jours", activity: "Quiz de validation TypeScript", score: "85%" },
                    { date: "Il y a 3 jours", activity: "Module CSS Grid terminé", score: "90%" },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{item.activity}</p>
                        <p className="text-xs text-muted-foreground">{item.date}</p>
                      </div>
                      <div className="text-sm font-semibold text-primary">{item.score}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

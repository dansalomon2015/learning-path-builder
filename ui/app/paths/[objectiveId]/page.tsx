"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Brain, Lock, CheckCircle2, Circle, BookOpen, ArrowLeft, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

// Mock data - In production, this would come from Firestore/AI
const mockPaths = [
  {
    id: "path1",
    title: "Fondamentaux de React",
    description: "Maîtrisez les bases essentielles de React",
    modules: [
      {
        id: "mod1",
        title: "Introduction à React",
        description: "Comprendre les concepts de base",
        flashcardsCount: 15,
        status: "unlocked",
        progress: 100,
      },
      {
        id: "mod2",
        title: "Components et Props",
        description: "Créer et utiliser des composants",
        flashcardsCount: 20,
        status: "unlocked",
        progress: 60,
      },
      {
        id: "mod3",
        title: "State et Lifecycle",
        description: "Gérer l'état des composants",
        flashcardsCount: 18,
        status: "locked",
        progress: 0,
      },
    ],
  },
  {
    id: "path2",
    title: "React Avancé",
    description: "Techniques avancées et patterns",
    modules: [
      {
        id: "mod4",
        title: "Hooks personnalisés",
        description: "Créer vos propres hooks",
        flashcardsCount: 12,
        status: "locked",
        progress: 0,
      },
      {
        id: "mod5",
        title: "Context API",
        description: "Gestion d'état globale",
        flashcardsCount: 16,
        status: "locked",
        progress: 0,
      },
      {
        id: "mod6",
        title: "Performance",
        description: "Optimiser vos applications",
        flashcardsCount: 14,
        status: "locked",
        progress: 0,
      },
    ],
  },
]

export default function LearningPathsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const objectiveId = params.objectiveId as string

  const [paths, setPaths] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [objectiveTitle, setObjectiveTitle] = useState("React.js")

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    // TODO: Fetch paths from Firestore
    setTimeout(() => {
      setPaths(mockPaths)
      setLoading(false)
    }, 1000)
  }, [user, router, objectiveId])

  const handleStartModule = (pathId: string, moduleId: string) => {
    router.push(`/study/${objectiveId}/${pathId}/${moduleId}`)
  }

  const calculatePathProgress = (modules: any[]) => {
    const totalProgress = modules.reduce((sum, mod) => sum + mod.progress, 0)
    return Math.round(totalProgress / modules.length)
  }

  if (loading) {
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
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              <div>
                <h1 className="font-semibold">Parcours d'apprentissage</h1>
                <p className="text-sm text-muted-foreground">{objectiveTitle}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Overview */}
        <Card className="border-2 mb-8">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">{paths.length}</div>
                <p className="text-sm text-muted-foreground">Parcours disponibles</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">
                  {paths.reduce((sum, path) => sum + path.modules.length, 0)}
                </div>
                <p className="text-sm text-muted-foreground">Modules au total</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">
                  {paths.reduce(
                    (sum, path) => sum + path.modules.reduce((s: number, m: any) => s + m.flashcardsCount, 0),
                    0,
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Flashcards à étudier</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Learning Paths */}
        <div className="space-y-8">
          {paths.map((path, pathIndex) => {
            const pathProgress = calculatePathProgress(path.modules)
            const isPathLocked = pathIndex > 0 && calculatePathProgress(paths[pathIndex - 1].modules) < 100

            return (
              <Card key={path.id} className="border-2">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-2xl">{path.title}</CardTitle>
                        {isPathLocked && (
                          <Badge variant="secondary">
                            <Lock className="h-3 w-3 mr-1" />
                            Verrouillé
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-base">{path.description}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{pathProgress}%</div>
                      <p className="text-xs text-muted-foreground">Progression</p>
                    </div>
                  </div>
                  <Progress value={pathProgress} className="mt-4" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {path.modules.map((module: any, moduleIndex: number) => {
                      const isLocked = module.status === "locked"
                      const isCompleted = module.progress === 100

                      return (
                        <div
                          key={module.id}
                          className={cn(
                            "flex items-center gap-4 p-4 rounded-lg border-2 transition-colors",
                            isLocked ? "bg-muted/30 opacity-60" : "hover:border-primary/50 cursor-pointer",
                          )}
                          onClick={() => !isLocked && handleStartModule(path.id, module.id)}
                        >
                          {/* Status Icon */}
                          <div
                            className={cn(
                              "flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center",
                              isCompleted ? "bg-green-500/10" : isLocked ? "bg-muted" : "bg-primary/10",
                            )}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : isLocked ? (
                              <Lock className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <Circle className="h-5 w-5 text-primary" />
                            )}
                          </div>

                          {/* Module Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{module.title}</h4>
                              {isCompleted && <Badge className="bg-green-500">Terminé</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{module.description}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <BookOpen className="h-3 w-3" />
                                <span>{module.flashcardsCount} flashcards</span>
                              </div>
                              {!isLocked && module.progress > 0 && <span>{module.progress}% complété</span>}
                            </div>
                          </div>

                          {/* Action Button */}
                          {!isLocked && (
                            <Button
                              variant={isCompleted ? "outline" : "default"}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleStartModule(path.id, module.id)
                              }}
                            >
                              {isCompleted ? "Réviser" : module.progress > 0 ? "Continuer" : "Commencer"}
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {isPathLocked && (
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg border-2 border-dashed">
                      <p className="text-sm text-muted-foreground text-center">
                        Complétez le parcours précédent pour débloquer celui-ci
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </main>
    </div>
  )
}

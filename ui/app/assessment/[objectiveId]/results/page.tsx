"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Brain, TrendingUp, Target, Sparkles, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function AssessmentResultsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const objectiveId = params.objectiveId as string

  const [loading, setLoading] = useState(true)
  const [generatingPaths, setGeneratingPaths] = useState(false)
  const [results, setResults] = useState({
    score: 68,
    totalQuestions: 25,
    correctAnswers: 17,
    currentLevel: "Intermédiaire",
    strengths: ["Concepts de base", "Syntaxe JSX", "Props et State"],
    weaknesses: ["Hooks avancés", "Performance", "Patterns de composition"],
  })

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    // TODO: Fetch assessment results from backend
    setTimeout(() => setLoading(false), 1000)
  }, [user, router, objectiveId])

  const handleGeneratePaths = async () => {
    setGeneratingPaths(true)

    // TODO: Call AI to generate learning paths
    setTimeout(() => {
      router.push(`/paths/${objectiveId}`)
    }, 2000)
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
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
            <Brain className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Évaluation terminée !</h1>
          <p className="text-muted-foreground text-lg">Voici les résultats de votre évaluation</p>
        </div>

        {/* Score Card */}
        <Card className="border-2 mb-6">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-6xl font-bold text-primary">{results.score}%</CardTitle>
            <CardDescription className="text-lg">
              {results.correctAnswers} / {results.totalQuestions} réponses correctes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={results.score} className="h-3" />
          </CardContent>
        </Card>

        {/* Current Level */}
        <Card className="border-2 mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Niveau actuel détecté</CardTitle>
                <CardDescription>Basé sur vos réponses</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{results.currentLevel}</div>
          </CardContent>
        </Card>

        {/* Strengths and Weaknesses */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <CardTitle>Points forts</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {results.strengths.map((strength, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-500" />
                <CardTitle>À améliorer</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {results.weaknesses.map((weakness, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-orange-500" />
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Generate Paths CTA */}
        <Card className="border-2 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-8 text-center space-y-4">
            <Sparkles className="h-12 w-12 text-primary mx-auto" />
            <h3 className="text-2xl font-bold">Prêt pour votre parcours personnalisé ?</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Notre IA va générer des parcours d'apprentissage adaptés à votre niveau et vos objectifs, avec des modules
              progressifs et des flashcards personnalisées.
            </p>
            <Button size="lg" onClick={handleGeneratePaths} disabled={generatingPaths}>
              {generatingPaths ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Générer mes parcours
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar, Target, TrendingUp } from "lucide-react"

interface ObjectiveCardProps {
  objective: {
    id: string
    title: string
    description: string
    targetLevel: string
    deadline?: string
    status: string
    progress?: number
  }
}

export function ObjectiveCard({ objective }: ObjectiveCardProps) {
  const getStatusBadge = () => {
    switch (objective.status) {
      case "pending_assessment":
        return <Badge variant="secondary">En attente d'évaluation</Badge>
      case "in_progress":
        return <Badge className="bg-primary">En cours</Badge>
      case "completed":
        return <Badge className="bg-green-500">Terminé</Badge>
      default:
        return <Badge variant="outline">{objective.status}</Badge>
    }
  }

  const getLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      beginner: "Débutant",
      intermediate: "Intermédiaire",
      advanced: "Avancé",
      expert: "Expert",
    }
    return labels[level] || level
  }

  return (
    <Card className="border-2 hover:border-primary/50 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <Target className="h-5 w-5 text-primary" />
          {getStatusBadge()}
        </div>
        <CardTitle className="text-xl">{objective.title}</CardTitle>
        <CardDescription>{objective.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TrendingUp className="h-4 w-4" />
          <span>Niveau cible: {getLevelLabel(objective.targetLevel)}</span>
        </div>
        {objective.deadline && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Échéance: {new Date(objective.deadline).toLocaleDateString("fr-FR")}</span>
          </div>
        )}
        {objective.progress !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progression</span>
              <span className="font-medium">{objective.progress}%</span>
            </div>
            <Progress value={objective.progress} />
          </div>
        )}
      </CardContent>
      <CardFooter>
        {objective.status === "pending_assessment" ? (
          <Button className="w-full" asChild>
            <Link href={`/assessment/${objective.id}`}>Commencer l'évaluation</Link>
          </Button>
        ) : (
          <Button className="w-full" asChild>
            <Link href={`/paths/${objective.id}`}>Voir mes parcours</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

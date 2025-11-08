"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, CheckCircle2, BookOpen } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Resource {
  id: string
  title: string
  type: "article" | "video" | "documentation" | "tutorial"
  url: string
  description: string
  selfAssessed?: boolean
}

interface ModuleResourcesProps {
  resources: Resource[]
  onSelfAssess?: (resourceId: string) => void
}

export function ModuleResources({ resources, onSelfAssess }: ModuleResourcesProps) {
  const [assessedResources, setAssessedResources] = useState<Set<string>>(new Set())

  const handleSelfAssess = (resourceId: string) => {
    setAssessedResources(new Set(assessedResources).add(resourceId))
    if (onSelfAssess) {
      onSelfAssess(resourceId)
    }
  }

  const getTypeColor = (type: Resource["type"]) => {
    switch (type) {
      case "article":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "video":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20"
      case "documentation":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "tutorial":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20"
    }
  }

  const getTypeLabel = (type: Resource["type"]) => {
    switch (type) {
      case "article":
        return "Article"
      case "video":
        return "Vidéo"
      case "documentation":
        return "Documentation"
      case "tutorial":
        return "Tutoriel"
    }
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Ressources suggérées
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {resources.map((resource) => {
          const isAssessed = assessedResources.has(resource.id)
          return (
            <div key={resource.id} className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getTypeColor(resource.type)}>
                      {getTypeLabel(resource.type)}
                    </Badge>
                    {isAssessed && (
                      <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Auto-évalué
                      </Badge>
                    )}
                  </div>
                  <h4 className="font-semibold leading-tight">{resource.title}</h4>
                  <p className="text-sm text-muted-foreground">{resource.description}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" asChild>
                  <a href={resource.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Consulter
                  </a>
                </Button>
                {!isAssessed && (
                  <Button size="sm" onClick={() => handleSelfAssess(resource.id)}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Auto-évaluer
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

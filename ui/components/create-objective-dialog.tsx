"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"

interface CreateObjectiveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateObjective: (objective: any) => void
}

export function CreateObjectiveDialog({ open, onOpenChange, onCreateObjective }: CreateObjectiveDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [targetLevel, setTargetLevel] = useState("")
  const [deadline, setDeadline] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // TODO: Save to Firestore
    const objective = {
      title,
      description,
      targetLevel,
      deadline,
      status: "pending_assessment",
      createdAt: new Date().toISOString(),
    }

    // Simulate API call
    setTimeout(() => {
      onCreateObjective(objective)
      setLoading(false)
      resetForm()
    }, 500)
  }

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setTargetLevel("")
    setDeadline("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Créer un objectif d'apprentissage</DialogTitle>
          <DialogDescription>
            Définissez votre objectif et nous créerons un parcours personnalisé pour vous
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre de l'objectif</Label>
              <Input
                id="title"
                placeholder="Ex: Maîtriser React.js"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Décrivez ce que vous souhaitez apprendre..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                disabled={loading}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetLevel">Niveau cible</Label>
              <Select value={targetLevel} onValueChange={setTargetLevel} required disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un niveau" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Débutant</SelectItem>
                  <SelectItem value="intermediate">Intermédiaire</SelectItem>
                  <SelectItem value="advanced">Avancé</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Date limite (optionnel)</Label>
              <Input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                "Créer l'objectif"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

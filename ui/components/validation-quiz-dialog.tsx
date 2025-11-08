"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, XCircle, Loader2, Lightbulb } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface ValidationQuizDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: (passed: boolean) => void
  moduleTitle: string
}

const mockQuizQuestions = [
  {
    id: "q1",
    question: "Quel est le rôle principal de React ?",
    options: [
      "Gérer les bases de données",
      "Construire des interfaces utilisateur",
      "Créer des serveurs web",
      "Compiler du code",
    ],
    correctAnswer: "Construire des interfaces utilisateur",
  },
  {
    id: "q2",
    question: "Comment passe-t-on des données à un composant enfant ?",
    options: ["Via le state", "Via les props", "Via le context", "Via les refs"],
    correctAnswer: "Via les props",
  },
  {
    id: "q3",
    question: "Que signifie JSX ?",
    options: ["JavaScript XML", "Java Syntax Extension", "JSON Extended", "JavaScript Express"],
    correctAnswer: "JavaScript XML",
  },
  {
    id: "q4",
    question: "Quel hook permet de gérer l'état local d'un composant ?",
    options: ["useEffect", "useState", "useContext", "useReducer"],
    correctAnswer: "useState",
  },
  {
    id: "q5",
    question: "Quel hook est utilisé pour les effets de bord ?",
    options: ["useState", "useEffect", "useMemo", "useCallback"],
    correctAnswer: "useEffect",
  },
  {
    id: "q6",
    question: "Que retourne un composant React ?",
    options: ["Un objet", "Du JSX", "Une fonction", "Un tableau"],
    correctAnswer: "Du JSX",
  },
  {
    id: "q7",
    question: "Comment créer un composant fonctionnel ?",
    options: [
      "class Component extends React.Component",
      "function Component() {}",
      "const Component = new React.Component()",
      "React.createComponent()",
    ],
    correctAnswer: "function Component() {}",
  },
  {
    id: "q8",
    question: "Quelle est la différence entre state et props ?",
    options: [
      "Aucune différence",
      "State est mutable, props est immutable",
      "Props est mutable, state est immutable",
      "Les deux sont mutables",
    ],
    correctAnswer: "State est mutable, props est immutable",
  },
  {
    id: "q9",
    question: "Qu'est-ce que le Virtual DOM ?",
    options: [
      "Une copie du DOM réel",
      "Une représentation en mémoire du DOM",
      "Un nouveau navigateur",
      "Une base de données",
    ],
    correctAnswer: "Une représentation en mémoire du DOM",
  },
  {
    id: "q10",
    question: "Comment gérer les événements en React ?",
    options: ["onclick='handleClick()'", "onClick={handleClick}", "on-click='handleClick'", "@click='handleClick'"],
    correctAnswer: "onClick={handleClick}",
  },
  {
    id: "q11",
    question: "Qu'est-ce qu'un hook personnalisé ?",
    options: ["Un composant React", "Une fonction qui utilise des hooks React", "Une classe React", "Un élément HTML"],
    correctAnswer: "Une fonction qui utilise des hooks React",
  },
  {
    id: "q12",
    question: "Quel est le but de useContext ?",
    options: [
      "Gérer l'état local",
      "Partager des données entre composants",
      "Créer des effets de bord",
      "Optimiser les performances",
    ],
    correctAnswer: "Partager des données entre composants",
  },
  {
    id: "q13",
    question: "Comment optimiser un composant React ?",
    options: ["Utiliser React.memo", "Utiliser plus de state", "Créer plus de composants", "Éviter les hooks"],
    correctAnswer: "Utiliser React.memo",
  },
  {
    id: "q14",
    question: "Qu'est-ce que le prop drilling ?",
    options: [
      "Passer des props à travers plusieurs niveaux",
      "Créer des trous dans les props",
      "Supprimer des props",
      "Modifier des props",
    ],
    correctAnswer: "Passer des props à travers plusieurs niveaux",
  },
  {
    id: "q15",
    question: "Quel hook permet de mémoriser une valeur calculée ?",
    options: ["useState", "useEffect", "useMemo", "useRef"],
    correctAnswer: "useMemo",
  },
  {
    id: "q16",
    question: "Qu'est-ce que le reconciliation en React ?",
    options: [
      "Le processus de mise à jour du DOM",
      "La création de composants",
      "La gestion des erreurs",
      "L'optimisation du code",
    ],
    correctAnswer: "Le processus de mise à jour du DOM",
  },
  {
    id: "q17",
    question: "Comment éviter les re-renders inutiles ?",
    options: [
      "Utiliser plus de state",
      "Utiliser React.memo et useMemo",
      "Créer plus de composants",
      "Éviter les props",
    ],
    correctAnswer: "Utiliser React.memo et useMemo",
  },
  {
    id: "q18",
    question: "Qu'est-ce qu'un composant contrôlé ?",
    options: [
      "Un composant géré par React",
      "Un composant dont la valeur est contrôlée par le state",
      "Un composant sans props",
      "Un composant sans state",
    ],
    correctAnswer: "Un composant dont la valeur est contrôlée par le state",
  },
  {
    id: "q19",
    question: "Quel est le rôle de useRef ?",
    options: ["Gérer l'état", "Accéder aux éléments DOM", "Créer des effets", "Partager des données"],
    correctAnswer: "Accéder aux éléments DOM",
  },
  {
    id: "q20",
    question: "Comment gérer les formulaires en React ?",
    options: ["Avec des composants contrôlés", "Avec jQuery", "Avec du HTML pur", "Avec des classes CSS"],
    correctAnswer: "Avec des composants contrôlés",
  },
  {
    id: "q21",
    question: "Qu'est-ce que le lifting state up ?",
    options: [
      "Supprimer le state",
      "Déplacer le state vers un composant parent",
      "Créer plus de state",
      "Utiliser le context",
    ],
    correctAnswer: "Déplacer le state vers un composant parent",
  },
  {
    id: "q22",
    question: "Quel est le cycle de vie d'un composant fonctionnel ?",
    options: ["Mount, Update, Unmount", "Render seulement", "Create, Destroy", "Init, Run, Stop"],
    correctAnswer: "Mount, Update, Unmount",
  },
  {
    id: "q23",
    question: "Comment gérer les erreurs en React ?",
    options: ["Avec try-catch", "Avec Error Boundaries", "Avec console.log", "Avec des alerts"],
    correctAnswer: "Avec Error Boundaries",
  },
  {
    id: "q24",
    question: "Qu'est-ce que le code splitting ?",
    options: ["Diviser le code en plusieurs fichiers", "Supprimer du code", "Compiler le code", "Minifier le code"],
    correctAnswer: "Diviser le code en plusieurs fichiers",
  },
  {
    id: "q25",
    question: "Comment implémenter le lazy loading ?",
    options: ["Avec React.lazy", "Avec useEffect", "Avec useState", "Avec useContext"],
    correctAnswer: "Avec React.lazy",
  },
  {
    id: "q26",
    question: "Qu'est-ce qu'un Higher Order Component (HOC) ?",
    options: [
      "Un composant qui retourne un autre composant",
      "Un composant avec beaucoup de props",
      "Un composant sans state",
      "Un composant parent",
    ],
    correctAnswer: "Un composant qui retourne un autre composant",
  },
  {
    id: "q27",
    question: "Comment partager la logique entre composants ?",
    options: ["Avec des hooks personnalisés", "Avec des variables globales", "Avec localStorage", "Avec des cookies"],
    correctAnswer: "Avec des hooks personnalisés",
  },
  {
    id: "q28",
    question: "Qu'est-ce que le Suspense en React ?",
    options: ["Un composant pour gérer le chargement asynchrone", "Un hook", "Une méthode de classe", "Un événement"],
    correctAnswer: "Un composant pour gérer le chargement asynchrone",
  },
  {
    id: "q29",
    question: "Comment optimiser les listes en React ?",
    options: [
      "Utiliser des keys uniques",
      "Ne pas utiliser de keys",
      "Utiliser des index comme keys",
      "Créer plus de composants",
    ],
    correctAnswer: "Utiliser des keys uniques",
  },
  {
    id: "q30",
    question: "Qu'est-ce que le StrictMode ?",
    options: [
      "Un mode de développement pour détecter les problèmes",
      "Un mode de production",
      "Un hook",
      "Un composant de style",
    ],
    correctAnswer: "Un mode de développement pour détecter les problèmes",
  },
  {
    id: "q31",
    question: "Comment gérer les animations en React ?",
    options: ["Avec des bibliothèques comme Framer Motion", "Avec jQuery", "Avec Flash", "Avec Java"],
    correctAnswer: "Avec des bibliothèques comme Framer Motion",
  },
  {
    id: "q32",
    question: "Qu'est-ce que le portail en React ?",
    options: [
      "Un moyen de rendre des composants en dehors du DOM parent",
      "Une porte d'entrée",
      "Un hook",
      "Un événement",
    ],
    correctAnswer: "Un moyen de rendre des composants en dehors du DOM parent",
  },
  {
    id: "q33",
    question: "Comment tester les composants React ?",
    options: ["Avec Jest et React Testing Library", "Avec console.log", "Avec des alerts", "Manuellement seulement"],
    correctAnswer: "Avec Jest et React Testing Library",
  },
  {
    id: "q34",
    question: "Qu'est-ce que le Context API ?",
    options: ["Un moyen de partager des données globalement", "Une API REST", "Un hook", "Un composant"],
    correctAnswer: "Un moyen de partager des données globalement",
  },
  {
    id: "q35",
    question: "Comment gérer le routing en React ?",
    options: ["Avec React Router", "Avec des liens HTML", "Avec des redirections serveur", "Avec des iframes"],
    correctAnswer: "Avec React Router",
  },
  {
    id: "q36",
    question: "Qu'est-ce que le Server-Side Rendering (SSR) ?",
    options: [
      "Rendre les composants côté serveur",
      "Rendre les composants côté client",
      "Compiler le code",
      "Minifier le code",
    ],
    correctAnswer: "Rendre les composants côté serveur",
  },
  {
    id: "q37",
    question: "Comment gérer l'authentification en React ?",
    options: [
      "Avec Context API et localStorage",
      "Avec des cookies seulement",
      "Avec des variables globales",
      "Avec jQuery",
    ],
    correctAnswer: "Avec Context API et localStorage",
  },
  {
    id: "q38",
    question: "Qu'est-ce que le Static Site Generation (SSG) ?",
    options: [
      "Générer des pages HTML au build time",
      "Générer des pages à la demande",
      "Compiler le code",
      "Minifier le code",
    ],
    correctAnswer: "Générer des pages HTML au build time",
  },
  {
    id: "q39",
    question: "Comment gérer les requêtes API en React ?",
    options: ["Avec fetch ou axios dans useEffect", "Avec jQuery", "Avec des formulaires HTML", "Avec des iframes"],
    correctAnswer: "Avec fetch ou axios dans useEffect",
  },
  {
    id: "q40",
    question: "Qu'est-ce que le useReducer ?",
    options: [
      "Un hook pour gérer un état complexe",
      "Un hook pour les effets",
      "Un hook pour le contexte",
      "Un hook pour les refs",
    ],
    correctAnswer: "Un hook pour gérer un état complexe",
  },
  {
    id: "q41",
    question: "Comment gérer les WebSockets en React ?",
    options: ["Avec useEffect pour la connexion", "Avec useState seulement", "Avec des formulaires", "Avec jQuery"],
    correctAnswer: "Avec useEffect pour la connexion",
  },
  {
    id: "q42",
    question: "Qu'est-ce que le useCallback ?",
    options: [
      "Un hook pour mémoriser des fonctions",
      "Un hook pour l'état",
      "Un hook pour les effets",
      "Un hook pour le contexte",
    ],
    correctAnswer: "Un hook pour mémoriser des fonctions",
  },
  {
    id: "q43",
    question: "Comment gérer les thèmes en React ?",
    options: [
      "Avec Context API et CSS variables",
      "Avec des styles inline seulement",
      "Avec jQuery",
      "Avec des iframes",
    ],
    correctAnswer: "Avec Context API et CSS variables",
  },
  {
    id: "q44",
    question: "Qu'est-ce que le useLayoutEffect ?",
    options: [
      "Un hook qui s'exécute avant le paint",
      "Un hook pour l'état",
      "Un hook pour le contexte",
      "Un hook pour les refs",
    ],
    correctAnswer: "Un hook qui s'exécute avant le paint",
  },
  {
    id: "q45",
    question: "Comment gérer les fichiers en React ?",
    options: ["Avec des inputs de type file et FormData", "Avec des liens HTML", "Avec jQuery", "Avec des iframes"],
    correctAnswer: "Avec des inputs de type file et FormData",
  },
  {
    id: "q46",
    question: "Qu'est-ce que le useImperativeHandle ?",
    options: [
      "Un hook pour exposer des méthodes aux parents",
      "Un hook pour l'état",
      "Un hook pour les effets",
      "Un hook pour le contexte",
    ],
    correctAnswer: "Un hook pour exposer des méthodes aux parents",
  },
  {
    id: "q47",
    question: "Comment gérer la pagination en React ?",
    options: ["Avec l'état et des calculs de page", "Avec des liens HTML", "Avec jQuery", "Avec des iframes"],
    correctAnswer: "Avec l'état et des calculs de page",
  },
  {
    id: "q48",
    question: "Qu'est-ce que le useDebugValue ?",
    options: [
      "Un hook pour afficher des valeurs dans DevTools",
      "Un hook pour l'état",
      "Un hook pour les effets",
      "Un hook pour le contexte",
    ],
    correctAnswer: "Un hook pour afficher des valeurs dans DevTools",
  },
  {
    id: "q49",
    question: "Comment gérer les notifications en React ?",
    options: ["Avec des bibliothèques comme react-toastify", "Avec des alerts", "Avec console.log", "Avec jQuery"],
    correctAnswer: "Avec des bibliothèques comme react-toastify",
  },
  {
    id: "q50",
    question: "Qu'est-ce que le Concurrent Mode ?",
    options: ["Un mode pour rendre React plus réactif", "Un mode de production", "Un hook", "Un composant"],
    correctAnswer: "Un mode pour rendre React plus réactif",
  },
  {
    id: "q51",
    question: "Comment gérer les modales en React ?",
    options: ["Avec des portails et l'état", "Avec des iframes", "Avec jQuery", "Avec des alerts"],
    correctAnswer: "Avec des portails et l'état",
  },
  {
    id: "q52",
    question: "Qu'est-ce que le Fiber en React ?",
    options: ["L'architecture interne de React", "Un hook", "Un composant", "Une bibliothèque"],
    correctAnswer: "L'architecture interne de React",
  },
  {
    id: "q53",
    question: "Comment gérer les tooltips en React ?",
    options: ["Avec des bibliothèques ou du CSS", "Avec des alerts", "Avec console.log", "Avec jQuery"],
    correctAnswer: "Avec des bibliothèques ou du CSS",
  },
  {
    id: "q54",
    question: "Qu'est-ce que le hydration en React ?",
    options: ["Attacher des événements au HTML pré-rendu", "Ajouter de l'eau", "Compiler le code", "Minifier le code"],
    correctAnswer: "Attacher des événements au HTML pré-rendu",
  },
  {
    id: "q55",
    question: "Comment gérer les drag and drop en React ?",
    options: ["Avec des événements onDrag et l'état", "Avec jQuery", "Avec des iframes", "Avec des liens"],
    correctAnswer: "Avec des événements onDrag et l'état",
  },
  {
    id: "q56",
    question: "Qu'est-ce que le useTransition ?",
    options: [
      "Un hook pour gérer les transitions d'état",
      "Un hook pour l'état",
      "Un hook pour les effets",
      "Un hook pour le contexte",
    ],
    correctAnswer: "Un hook pour gérer les transitions d'état",
  },
  {
    id: "q57",
    question: "Comment gérer les graphiques en React ?",
    options: ["Avec des bibliothèques comme Recharts", "Avec des images", "Avec jQuery", "Avec des iframes"],
    correctAnswer: "Avec des bibliothèques comme Recharts",
  },
  {
    id: "q58",
    question: "Qu'est-ce que le useDeferredValue ?",
    options: [
      "Un hook pour différer les mises à jour",
      "Un hook pour l'état",
      "Un hook pour les effets",
      "Un hook pour le contexte",
    ],
    correctAnswer: "Un hook pour différer les mises à jour",
  },
  {
    id: "q59",
    question: "Comment gérer les cartes en React ?",
    options: ["Avec des bibliothèques comme Leaflet", "Avec des images", "Avec jQuery", "Avec des iframes"],
    correctAnswer: "Avec des bibliothèques comme Leaflet",
  },
  {
    id: "q60",
    question: "Qu'est-ce que le useId ?",
    options: [
      "Un hook pour générer des IDs uniques",
      "Un hook pour l'état",
      "Un hook pour les effets",
      "Un hook pour le contexte",
    ],
    correctAnswer: "Un hook pour générer des IDs uniques",
  },
]

export function ValidationQuizDialog({ open, onOpenChange, onComplete, moduleTitle }: ValidationQuizDialogProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showResults, setShowResults] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const currentQuestion = mockQuizQuestions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / mockQuizQuestions.length) * 100

  const handleAnswerChange = (answer: string) => {
    setAnswers({ ...answers, [currentQuestion.id]: answer })
  }

  const handleNext = () => {
    if (currentQuestionIndex < mockQuizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      handleSubmit()
    }
  }

  const handleSubmit = () => {
    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      setShowResults(true)
    }, 1000)
  }

  const calculateScore = () => {
    let correct = 0
    mockQuizQuestions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) {
        correct++
      }
    })
    return (correct / mockQuizQuestions.length) * 100
  }

  const handleClose = () => {
    const score = calculateScore()
    const passed = score >= 80
    onComplete(passed)

    // Reset state
    setCurrentQuestionIndex(0)
    setAnswers({})
    setShowResults(false)
  }

  if (showResults) {
    const score = calculateScore()
    const passed = score >= 80

    const suggestions = [
      "Révisez les concepts de hooks React pour mieux comprendre useState et useEffect",
      "Pratiquez la création de composants personnalisés pour renforcer vos compétences",
      "Explorez les patterns avancés comme les Higher Order Components",
      "Consultez la documentation officielle de React pour approfondir vos connaissances",
    ]

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Résultats du quiz</DialogTitle>
            <DialogDescription>{moduleTitle}</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="text-center">
              {passed ? (
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              ) : (
                <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              )}
              <div className="text-4xl font-bold text-primary mb-2">{Math.round(score)}%</div>
              <p className="text-muted-foreground">
                {passed
                  ? "Félicitations ! Vous avez réussi le quiz."
                  : "Score insuffisant. Révisez le module et réessayez."}
              </p>
            </div>

            {passed ? (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <p className="text-sm text-center">Le module suivant est maintenant débloqué !</p>
              </div>
            ) : (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <p className="text-sm text-center">Vous devez obtenir au moins 80% pour débloquer le module suivant.</p>
              </div>
            )}

            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3 mb-4">
                  <Lightbulb className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-2">Suggestions d'apprentissage</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button className="w-full" onClick={handleClose}>
              {passed ? "Continuer" : "Réviser le module"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Quiz de validation</DialogTitle>
          <DialogDescription>
            {moduleTitle} - Question {currentQuestionIndex + 1} sur {mockQuizQuestions.length}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <Progress value={progress} />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold leading-relaxed">{currentQuestion.question}</h3>

            <RadioGroup value={answers[currentQuestion.id] || ""} onValueChange={handleAnswerChange}>
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <RadioGroupItem value={option} id={`quiz-option-${index}`} />
                    <Label htmlFor={`quiz-option-${index}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleNext} disabled={!answers[currentQuestion.id] || submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi...
                </>
              ) : currentQuestionIndex === mockQuizQuestions.length - 1 ? (
                "Terminer le quiz"
              ) : (
                "Question suivante"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

# Plan d'Implémentation : Auto-évaluation des Ressources Suggerées

## 📋 Vue d'ensemble

Cette feature permet aux utilisateurs de s'auto-évaluer après avoir consulté une ressource suggérée (article, vidéo, documentation, etc.) via un quiz généré par IA. L'objectif est de valider la compréhension du contenu de la ressource et de suivre les progrès d'apprentissage.

## 🎯 Objectifs

1. **Génération de quiz personnalisés** : Créer des questions adaptées au contenu de chaque ressource
2. **Interface utilisateur intuitive** : Permettre l'auto-évaluation directement depuis la liste des ressources
3. **Suivi des progrès** : Enregistrer les résultats et marquer les ressources comme évaluées
4. **Intégration avec le système existant** : S'intégrer avec les modules, objectifs et le système de progression

## 🏗️ Architecture

### 1. Modèles de données

#### Collection Firestore : `resourceAssessments`

```typescript
interface ResourceAssessment {
  id: string;
  userId: string;
  resourceId: string;
  moduleId: string;
  objectiveId: string;
  resourceTitle: string;
  resourceType: 'documentation' | 'book' | 'article' | 'video' | 'tutorial' | 'official_guide';
  resourceUrl?: string;
  questions: QuizQuestion[];
  status: 'pending' | 'completed';
  createdAt: Date;
  completedAt?: Date;
  score?: number;
  passed?: boolean; // >= 70%
  correctAnswers?: number;
  totalQuestions?: number;
  timeSpent?: number; // en secondes
}
```

**Note** : 
- **Pas d'expiration** : Les assessments ne expirent jamais. L'utilisateur peut compléter l'évaluation quand il veut.
- **Cooldown configurable** : Un cooldown (configurable via `RESOURCE_ASSESSMENT_COOLDOWN_HOURS`, défaut: 1h) limite la génération de nouveaux quiz pour éviter l'abus, mais n'empêche pas de compléter un quiz existant.
- **Cohérence avec le système** : Cette approche est cohérente avec le système de streak recovery qui a également supprimé l'expiration et utilise un cooldown configurable.

#### Collection Firestore : `resourceAssessmentResults`

```typescript
interface ResourceAssessmentResult {
  id: string;
  userId: string;
  resourceId: string;
  assessmentId: string;
  moduleId: string;
  objectiveId: string;
  resourceTitle: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number;
  passed: boolean;
  answers: Array<{
    questionId: string;
    selectedAnswer: string | number;
    correct: boolean;
    explanation?: string;
  }>;
  feedback: Array<{
    questionId: string;
    question: string;
    correct: boolean;
    userAnswer: string | number;
    correctAnswer: string | number;
    explanation: string;
  }>;
  completedAt: Date;
}
```

#### Mise à jour de `SuggestedResource` (optionnel)

```typescript
interface SuggestedResource {
  // ... champs existants
  assessmentStatus?: 'not_started' | 'in_progress' | 'completed';
  lastAssessmentScore?: number;
  lastAssessmentDate?: Date;
}
```

## 🔧 Implémentation Backend

### Phase 1 : Service Gemini - Génération de questions

**Fichier** : `packages/backend/src/services/gemini.ts`

#### Nouvelle méthode : `generateResourceAssessmentQuestions`

```typescript
async generateResourceAssessmentQuestions(
  resource: {
    id: string;
    title: string;
    description: string;
    type: 'documentation' | 'book' | 'article' | 'video' | 'tutorial' | 'official_guide';
    url?: string;
    author?: string;
  },
  context: {
    moduleTitle: string;
    moduleDescription: string;
    objectiveTitle: string;
    objectiveCategory: string;
    targetRole: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
  },
  questionCount: number = 5 // Par défaut 5 questions
): Promise<QuizQuestion[]>
```

**Prompt Gemini** :
- Basé sur le titre, description et type de ressource
- Questions adaptées au niveau de difficulté
- Focus sur les concepts clés de la ressource
- Questions pratiques et applicatives

**Exemple de prompt** :
```
Génère ${questionCount} questions de quiz pour valider la compréhension d'une ressource d'apprentissage.

Ressource:
- Titre: ${resource.title}
- Description: ${resource.description}
- Type: ${resource.type}
- Auteur: ${resource.author || 'N/A'}

Contexte:
- Module: ${context.moduleTitle}
- Objectif: ${context.objectiveTitle}
- Niveau: ${context.difficulty}
- Rôle cible: ${context.targetRole}

Les questions doivent:
1. Tester la compréhension des concepts clés de la ressource
2. Être adaptées au niveau ${context.difficulty}
3. Être pratiques et applicatives
4. Inclure des explications détaillées
```

### Phase 2 : Routes API

**Fichier** : `packages/backend/src/routes/resourceAssessments.ts` (nouveau)

#### Route 1 : Créer un assessment pour une ressource

```
POST /api/resource-assessments/start
```

**Body** :
```typescript
{
  resourceId: string;
  moduleId: string;
  objectiveId: string;
  questionCount?: number; // Optionnel, défaut: 5
}
```

**Réponse** :
```typescript
{
  success: true;
  data: ResourceAssessment;
}
```

**Logique** :
1. Vérifier l'authentification
2. Vérifier le cooldown (via `canCreateAssessment`)
   - Si en cooldown : retourner erreur 429 avec le temps restant
3. Vérifier si un assessment en attente existe déjà pour cette ressource
   - Si oui et `forceNew=false` : retourner l'assessment existant
   - Si oui et `forceNew=true` : créer un nouveau (sous réserve du cooldown)
   - Si non : créer un nouveau
4. Récupérer la ressource depuis le module
5. Récupérer les détails du module et de l'objectif
6. Générer les questions via Gemini
7. Créer le document `resourceAssessments` dans Firestore
8. Retourner l'assessment

#### Route 2 : Soumettre les réponses

```
POST /api/resource-assessments/:assessmentId/submit
```

**Body** :
```typescript
{
  answers: Array<{
    questionId: string;
    selectedAnswer: string | number;
  }>;
  timeSpent?: number; // en secondes
}
```

**Réponse** :
```typescript
{
  success: true;
  data: {
    assessmentId: string;
    score: number;
    passed: boolean;
    correctAnswers: number;
    totalQuestions: number;
    feedback: Array<FeedbackItem>;
    resultId: string;
  };
}
```

**Logique** :
1. Vérifier l'authentification et la propriété
2. Récupérer l'assessment
3. Vérifier qu'il n'est pas déjà complété
4. Calculer le score
5. Générer le feedback
6. Créer le document `resourceAssessmentResults`
7. Mettre à jour l'assessment (status: 'completed')
8. Optionnel : Mettre à jour la ressource avec le statut

#### Route 3 : Récupérer un assessment

```
GET /api/resource-assessments/:assessmentId
```

**Réponse** :
```typescript
{
  success: true;
  data: ResourceAssessment;
}
```

#### Route 4 : Récupérer les résultats d'une ressource

```
GET /api/resource-assessments/resource/:resourceId/results
```

**Réponse** :
```typescript
{
  success: true;
  data: ResourceAssessmentResult[];
}
```

#### Route 5 : Vérifier le statut d'évaluation d'une ressource

```
GET /api/resource-assessments/resource/:resourceId/status
```

**Réponse** :
```typescript
{
  success: true;
  data: {
    hasAssessment: boolean;
    assessmentId?: string;
    isCompleted: boolean;
    lastScore?: number;
    lastCompletedAt?: Date;
  };
}
```

### Phase 3 : Service de gestion des assessments

**Fichier** : `packages/backend/src/services/resourceAssessmentService.ts` (nouveau)

```typescript
class ResourceAssessmentService {
  /**
   * Get cooldown duration in hours from environment variable
   * Default: 1 hour
   */
  private getCooldownHours(): number {
    const cooldownEnv = process.env['RESOURCE_ASSESSMENT_COOLDOWN_HOURS'];
    if (cooldownEnv != null && cooldownEnv !== '') {
      const parsed = Number.parseFloat(cooldownEnv);
      if (!Number.isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
    return 1; // Default: 1 hour
  }

  /**
   * Check if user can create a new assessment (cooldown check)
   */
  async canCreateAssessment(
    userId: string,
    resourceId: string
  ): Promise<{ canCreate: boolean; cooldownEndsAt?: Date }>;

  // Créer un assessment
  async createAssessment(
    userId: string,
    resourceId: string,
    moduleId: string,
    objectiveId: string,
    questionCount?: number
  ): Promise<ResourceAssessment>;

  // Valider et soumettre un assessment
  async submitAssessment(
    assessmentId: string,
    userId: string,
    answers: Array<{ questionId: string; selectedAnswer: string | number }>,
    timeSpent?: number
  ): Promise<ResourceAssessmentResult>;

  // Récupérer le statut d'une ressource
  async getResourceStatus(
    userId: string,
    resourceId: string
  ): Promise<{
    hasAssessment: boolean;
    assessmentId?: string;
    isCompleted: boolean;
    lastScore?: number;
  }>;

  // Récupérer ou créer un assessment
  async getOrCreateAssessment(
    userId: string,
    resourceId: string,
    moduleId: string,
    objectiveId: string,
    forceNew: boolean = false // Si true, crée toujours un nouveau même si un existe (sous réserve du cooldown)
  ): Promise<ResourceAssessment>;
}
```

## 🎨 Implémentation Frontend

### Phase 1 : Types TypeScript

**Fichier** : `packages/frontend/src/types/index.ts`

Ajouter les interfaces :
```typescript
export interface ResourceAssessment {
  id: string;
  userId: string;
  resourceId: string;
  moduleId: string;
  objectiveId: string;
  resourceTitle: string;
  resourceType: ResourceType;
  resourceUrl?: string;
  questions: QuizQuestion[];
  status: 'pending' | 'completed' | 'expired';
  createdAt: string;
  expiresAt: string;
  completedAt?: string;
  score?: number;
  passed?: boolean;
}

export interface ResourceAssessmentResult {
  id: string;
  userId: string;
  resourceId: string;
  assessmentId: string;
  moduleId: string;
  objectiveId: string;
  resourceTitle: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number;
  passed: boolean;
  feedback: Array<{
    questionId: string;
    question: string;
    correct: boolean;
    userAnswer: string | number;
    correctAnswer: string | number;
    explanation: string;
  }>;
  completedAt: string;
}
```

### Phase 2 : Service API

**Fichier** : `packages/frontend/src/services/resourceAssessmentService.ts` (nouveau)

```typescript
class ResourceAssessmentService {
  // Créer un assessment
  async startAssessment(
    resourceId: string,
    moduleId: string,
    objectiveId: string,
    questionCount?: number
  ): Promise<ResourceAssessment>;

  // Soumettre les réponses
  async submitAssessment(
    assessmentId: string,
    answers: Array<{ questionId: string; selectedAnswer: string | number }>,
    timeSpent?: number
  ): Promise<ResourceAssessmentResult>;

  // Récupérer un assessment
  async getAssessment(assessmentId: string): Promise<ResourceAssessment>;

  // Récupérer le statut d'une ressource
  async getResourceStatus(resourceId: string): Promise<{
    hasAssessment: boolean;
    assessmentId?: string;
    isCompleted: boolean;
    lastScore?: number;
  }>;
}
```

### Phase 3 : Composants UI

#### Composant 1 : Modal d'auto-évaluation

**Fichier** : `packages/frontend/src/components/ResourceAssessmentModal.tsx` (nouveau)

**Fonctionnalités** :
- Affichage des questions une par une ou toutes ensemble
- Navigation entre les questions
- Timer optionnel
- Soumission et affichage des résultats
- Feedback détaillé par question

**Props** :
```typescript
interface ResourceAssessmentModalProps {
  open: boolean;
  onClose: () => void;
  resourceId: string;
  resourceTitle: string;
  moduleId: string;
  objectiveId: string;
  onComplete?: (result: ResourceAssessmentResult) => void;
}
```

#### Composant 2 : Mise à jour de ModuleResources

**Fichier** : `packages/frontend/src/components/ModuleResources.tsx`

**Modifications** :
1. Ajouter un état pour suivre les ressources évaluées
2. Afficher un badge "Auto-évalué" avec le score si disponible
3. Remplacer le bouton "Auto-évaluer" par un bouton qui ouvre le modal
4. Gérer le chargement et les erreurs

**Nouveau comportement** :
```typescript
const handleSelfAssess = async (resourceId: string) => {
  try {
    setLoading(true);
    // Vérifier si un assessment existe déjà
    const status = await resourceAssessmentService.getResourceStatus(resourceId);
    
    if (status.isCompleted) {
      // Afficher les résultats précédents ou permettre de refaire
      // Option: Modal avec résultats ou nouveau quiz
    } else {
      // Créer ou récupérer l'assessment
      const assessment = await resourceAssessmentService.startAssessment(
        resourceId,
        moduleId,
        objectiveId
      );
      // Ouvrir le modal avec l'assessment
      setSelectedAssessment(assessment);
      setAssessmentModalOpen(true);
    }
  } catch (error) {
    // Gérer l'erreur
  } finally {
    setLoading(false);
  }
};
```

#### Composant 3 : Badge de statut de ressource

**Fichier** : `packages/frontend/src/components/ResourceStatusBadge.tsx` (nouveau)

Affiche le statut d'évaluation d'une ressource :
- "Non évalué" (gris)
- "En cours" (orange)
- "Auto-évalué - Score: X%" (vert avec score)

### Phase 4 : Intégration dans ModuleLearnPage

**Fichier** : `packages/frontend/src/pages/ModuleLearnPage.tsx`

**Modifications** :
1. Importer le `ResourceAssessmentModal`
2. Gérer l'état du modal
3. Implémenter `onSelfAssess` pour ouvrir le modal
4. Mettre à jour la liste des ressources après évaluation

## 📊 Flux Utilisateur

### Diagramme de séquence : Auto-évaluation d'une ressource

```
Utilisateur          Frontend              Backend API          Gemini Service        Firestore
   |                    |                      |                      |                   |
   |-- Consulte ressource -->|                  |                      |                   |
   |                    |                      |                      |                   |
   |-- Clic "Auto-évaluer" -->|                 |                      |                   |
   |                    |-- POST /start ------>|                      |                   |
   |                    |                      |-- Récupère ressource ->|                   |
   |                    |                      |                      |                   |
   |                    |                      |-- Génère questions -->|                   |
   |                    |                      |<-- Questions ---------|                   |
   |                    |                      |-- Crée assessment ----------------------->|
   |                    |<-- Assessment -------|                      |                   |
   |                    |                      |                      |                   |
   |<-- Modal s'ouvre --|                      |                      |                   |
   |                    |                      |                      |                   |
   |-- Répond questions -->|                    |                      |                   |
   |                    |                      |                      |                   |
   |-- Soumet quiz ----->|                      |                      |                   |
   |                    |-- POST /submit ----->|                      |                   |
   |                    |                      |-- Calcule score ----->|                   |
   |                    |                      |-- Crée résultat ------------------------->|
   |                    |                      |-- Met à jour assessment ----------------->|
   |                    |<-- Résultat ---------|                      |                   |
   |<-- Affiche résultats|                      |                      |                   |
   |                    |                      |                      |                   |
   |-- Ferme modal ----->|                      |                      |                   |
   |                    |-- Met à jour UI -----|                      |                   |
```

### Scénario 1 : Première auto-évaluation

1. L'utilisateur consulte une ressource suggérée
2. Après lecture/visionnage, il clique sur "Auto-évaluer"
3. Le système génère un quiz (5 questions par défaut)
4. L'utilisateur répond aux questions
5. Soumission et calcul du score
6. Affichage des résultats avec feedback
7. La ressource est marquée comme "Auto-évaluée" avec le score

### Scénario 2 : Réévaluation

1. L'utilisateur peut refaire l'évaluation
2. Option 1 : Nouveau quiz avec nouvelles questions
3. Option 2 : Afficher les résultats précédents
4. Le dernier score est conservé

### Scénario 3 : Assessment en attente

1. Si un assessment existe déjà en statut "pending", l'utilisateur peut :
   - Continuer l'évaluation existante
   - Ou créer un nouveau quiz (les anciennes questions seront remplacées)
2. L'utilisateur peut toujours refaire l'évaluation même après l'avoir complétée

## 🔒 Sécurité et Validation

1. **Authentification** : Toutes les routes nécessitent une authentification
2. **Autorisation** : Vérifier que l'utilisateur possède la ressource
3. **Validation des réponses** : Vérifier le format et la cohérence
4. **Gestion des assessments multiples** : Permettre de créer un nouveau quiz même si un assessment existe déjà
5. **Cooldown configurable** : Utiliser la variable d'environnement `RESOURCE_ASSESSMENT_COOLDOWN_HOURS` (défaut: 1h) pour limiter la génération de quiz et éviter l'abus
   - Le cooldown s'applique entre les tentatives de génération d'un nouveau quiz
   - L'utilisateur peut toujours compléter un quiz existant en attente
   - Pas d'expiration : les assessments restent valides indéfiniment

## 📈 Métriques et Analytics

1. **Taux de complétion** : % de ressources évaluées
2. **Scores moyens** : Score moyen par type de ressource
3. **Temps moyen** : Temps moyen pour compléter un assessment
4. **Taux de réussite** : % d'assessments avec score >= 70%

## 🧪 Tests

### Tests Backend

1. **Service Gemini** :
   - Génération de questions pour différents types de ressources
   - Validation du format des questions

2. **Routes API** :
   - Création d'assessment
   - Soumission de réponses
   - Calcul de score
   - Gestion des erreurs

3. **Service ResourceAssessmentService** :
   - Logique métier
   - Gestion des états

### Tests Frontend

1. **Composants** :
   - ResourceAssessmentModal
   - ModuleResources (mise à jour)
   - ResourceStatusBadge

2. **Intégration** :
   - Flux complet d'auto-évaluation
   - Gestion des erreurs
   - États de chargement

## 📝 Checklist d'Implémentation

### Backend
- [x] Ajouter méthode `generateResourceAssessmentQuestions` dans `gemini.ts`
- [x] Créer `resourceAssessmentService.ts`
- [x] Créer routes `/api/resource-assessments/*`
- [x] Ajouter types dans `types/index.ts`
- [ ] Tests unitaires pour le service
- [ ] Tests d'intégration pour les routes

### Frontend
- [x] Ajouter types dans `types/index.ts`
- [x] Ajouter méthodes dans `api.ts` (service API)
- [x] Créer `ResourceAssessmentModal.tsx`
- [x] Badge de statut intégré dans `ModuleResources.tsx`
- [x] Mettre à jour `ModuleResources.tsx`
- [x] Intégrer dans `ModuleLearnPage.tsx`
- [ ] Tests des composants
- [ ] Tests d'intégration

### Documentation
- [ ] Documenter les nouvelles routes API
- [ ] Mettre à jour la documentation utilisateur
- [ ] Ajouter des exemples d'utilisation

## 🚀 Déploiement

1. **Migration Firestore** : Créer les collections si nécessaire
2. **Variables d'environnement** : Vérifier les configurations
3. **Déploiement progressif** : Feature flag pour activation progressive
4. **Monitoring** : Surveiller les erreurs et performances

## 🔄 Améliorations Futures

1. **Adaptive difficulty** : Ajuster la difficulté selon les performances
2. **Questions contextuelles** : Questions basées sur le contenu réel de la ressource (scraping)
3. **Recommandations** : Suggestions de ressources supplémentaires basées sur les scores
4. **Gamification** : Badges et récompenses pour les évaluations réussies
5. **Social** : Comparaison anonyme avec d'autres utilisateurs
6. **Rappels** : Notifications pour compléter les évaluations en attente


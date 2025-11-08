# Plan de Mise en Place - Gestion des Jours Manqués et Récupération

## 📋 Vue d'ensemble

Cette fonctionnalité permet aux utilisateurs de récupérer les jours manqués dans leur série d'apprentissage en passant un test d'évaluation. Le système génère automatiquement un assessment personnalisé basé sur un objectif d'apprentissage sélectionné.

## 🎯 Objectifs

1. **Tracking des jours manqués** : Suivre les jours où l'utilisateur n'a pas étudié
2. **Récupération par test** : Permettre la récupération des jours manqués via un assessment
3. **Génération IA** : Utiliser Gemini pour générer des questions adaptées à l'objectif
4. **Sauvegarde des résultats** : Persister les résultats du test de récupération

## 📐 Architecture

### Frontend

#### 1. Composants à créer/modifier

**a) `StreakRecoveryModal.tsx`** (nouveau)
- Modal principale qui affiche les jours manqués
- Affiche la liste des objectifs actifs
- Permet la sélection d'un objectif
- Gère le flux de récupération

**b) `ObjectiveSelectionModal.tsx`** (nouveau)
- Liste des objectifs actifs avec leurs détails
- Sélection d'un objectif pour le test de récupération
- Affichage du nombre de jours manqués et du nombre de questions qui seront générées

**c) `RecoveryAssessmentModal.tsx`** (nouveau)
- Modal pour afficher le test de récupération
- Affiche les questions générées par Gemini
- Gère le scoring et la soumission
- Affiche les résultats (succès/échec)

**d) `StreakCard.tsx`** (modifier)
- Ajouter le bouton "Récupérer" si des jours sont manqués
- Intégrer la modal de récupération
- Mettre à jour l'affichage après récupération réussie

#### 2. Services à créer/modifier

**a) `api.ts`** (modifier)
- `getMissedDays(userId: string): Promise<ApiResponse<{ missedDays: number; lastStudyDate: Date }>>`
- `getActiveObjectives(userId: string): Promise<ApiResponse<LearningObjective[]>>`
- `generateRecoveryAssessment(objectiveId: string, missedDays: number): Promise<ApiResponse<RecoveryAssessment>>`
- `submitRecoveryAssessment(assessmentId: string, answers: AssessmentAnswer[]): Promise<ApiResponse<RecoveryResult>>`

**b) Types à ajouter** (`types/index.ts`)
```typescript
export interface RecoveryAssessment {
  id: string;
  objectiveId: string;
  objectiveTitle: string;
  missedDays: number;
  questionCount: number;
  questions: AssessmentQuestion[];
  createdAt: string;
  expiresAt: string; // 24h après création
}

export interface RecoveryResult {
  assessmentId: string;
  score: number;
  passed: boolean;
  correctAnswers: number;
  totalQuestions: number;
  recoveredDays: number;
  newStreak: number;
}
```

### Backend

#### 1. Routes à créer/modifier

**a) `routes/streak.ts`** (nouveau)
- `GET /api/streak/:userId/missed-days` - Récupérer les jours manqués
- `GET /api/streak/:userId/active-objectives` - Récupérer les objectifs actifs pour récupération
- `POST /api/streak/recovery/generate` - Générer un assessment de récupération
- `POST /api/streak/recovery/submit` - Soumettre les réponses et mettre à jour la série

#### 2. Services à créer/modifier

**a) `services/streakService.ts`** (nouveau)
- `calculateMissedDays(userId: string): Promise<{ missedDays: number; lastStudyDate: Date }>`
- `getActiveObjectivesForRecovery(userId: string): Promise<LearningObjective[]>`
- `generateRecoveryAssessment(objectiveId: string, missedDays: number): Promise<RecoveryAssessment>`
- `validateRecoveryAssessment(assessmentId: string, answers: AssessmentAnswer[]): Promise<RecoveryResult>`
- `updateStreakAfterRecovery(userId: string, recoveredDays: number): Promise<void>`

**b) `services/gemini.ts`** (modifier)
- Ajouter méthode `generateRecoveryAssessmentQuestions(objectiveId: string, missedDays: number, questionCount: number): Promise<AssessmentQuestion[]>`
- Générer des questions basées sur l'objectif et le nombre de jours manqués

#### 3. Modèles Firestore

**a) Collection `streaks`**
```typescript
{
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: Date;
  missedDays: number;
  recoveryHistory: Array<{
    date: Date;
    recoveredDays: number;
    assessmentId: string;
    objectiveId: string;
  }>;
  updatedAt: Date;
}
```

**b) Collection `recoveryAssessments`**
```typescript
{
  id: string;
  userId: string;
  objectiveId: string;
  objectiveTitle: string;
  missedDays: number;
  questionCount: number;
  questions: AssessmentQuestion[];
  status: 'pending' | 'completed' | 'expired';
  score?: number;
  passed?: boolean;
  recoveredDays?: number;
  createdAt: Date;
  expiresAt: Date;
  completedAt?: Date;
}
```

## 🔄 Flux Utilisateur

### 1. Détection des jours manqués
- L'utilisateur ouvre le dashboard
- Le système calcule automatiquement les jours manqués depuis la dernière étude
- Si `missedDays > 0`, le `StreakCard` affiche un bouton "Récupérer"

### 2. Sélection de l'objectif
- L'utilisateur clique sur "Récupérer"
- `ObjectiveSelectionModal` s'ouvre
- Affichage de la liste des objectifs actifs avec :
  - Titre de l'objectif
  - Description
  - Nombre de jours manqués
  - Nombre de questions qui seront générées (jours × 10, max 30)
- L'utilisateur sélectionne un objectif

### 3. Génération de l'assessment
- Appel API pour générer l'assessment
- Backend appelle Gemini pour générer les questions
- Retour de l'assessment avec les questions
- `RecoveryAssessmentModal` s'ouvre avec les questions

### 4. Passage du test
- L'utilisateur répond aux questions
- Navigation entre les questions
- Soumission du test

### 5. Validation et récupération
- Backend calcule le score
- Si score >= 70% : récupération réussie
  - Mise à jour de la série (ajout des jours récupérés)
  - Sauvegarde des résultats
  - Affichage du succès
- Si score < 70% : échec
  - Affichage du score et message d'encouragement
  - Possibilité de réessayer (génération d'un nouveau test)

## 📝 Spécifications Techniques

### Calcul du nombre de questions

```typescript
function calculateQuestionCount(missedDays: number): number {
  const calculated = missedDays * 10;
  return Math.min(calculated, 30); // Max 30 questions
}
```

### Génération des questions Gemini

```typescript
async generateRecoveryAssessmentQuestions(
  objectiveId: string,
  missedDays: number,
  questionCount: number
): Promise<AssessmentQuestion[]> {
  const prompt = `Génère ${questionCount} questions pour un test de récupération de série d'apprentissage.
  
Objectif: [objectifTitle]
Jours manqués: ${missedDays}
Contexte: L'utilisateur a manqué ${missedDays} jours d'étude et doit prouver qu'il a continué à apprendre.

Les questions doivent :
- Couvrir les concepts clés de l'objectif
- Être de difficulté adaptée (beginner à advanced)
- Être variées (multiple choice, true/false, etc.)
- Tester la compréhension plutôt que la mémorisation

Format JSON attendu: [questions array]`;
  
  // Appel Gemini API
  // Parse et validation
  // Retour questions
}
```

### Validation du test

```typescript
function validateRecoveryAssessment(
  assessment: RecoveryAssessment,
  answers: AssessmentAnswer[]
): RecoveryResult {
  const correctAnswers = calculateCorrectAnswers(assessment.questions, answers);
  const score = (correctAnswers / assessment.questionCount) * 100;
  const passed = score >= 70;
  const recoveredDays = passed ? assessment.missedDays : 0;
  
  return {
    assessmentId: assessment.id,
    score,
    passed,
    correctAnswers,
    totalQuestions: assessment.questionCount,
    recoveredDays,
    newStreak: passed ? currentStreak + recoveredDays : currentStreak
  };
}
```

### Mise à jour de la série

```typescript
async function updateStreakAfterRecovery(
  userId: string,
  recoveredDays: number,
  assessmentId: string,
  objectiveId: string
): Promise<void> {
  const streakDoc = await getStreak(userId);
  const newStreak = streakDoc.currentStreak + recoveredDays;
  const newLongestStreak = Math.max(streakDoc.longestStreak, newStreak);
  
  await updateStreak(userId, {
    currentStreak: newStreak,
    longestStreak: newLongestStreak,
    lastStudyDate: new Date(),
    missedDays: 0,
    recoveryHistory: [
      ...streakDoc.recoveryHistory,
      {
        date: new Date(),
        recoveredDays,
        assessmentId,
        objectiveId
      }
    ]
  });
}
```

## 🗂️ Structure des fichiers

```
packages/
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── StreakCard.tsx (modifier)
│       │   ├── StreakRecoveryModal.tsx (nouveau)
│       │   ├── ObjectiveSelectionModal.tsx (nouveau)
│       │   └── RecoveryAssessmentModal.tsx (nouveau)
│       ├── services/
│       │   └── api.ts (modifier)
│       └── types/
│           └── index.ts (modifier)
│
└── backend/
    └── src/
        ├── routes/
        │   └── streak.ts (nouveau)
        ├── services/
        │   ├── streakService.ts (nouveau)
        │   └── gemini.ts (modifier)
        └── types/
            └── index.ts (modifier)
```

## ✅ Checklist d'Implémentation

### Phase 1: Backend - Modèles et Services
- [ ] Créer la collection `streaks` dans Firestore
- [ ] Créer la collection `recoveryAssessments` dans Firestore
- [ ] Implémenter `streakService.ts` avec toutes les méthodes
- [ ] Modifier `gemini.ts` pour ajouter la génération de questions de récupération
- [ ] Créer les routes `routes/streak.ts`
- [ ] Ajouter les types TypeScript nécessaires

### Phase 2: Frontend - Composants
- [ ] Modifier `StreakCard.tsx` pour ajouter le bouton de récupération
- [ ] Créer `ObjectiveSelectionModal.tsx`
- [ ] Créer `RecoveryAssessmentModal.tsx`
- [ ] Créer `StreakRecoveryModal.tsx` (orchestrateur)
- [ ] Ajouter les méthodes API dans `api.ts`
- [ ] Ajouter les types TypeScript nécessaires

### Phase 3: Intégration et Tests
- [ ] Intégrer les modals dans le flux utilisateur
- [ ] Tester la génération d'assessments
- [ ] Tester la validation et le scoring
- [ ] Tester la mise à jour de la série
- [ ] Tester les cas limites (0 jours, >30 questions, échec du test)

### Phase 4: UX/UI
- [ ] Styliser les modals selon le nouveau design system
- [ ] Ajouter les animations et transitions
- [ ] Ajouter les messages de feedback
- [ ] Tester la responsivité

## 🔒 Règles de Validation

1. **Score minimum** : 70% pour réussir la récupération
2. **Nombre de questions** : `min(missedDays × 10, 30)`
3. **Expiration** : L'assessment expire 24h après création
4. **Limite de tentatives** : 1 tentative par jour pour un objectif donné
5. **Objectifs actifs** : Seuls les objectifs avec `status === 'IN_PROGRESS'` sont éligibles

## 📊 Métriques à Tracker

- Nombre de récupérations réussies
- Taux de réussite des tests de récupération
- Temps moyen pour compléter un test de récupération
- Distribution des scores

## 🚀 Prochaines Étapes

1. Commencer par le backend (Phase 1)
2. Implémenter les services de base
3. Créer les routes API
4. Passer au frontend (Phase 2)
5. Tester end-to-end
6. Itérer sur l'UX


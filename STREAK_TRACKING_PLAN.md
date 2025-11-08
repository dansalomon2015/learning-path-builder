# Plan de Conception : Système de Comptage de Jours Actifs (Streak Tracking)

## 📋 Vue d'ensemble

Le système de comptage de jours actifs (streak) permet de suivre la régularité de l'apprentissage de l'utilisateur. Actuellement, la méthode `updateStreakOnStudy` existe dans `streakService.ts` mais n'est jamais appelée automatiquement lors des activités d'étude.

## 🎯 Objectifs

1. **Détecter automatiquement** les activités d'apprentissage significatives
2. **Mettre à jour le streak** de manière cohérente et fiable
3. **Définir des critères clairs** pour ce qui constitue une "activité d'étude"
4. **Éviter les abus** (ex: multiples mises à jour le même jour)

## 🔍 Analyse de l'existant

### ✅ Ce qui existe déjà

1. **Service de streak** (`streakService.ts`)
   - `updateStreakOnStudy(userId: string)`: Méthode qui met à jour le streak
   - Logique de calcul :
     - Si même jour : pas de changement
     - Si jour suivant : incrémente le streak
     - Si > 1 jour : reset à 1
   - Met à jour `currentStreak`, `longestStreak`, `lastStudyDate`, `missedDays`

2. **Structure de données** (`Streak` interface)
   - `currentStreak`: Nombre de jours consécutifs actuels
   - `longestStreak`: Record personnel
   - `lastStudyDate`: Date de la dernière activité
   - `missedDays`: Jours manqués (pour la récupération)

### ❌ Ce qui manque

1. **Appels automatiques** à `updateStreakOnStudy` dans les routes d'activité
2. **Définition claire** des activités qui comptent comme "étude"
3. **Gestion des cas limites** (timezone, minuit, etc.)

## 📝 Activités d'étude à tracker

### Activités qui DEVRAIENT compter

1. **Soumission d'un quiz/assessment**
   - ✅ Assessment d'objectif (`POST /api/assessments/:assessmentId/submit`)
   - ✅ Assessment de ressource (`POST /api/resource-assessments/:assessmentId/submit`)
   - ✅ Examen final de module (`POST /api/module-final-exams/:examId/submit`)
   - ✅ Quiz de learning plan (`POST /api/learning-plans/:id/quiz-submit`)

2. **Complétion de module**
   - ✅ Complétion manuelle (`PATCH /api/objectives/:id/paths/:pathId/modules/:moduleId/complete`)
   - ✅ Validation de module (`POST /api/objectives/:id/paths/:pathId/modules/:moduleId/validate`)

3. **Session d'étude significative**
   - ⚠️ Review de flashcards (`POST /api/learning-plans/:id/flashcards/:cardId/review`)
     - **Question**: Compter chaque review ou seulement les sessions complètes ?
     - **Recommandation**: Compter seulement si au moins N flashcards sont reviewées (ex: 5)

### Activités qui NE DEVRAIENT PAS compter

1. **Actions passives**
   - Consultation de ressources (lecture d'article, vidéo)
   - Navigation dans l'interface
   - Ouverture de modules sans interaction

2. **Actions de configuration**
   - Création d'objectif
   - Génération de parcours
   - Modification de paramètres

## 🏗️ Architecture proposée

### Option 1 : Appels directs dans chaque route (Recommandé)

**Avantages:**
- Simple et explicite
- Contrôle fin sur quand mettre à jour
- Facile à déboguer

**Inconvénients:**
- Duplication de code
- Risque d'oublier certains endroits

**Implémentation:**
```typescript
// Dans chaque route pertinente
try {
  // ... logique métier existante ...
  
  // Mettre à jour le streak (non-bloquant)
  streakService.updateStreakOnStudy(userId).catch((error) => {
    logger.warn('Failed to update streak', { userId, error });
  });
  
  return res.json({ success: true, data: ... });
} catch (error) {
  // ...
}
```

### Option 2 : Middleware Express

**Avantages:**
- Centralisé
- Pas de duplication
- Facile à activer/désactiver

**Inconvénients:**
- Moins flexible
- Difficile de définir quelles routes doivent déclencher le streak
- Risque de déclencher sur des actions non-pertinentes

**Implémentation:**
```typescript
// Middleware qui détecte certaines routes
const streakTrackingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const streakRoutes = [
    '/api/assessments/:assessmentId/submit',
    '/api/resource-assessments/:assessmentId/submit',
    // ...
  ];
  
  if (streakRoutes.some(route => matchesRoute(req.path, route))) {
    // Track streak after response
    res.on('finish', () => {
      if (res.statusCode < 400 && req.user?.uid) {
        streakService.updateStreakOnStudy(req.user.uid).catch(/* ... */);
      }
    });
  }
  
  next();
};
```

### Option 3 : Event-driven (Pub/Sub)

**Avantages:**
- Découplage complet
- Extensible (autres listeners possibles)
- Testable

**Inconvénients:**
- Plus complexe
- Overhead pour un cas simple

**Recommandation: Option 1** pour la simplicité et la clarté.

## 📍 Points d'intégration

### 1. Assessments d'objectif
**Fichier:** `packages/backend/src/routes/assessments.ts`
**Route:** `POST /api/assessments/:assessmentId/submit`
**Ligne:** Après la création du résultat (ligne ~263)

```typescript
// Après la création du résultat
await streakService.updateStreakOnStudy(uid).catch((error) => {
  logger.warn('Failed to update streak after assessment', { userId: uid, error });
});
```

### 2. Assessments de ressource
**Fichier:** `packages/backend/src/routes/resourceAssessments.ts`
**Route:** `POST /api/resource-assessments/:assessmentId/submit`
**Ligne:** Après la soumission réussie (ligne ~174)

```typescript
// Après la soumission réussie
await streakService.updateStreakOnStudy(uid).catch((error) => {
  logger.warn('Failed to update streak after resource assessment', { userId: uid, error });
});
```

### 3. Examens finaux de module
**Fichier:** `packages/backend/src/routes/moduleFinalExams.ts`
**Route:** `POST /api/module-final-exams/:examId/submit`
**Ligne:** Après la soumission réussie (ligne ~96)

```typescript
// Après la soumission réussie
await streakService.updateStreakOnStudy(uid).catch((error) => {
  logger.warn('Failed to update streak after module final exam', { userId: uid, error });
});
```

### 4. Quiz de learning plan
**Fichier:** `packages/backend/src/routes/learningPlan.ts`
**Route:** `POST /api/learning-plans/:id/quiz-submit`
**Ligne:** Après la mise à jour de la session (ligne ~525)

```typescript
// Après la mise à jour de la session
await streakService.updateStreakOnStudy(userId).catch((error) => {
  logger.warn('Failed to update streak after quiz', { userId, error });
});
```

### 5. Complétion de module
**Fichier:** `packages/backend/src/routes/objectives.ts`
**Route:** `PATCH /api/objectives/:id/paths/:pathId/modules/:moduleId/complete`
**Ligne:** Après la mise à jour de l'objective (ligne ~934)

```typescript
// Après la mise à jour de l'objective
await streakService.updateStreakOnStudy(uid).catch((error) => {
  logger.warn('Failed to update streak after module completion', { userId: uid, error });
});
```

### 6. Validation de module
**Fichier:** `packages/backend/src/routes/objectives.ts`
**Route:** `POST /api/objectives/:id/paths/:pathId/modules/:moduleId/validate`
**Ligne:** Après la validation réussie (ligne ~1608)

```typescript
// Après la validation réussie
await streakService.updateStreakOnStudy(uid).catch((error) => {
  logger.warn('Failed to update streak after module validation', { userId: uid, error });
});
```

### 7. Review de flashcards (Optionnel)
**Fichier:** `packages/backend/src/routes/learningPlan.ts`
**Route:** `POST /api/learning-plans/:id/flashcards/:cardId/review`
**Ligne:** Après la mise à jour de la session

**Note:** Pour éviter les abus, on pourrait tracker le nombre de reviews par session et mettre à jour le streak seulement si un seuil est atteint (ex: 5 flashcards reviewées dans la même session).

## 🔧 Améliorations de la méthode `updateStreakOnStudy`

### Problèmes potentiels actuels

1. **Gestion du timezone**
   - Actuellement utilise `new Date()` qui est en UTC
   - Devrait utiliser le timezone de l'utilisateur ou du serveur

2. **Idempotence**
   - Si appelé plusieurs fois le même jour, ne devrait pas causer de problème
   - ✅ Déjà géré : `if (daysSinceLastStudy === 0) return;`

3. **Gestion des erreurs**
   - ✅ Déjà géré : Ne throw pas d'erreur pour ne pas casser le flux principal

### Améliorations suggérées

```typescript
async updateStreakOnStudy(userId: string): Promise<void> {
  try {
    const streak = await this.getStreak(userId);
    if (streak == null) {
      logger.warn('Cannot update streak: streak not found', { userId });
      return;
    }

    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const lastStudy = new Date(streak.lastStudyDate);
    lastStudy.setHours(0, 0, 0, 0);

    const daysSinceLastStudy = Math.floor(
      (today.getTime() - lastStudy.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Si même jour, pas de changement (idempotent)
    if (daysSinceLastStudy === 0) {
      logger.debug('Streak update skipped: same day', { userId });
      return;
    }

    let newStreak: number;
    if (daysSinceLastStudy === 1) {
      // Jour consécutif, incrémenter
      newStreak = streak.currentStreak + 1;
      logger.info('Streak incremented', { userId, oldStreak: streak.currentStreak, newStreak });
    } else {
      // Streak brisé, reset à 1
      newStreak = 1;
      logger.info('Streak reset', { userId, oldStreak: streak.currentStreak, daysSince: daysSinceLastStudy });
    }

    const newLongestStreak = Math.max(streak.longestStreak, newStreak);

    await firebaseService.updateDocument('streaks', userId, {
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      lastStudyDate: admin.firestore.Timestamp.fromDate(now),
      missedDays: 0, // Reset missed days when studying
      updatedAt: admin.firestore.Timestamp.fromDate(now),
    });

    logger.info('Streak updated successfully', {
      userId,
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
    });
  } catch (error: unknown) {
    logger.error('Error updating streak on study:', error);
    // Ne pas throw pour ne pas casser le flux principal
  }
}
```

## 📊 Tests à prévoir

### Tests unitaires

1. **Test de mise à jour normale**
   - Streak de 5 jours, étude le jour suivant → streak = 6

2. **Test de même jour**
   - Streak de 5 jours, étude le même jour → streak = 5 (pas de changement)

3. **Test de reset**
   - Streak de 5 jours, étude après 3 jours → streak = 1

4. **Test de longest streak**
   - Streak actuel = 5, longest = 10, nouvelle étude → longest reste 10
   - Streak actuel = 10, longest = 10, nouvelle étude → longest = 11

5. **Test de création initiale**
   - Pas de streak existant → création avec streak = 1

### Tests d'intégration

1. **Test de route complète**
   - Soumettre un assessment → vérifier que le streak est mis à jour

2. **Test de non-bloquant**
   - Simuler une erreur dans `updateStreakOnStudy` → vérifier que la route répond toujours

## ✅ Checklist d'implémentation

### Backend

- [ ] Importer `streakService` dans les routes concernées
- [ ] Ajouter l'appel à `updateStreakOnStudy` dans `assessments.ts`
- [ ] Ajouter l'appel à `updateStreakOnStudy` dans `resourceAssessments.ts`
- [ ] Ajouter l'appel à `updateStreakOnStudy` dans `moduleFinalExams.ts`
- [ ] Ajouter l'appel à `updateStreakOnStudy` dans `learningPlan.ts` (quiz-submit)
- [ ] Ajouter l'appel à `updateStreakOnStudy` dans `objectives.ts` (module complete)
- [ ] Ajouter l'appel à `updateStreakOnStudy` dans `objectives.ts` (module validate)
- [ ] Améliorer les logs dans `updateStreakOnStudy`
- [ ] Ajouter des tests unitaires pour `updateStreakOnStudy`
- [ ] Ajouter des tests d'intégration pour les routes

### Frontend (Optionnel)

- [ ] Rafraîchir automatiquement la `StreakCard` après une activité d'étude
- [ ] Afficher une notification quand le streak est incrémenté
- [ ] Afficher une notification quand le streak est brisé

## 🚀 Ordre d'implémentation recommandé

1. **Phase 1 : Core**
   - Améliorer `updateStreakOnStudy` avec de meilleurs logs
   - Ajouter les appels dans les routes principales (assessments, resource assessments)

2. **Phase 2 : Extension**
   - Ajouter les appels dans les autres routes (module exams, quiz, completions)

3. **Phase 3 : Tests**
   - Tests unitaires
   - Tests d'intégration

4. **Phase 4 : UX (Optionnel)**
   - Notifications frontend
   - Rafraîchissement automatique

## 📝 Notes importantes

1. **Non-bloquant**: Les mises à jour de streak ne doivent jamais bloquer les opérations principales
2. **Idempotence**: Plusieurs appels le même jour ne doivent pas causer de problème
3. **Performance**: Les appels sont asynchrones et ne doivent pas ralentir les réponses API
4. **Logs**: Logger les mises à jour pour faciliter le débogage

## 🔗 Références

- `packages/backend/src/services/streakService.ts` - Service de streak
- `packages/backend/src/routes/streak.ts` - Routes de streak
- `STREAK_RECOVERY_PLAN.md` - Plan de récupération de streak


# 🎨 Plan d'Intégration du Nouveau Design

## 📋 Vue d'ensemble

Ce document détaille le plan d'intégration du nouveau design système présent dans `ui/` vers le frontend existant `packages/frontend/`.

### Différences principales

**Nouveau design (ui/):**
- Next.js 16 (App Router) + shadcn/ui
- Tailwind CSS v4 avec variables CSS (oklch colors)
- React 19
- Système de thème dark/light
- Composants Radix UI stylisés

**Frontend actuel:**
- React 18 + Vite + React Router
- Tailwind CSS v3
- Redux Toolkit + React Query
- Composants personnalisés

## 🎯 Objectifs

1. ✅ Migrer le système de design (CSS variables, thème)
2. ✅ Intégrer les composants shadcn/ui
3. ✅ Migrer progressivement les pages/composants
4. ✅ Préserver la logique métier (Redux, services, API)
5. ✅ Maintenir la compatibilité avec l'architecture existante

## 📦 Phase 1: Préparation et Infrastructure

### 1.1 Mise à jour des dépendances

**Actions:**
- [ ] Mettre à jour Tailwind CSS v3 → v4
- [ ] Installer les dépendances Radix UI nécessaires
- [ ] Installer `class-variance-authority` et `tailwind-merge`
- [ ] Installer `@radix-ui/react-slot` pour les composants

**Fichiers à modifier:**
- `packages/frontend/package.json`
- `packages/frontend/tailwind.config.js` → convertir en `tailwind.config.ts` ou utiliser CSS-only config

**Commandes:**
```bash
cd packages/frontend
npm install @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-dropdown-menu \
  @radix-ui/react-label @radix-ui/react-select @radix-ui/react-tabs \
  @radix-ui/react-toast @radix-ui/react-popover \
  class-variance-authority tailwind-merge
npm install -D tailwindcss@^4.1.9 postcss@^8.5
```

### 1.2 Migration du système de design CSS

**Actions:**
- [ ] Migrer `ui/app/globals.css` vers `packages/frontend/src/index.css`
- [ ] Adapter les variables CSS (oklch colors) pour Tailwind v4
- [ ] Configurer le système de thème dark/light
- [ ] Ajouter les utilitaires CSS (perspective, 3D transforms)

**Fichiers à créer/modifier:**
- `packages/frontend/src/index.css` (migrer depuis `ui/app/globals.css`)
- `packages/frontend/src/lib/utils.ts` (fonction `cn`)

**Points d'attention:**
- Adapter les variables CSS pour être compatibles avec Tailwind v4
- Préserver les animations existantes si nécessaires
- Tester le thème dark/light

### 1.3 Configuration Tailwind v4

**Actions:**
- [ ] Convertir `tailwind.config.js` pour utiliser CSS-first config
- [ ] Configurer les alias de chemins (`@/components`, `@/lib`)
- [ ] Configurer les couleurs personnalisées via CSS variables

**Fichiers à créer/modifier:**
- `packages/frontend/tailwind.config.js` (simplifier ou migrer vers CSS-only)
- `packages/frontend/postcss.config.js` (mettre à jour si nécessaire)
- `packages/frontend/tsconfig.json` (ajouter les alias de chemins)

## 🧩 Phase 2: Composants UI de Base

### 2.1 Installation des composants shadcn/ui essentiels

**Priorité 1 (critiques):**
- [ ] `Button` (`ui/components/ui/button.tsx`)
- [ ] `Card` (`ui/components/ui/card.tsx`)
- [ ] `Dialog` (`ui/components/ui/dialog.tsx`)
- [ ] `Input` (`ui/components/ui/input.tsx`)
- [ ] `Label` (`ui/components/ui/label.tsx`)
- [ ] `Badge` (`ui/components/ui/badge.tsx`)
- [ ] `Progress` (`ui/components/ui/progress.tsx`)

**Priorité 2 (souvent utilisés):**
- [ ] `Tabs` (`ui/components/ui/tabs.tsx`)
- [ ] `Select` (`ui/components/ui/select.tsx`)
- [ ] `Textarea` (`ui/components/ui/textarea.tsx`)
- [ ] `Toast` + `Toaster` (`ui/components/ui/toast.tsx`, `toaster.tsx`)
- [ ] `Skeleton` (`ui/components/ui/skeleton.tsx`)
- [ ] `Separator` (`ui/components/ui/separator.tsx`)

**Priorité 3 (autres):**
- [ ] Tous les autres composants selon les besoins

**Actions:**
- [ ] Créer `packages/frontend/src/components/ui/` directory
- [ ] Copier et adapter chaque composant depuis `ui/components/ui/`
- [ ] Adapter les imports (`@/lib/utils` → chemin relatif ou alias)
- [ ] Tester chaque composant isolément

**Fichiers à créer:**
```
packages/frontend/src/
  components/
    ui/
      button.tsx
      card.tsx
      dialog.tsx
      input.tsx
      label.tsx
      badge.tsx
      progress.tsx
      ...
  lib/
    utils.ts
```

### 2.2 Création des utilitaires

**Actions:**
- [ ] Créer `packages/frontend/src/lib/utils.ts`
- [ ] Copier la fonction `cn` depuis `ui/lib/utils.ts`
- [ ] Vérifier que `clsx` et `tailwind-merge` sont installés

## 🎨 Phase 3: Migration des Composants Métier

### 3.1 Composants Dashboard

**Composants à migrer:**
- [ ] `ObjectiveCard` (`ui/components/objective-card.tsx`)
- [ ] `StreakCard` (`ui/components/streak-card.tsx`)
- [ ] `CreateObjectiveDialog` (`ui/components/create-objective-dialog.tsx`)

**Actions:**
- [ ] Copier les composants depuis `ui/components/`
- [ ] Adapter les imports pour utiliser les composants UI de base
- [ ] Intégrer avec Redux/API existants (remplacer les TODO)
- [ ] Tester l'intégration avec les données réelles

**Fichiers à créer/modifier:**
- `packages/frontend/src/components/ObjectiveCard.tsx` (nouveau)
- `packages/frontend/src/components/StreakCard.tsx` (nouveau)
- `packages/frontend/src/components/CreateObjectiveModal.tsx` (migrer depuis `CreateObjectiveDialog`)

### 3.2 Composants d'Étude

**Composants à migrer:**
- [ ] `FlashcardRating` (`ui/components/flashcard-rating.tsx`)
- [ ] `ValidationQuizDialog` (`ui/components/validation-quiz-dialog.tsx`)
- [ ] `ModuleResources` (`ui/components/module-resources.tsx`)

**Actions:**
- [ ] Migrer les composants avec leur logique métier
- [ ] Adapter pour utiliser les services API existants
- [ ] Intégrer avec `StudySession` et `FlashcardView` existants

## 📄 Phase 4: Migration des Pages

### 4.1 Landing Page

**Actions:**
- [ ] Migrer `ui/app/page.tsx` vers `packages/frontend/src/pages/LandingPage.tsx`
- [ ] Adapter pour React Router (remplacer `Link` de Next.js par `Link` de React Router)
- [ ] Tester la navigation

**Fichiers à modifier:**
- `packages/frontend/src/pages/LandingPage.tsx`

### 4.2 Dashboard Page

**Actions:**
- [ ] Migrer `ui/app/dashboard/page.tsx` vers `packages/frontend/src/pages/DashboardPage.tsx`
- [ ] Intégrer avec Redux pour la gestion d'état
- [ ] Connecter aux API existantes
- [ ] Adapter la navigation (React Router)

**Fichiers à modifier:**
- `packages/frontend/src/pages/DashboardPage.tsx`
- `packages/frontend/src/components/Dashboard.tsx` (potentiellement fusionner)

### 4.3 Pages d'Évaluation et d'Étude

**Actions:**
- [ ] Migrer `ui/app/assessment/[objectiveId]/page.tsx`
- [ ] Migrer `ui/app/study/[objectiveId]/[pathId]/[moduleId]/page.tsx`
- [ ] Adapter les routes pour React Router
- [ ] Intégrer avec `SkillAssessment` et `ModuleFlashcardStudy` existants

**Fichiers à modifier:**
- `packages/frontend/src/pages/ObjectivePathPage.tsx`
- `packages/frontend/src/pages/ModuleLearnPage.tsx`
- `packages/frontend/src/pages/DashboardPage.tsx` (route assessment)

### 4.4 Pages d'Authentification

**Actions:**
- [ ] Migrer `ui/app/login/page.tsx` et `ui/app/register/page.tsx`
- [ ] Adapter `AuthForm.tsx` existant pour utiliser les nouveaux composants UI
- [ ] Intégrer avec Firebase Auth existant

**Fichiers à modifier:**
- `packages/frontend/src/pages/AuthPage.tsx`
- `packages/frontend/src/components/AuthForm.tsx`

### 4.5 Page Profil

**Actions:**
- [ ] Migrer `ui/app/profile/page.tsx`
- [ ] Intégrer avec `ProfilePage.tsx` existant
- [ ] Adapter les composants de profil

**Fichiers à modifier:**
- `packages/frontend/src/pages/ProfilePage.tsx`

## 🔧 Phase 5: Intégration et Adaptation

### 5.1 Système de Thème

**Actions:**
- [ ] Installer `next-themes` ou créer un système de thème custom
- [ ] Créer un `ThemeProvider` component
- [ ] Ajouter un toggle dark/light dans le Header
- [ ] Tester tous les composants en mode dark et light

**Fichiers à créer:**
- `packages/frontend/src/components/ThemeProvider.tsx`
- `packages/frontend/src/components/ThemeToggle.tsx`

### 5.2 Navigation et Layout

**Actions:**
- [ ] Migrer le Header depuis le nouveau design
- [ ] Adapter `Layout.tsx` pour utiliser les nouveaux composants
- [ ] Tester la navigation sur toutes les pages

**Fichiers à modifier:**
- `packages/frontend/src/components/Header.tsx`
- `packages/frontend/src/components/Layout.tsx`

### 5.3 Notifications et Toasts

**Actions:**
- [ ] Migrer de `react-hot-toast` vers `sonner` ou `@radix-ui/react-toast`
- [ ] Adapter toutes les notifications existantes
- [ ] Tester les toasts dans tous les contextes

**Fichiers à modifier:**
- Remplacer `react-hot-toast` par `sonner` ou Radix Toast
- Mettre à jour tous les fichiers utilisant `toast`

## 🧪 Phase 6: Tests et Validation

### 6.1 Tests Visuels

**Actions:**
- [ ] Comparer chaque page avec le design original
- [ ] Vérifier la cohérence du design système
- [ ] Tester sur différents navigateurs
- [ ] Tester le mode responsive (mobile/tablet/desktop)
- [ ] Tester le mode dark/light

### 6.2 Tests Fonctionnels

**Actions:**
- [ ] Vérifier que toutes les fonctionnalités existantes fonctionnent
- [ ] Tester l'intégration avec Redux
- [ ] Tester l'intégration avec les API
- [ ] Vérifier que les animations fonctionnent
- [ ] Tester les formulaires et validations

### 6.3 Tests de Performance

**Actions:**
- [ ] Vérifier le bundle size (ne pas trop augmenter)
- [ ] Tester les temps de chargement
- [ ] Optimiser les imports si nécessaire

## 📝 Phase 7: Nettoyage et Documentation

### 7.1 Nettoyage

**Actions:**
- [ ] Supprimer les anciens composants non utilisés
- [ ] Nettoyer les imports non utilisés
- [ ] Supprimer les styles CSS obsolètes
- [ ] Vérifier qu'il n'y a pas de code mort

### 7.2 Documentation

**Actions:**
- [ ] Documenter les nouveaux composants UI
- [ ] Mettre à jour le README avec le nouveau design system
- [ ] Créer un guide de style pour les développeurs
- [ ] Documenter les changements de dépendances

## 🚀 Ordre d'Exécution Recommandé

### Sprint 1 (Semaine 1): Infrastructure
- Phase 1 complète (dépendances, CSS, Tailwind)

### Sprint 2 (Semaine 2): Composants de Base
- Phase 2 complète (composants UI essentiels)

### Sprint 3 (Semaine 3): Composants Métier
- Phase 3 complète (ObjectiveCard, StreakCard, etc.)

### Sprint 4 (Semaine 4): Pages Principales
- Phase 4.1, 4.2, 4.3 (Landing, Dashboard, Assessment)

### Sprint 5 (Semaine 5): Pages Secondaires
- Phase 4.4, 4.5 (Auth, Profile)

### Sprint 6 (Semaine 6): Intégration
- Phase 5 complète (Thème, Navigation, Toasts)

### Sprint 7 (Semaine 7): Tests et Finalisation
- Phase 6 et 7 complètes

## ⚠️ Points d'Attention

1. **Compatibilité React 18 vs 19**
   - Le nouveau design utilise React 19, mais le frontend actuel utilise React 18
   - Vérifier la compatibilité des composants Radix UI avec React 18
   - Si nécessaire, mettre à jour React 18 → 19 progressivement

2. **Routing**
   - Next.js App Router vs React Router
   - Adapter toutes les routes et navigations
   - Vérifier les paramètres de route (`[objectiveId]` → `:objectiveId`)

3. **State Management**
   - Le nouveau design utilise des hooks simples
   - Intégrer avec Redux Toolkit existant
   - Préserver la logique métier existante

4. **API Integration**
   - Le nouveau design a des TODO pour les API
   - Utiliser les services API existants (`apiService`, `authService`)
   - Adapter les appels API

5. **Styles et Animations**
   - Préserver les animations existantes si importantes
   - Adapter les styles pour utiliser le nouveau design system
   - Vérifier les classes Tailwind personnalisées

6. **Bundle Size**
   - Radix UI peut augmenter le bundle size
   - Vérifier l'impact et optimiser si nécessaire
   - Utiliser le tree-shaking

## 📚 Ressources

- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Radix UI Documentation](https://www.radix-ui.com)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [React Router Documentation](https://reactrouter.com)

## ✅ Checklist de Validation

- [ ] Toutes les dépendances installées
- [ ] Tailwind CSS v4 configuré et fonctionnel
- [ ] Tous les composants UI de base créés
- [ ] Système de thème fonctionnel (dark/light)
- [ ] Toutes les pages migrées
- [ ] Navigation fonctionnelle
- [ ] Intégration Redux/API fonctionnelle
- [ ] Tests passent
- [ ] Pas de régression fonctionnelle
- [ ] Design cohérent avec le nouveau design system
- [ ] Performance acceptable
- [ ] Documentation à jour


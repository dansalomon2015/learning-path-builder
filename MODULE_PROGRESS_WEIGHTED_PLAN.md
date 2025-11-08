# Plan d'Implémentation : Système de Progression Pondérée pour les Modules

## 📋 Vue d'ensemble

Repenser le système de progression des modules pour utiliser une répartition pondérée entre les ressources et le test final, avec une progression incrémentale basée sur la validation des ressources.

## 🎯 Objectifs

1. **Répartition équitable** : Diviser 100% entre les ressources et le test final
2. **Progression incrémentale** : Chaque ressource validée ajoute son pourcentage au module
3. **Test final significatif** : Garantir un minimum de 20% pour le test final
4. **Rétrocompatibilité** : Fonctionner avec les modules existants

## 📊 Logique de Calcul

### Formule de base

```
Si resourceCount === 0:
  resourceWeight = 0%
  finalExamWeight = 100%

Sinon:
  totalElements = resourceCount + 1
  baseWeight = 100 / totalElements
  resourceWeight = Math.floor(baseWeight)  // Arrondi à l'entier inférieur
  finalExamWeight = 100 - (resourceWeight × resourceCount)
  
  // Garantir minimum 20% pour le test final
  Si finalExamWeight < 20:
    finalExamWeight = 20
    resourceWeight = Math.floor((100 - 20) / resourceCount)
```

### Exemples

| Ressources | Base Weight | Resource Weight | Final Exam | Total |
|------------|-------------|-----------------|------------|-------|
| 0          | -           | 0%              | 100%       | 100%  |
| 1          | 50%         | 50%             | 50%        | 100%  |
| 2          | 33.33%      | 33%             | 34%        | 100%  |
| 3          | 25%         | 25%             | 25%        | 100%  |
| 4          | 20%         | 20%             | 20%        | 100%  |
| 5          | 16.67%      | 16%             | 20%        | 100%  |
| 10         | 9.09%       | 8%              | 20%        | 100%  |

## 🏗️ Architecture

Voir les détails d'implémentation dans le code source.


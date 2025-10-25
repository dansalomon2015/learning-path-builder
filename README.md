# Learning Path Builder

Un monorepo complet pour créer et gérer des parcours d'apprentissage personnalisés, avec un backend Node.js 22 et un frontend React/Vite/TypeScript, déployé sur Google Cloud Run.

## 🏗️ Architecture

```
learning-path-builder/
├── packages/
│   ├── backend/          # API Node.js 22 + TypeScript + Express
│   └── frontend/         # React + Vite + TypeScript + Tailwind CSS
├── cloud-run/           # Configurations Cloud Run
├── scripts/             # Scripts de déploiement
├── .github/workflows/   # CI/CD GitHub Actions
└── docker-compose.yml   # Développement local
```

## 🚀 Fonctionnalités

### Backend

-   **Node.js 22** avec TypeScript
-   **Express.js** avec middleware de sécurité
-   **MongoDB** pour la persistance des données
-   **JWT** pour l'authentification
-   **Winston** pour les logs
-   **Rate limiting** et protection CORS
-   **Health checks** pour Cloud Run

### Frontend

-   **React 18** avec TypeScript
-   **Vite** pour le build rapide
-   **Tailwind CSS** pour le styling
-   **React Router** pour la navigation
-   **React Query** pour la gestion des données
-   **Zustand** pour l'état global
-   **React Hook Form** pour les formulaires

### DevOps

-   **Docker** multi-stage pour les builds optimisés
-   **GitHub Actions** pour le CI/CD automatique
-   **Google Cloud Run** pour le déploiement serverless
-   **Nginx** pour servir le frontend en production

## 🛠️ Installation et Développement

### Prérequis

-   Node.js 22+
-   npm 10+
-   Docker (optionnel pour le développement local)
-   Google Cloud SDK (pour le déploiement)

### Installation

```bash
# Cloner le repository
git clone <repository-url>
cd learning-path-builder

# Installer les dépendances
npm install

# Copier les fichiers d'environnement
cp packages/backend/env.example packages/backend/.env
cp packages/frontend/env.example packages/frontend/.env
```

### Développement Local

#### Option 1: Développement avec npm

```bash
# Démarrer le backend en mode développement
npm run dev:backend

# Dans un autre terminal, démarrer le frontend
npm run dev:frontend
```

#### Option 2: Développement avec Docker

```bash
# Démarrer tous les services avec Docker Compose
npm run docker:up

# Arrêter les services
npm run docker:down
```

### Scripts Disponibles

#### Racine du projet

```bash
npm run dev          # Démarrer backend + frontend en parallèle
npm run build         # Build complet
npm run test          # Tests complets
npm run lint          # Linting complet
npm run clean         # Nettoyer les builds
```

#### Backend

```bash
npm run dev:backend   # Démarrer en mode développement
npm run build:backend # Build TypeScript
npm run start         # Démarrer en production
npm run test          # Tests Jest
npm run lint          # ESLint
```

#### Frontend

```bash
npm run dev:frontend  # Démarrer Vite dev server
npm run build:frontend # Build Vite
npm run preview       # Prévisualiser le build
npm run test          # Tests Vitest
npm run lint          # ESLint
```

## 🚀 Déploiement

### Configuration GitHub Actions

1. **Créer un projet Google Cloud**
2. **Activer les APIs nécessaires** :

    - Cloud Run API
    - Container Registry API
    - Cloud Build API

3. **Créer un Service Account** avec les permissions :

    - Cloud Run Admin
    - Storage Admin
    - Service Account User

4. **Configurer les secrets GitHub** :
    - `GCP_PROJECT_ID` : ID de votre projet GCP
    - `GCP_SA_KEY` : Clé JSON du Service Account

### Déploiement Automatique

Le déploiement se fait automatiquement à chaque push sur la branche `main` :

1. **Tests** : Exécution des tests backend et frontend
2. **Build** : Construction des images Docker
3. **Deploy** : Déploiement sur Cloud Run
4. **Notification** : Statut du déploiement

### Déploiement Manuel

```bash
# Rendre le script exécutable
chmod +x scripts/deploy.sh

# Déployer
./scripts/deploy.sh YOUR_PROJECT_ID us-central1
```

### URLs de Déploiement

Après déploiement, vos services seront disponibles à :

-   **Frontend** : `https://learning-path-builder-frontend-PROJECT_ID.a.run.app`
-   **Backend** : `https://learning-path-builder-backend-PROJECT_ID.a.run.app`
-   **Health Check** : `https://learning-path-builder-backend-PROJECT_ID.a.run.app/health`

## 📁 Structure du Code

### Backend (`packages/backend/`)

```
src/
├── index.ts              # Point d'entrée
├── middleware/           # Middlewares Express
│   ├── errorHandler.ts
│   └── notFoundHandler.ts
├── routes/               # Routes API
│   ├── index.ts
│   ├── learningPath.ts
│   └── user.ts
├── types/                # Types TypeScript
│   └── index.ts
└── utils/                # Utilitaires
    └── logger.ts
```

### Frontend (`packages/frontend/`)

```
src/
├── main.tsx              # Point d'entrée React
├── App.tsx               # Composant principal
├── components/           # Composants réutilisables
│   └── Layout.tsx
├── pages/                # Pages de l'application
│   ├── HomePage.tsx
│   ├── LearningPathsPage.tsx
│   ├── LearningPathDetailPage.tsx
│   ├── ProfilePage.tsx
│   └── NotFoundPage.tsx
├── services/             # Services API
│   └── api.ts
├── types/                # Types TypeScript
│   └── index.ts
└── index.css             # Styles Tailwind
```

## 🔧 Configuration

### Variables d'Environnement

#### Backend

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://localhost:27017/learning-path-builder
JWT_SECRET=your-secret-key
FRONTEND_URL=https://your-frontend-url
```

#### Frontend

```env
VITE_API_URL=https://your-backend-url/api
VITE_APP_NAME=Learning Path Builder
```

### Configuration Cloud Run

Les services sont configurés avec :

-   **Auto-scaling** : 0-10 instances (backend), 0-5 instances (frontend)
-   **Memory** : 512Mi (backend), 256Mi (frontend)
-   **CPU** : 1 vCPU pour les deux services
-   **Health checks** : Endpoints `/health`
-   **Timeout** : 300 secondes

## 🧪 Tests

```bash
# Tests backend
npm run test --workspace=@learning-path-builder/backend

# Tests frontend
npm run test --workspace=@learning-path-builder/frontend

# Tests avec couverture
npm run test:coverage --workspace=@learning-path-builder/backend
npm run test:coverage --workspace=@learning-path-builder/frontend
```

## 📊 Monitoring

### Logs

-   **Backend** : Winston avec rotation des logs
-   **Frontend** : Logs Nginx
-   **Cloud Run** : Logs intégrés dans Google Cloud Console

### Métriques

-   **Performance** : Temps de réponse, throughput
-   **Erreurs** : Taux d'erreur, codes de statut
-   **Ressources** : CPU, mémoire, requêtes

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour toute question ou problème :

1. Vérifier la documentation
2. Consulter les issues GitHub
3. Créer une nouvelle issue si nécessaire

---

**Développé avec ❤️ pour l'apprentissage continu**

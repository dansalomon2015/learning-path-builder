# FlashLearn AI

Un système d'apprentissage adaptatif moderne alimenté par l'IA, conçu pour créer et étudier des flashcards dynamiques générées par IA. L'application met l'accent sur une expérience utilisateur propre, intuitive et engageante grâce à un design minimaliste et des animations fluides.

## 🏗️ Architecture

```
flashlearn-ai/
├── packages/
│   ├── backend/          # API Node.js 22 + TypeScript + Express + Firebase + Gemini AI
│   └── frontend/         # React + Vite + TypeScript + Tailwind CSS + Firebase Auth
├── cloud-run/           # Configurations Cloud Run
├── scripts/             # Scripts de déploiement
├── .github/workflows/   # CI/CD GitHub Actions
└── docker-compose.yml   # Développement local
```

## 🚀 Fonctionnalités

### Backend

-   **Node.js 22** avec TypeScript
-   **Express.js** avec middleware de sécurité
-   **Firebase Admin SDK** pour l'authentification et Firestore
-   **Gemini AI** pour la génération de flashcards et quiz adaptatifs
-   **Algorithmes adaptatifs** pour l'ajustement automatique de la difficulté
-   **Upload de documents** (PDF, TXT, MD) avec traitement IA
-   **Export de données** (CSV, PDF) avec historique complet
-   **Health checks** avancés pour Cloud Run
-   **Monitoring** avec Winston et Cloud Logging

### Frontend

-   **React 18** avec TypeScript
-   **Vite** pour le build rapide
-   **Tailwind CSS** pour le styling moderne
-   **Firebase Auth** pour l'authentification sécurisée
-   **Framer Motion** pour les animations fluides
-   **React Query** pour la gestion des données
-   **Zustand** pour l'état global
-   **React Hook Form** pour les formulaires
-   **Composants de flashcards** avec animations de retournement
-   **Mode quiz** avec questions à choix multiples adaptatives

### Fonctionnalités Principales

-   **Génération dynamique de quiz** : Création de quiz personnalisés basés sur le niveau de compétence et les performances passées
-   **Authentification utilisateur** : Connexion et inscription sécurisées (Firebase Auth)
-   **Suivi et sauvegarde des progrès** : Stockage persistant des résultats de quiz et statistiques
-   **Apprentissage adaptatif** : Ajustement automatique de la difficulté et suggestions de nouveaux sujets
-   **Upload et traitement de documents** : Conversion de documents en flashcards via IA
-   **Export et reprise de session** : Reprise de sessions incomplètes et export de l'historique
-   **Dashboard et analytics** : Tableaux de bord personnalisés avec analyses visuelles
-   **Gestion de profil utilisateur** : Édition des informations, niveau de compétence et objectifs
-   **Sécurité et protection des données** : Chiffrement des données et logs d'audit

### DevOps

-   **Docker** multi-stage pour les builds optimisés
-   **GitHub Actions** pour le CI/CD automatique
-   **Google Cloud Run** pour le déploiement serverless
-   **Nginx** pour servir le frontend en production
-   **Cloud Build** pour les tests et déploiement automatisé
-   **Cloud Logging et Monitoring** avec alertes automatiques

## 🛠️ Installation et Développement

### Prérequis

-   Node.js 22+
-   npm 10+
-   Firebase CLI
-   Google Cloud SDK (pour le déploiement)
-   Docker (optionnel pour le développement local)

### Configuration Firebase

1. **Créer un projet Firebase** :

    - Aller sur [Firebase Console](https://console.firebase.google.com/)
    - Créer un nouveau projet
    - Activer Authentication et Firestore

2. **Configurer Authentication** :

    - Activer Email/Password et Google Sign-In
    - Configurer les domaines autorisés

3. **Configurer Firestore** :
    - Créer une base de données en mode production
    - Configurer les règles de sécurité

### Configuration Gemini AI

1. **Obtenir une clé API Gemini** :
    - Aller sur [Google AI Studio](https://makersuite.google.com/app/apikey)
    - Créer une nouvelle clé API

### Installation

```bash
# Cloner le repository
git clone <repository-url>
cd flashlearn-ai

# Installer les dépendances
npm install

# Copier les fichiers d'environnement
cp packages/backend/env.example packages/backend/.env
cp packages/frontend/env.example packages/frontend/.env
```

### Configuration des Variables d'Environnement

#### Backend (.env)

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com

# Gemini AI Configuration
GEMINI_API_KEY=your-gemini-api-key

# Server Configuration
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
```

#### Frontend (.env)

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-firebase-app-id

# API Configuration
VITE_API_URL=http://localhost:3000/api
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
    - Firebase Admin API

3. **Créer un Service Account** avec les permissions :

    - Cloud Run Admin
    - Storage Admin
    - Service Account User
    - Firebase Admin

4. **Configurer les secrets GitHub** :
    - `GCP_PROJECT_ID` : ID de votre projet GCP
    - `GCP_SA_KEY` : Clé JSON du Service Account
    - `FIREBASE_PROJECT_ID` : ID de votre projet Firebase
    - `GEMINI_API_KEY` : Clé API Gemini

### Déploiement Automatique

Le déploiement se fait automatiquement à chaque push sur la branche `main` :

1. **Tests** : Exécution des tests backend et frontend
2. **Build** : Construction des images Docker
3. **Deploy** : Déploiement sur Cloud Run
4. **Health Check** : Vérification de la disponibilité des services
5. **Notification** : Statut du déploiement

### Déploiement Manuel

```bash
# Rendre le script exécutable
chmod +x scripts/deploy.sh

# Déployer
./scripts/deploy.sh YOUR_PROJECT_ID us-central1
```

### URLs de Déploiement

Après déploiement, vos services seront disponibles à :

-   **Frontend** : `https://flashlearn-ai-frontend-PROJECT_ID.a.run.app`
-   **Backend** : `https://flashlearn-ai-backend-PROJECT_ID.a.run.app`
-   **Health Check** : `https://flashlearn-ai-backend-PROJECT_ID.a.run.app/health`

## 📁 Structure du Code

### Backend (`packages/backend/`)

```
src/
├── index.ts                    # Point d'entrée
├── middleware/                 # Middlewares Express
│   ├── auth.ts                # Authentification Firebase
│   ├── errorHandler.ts
│   └── notFoundHandler.ts
├── routes/                     # Routes API
│   ├── learningPlan.ts        # Gestion des plans d'apprentissage
│   └── document.ts            # Upload et export de documents
├── services/                   # Services métier
│   ├── firebase.ts            # Service Firebase Admin
│   ├── gemini.ts              # Service Gemini AI
│   └── adaptiveLearning.ts    # Algorithmes adaptatifs
├── types/                      # Types TypeScript
│   └── index.ts
└── utils/                      # Utilitaires
    └── logger.ts
```

### Frontend (`packages/frontend/`)

```
src/
├── main.tsx                    # Point d'entrée React
├── App.tsx                     # Composant principal
├── components/                 # Composants réutilisables
│   ├── Layout.tsx
│   ├── FlashcardView.tsx
│   ├── QuizView.tsx
│   └── Dashboard.tsx
├── pages/                      # Pages de l'application
│   ├── HomePage.tsx
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── StudyPage.tsx
│   └── ProfilePage.tsx
├── services/                   # Services API
│   ├── api.ts
│   └── firebase.ts
├── types/                      # Types TypeScript
│   └── index.ts
└── index.css                   # Styles Tailwind
```

## 🔧 Configuration

### Variables d'Environnement

#### Backend

```env
NODE_ENV=production
PORT=3000
FIREBASE_PROJECT_ID=your-firebase-project-id
GEMINI_API_KEY=your-gemini-api-key
FRONTEND_URL=https://your-frontend-url
```

#### Frontend

```env
VITE_API_URL=https://your-backend-url/api
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_API_KEY=your-firebase-api-key
```

### Configuration Cloud Run

Les services sont configurés avec :

-   **Auto-scaling** : 0-10 instances (backend), 0-5 instances (frontend)
-   **Memory** : 512Mi (backend), 256Mi (frontend)
-   **CPU** : 1 vCPU pour les deux services
-   **Health checks** : Endpoints `/health` avec vérification des services
-   **Timeout** : 300 secondes
-   **Monitoring** : Cloud Logging et Cloud Monitoring intégrés

## 🧪 Tests

```bash
# Tests backend
npm run test --workspace=@flashlearn-ai/backend

# Tests frontend
npm run test --workspace=@flashlearn-ai/frontend

# Tests avec couverture
npm run test:coverage --workspace=@flashlearn-ai/backend
npm run test:coverage --workspace=@flashlearn-ai/frontend
```

## 📊 Monitoring

### Logs

-   **Backend** : Winston avec rotation des logs et intégration Cloud Logging
-   **Frontend** : Logs Nginx et erreurs JavaScript
-   **Cloud Run** : Logs intégrés dans Google Cloud Console
-   **Firebase** : Logs d'authentification et Firestore

### Métriques

-   **Performance** : Temps de réponse, throughput, latence
-   **Erreurs** : Taux d'erreur, codes de statut, exceptions
-   **Ressources** : CPU, mémoire, requêtes, coûts
-   **Utilisateurs** : Sessions actives, conversions, rétention

### Alertes

-   **Erreurs critiques** : Alertes automatiques sur les erreurs 5xx
-   **Performance** : Alertes sur la latence élevée
-   **Ressources** : Alertes sur l'utilisation CPU/mémoire
-   **Sécurité** : Alertes sur les tentatives d'intrusion

## 🔒 Sécurité

### Authentification

-   **Firebase Auth** avec JWT tokens
-   **OAuth 2.0** pour Google Sign-In
-   **Middleware d'authentification** sur toutes les routes protégées

### Protection des Données

-   **Chiffrement en transit** : HTTPS/TLS
-   **Chiffrement au repos** : Firestore avec chiffrement automatique
-   **Validation des données** : Joi pour la validation des entrées
-   **Rate limiting** : Protection contre les attaques DDoS

### Conformité RGPD

-   **Anonymisation** des données personnelles
-   **Logs d'audit** pour le suivi des accès
-   **Export des données** : Fonctionnalité d'export CSV/PDF
-   **Suppression des données** : API pour la suppression des comptes

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

**Développé avec ❤️ et alimenté par l'IA pour l'apprentissage adaptatif**

# FlashLearn AI

A modern AI-powered adaptive learning system designed to create and study dynamic AI-generated flashcards. The application emphasizes a clean, intuitive, and engaging user experience through minimalist design and smooth animations.

## 🏗️ Architecture

```
learning-path-builder/
├── packages/
│   ├── backend/          # API Node.js 22 + TypeScript + Express + Firebase Admin + Gemini AI
│   ├── frontend/         # React + Vite + TypeScript + Tailwind CSS + Nginx
│   └── shared/           # Shared code between backend and frontend
├── scripts/             # Deployment scripts
├── .github/workflows/   # CI/CD GitHub Actions (CI, Deploy, Provision)
└── docker-compose.yml   # Local development
```

## 🚀 Features

### Backend

-   **Node.js 22** with TypeScript
-   **Express.js** with security middleware
-   **Firebase Admin SDK** for authentication and Firestore
-   **Gemini AI** for generating adaptive flashcards and quizzes
-   **Adaptive algorithms** for automatic difficulty adjustment
-   **Document upload** (PDF, TXT, MD) with AI processing
-   **Data export** (CSV, PDF) with complete history
-   **Advanced health checks** for Cloud Run
-   **Monitoring** with Winston and Cloud Logging

### Frontend

-   **React 18** with TypeScript
-   **Vite** for fast builds
-   **Tailwind CSS** for modern styling
-   **Backend JWT Auth** - Authentication via backend with JWT tokens
-   **Redux Toolkit + Redux Persist** for global state management
-   **React Context API** for authentication
-   **React Query** for data management
-   **Framer Motion** for smooth animations
-   **React Hook Form** for forms
-   **Axios** for API calls with interceptors
-   **Nginx** with proxy for API requests in production
-   **Flashcard components** with flip animations
-   **Quiz mode** with adaptive multiple-choice questions

### Main Features

-   **Dynamic quiz generation** : Create personalized quizzes based on skill level and past performance
-   **User authentication** : Secure login and registration (Firebase Auth)
-   **Progress tracking and saving** : Persistent storage of quiz results and statistics
-   **Adaptive learning** : Automatic difficulty adjustment and suggestions for new topics
-   **Document upload and processing** : Convert documents to flashcards via AI
-   **Export and session resume** : Resume incomplete sessions and export history
-   **Dashboard and analytics** : Customized dashboards with visual analytics
-   **User profile management** : Edit information, skill level, and objectives
-   **Security and data protection** : Data encryption and audit logs

### DevOps

-   **Docker** multi-stage for optimized builds
-   **GitHub Actions** for automated CI/CD
-   **Google Cloud Run** for serverless deployment
-   **Nginx** to serve the frontend in production
-   **Cloud Build** for automated testing and deployment
-   **Cloud Logging and Monitoring** with automatic alerts

## 🛠️ Installation and Development

### Prerequisites

-   Node.js 22+
-   npm 10+
-   Firebase CLI
-   Google Cloud SDK (for deployment)
-   Docker (optional for local development)

### Firebase Configuration

1. **Create a Firebase project** :
    - Go to [Firebase Console](https://console.firebase.google.com/)
    - Create a new project
    - Enable Authentication (Email/Password) and Firestore

2. **Get service account credentials** :
    - Go to Project Settings > Service Accounts
    - Generate a new private key (JSON)
    - Save the JSON file

3. **Configure Firestore** :
    - Create a database in production mode
    - Configure security rules

### Gemini AI Configuration

1. **Get a Gemini API key** :
    - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
    - Create a new API key

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd flashlearn-ai

# Install dependencies
npm install

# Copy environment files
cp packages/backend/env.example packages/backend/.env.local
cp packages/frontend/env.example packages/frontend/.env.local
```

### Environment Variables Configuration

#### Backend (.env.local)

**Option 1: Use FIREBASE_CONFIG (recommended - JSON format, same as production)**

```env
# Firebase Configuration (JSON string)
FIREBASE_CONFIG={"project_id":"your-project-id","serviceAccount":{"type":"service_account","project_id":"your-project-id","private_key_id":"key-id","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"xxx@xxx.iam.gserviceaccount.com","client_id":"123","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token"}}

# Alternative: Use individual variables or firebase-service-account.json file
# FIREBASE_PROJECT_ID=your-firebase-project-id
# firebase-project-id=your-firebase-project-id

# Gemini AI Configuration
GEMINI_API_KEY=your-gemini-api-key

# Server Configuration
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

# Security Keys
JWT_SECRET=your-jwt-secret-key-here
```

**To generate FIREBASE_CONFIG from your service account JSON file:**
```bash
cd packages/backend
jq -c '{project_id: .project_id, serviceAccount: .}' src/services/firebase-service-account.json
```

#### Frontend (.env.local)

```env
# API Configuration
VITE_API_URL=http://localhost:3000/api

# Note: Firebase client SDK is not used in the frontend.
# Authentication is handled via the backend API with JWT tokens.
```

### Local Development

#### Option 1: Development with npm

```bash
# Start the backend in development mode
npm run dev:backend

# In another terminal, start the frontend
npm run dev:frontend
```

#### Option 2: Development with Docker

```bash
# Start all services with Docker Compose
npm run docker:up

# Stop services
npm run docker:down
```

### Available Scripts

#### Root project

```bash
npm run dev          # Start backend + frontend in parallel
npm run build         # Full build
npm run test          # Full tests
npm run lint          # Full linting
npm run clean         # Clean builds
```

#### Backend

```bash
npm run dev:backend   # Start in development mode (tsx watch)
npm run build:backend # TypeScript build + tsc-alias
npm run start         # Start in production
npm run test          # Jest tests (watch mode)
npm run test:ci       # Jest tests (CI mode, no watch)
npm run lint          # ESLint
```

#### Frontend

```bash
npm run dev:frontend  # Start Vite dev server
npm run build:frontend # Vite build
npm run preview       # Preview the build
npm run test          # Vitest tests (watch mode)
npm run test:ci       # Vitest tests (CI mode, no watch)
npm run lint          # ESLint
```

## 🚀 Deployment

### GitHub Actions Configuration

1. **Create a Google Cloud project**
2. **Enable required APIs** :

    - Cloud Run API
    - Container Registry API
    - Cloud Build API
    - Firebase Admin API

3. **Create a Service Account** with permissions :

    - Cloud Run Admin
    - Storage Admin
    - Service Account User
    - Firebase Admin

4. **Configure GitHub secrets** :
    - `GCP_PROJECT_ID` : Your GCP project ID
    - `GCP_REGION` : GCP region (e.g., us-west1, us-central1)
    - `GCP_SA_KEY` : Service Account JSON key with required permissions

### Automatic Deployment

Deployment happens automatically on every push to the `main` branch :

1. **Tests** : Run backend and frontend tests (`test:ci`)
2. **Build** : Build Docker images with multi-stage Dockerfile
3. **Deploy** : Sequential deployment to Cloud Run (concurrency group to avoid conflicts)
4. **Secrets** : Use Google Cloud Secret Manager for `FIREBASE_CONFIG` and `GEMINI_API_KEY`
5. **Nginx Proxy** : Frontend configures nginx to proxy `/api/*` to backend
6. **Health Check** : Verify service availability

**Note** : Deployments are configured to not run concurrently (one deployment at a time).

### Manual Deployment

```bash
# Make the script executable
chmod +x scripts/deploy.sh

# Deploy
./scripts/deploy.sh YOUR_PROJECT_ID us-central1
```

### Deployment URLs

After deployment, your services will be available at :

-   **Frontend** : `https://flashlearn-ai-frontend-PROJECT_ID.REGION.run.app`
-   **Backend** : `https://flashlearn-ai-backend-PROJECT_ID.REGION.run.app`
-   **Backend Health Check** : `https://flashlearn-ai-backend-PROJECT_ID.REGION.run.app/health`

**Required configuration before first deployment :**

1. **Create secrets in Google Cloud Secret Manager** :
   ```bash
   # Firebase config (JSON object)
   cat firebase-service-account.json | jq -c '{project_id: .project_id, serviceAccount: .}' | \
     gcloud secrets create firebase-config --data-file=- --replication-policy="automatic"
   
   # Gemini API key (string)
   echo -n 'your-gemini-api-key' | \
     gcloud secrets create gemini-api-key --data-file=- --replication-policy="automatic"
   ```

2. **Run the provision workflow** (one time only) :
    - Via GitHub Actions : Go to Actions > Provision > Run workflow
    - Or manually with the provision script

3. **Subsequent deployments** will be automatic via the `deploy.yml` workflow

## 📁 Code Structure

### Backend (`packages/backend/`)

```
src/
├── index.ts                    # Entry point with health checks
├── middleware/                 # Middlewares Express
│   ├── auth.ts                # JWT authentication
│   ├── errorHandler.ts        # Centralized error handling
│   └── notFoundHandler.ts     # 404 handler
├── routes/                     # API routes
│   ├── auth.ts                # Authentication (login/register)
│   ├── objectives.ts          # Learning objectives management
│   ├── assessments.ts         # Skill assessments
│   ├── learningPlan.ts        # Learning plans
│   ├── document.ts            # Document upload and export
│   ├── user.ts                # User profile
│   └── analytics.ts           # Analytics and statistics
├── services/                   # Business services
│   ├── firebase.ts            # Firebase Admin service (Firestore + Auth)
│   ├── gemini.ts              # Gemini AI service (content generation)
│   ├── adaptiveLearning.ts    # Adaptive algorithms
│   └── analytics.ts           # Analytics service
├── types/                      # TypeScript types
│   └── index.ts               # Shared types with enums
└── utils/                      # Utilities
    └── logger.ts              # Winston logger (Cloud Run compatible)
```

### Frontend (`packages/frontend/`)

```
src/
├── main.tsx                    # React entry point
├── App.tsx                     # Main component with routing
├── components/                 # Reusable components
│   ├── Layout.tsx             # Main layout
│   ├── Header.tsx             # Navigation header
│   ├── AuthForm.tsx           # Authentication form
│   ├── FlashcardView.tsx      # Flashcard view
│   ├── StudySession.tsx       # Complete study session
│   ├── Dashboard.tsx          # Dashboard
│   ├── ProfilePage.tsx        # Profile page
│   ├── SkillAssessment.tsx    # Skill assessment
│   ├── ModuleFlashcardStudy.tsx  # Module study
│   ├── ValidationQuizModal.tsx   # Validation quiz
│   ├── ContentGenerationModal.tsx # Content generation
│   └── SuggestedResourcesPanel.tsx # Suggested resources
├── pages/                      # Application pages
│   ├── LandingPage.tsx        # Landing page
│   ├── AuthPage.tsx           # Authentication page
│   ├── DashboardPage.tsx      # Main dashboard
│   ├── StudyPage.tsx          # Study page
│   ├── ProfilePage.tsx        # User profile
│   ├── LearningPathsPage.tsx  # Learning paths list
│   ├── ObjectivePathPage.tsx  # Objective details
│   └── ModuleLearnPage.tsx    # Module learning
├── services/                   # API services
│   ├── api.ts                 # Axios API service with interceptors
│   ├── auth.ts                # Authentication service (backend JWT)
│   └── sessionService.ts      # Study session management
├── store/                      # Redux store
│   ├── index.ts               # Store configuration with persist
│   └── slices/                # Redux slices
│       ├── authSlice.ts       # Authentication state
│       └── learningPlansSlice.ts  # Learning plans state
├── contexts/                   # React Context
│   └── AuthContext.tsx        # Authentication context
├── types/                      # TypeScript types
│   └── index.ts               # Types with enums (SkillLevel, Difficulty, etc.)
└── index.css                   # Styles Tailwind
```

## 🔧 Configuration

### Environment Variables

#### Backend (Cloud Run)

Environment variables are configured via:
- **Google Cloud Secret Manager secrets** :
  - `FIREBASE_CONFIG` : JSON object with project_id and serviceAccount
  - `GEMINI_API_KEY` : Gemini API key (string)
- **Cloud Run environment variables** :
  - `NODE_ENV=production`
  - `BACKEND_URL` : Backend URL (for frontend nginx proxy)
  - `PORT` : Automatically set by Cloud Run (3000)

#### Frontend (Cloud Run)

Environment variables are configured via:
- **Cloud Run environment variables** :
  - `VITE_API_URL` : Full backend URL with `/api` (used at build time)
  - `BACKEND_URL` : Backend URL (used by nginx proxy at runtime)

**Note** : The frontend uses nginx which proxies `/api/*` requests to the backend configured in `BACKEND_URL`.

### Cloud Run Configuration

Services are configured with :

-   **Auto-scaling** : 0-10 instances (backend), 0-5 instances (frontend)
-   **Memory** : 1Gi (backend), 512Mi (frontend)
-   **CPU** : 1 vCPU for both services
-   **Health checks** : `/health` endpoints with service verification (always returns 200 to prevent Cloud Run from killing the container)
-   **Timeout** : 300 seconds (backend), 60 seconds (frontend)
-   **Secrets** : Access to secrets via Secret Manager (FIREBASE_CONFIG, GEMINI_API_KEY)
-   **Concurrency** : Sequential deployments (no concurrency)
-   **Monitoring** : Integrated Cloud Logging and Cloud Monitoring
-   **Frontend Nginx** : Proxy `/api/*` to backend, static file server

## 🧪 Tests

```bash
# Tests backend (watch mode)
npm run test --workspace=@flashlearn-ai/backend

# Tests backend (CI mode)
npm run test:ci --workspace=@flashlearn-ai/backend

# Tests frontend (watch mode)
npm run test --workspace=@flashlearn-ai/frontend

# Tests frontend (CI mode)
npm run test:ci --workspace=@flashlearn-ai/frontend

# Tests with coverage
npm run test:coverage --workspace=@flashlearn-ai/backend
npm run test:coverage --workspace=@flashlearn-ai/frontend

# Full tests (CI mode)
npm run test:ci
```

## 📊 Monitoring

### Logs

-   **Backend** : Winston with log rotation and Cloud Logging integration
-   **Frontend** : Nginx logs and JavaScript errors
-   **Cloud Run** : Integrated logs in Google Cloud Console
-   **Firebase** : Authentication and Firestore logs

### Metrics

-   **Performance** : Response time, throughput, latency
-   **Errors** : Error rate, status codes, exceptions
-   **Resources** : CPU, memory, requests, costs
-   **Users** : Active sessions, conversions, retention

### Alerts

-   **Critical errors** : Automatic alerts on 5xx errors
-   **Performance** : Alerts on high latency
-   **Resources** : Alerts on CPU/memory usage
-   **Security** : Alerts on intrusion attempts

## 🔒 Security

### Authentication

-   **Backend JWT** : Authentication via backend with JWT tokens
-   **Firebase Admin SDK** : Used only on backend to create/verify users
-   **Identity Toolkit API** : Server-side email/password verification
-   **Authentication middleware** : API route protection with JWT verification
-   **Redux Persist** : Authentication state persistence in frontend
-   **Protected Routes** : Protected routes with redirect if not authenticated

### Data Protection

-   **Encryption in transit** : HTTPS/TLS (Cloud Run default)
-   **Encryption at rest** : Firestore with automatic encryption
-   **Secrets Management** : Google Cloud Secret Manager for sensitive credentials
-   **Rate limiting** : Express rate limiting (100 requests/15min per IP)
-   **CORS** : Strict configuration of allowed origins
-   **Helmet** : HTTP security headers
-   **JWT Tokens** : Signed tokens with expiration (7 days)

### GDPR Compliance

-   **Anonymization** of personal data
-   **Audit logs** for access tracking
-   **Data export** : CSV/PDF export functionality
-   **Data deletion** : API for account deletion

## 🤝 Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under MIT. See the `LICENSE` file for more details.

## 🆘 Support

For questions or issues :

1. Check the documentation
2. Consult GitHub issues
3. Create a new issue if necessary

---

**Developed with ❤️ and powered by AI for adaptive learning**

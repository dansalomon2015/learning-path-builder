# 🔥 Guide de Configuration Firebase pour FlashLearn AI

## 📋 Prérequis
- Compte Google
- Accès à la console Firebase
- Accès à Google AI Studio

## 🚀 Étape 1 : Créer un Projet Firebase

### 1.1 Créer le Projet
1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Cliquez sur **"Créer un projet"**
3. Nom du projet : `flashlearn-ai` (ou votre nom préféré)
4. Activez Google Analytics (recommandé)
5. Cliquez sur **"Créer le projet"**

### 1.2 Configurer l'Authentification
1. Dans le menu de gauche, cliquez sur **"Authentication"**
2. Cliquez sur **"Commencer"**
3. Allez dans l'onglet **"Sign-in method"**
4. Activez **"Email/Password"**
5. Activez **"Google"** (optionnel)

### 1.3 Configurer Firestore Database
1. Dans le menu de gauche, cliquez sur **"Firestore Database"**
2. Cliquez sur **"Créer une base de données"**
3. Choisissez **"Commencer en mode test"** (pour le développement)
4. Sélectionnez une région (ex: `us-central1`)

## 🔑 Étape 2 : Obtenir les Clés Firebase

### 2.1 Clés Frontend (Client SDK)
1. Allez dans **"Project Settings"** (icône ⚙️)
2. Dans l'onglet **"General"**, faites défiler vers le bas
3. Section **"Your apps"**, cliquez sur **"Web"** (icône `</>`)
4. Nom de l'app : `FlashLearn AI Frontend`
5. **Ne cochez PAS** "Also set up Firebase Hosting"
6. Cliquez sur **"Enregistrer l'application"**
7. **Copiez la configuration** qui ressemble à :

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "flashlearn-ai.firebaseapp.com",
  projectId: "flashlearn-ai",
  storageBucket: "flashlearn-ai.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890abcdef"
};
```

### 2.2 Clés Backend (Admin SDK)
1. Toujours dans **"Project Settings"**
2. Allez dans l'onglet **"Service accounts"**
3. Cliquez sur **"Generate new private key"**
4. Cliquez sur **"Generate key"**
5. **Téléchargez le fichier JSON** (gardez-le secret !)

## 🤖 Étape 3 : Obtenir la Clé Gemini AI

### 3.1 Accéder à Google AI Studio
1. Allez sur [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Connectez-vous avec votre compte Google
3. Cliquez sur **"Create API Key"**
4. Sélectionnez votre projet Firebase (ou créez-en un nouveau)
5. **Copiez la clé API** générée

## 📝 Étape 4 : Configuration des Fichiers .env.local

### 4.1 Backend (.env.local)
Créez le fichier `packages/backend/.env.local` :

```bash
# Firebase Admin SDK (depuis le fichier JSON téléchargé)
FIREBASE_PROJECT_ID=flashlearn-ai
FIREBASE_PRIVATE_KEY_ID=1234567890abcdef1234567890abcdef12345678
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@flashlearn-ai.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=123456789012345678901
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token

# Gemini AI
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Autres configurations
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5175
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
ENCRYPTION_KEY=your-32-character-encryption-key-here
JWT_SECRET=your-jwt-secret-key-here
ENABLE_MONITORING=true
```

### 4.2 Frontend (.env.local)
Créez le fichier `packages/frontend/.env.local` :

```bash
# Firebase Client SDK (depuis la configuration web)
FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
FIREBASE_AUTH_DOMAIN=flashlearn-ai.firebaseapp.com
FIREBASE_PROJECT_ID=flashlearn-ai
FIREBASE_STORAGE_BUCKET=flashlearn-ai.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789012
FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890abcdef
FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Configuration de l'app
VITE_APP_NAME=FlashLearn AI
VITE_APP_VERSION=1.0.0
VITE_NODE_ENV=development
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG=true
```

## ✅ Étape 5 : Vérification

### 5.1 Tester Firebase
```bash
# Redémarrer le backend
npm run dev:backend

# Vérifier le health check
curl http://localhost:3000/health
```

### 5.2 Tester Gemini
```bash
# Le backend devrait maintenant montrer "gemini": true dans le health check
```

## 🔒 Sécurité

- ⚠️ **Ne jamais commiter** les fichiers `.env.local`
- 🔐 Gardez vos clés privées secrètes
- 🌐 Pour la production, utilisez les variables d'environnement Cloud Run
- 📝 Consultez `API_KEYS_SETUP.md` pour plus de détails

## 🆘 Dépannage

### Erreur "API key not valid"
- Vérifiez que la clé Gemini est correcte
- Assurez-vous que l'API est activée dans Google Cloud Console

### Erreur "Could not load default credentials"
- Vérifiez que les clés Firebase Admin sont correctes
- Assurez-vous que le fichier `.env.local` est dans le bon répertoire

### Erreur "Firebase project not found"
- Vérifiez que le `FIREBASE_PROJECT_ID` correspond à votre projet
- Assurez-vous que le projet Firebase existe et est actif

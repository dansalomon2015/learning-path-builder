# Configuration des API Keys pour FlashLearn AI

## 🔑 API Keys Requises

Pour que FlashLearn AI fonctionne complètement, vous devez configurer les API keys suivantes :

### 1. Firebase (Backend)
Ajoutez ces variables dans `packages/backend/.env.local` :

```bash
# Firebase Admin SDK
FIREBASE_PROJECT_ID=votre-project-id
FIREBASE_PRIVATE_KEY_ID=votre-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nvotre-private-key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=votre-client-email@votre-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=votre-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
```

### 2. Gemini AI (Backend)
Ajoutez dans `packages/backend/.env.local` :

```bash
# Gemini AI API
GEMINI_API_KEY=votre-gemini-api-key
```

### 3. Firebase (Frontend)
Ajoutez dans `packages/frontend/.env.local` :

```bash
# Firebase Client SDK
FIREBASE_API_KEY=votre-firebase-api-key
FIREBASE_AUTH_DOMAIN=votre-project.firebaseapp.com
FIREBASE_PROJECT_ID=votre-project-id
FIREBASE_STORAGE_BUCKET=votre-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=votre-messaging-sender-id
FIREBASE_APP_ID=votre-firebase-app-id
FIREBASE_MEASUREMENT_ID=votre-measurement-id
```

## 📋 Comment Obtenir les API Keys

### Firebase
1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Créez un projet ou sélectionnez un projet existant
3. **Pour le Frontend** : Allez dans "Project Settings" > "General" > "Your apps" > "Web app"
4. **Pour le Backend** : Allez dans "Project Settings" > "Service accounts" > "Generate new private key"

### Gemini AI
1. Allez sur [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Cliquez sur "Create API Key"
3. Copiez la clé générée

## ✅ Vérification

Après avoir configuré les API keys :

1. **Backend** : `curl http://localhost:3000/health`
   - Devrait retourner `"status": "healthy"`

2. **Frontend** : Ouvrez `http://localhost:5175`
   - Devrait charger l'interface FlashLearn AI

## 🚨 Notes Importantes

- ⚠️ **Ne jamais commiter** les fichiers `.env.local`
- 🔒 Les fichiers `.env.local` sont automatiquement ignorés par Git
- 🌐 Pour la production, utilisez les variables d'environnement Cloud Run
- 📝 Consultez `FIREBASE_CONFIG.md` pour plus de détails

## 🎯 Statut Actuel

- ✅ Backend : Fonctionne (port 3000)
- ✅ Frontend : Fonctionne (port 5175)
- ⚠️ Services externes : Nécessitent les API keys pour fonctionner complètement

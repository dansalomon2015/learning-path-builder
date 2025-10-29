#!/bin/bash

# Script d'initialisation pour FlashLearn AI
# Ce script vous aide à configurer les fichiers .env.local

echo "🚀 Configuration de FlashLearn AI"
echo "================================="
echo ""

# Vérifier si les fichiers .env.local existent déjà
if [ -f "packages/backend/.env.local" ]; then
    echo "⚠️  Le fichier packages/backend/.env.local existe déjà"
    read -p "Voulez-vous le remplacer ? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Configuration annulée"
        exit 0
    fi
fi

if [ -f "packages/frontend/.env.local" ]; then
    echo "⚠️  Le fichier packages/frontend/.env.local existe déjà"
    read -p "Voulez-vous le remplacer ? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Configuration annulée"
        exit 0
    fi
fi

echo "📋 Veuillez suivre le guide FIREBASE_SETUP_GUIDE.md pour obtenir vos clés API"
echo ""

# Demander les informations Firebase
echo "🔑 Configuration Firebase Backend (Admin SDK)"
read -p "Firebase Project ID: " FIREBASE_PROJECT_ID
read -p "Firebase Private Key ID: " FIREBASE_PRIVATE_KEY_ID
read -p "Firebase Client Email: " FIREBASE_CLIENT_EMAIL
read -p "Firebase Client ID: " FIREBASE_CLIENT_ID

echo ""
echo "🤖 Configuration Gemini AI"
read -p "Gemini API Key: " GEMINI_API_KEY

echo ""
echo "🔑 Configuration Firebase Frontend (Client SDK)"
read -p "Firebase API Key: " FIREBASE_API_KEY
read -p "Firebase Auth Domain: " FIREBASE_AUTH_DOMAIN
read -p "Firebase Storage Bucket: " FIREBASE_STORAGE_BUCKET
read -p "Firebase Messaging Sender ID: " FIREBASE_MESSAGING_SENDER_ID
read -p "Firebase App ID: " FIREBASE_APP_ID

# Créer le fichier .env.local pour le backend
cat > packages/backend/.env.local << EOF
# Configuration de développement pour FlashLearn AI Backend
# Généré automatiquement le $(date)

# Firebase Admin SDK
FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID
FIREBASE_PRIVATE_KEY_ID=$FIREBASE_PRIVATE_KEY_ID
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=$FIREBASE_CLIENT_EMAIL
FIREBASE_CLIENT_ID=$FIREBASE_CLIENT_ID
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token

# Gemini AI
GEMINI_API_KEY=$GEMINI_API_KEY

# Configuration du serveur
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5175

# Configuration des fichiers
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Clés de sécurité
ENCRYPTION_KEY=dev-encryption-key-32-chars-long
JWT_SECRET=dev-jwt-secret-key-here

# Monitoring
ENABLE_MONITORING=true
EOF

# Créer le fichier .env.local pour le frontend
cat > packages/frontend/.env.local << EOF
# Configuration de développement pour FlashLearn AI Frontend
# Généré automatiquement le $(date)

# Firebase Client SDK
FIREBASE_API_KEY=$FIREBASE_API_KEY
FIREBASE_AUTH_DOMAIN=$FIREBASE_AUTH_DOMAIN
FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID
FIREBASE_STORAGE_BUCKET=$FIREBASE_STORAGE_BUCKET
FIREBASE_MESSAGING_SENDER_ID=$FIREBASE_MESSAGING_SENDER_ID
FIREBASE_APP_ID=$FIREBASE_APP_ID
FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Configuration de l'app
VITE_APP_NAME=FlashLearn AI
VITE_APP_VERSION=1.0.0
VITE_NODE_ENV=development
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG=true
EOF

echo ""
echo "✅ Fichiers .env.local créés avec succès !"
echo ""
echo "⚠️  IMPORTANT: Vous devez encore :"
echo "   1. Remplacer 'YOUR_PRIVATE_KEY_HERE' par votre vraie clé privée Firebase"
echo "   2. Redémarrer les services : npm run dev"
echo ""
echo "📖 Consultez FIREBASE_SETUP_GUIDE.md pour plus de détails"
echo ""
echo "🚀 Pour tester la configuration :"
echo "   npm run dev:backend"
echo "   curl http://localhost:3000/health"

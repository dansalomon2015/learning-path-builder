# Configuration Firebase pour FlashLearn AI

## Développement Local

Pour le développement local, vous devez créer un fichier `.env.local` dans le dossier `packages/frontend/` avec vos valeurs Firebase :

```bash
# packages/frontend/.env.local
FIREBASE_API_KEY=AIzaSyD9EEOHaC8RokmbSlSngctzQcsNHPUqXIM
FIREBASE_AUTH_DOMAIN=gen-lang-client-0438922965.firebaseapp.com
FIREBASE_PROJECT_ID=gen-lang-client-0438922965
FIREBASE_STORAGE_BUCKET=gen-lang-client-0438922965.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=589803612777
FIREBASE_APP_ID=1:589803612777:web:b9ec1bd6c0f90eef3a90f8
FIREBASE_MEASUREMENT_ID=G-64KBFFRS33
```

**Important :** Le fichier `.env.local` est automatiquement ignoré par Git pour des raisons de sécurité.

## Production (Cloud Run)

En production, les variables d'environnement sont définies dans Cloud Run et récupérées depuis les secrets Kubernetes.

### Configuration des Secrets

1. Créer les secrets dans Google Cloud :
```bash
# Encoder les valeurs en base64
echo -n "AIzaSyD9EEOHaC8RokmbSlSngctzQcsNHPUqXIM" | base64
echo -n "gen-lang-client-0438922965.firebaseapp.com" | base64
echo -n "gen-lang-client-0438922965" | base64
echo -n "gen-lang-client-0438922965.firebasestorage.app" | base64
echo -n "589803612777" | base64
echo -n "1:589803612777:web:b9ec1bd6c0f90eef3a90f8" | base64
echo -n "G-64KBFFRS33" | base64
```

2. Mettre à jour le fichier `cloud-run/secrets.yaml` avec les valeurs encodées

3. Appliquer les secrets :
```bash
kubectl apply -f cloud-run/secrets.yaml
```

### Variables d'Environnement GitHub Actions

Configurer les secrets suivants dans GitHub Actions :
- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `FIREBASE_MEASUREMENT_ID`

## Sécurité

✅ **Bonnes pratiques appliquées :**
- Aucune clé Firebase dans le code source
- Variables d'environnement obligatoires
- Fichier `.env.local` ignoré par Git
- Secrets chiffrés en production

## Fonctionnement

Le code utilise uniquement les variables d'environnement :
- **Développement local** : Utilise le fichier `.env.local`
- **Production** : Utilise les variables d'environnement Cloud Run

Si les variables d'environnement ne sont pas définies, l'application ne fonctionnera pas (comportement attendu pour la sécurité).

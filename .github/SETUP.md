# 🚀 Configuration GitHub Actions pour Cloud Run

## ✅ Vérification des Workflows

Les workflows GitHub Actions ont été créés et peuvent :
- ✅ **Provisionner** les services Cloud Run (via `provision.yml`)
- ✅ **Gérer les déploiements automatiques** (via `deploy.yml`)
- ✅ **Exécuter les tests** (via `ci.yml`)

## 📋 Checklist de Configuration

### Étape 1: Créer un Service Account GCP

1. Aller dans Google Cloud Console > IAM & Admin > Service Accounts
2. Créer un nouveau service account (ex: `github-actions`)
3. Attacher les rôles suivants:
   - `Cloud Run Admin` (pour déployer les services)
   - `Service Account User` (pour utiliser le service account Cloud Run)
   - `Secret Manager Secret Accessor` (pour accéder aux secrets)
   - `Storage Admin` (pour push vers Container Registry)
   - `Service Usage Admin` (pour activer les APIs)

4. Créer une clé JSON:
   ```bash
   gcloud iam service-accounts keys create key.json \
     --iam-account=github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com
   ```

### Étape 2: Configurer les Secrets GitHub

Aller dans GitHub > Settings > Secrets and variables > Actions

Ajouter les secrets suivants:

1. **`GCP_SA_KEY`**: Contenu complet du fichier `key.json` créé à l'étape 1
2. **`GCP_PROJECT_ID`**: Votre ID de projet GCP (ex: `flashlearn-ai`)
3. **`GCP_REGION`**: Région GCP (optionnel, défaut: `us-central1`)

### Étape 3: Configurer Secret Manager (Important!)

Les secrets Firebase et Gemini doivent être stockés dans Google Cloud Secret Manager au format JSON.

#### Créer le secret Firebase

```bash
# Créer un fichier firebase-config.json
cat > firebase-config.json << EOF
{
  "project_id": "gen-lang-client-0438922965",
  "api_key": "AIzaSyD9EEOHaC8RokmbSlSngctzQcsNHPUqXIM",
  "auth_domain": "gen-lang-client-0438922965.firebaseapp.com",
  "storage_bucket": "gen-lang-client-0438922965.firebasestorage.app",
  "messaging_sender_id": "589803612777",
  "app_id": "1:589803612777:web:b9ec1bd6c0f90eef3a90f8",
  "measurement_id": "G-64KBFFRS33"
}
EOF

# Créer le secret dans Secret Manager
gcloud secrets create firebase-config \
  --replication-policy="automatic" \
  --project=YOUR_PROJECT_ID

# Ajouter la version
cat firebase-config.json | gcloud secrets versions add firebase-config \
  --data-file=- \
  --project=YOUR_PROJECT_ID

# Nettoyer (optionnel)
rm firebase-config.json
```

#### Créer le secret Gemini

```bash
# Créer un fichier gemini-config.json
cat > gemini-config.json << EOF
{
  "api_key": "YOUR_GEMINI_API_KEY_HERE"
}
EOF

# Créer le secret dans Secret Manager
gcloud secrets create gemini-config \
  --replication-policy="automatic" \
  --project=YOUR_PROJECT_ID

# Ajouter la version
cat gemini-config.json | gcloud secrets versions add gemini-config \
  --data-file=- \
  --project=YOUR_PROJECT_ID

# Nettoyer (optionnel)
rm gemini-config.json
```

#### Accorder les permissions

```bash
# Obtenir le numéro de projet
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)")

# Accorder l'accès au service account Cloud Run
gcloud secrets add-iam-policy-binding firebase-config \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=YOUR_PROJECT_ID

gcloud secrets add-iam-policy-binding gemini-config \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=YOUR_PROJECT_ID
```

### Étape 4: Provisioning Initial (Optionnel)

Si vous voulez créer les services Cloud Run avant le premier déploiement:

1. Aller dans GitHub > Actions
2. Sélectionner "Provision Cloud Run Services"
3. Cliquer sur "Run workflow"
4. Fournir le Project ID

⚠️ **Note**: Cette étape n'est pas obligatoire car le workflow `deploy.yml` créera automatiquement les services s'ils n'existent pas.

### Étape 5: Premier Déploiement

Option 1: Déploiement automatique (recommandé)
```bash
git push origin main
```

Option 2: Déploiement manuel
1. Aller dans GitHub > Actions
2. Sélectionner "Deploy to Cloud Run"
3. Cliquer sur "Run workflow"
4. Choisir "both" pour déployer backend et frontend
5. Cliquer sur "Run workflow"

## 🔍 Vérification

Après le déploiement, vérifiez que tout fonctionne:

```bash
# Lister les services
gcloud run services list --region=us-central1

# Vérifier les logs du backend
gcloud run services logs read flashlearn-ai-backend --region=us-central1 --limit=50

# Tester le endpoint de santé
curl https://flashlearn-ai-backend-XXXXX.a.run.app/health

# Vérifier le frontend
curl -I https://flashlearn-ai-frontend-XXXXX.a.run.app
```

## 🐛 Dépannage

### Erreur: "Permission denied on secret"
- Vérifier que les permissions IAM sont bien configurées
- Vérifier que le service account Cloud Run a accès aux secrets

### Erreur: "Secret not found"
- Vérifier que les secrets existent: `gcloud secrets list`
- Vérifier les noms: doivent être exactement `firebase-config` et `gemini-config`

### Erreur: "Image not found"
- Vérifier que les images sont dans GCR: `gcloud container images list`
- Vérifier que le PROJECT_ID est correct

### Les services ne se déploient pas
- Vérifier les logs du workflow GitHub Actions
- Vérifier que toutes les APIs sont activées
- Vérifier les permissions du service account

## 📚 Ressources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)
- [Workflows README](./workflows/README.md)


# GitHub Actions Workflows - Guide de Configuration

Ce dossier contient les workflows GitHub Actions pour automatiser le déploiement sur Google Cloud Run.

## 📋 Workflows Disponibles

### 1. `ci.yml` - Tests et Linting
**Déclenchement:** Automatique sur chaque Pull Request et push vers `main`
- Lint backend et frontend
- Exécute les tests
- Build les projets pour vérifier la compilation

### 2. `provision.yml` - Provisioning Initial
**Déclenchement:** Manuel (workflow_dispatch)
- Active les APIs Google Cloud nécessaires
- Crée les secrets dans Secret Manager
- Provisionne les services Cloud Run (backend et frontend)
- Configure les permissions IAM

**Utilisation:**
1. Aller dans l'onglet "Actions" de GitHub
2. Sélectionner "Provision Cloud Run Services"
3. Cliquer sur "Run workflow"
4. Fournir le Project ID GCP

### 3. `deploy.yml` - Déploiement Automatique
**Déclenchement:** 
- Automatique sur push vers `main`
- Manuel avec sélection du service (backend, frontend, ou both)

**Actions:**
- Build les images Docker
- Push vers Google Container Registry (GCR)
- Déploie sur Cloud Run
- Configure les variables d'environnement et secrets

## 🔐 Configuration des Secrets GitHub

Vous devez configurer les secrets suivants dans GitHub (Settings > Secrets and variables > Actions):

### Secrets Requis

#### 1. GCP Authentication
- `GCP_SA_KEY`: Clé JSON du service account Google Cloud (complète)
  - Créer un service account avec les rôles:
    - `Cloud Run Admin`
    - `Service Account User`
    - `Secret Manager Secret Accessor`
    - `Storage Admin` (pour GCR)

#### 2. GCP Configuration
- `GCP_PROJECT_ID`: ID de votre projet GCP (ex: `flashlearn-ai`)
- `GCP_REGION`: Région GCP (optionnel, défaut: `us-central1`)

### Configuration des Secrets dans Secret Manager

Les secrets Firebase et Gemini doivent être stockés dans Google Cloud Secret Manager:

#### Firebase Config
```bash
# Créer un fichier firebase-config.json avec la structure:
{
  "project_id": "your-project-id",
  "api_key": "your-api-key",
  "auth_domain": "your-project.firebaseapp.com",
  "storage_bucket": "your-project.appspot.com",
  "messaging_sender_id": "123456789",
  "app_id": "1:123456789:web:xxxxx",
  "measurement_id": "G-XXXXXXXXXX"
}

# Créer le secret dans GCP
gcloud secrets create firebase-config \
  --replication-policy="automatic" \
  --project=YOUR_PROJECT_ID

# Ajouter la version
cat firebase-config.json | gcloud secrets versions add firebase-config \
  --data-file=- \
  --project=YOUR_PROJECT_ID
```

#### Gemini Config
```bash
# Créer un fichier gemini-config.json
{
  "api_key": "your-gemini-api-key"
}

# Créer le secret dans GCP
gcloud secrets create gemini-config \
  --replication-policy="automatic" \
  --project=YOUR_PROJECT_ID

# Ajouter la version
cat gemini-config.json | gcloud secrets versions add gemini-config \
  --data-file=- \
  --project=YOUR_PROJECT_ID
```

## 🚀 Déploiement Automatique

### Déploiement Automatique sur Push

Lorsque vous poussez du code vers `main`, le workflow `deploy.yml` se déclenche automatiquement:

1. ✅ Build du backend
2. ✅ Build et push de l'image Docker backend
3. ✅ Déploiement du backend sur Cloud Run
4. ✅ Build du frontend (avec l'URL du backend)
5. ✅ Build et push de l'image Docker frontend
6. ✅ Déploiement du frontend sur Cloud Run

### Déploiement Manuel

Pour déployer manuellement un service spécifique:

1. Aller dans l'onglet "Actions"
2. Sélectionner "Deploy to Cloud Run"
3. Cliquer sur "Run workflow"
4. Choisir le service (backend, frontend, ou both)
5. Cliquer sur "Run workflow"

## 📝 Ordre de Déploiement Initial

### Étape 1: Provisioning Initial (une seule fois)
```bash
# Via GitHub Actions UI:
Actions > Provision Cloud Run Services > Run workflow
```

Ou manuellement:
```bash
# Activer les APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com

# Créer les secrets (voir section ci-dessus)
# Provisionner les services (optionnel, le workflow deploy les créera)
```

### Étape 2: Premier Déploiement
```bash
# Via GitHub Actions UI:
Actions > Deploy to Cloud Run > Run workflow > both
```

Ou via push:
```bash
git push origin main
```

## 🔍 Vérification du Déploiement

Après le déploiement, vous pouvez vérifier:

```bash
# Lister les services Cloud Run
gcloud run services list --region=us-central1

# Voir les logs du backend
gcloud run services logs read flashlearn-ai-backend --region=us-central1

# Voir les logs du frontend
gcloud run services logs read flashlearn-ai-frontend --region=us-central1

# Vérifier la santé du backend
curl https://flashlearn-ai-backend-XXXXX.a.run.app/health
```

## 🔧 Dépannage

### Erreur: "Permission denied"
- Vérifier que le service account a les rôles nécessaires
- Vérifier que les APIs sont activées

### Erreur: "Secret not found"
- Vérifier que les secrets existent dans Secret Manager
- Vérifier que les noms correspondent (firebase-config, gemini-config)
- Vérifier les permissions IAM sur les secrets

### Erreur: "Image not found"
- Vérifier que les images sont bien poussées dans GCR
- Vérifier que le PROJECT_ID est correct

### Les services ne se mettent pas à jour
- Vérifier que le workflow s'est bien exécuté
- Vérifier les logs du workflow GitHub Actions
- Forcer un nouveau déploiement via l'interface GitHub Actions

## 📚 Ressources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)


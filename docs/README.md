# Documentation Content OS

Bienvenue dans le centre de documentation de Content OS. Ce dossier est organisé par catégories pour faciliter la gestion de la plateforme.

## 📁 Catégories

### 🚀 [Déploiement](./deployment/DEPLOYMENT.md)
Instructions pour le déploiement sur Railway, configuration de l'infrastructure et de la base de données de production.

### 🔌 [Intégrations](./integrations/INTEGRATIONS.md)
Guide complet pour configurer Firebase, Claude AI, Google Drive, YouTube et Metricool.

### 💻 [Application Desktop (Electron)](./electron/EXE_FEATURES.md)
Stratégie et roadmap pour les fonctionnalités spécifiques à la version Windows (.exe).

### 📝 [Projet & Roadmap](./Content%20OS.md)
Vue d'ensemble de l'architecture, du plan de production et de la validation end-to-end.

---

## 🛠️ Scripts d'Automatisation (Dossier /scripts)

Des scripts PowerShell sont disponibles pour simplifier le développement local :

- `.\scripts\test-local.ps1` : Lance l'application localement (avec option Docker `-Docker`).
- `.\scripts\e2e-test.ps1` : Exécute la suite de tests Playwright complète.
- `.\scripts\clean-system.ps1` : Réinitialisation complète (nettoyage node_modules, cache, et réinstallation).

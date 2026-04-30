# Content OS — Electron & .EXE Features Strategy

Ce document détaille les fonctionnalités spécifiques à l'application de bureau (.exe) pour Windows, visant à offrir une expérience supérieure à la version web.

## 🛠️ Fonctionnalités Native .EXE (Roadmap)

### 1. Système de Tray (Zone de notification)
- **Objectif** : Garder Content OS actif en arrière-plan pour les téléchargements de vidéos longs.
- **Détails** : Ajouter une icône dans la barre des tâches avec un menu contextuel (Ouvrir, Pause Uploads, Quitter).

### 2. Notifications Natives Windows
- **Objectif** : Alerter l'utilisateur quand un rendu de clip est terminé ou qu'une analyse IA est prête.
- **API** : Utiliser `electron-notifications` ou l'API Notification native d'Electron.

### 3. Accès au Système de Fichiers Local
- **Objectif** : Permettre l'importation de dossiers entiers de "Rushes" sans passer par le sélecteur de fichiers du navigateur.
- **Détails** : Utiliser `dialog.showOpenDialog` avec `properties: ['openDirectory']`.

### 4. Raccourcis Clavier Globaux
- **Objectif** : Lancer un enregistrement rapide ou capturer une idée sans que l'application soit au premier plan.
- **API** : `globalShortcut` d'Electron.

### 5. Auto-Launch (Démarrage Automatique)
- **Objectif** : Lancer l'application au démarrage de Windows.
- **Package** : `auto-launch`.

---

## 🏗️ Architecture Electron

### IPC (Inter-Process Communication)
Pour que le frontend (React) communique avec le système Windows :
1. Définir des handlers dans `electron/main.cjs` via `ipcMain.handle()`.
2. Exposer des ponts sécurisés dans `electron/preload.cjs` via `contextBridge.exposeInMainWorld()`.

### Détection de l'Environnement
Le frontend peut détecter s'il tourne dans l'EXE via :
```javascript
const isElectron = navigator.userAgent.includes('ContentOS-Electron');
```

---

## 📦 Packaging (Build EXE)

Pour générer l'installateur Windows :
1. `npm run electron:build`
2. Les fichiers seront générés dans le dossier `dist_electron/`.
3. Configuration dans `package.json` sous la clé `"build"` (electron-builder).

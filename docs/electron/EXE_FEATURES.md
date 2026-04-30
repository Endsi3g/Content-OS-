# Content OS — Electron Desktop App (.EXE)

> Ce document couvre l'architecture, les fonctionnalités implémentées, et la roadmap du client desktop.

---

## ✅ Fonctionnalités Implémentées

### 1. Système de Tray (Zone de notification)
- L'application se minimise dans la barre des tâches au lieu de se fermer.
- Menu contextuel : **Ouvrir**, **Notifications** (toggle), **Paramètres**, **Quitter**.
- Double-clic sur l'icône tray → ramène la fenêtre au premier plan.
- **Fichier** : `electron/main.cjs` → `createTray()`

### 2. Notifications Natives Windows
- Toast notifications Windows 10/11 via l'API `Notification` d'Electron.
- Déclenchées automatiquement quand l'app passe en arrière-plan.
- Accessibles depuis React via `useElectron().sendNotification(title, body)`.
- **Fichier** : `electron/main.cjs` → `showTrayNotification()`

### 3. Accès au Système de Fichiers Local
- Import de dossiers complets de rushes via `dialog.showOpenDialog({ openDirectory })`.
- Import multi-fichiers vidéo (MP4, MOV, AVI, MKV, WebM).
- Accessible depuis React via `useElectron().openFolder()` et `useElectron().openVideoFiles()`.
- **Fichier** : `electron/main.cjs` → IPC `dialog:openFolder` et `dialog:openFiles`

### 4. Raccourcis Clavier Globaux
Fonctionnent même quand l'application n'est pas au premier plan :

| Raccourci | Action |
|:---|:---|
| `Ctrl+Shift+Space` | Afficher / masquer Content OS |
| `Ctrl+Shift+N` | Nouveau script (capture rapide) |
| `Ctrl+Shift+U` | Upload rapide de vidéo |

- **Fichier** : `electron/main.cjs` → `registerShortcuts()`

### 5. Auto-Launch (Démarrage Automatique)
- L'application peut se lancer automatiquement au démarrage de Windows.
- Activable/désactivable depuis React via `useElectron().setAutoLaunch(true/false)`.
- Utilise le package `auto-launch`.

---

## 🏗️ Architecture

### Processus Electron
```
┌─────────────────────────────────────────────┐
│           Main Process (main.cjs)           │
│  Tray • Shortcuts • Notifications • IPC     │
└──────────────────┬──────────────────────────┘
                   │ contextBridge (preload.cjs)
┌──────────────────▼──────────────────────────┐
│         Renderer Process (React App)         │
│  useElectron() hook pour accès aux APIs      │
└─────────────────────────────────────────────┘
```

### Fichiers Clés
| Fichier | Rôle |
|:---|:---|
| `electron/main.cjs` | Processus principal : fenêtre, tray, raccourcis, IPC |
| `electron/preload.cjs` | Pont sécurisé entre Node.js et le navigateur |
| `src/hooks/useElectron.ts` | Hook React avec fallback automatique pour le web |

### Détection de l'Environnement
Le frontend détecte l'EXE via le User-Agent :
```typescript
import { useElectron } from '@/src/hooks/useElectron';
const { isElectron } = useElectron();
// isElectron === true  → dans le .exe
// isElectron === false → dans le navigateur web
```

### API IPC Disponibles (`window.electronAPI`)

| Méthode | Retour | Description |
|:---|:---|:---|
| `openFolder()` | `Promise<string \| null>` | Ouvre un sélecteur de dossier natif |
| `openVideoFiles(filters?)` | `Promise<string[]>` | Ouvre un sélecteur multi-fichiers |
| `sendNotification(title, body)` | `Promise<void>` | Envoie une notification Windows |
| `getAutoLaunch()` | `Promise<boolean>` | Vérifie l'état de l'auto-launch |
| `setAutoLaunch(enabled)` | `Promise<boolean>` | Active/désactive l'auto-launch |
| `openExternal(url)` | `void` | Ouvre un lien dans le navigateur système |
| `getVersion()` | `Promise<string>` | Version de l'application |
| `onNavigate(callback)` | `void` | Écoute les événements de navigation (tray/shortcuts) |

---

## 📦 Build & Packaging

### Commandes
```bash
# Développement (lance Vite + Electron en parallèle)
npm run electron:dev

# Preview de la version production
npm run electron:preview

# Build de l'installateur Windows (.exe)
npm run electron:build
```

### Configuration (package.json → `build`)
- **Format** : NSIS installer (Windows), DMG (macOS), AppImage (Linux)
- **Sortie** : Dossier `dist_electron/`
- **Options NSIS** : Installation personnalisable, raccourcis Bureau + Menu Démarrer

### Icônes Requises
Placer dans le dossier `electron/` :
- `icon.ico` (Windows — 256×256 min)
- `icon.icns` (macOS)
- `icon.png` (Linux — 512×512)
- `tray-icon.png` (Icône tray — 16×16 ou 32×32)

---

## 🔮 Roadmap Future (EXE-Only)

### Phase 2 — Fonctionnalités Avancées
- [ ] **Drag & Drop natif** : Glisser des fichiers depuis l'Explorateur Windows directement dans l'app.
- [ ] **Rendu vidéo local** : Utiliser FFmpeg embarqué pour le montage de clips sans serveur.
- [ ] **Mode hors-ligne** : Cache local des scripts et projets avec synchronisation au retour en ligne.
- [ ] **Capture d'écran** : Enregistrement natif de l'écran via `desktopCapturer`.
- [ ] **Deep Links** : Ouvrir `contentos://script/123` depuis un lien externe.

### Phase 3 — Distribution
- [ ] **Auto-Update** : Mise à jour automatique via `electron-updater` + GitHub Releases.
- [ ] **Code Signing** : Certificat Windows pour éviter les avertissements SmartScreen.
- [ ] **Crash Reports** : Intégration Sentry pour le monitoring du client desktop.

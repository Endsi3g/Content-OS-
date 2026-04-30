# Content OS — Architecture & Plan de Production

**Objectif :** Finaliser la plateforme en rendant fonctionnels en production les 3 piliers critiques de l'application :
1. **Workspaces** (Espaces de travail dynamiques et persistants)
2. **Gestion des Rôles & RBAC** (Contrôle d'accès rigoureux)
3. **Multijoueur Temps Réel** (Édition collaborative sécurisée et persistante)

---

## 🏗️ Phase 1 — Base de Données & Schéma Prisma

- **WorkspaceMember** : Changement du rôle par défaut de `@default("member")` vers `@default("viewer")`.
- **CustomRole** : Ajout du modèle pour gérer les rôles personnalisés (id, workspaceId, name, allowedViews: JSON, etc.).
- **YjsDocument** : Confirmation de la structure pour la persistance d'états binaires (`state Bytes`).
- **Migration** : Exécution de `npx prisma migrate dev --name "custom-roles-fix-defaults"`.

---

## 🔒 Phase 2 — Sécurité Backend (RBAC)

1. **Middleware Auth (`middleware/auth.ts`)** : 
   - Suppression du mode bypass de développement. Si `NODE_ENV=production` et qu'aucune credential Firebase n'est fournie, retourne HTTP 503.
2. **Démarrage Serveur (`server.ts`)** :
   - Validation stricte des variables Firebase (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`). Crash du serveur (`process.exit(1)`) si manquantes.
3. **Endpoints Utilisateurs** :
   - `GET /users` : Restreint l'affichage aux membres des mêmes workspaces (via `getUserWorkspaceIds`). Les administrateurs globaux voient tout le monde.
   - `PATCH /users/:id/role` : Restreint aux admins globaux. Ajout de `PATCH /workspaces/:id/members/:userId/role` pour la gestion par espace de travail.
4. **Endpoints Workspaces** :
   - `GET /workspaces` : Remplacement du paramètre query `email` par une extraction sécurisée via `req.dbUser.id`.
   - `POST /workspaces/:id/invite` : L'inviteur est désormais déduit via `req.dbUser.id`, sécurisé par un check admin.
5. **Synchronisation Auth (`/auth/sync`)** : 
   - Définition du rôle initial à `admin` ou `viewer`.

---

## 🏢 Phase 3 — Endpoints Workspaces (Backend)

Implémentation complète du CRUD dans `server.ts` :
- `POST /workspaces` : Crée un espace de travail et ajoute le créateur comme admin.
- `GET /workspaces/:id` : Retourne l'espace de travail et ses membres.
- `DELETE /workspaces/:id` : Supprime l'espace (admin requis).
- `GET /workspaces/:id/members` : Liste les membres.
- `DELETE /workspaces/:id/members/:userId` : Retire un membre.
- `GET /workspaces/:id/invites` & `DELETE /workspaces/:id/invites/:inviteId` : Gestion des invitations en attente.

---

## 🎭 Phase 4 — Rôles Personnalisés (Backend)

Implémentation des rôles personnalisés par workspace :
- `GET /workspaces/:id/custom-roles` : Liste les rôles.
- `POST /workspaces/:id/custom-roles` : Crée un rôle (stocke `allowedViews` en JSON stringifié).
- `PATCH` & `DELETE` : Mise à jour et suppression des rôles personnalisés.

---

## ⚡ Phase 5 — Multijoueur & Temps Réel (Hocuspocus)

Sécurisation de la connexion WebSocket dans `server.ts` :
- **`onAuthenticate`** : Vérifie le token Firebase via `admin.auth().verifyIdToken()`. Valide l'appartenance de l'utilisateur au workspace ciblé (`workspace:<id>` ou `script:<id>`).
- **`onLoadDocument`** : Charge l'état Yjs depuis la base de données.
- **`onStoreDocument`** : Encode et sauvegarde l'état dans la table `YjsDocument`.
- **Note** : La synchronisation du contenu `Script.content` (ProseMirror JSON) vers la DB se fait de façon asynchrone via `PATCH /api/scripts/:id` (debounce de 2s) pour des raisons de performance.

---

## 🖥️ Phase 6 — Hooks et Contexte Auth (Frontend)

- **AuthContext** : Ajout du helper `getWorkspaceRole(workspaceId)` et émission d'un événement global `auth:synced`.
- **useRole** : Refonte totale du hook pour tenir compte de `activeWorkspaceId` et remonter le rôle local (ou global par défaut).
- **Store Zustand** : Suppression des mocks (workspaces, teamMembers) et ajout de la méthode `loadWorkspaces()`.

---

## 🖥️ Phase 7 — Interface Workspaces (Frontend)

- **WorkspaceSwitcher** : Permet la création inline d'un nouvel espace de travail avec appel API direct.
- **AddTeamMemberModal** : Envoi de l'invitation par email via l'API, avec sélection stricte des rôles (viewer / editor / admin).
- **TeamView** : Branchement de la liste des membres sur l'API et implémentation des actions de modification de rôle et d'éviction.

---

## 🖥️ Phase 8 — Interface Multijoueur (Frontend)

- **Scripts.tsx (CollaborativeEditor)** : 
  - Injection du `token` Firebase lors de la connexion WebSocket.
  - Définition de l'identité Awareness (Nom, Couleur unique, Avatar).
  - Mise en place du debounce (2s) sur l'événement `onUpdate` pour la persistance JSON.
- **WorkspacePresence.tsx** : Mise en place de l'indicateur de présence globale de l'espace de travail.

---

## 🖥️ Phase 9 — Rôles Personnalisés (Frontend)

- **ManageRolesModal.tsx** : Branchement au CRUD API. Fusion des rôles systèmes (inéditables) et des rôles customisés. Gestion des mises à jour optimistes (UI-first avec rollback en cas d'échec API).
- **Store** : Mise à jour de `addCustomRole` pour accepter l'identifiant généré par la base de données.

---

## 🧹 Phase 10 — Nettoyage & Finalisation

- **Seed Database** : Limité au mode développement (`if (process.env.NODE_ENV !== 'production')`).
- **Audit des Dropdowns** : Suppression définitive du rôle `member` dans les sélecteurs au profit de `viewer`, `editor` et `admin`.
- **Données Mocks (`data.ts`)** : Maintenues temporairement comme état initial des assets, mais documentées via `TODO` pour suppression future.

---

## 🚦 End-to-End Validation Checklist

| Scénario | Résultat Attendu |
| :--- | :--- |
| **Démarrage sans variables Firebase (Prod)** | Crash `process.exit(1)` et HTTP 503 sur les routes API. |
| **Élévation de privilège illicite** | Une tentative `PATCH` vers un rôle supérieur retourne HTTP 403. |
| **Isolation des Workspaces** | L'appel `GET /users` limite la réponse aux membres des espaces partagés. |
| **Création d'un espace de travail** | Persistance en DB après rechargement de la page. |
| **Invitation par email** | Apparition de l'utilisateur avec le rôle défini dans `TeamView`. |
| **Changement de Workspace** | Le hook `useRole` ajuste dynamiquement les permissions et les actions de l'UI. |
| **Authentification WebSocket** | La connexion Hocuspocus sans token est rejetée. |
| **Collaboration Éditeur Texte** | Curseur affiché avec le vrai nom. Sauvegarde persistée en DB après un rechargement. |

---

*Document généré le 30 Avril 2026 pour le projet Content OS.*

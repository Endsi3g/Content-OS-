import { Asset, Clip, KnowledgeDoc, TeamMember } from './types';

export const mockTeamMembers: TeamMember[] = [
  { id: 'tm-001', name: 'Admin', email: 'admin@example.com', role: 'admin' },
  { id: 'tm-002', name: 'Editor', email: 'editor@example.com', role: 'editor' },
  { id: 'tm-003', name: 'Viewer', email: 'viewer@example.com', role: 'viewer' },
];

export const mockAssets: Asset[] = [
  {
    id: 'ast-001',
    title: 'Q3 Marketing Strategy Keynote',
    client: 'Acme Corp',
    campaign: 'Q3 Thought Leadership',
    status: 'approved',
    duration: '45:20',
    createdAt: '2026-03-28T10:00:00Z',
    order: 0,
  },
  {
    id: 'ast-002',
    title: 'Product Launch Teaser - Raw',
    client: 'Globex',
    campaign: 'Launch 2026',
    status: 'ready_clipping',
    duration: '12:05',
    createdAt: '2026-03-29T14:30:00Z',
    order: 0,
  },
  {
    id: 'ast-003',
    title: 'CEO Interview - Forbes',
    client: 'Acme Corp',
    campaign: 'PR Outreach',
    status: 'processing',
    duration: '28:15',
    createdAt: '2026-03-29T16:45:00Z',
    order: 0,
  },
  {
    id: 'ast-004',
    title: 'Webinar: Future of AI',
    client: 'TechFlow',
    campaign: 'Lead Gen Q1',
    status: 'to_classify',
    duration: '55:00',
    createdAt: '2026-03-30T09:15:00Z',
    order: 0,
  },
  {
    id: 'ast-005',
    title: 'Podcast Ep 42 - Guest Speaker',
    client: 'TechFlow',
    campaign: 'Podcast Shorts',
    status: 'review',
    duration: '62:10',
    createdAt: '2026-03-27T11:20:00Z',
    order: 0,
  },
  {
    id: 'ast-006',
    title: 'Office Tour B-Roll',
    client: 'Globex',
    campaign: 'Employer Branding',
    status: 'inbox',
    duration: '08:45',
    createdAt: '2026-03-30T10:05:00Z',
    order: 0,
  }
];

export const mockClips: Clip[] = [
  {
    id: 'clp-001',
    assetId: 'ast-005',
    title: 'The AI Revolution is Here',
    duration: '00:45',
    status: 'pending',
    hook: 'Why 90% of companies will fail at AI adoption this year.',
    createdAt: '2026-03-30T10:30:00Z',
  },
  {
    id: 'clp-002',
    assetId: 'ast-005',
    title: 'Building Remote Teams',
    duration: '00:58',
    status: 'pending',
    hook: 'The counter-intuitive secret to managing remote engineers.',
    createdAt: '2026-03-30T10:32:00Z',
  },
  {
    id: 'clp-003',
    assetId: 'ast-005',
    title: 'Future of Work Predictions',
    duration: '01:12',
    status: 'approved',
    hook: 'Three jobs that won\'t exist in 2030.',
    createdAt: '2026-03-30T10:35:00Z',
  }
];

export const mockDocs: KnowledgeDoc[] = [
  {
    id: 'doc-onboarding-001',
    title: '🚀 Guide d\'Onboarding Complet (Par Rôle)',
    type: 'sop',
    lastUpdated: new Date().toISOString(),
    content: `
## Bienvenue sur Content OS !
Ce guide vous présente toutes les fonctionnalités de la plateforme, adaptées à votre rôle. 

---

### Si vous êtes : Admin 👑
En tant qu'administrateur, vous avez accès à l'ensemble du système.
* **Overview & Analytics :** Gardez un oeil sur le pipeline complet et les performances.
* **Team & Board Control :** Gérez les rôles, les permissions, et la configuration du board (colonnes, tags).
* **Settings & Billing :** Configurez la marque, les intégrations et l'abonnement.
* **Camera to Cloud (C2C) :** Connectez de nouveaux appareils et gérez le flux en direct lors des tournages.
* **Workflow & Review :** Supervisez la validation et assurez-vous que rien n'est bloqué.

---

### Si vous êtes : Éditeur (Editor) 🎬
Votre mission est de produire, monter et préparer le contenu pour la validation.
* **Video Inbox :** Ingérez les nouveaux rushs et liez-les aux bonnes campagnes.
* **Editor Workspace :** Vous retrouverez un clone de Frame.io pour échanger et réviser précisément sur la timeline avec les clients.
* **Scripts :** Collaborez en direct sur les narrations avec le reste de l'équipe. L'intégration de scripts connectés en temps réel simplifie le workflow !
* **AI Coach :** Faites réécrire vos hooks ou générer de nouvelles idées grâce à l'assistant IA intégré.
* **Presentations :** Créez des galeries de présentation élégantes pour partager vos montages validés avec les clients externes.

---

### Si vous êtes : Viewer (Client / Guest) 👀
Vous êtes ici pour observer, commenter et valider sans vous soucier de la technique.
* **Overview :** Suivez facilement l'avancement global de votre projet.
* **Review :** Validez les hooks texte ou les montages finaux d'un simple clic ("Approve" / "Reject").
* **Presentations :** Accédez directement aux livrables finaux prêts à être téléchargés ou partagés.
* **Knowledge :** Lisez les documents de référence (comme ce guide ou les briefs de marque) pour rester aligné avec l'équipe.

> **Astuce :** Suivez les tooltips interactifs dans le menu de gauche pour une visite guidée de votre espace de travail.
    `
  },
  {
    id: 'doc-sop-000',
    title: 'Content OS: Guide de survie & SOP',
    type: 'sop',
    lastUpdated: new Date().toISOString(),
    content: `
## 1. C'est quoi Content OS ?
Content OS, c'est notre hub central pour gérer toute la prod vidéo. Fini les Google Drive bordéliques et les messages Slack perdus. De l'ingestion des rushs jusqu'à la validation des clips générés par l'IA, tout se passe ici. Fais gaffe à bien suivre ce flow pour pas bloquer la team.

### 2. Les différentes vues (Pipeline)
* **Overview :** Ton dashboard du matin. Commence par là pour voir les stats de A à Z, checker la santé du pipeline et voir s'il y a le feu quelque part (ex: trop de clips en attente de review).
* **Video Inbox :** Le point d'entrée. On drop les rushs ici. Tu dois absolument assigner le bon client et la bonne campagne avant de les envoyer plus loin.
* **Content Database :** La vue master. Tu peux switcher entre la table et le board Kanban pour voir où en sont tous les assets (Inbox, To Classify, Processing, In Review, Approved).
* **Workflow :** Le moteur visuel. C'est ici que tu fais avancer les assets. Quand un asset passe en "Processing", l'IA (Opus Clip) prend le relais pour générer les shorts.
* **Clip Review :** L'interface de validation. Check les clips générés, lis les insights du coach IA (potentiel viral, suggestions de captions), et clique sur Approve ou Reject. Pas de niaisage.
* **Knowledge & SOPs :** La bible. T'y trouves ce doc, les briefs clients et les templates de hooks.

### 3. Ton workflow quotidien
1. **Check l'Overview :** Ouvre l'app, regarde les KPIs. Si t'as 50 clips en "Pending", tu sais par quoi commencer.
2. **Clean l'Inbox :** Va dans Video Inbox, tag les nouveaux rushs et envoie-les au clipping.
3. **Review les clips :** Va dans Clip Review. Valide ou rejette ce que l'IA a sorti cette nuit.
4. **Monitor le Workflow :** Assure-toi que rien n'est bloqué dans les colonnes du Kanban.

> **Best Practice :** Ne laisse jamais un asset sans tag Client/Campaign. C'est le meilleur moyen de fausser les analytics et de foirer la facturation. Si t'as un doute sur un hook, fie-toi aux insights de l'IA, mais garde ton jugement critique d'humain.
    `
  },
  {
    id: 'doc-001',
    title: 'SOP: Opus Clip Ingestion Pipeline',
    type: 'sop',
    lastUpdated: '2026-03-25T08:00:00Z',
    content: `
## 1. Overview
This document outlines the standard operating procedure for ingesting raw video files into the Content OS pipeline and sending them to Opus Clip for processing.

## 2. Pre-requisites
* Raw video file (MP4 or MOV format, max 2GB)
* Client name and campaign tags confirmed with the account manager

## 3. Execution Steps
1. Navigate to the **Video Inbox** via the left sidebar.
2. Drag and drop the raw video file into the upload zone. Wait for the upload to complete.
3. Once uploaded, select the video from the "Needs Classification" list to open the context panel.
4. Assign the correct *Client* and *Campaign*. Ensure spelling matches existing tags.
5. Click the **Send to Opus Clip** button at the bottom of the panel.

> **Critical Note:** Ensure the source video is at least 3 minutes long. Opus Clip's AI requires sufficient context to generate high-performing short-form hooks.
    `
  },
  {
    id: 'doc-002',
    title: 'Client Brief: Acme Corp Q3',
    type: 'brief',
    lastUpdated: '2026-03-28T14:20:00Z',
    content: `
## Brand Voice & Tone
Acme Corp requires a professional, authoritative, yet accessible tone. Avoid overly aggressive marketing jargon. Focus on thought leadership and data-backed insights.

## Visual Guidelines
* **Primary Colors:** Navy Blue (#0A192F) and Slate (#8892B0).
* **Captions:** Use the "Hormozi-style" bold captions, but strictly in the brand's primary colors. No neon yellow or green.
* **B-Roll:** Minimal. Rely on the speaker's delivery. Use B-roll only to cover awkward cuts.
    `
  },
  {
    id: 'doc-003',
    title: 'Template: Viral Hook Structures',
    type: 'template',
    lastUpdated: '2026-03-10T09:15:00Z',
    content: `
## The "Negative Pivot" Hook
Start with a commonly accepted truth, then immediately contradict it.

\`\`\`
"Everyone tells you to [Common Advice], but here is why that will actually destroy your [Goal]."
\`\`\`

## The "Specific Number" Hook
Use highly specific, non-round numbers to build immediate credibility.

\`\`\`
"I analyzed 4,302 viral TikToks last month. Here are the 3 patterns that appeared in 87% of them."
\`\`\`
    `
  },
  {
    id: 'doc-pdf-001',
    title: 'Brand Guidelines 2026 (PDF)',
    type: 'brief',
    lastUpdated: '2026-03-01T10:00:00Z',
    content: 'This is a PDF document preview.',
    fileUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf'
  },
  {
    id: 'doc-docx-001',
    title: 'Q2 Marketing Plan (DOCX)',
    type: 'sop',
    lastUpdated: '2026-03-15T10:00:00Z',
    content: 'This is a DOCX document preview.',
    fileUrl: 'https://calibre-ebook.com/downloads/demos/demo.docx'
  }
];

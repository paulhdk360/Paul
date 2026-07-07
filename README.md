# Enedril — Application de gestion des locations d'outillage

Application web métier pour Enedril (Fishing &amp; Drilling Solutions) : devis,
Tool List, bons de livraison, Service Tickets (Enedril / Opérateur), catalogue
outils, tableau de bord. Reconstruction du workflow Excel (`VF2520FR_Workflow.xlsm`)
sous forme d'un outil serveur multi-utilisateurs, avec authentification et rôles.

## Stack technique

- **Frontend** : Next.js 14 (App Router) + React + Tailwind CSS
- **Backend** : routes/actions serveur Next.js
- **Base de données** : PostgreSQL via [Supabase](https://supabase.com)
- **Authentification** : Supabase Auth (email + mot de passe), rôles
  `admin` / `commercial` / `atelier` / `operateur`
- **Stockage des documents joints** : Supabase Storage (bucket `attachments`)
- **Génération PDF** (devis, BL) : jsPDF + jsPDF-AutoTable, générée dans le
  navigateur au moment du téléchargement
- **Hébergement conseillé** : Vercel (front) + Supabase (BDD, auth, fichiers)

## Mise en route (développement local)

1. Installer les dépendances :
   ```bash
   npm install
   ```
2. Créer un projet sur [supabase.com](https://supabase.com).
3. Dans l'éditeur SQL du projet Supabase, exécuter le contenu de
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
   Cela crée toutes les tables, les rôles, les règles de sécurité (RLS) et le
   bucket de stockage `attachments`.
4. Copier `env.example` vers `.env.local` et renseigner :
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
5. Lancer le serveur de développement :
   ```bash
   npm run dev
   ```
6. Créer le premier compte depuis le tableau de bord Supabase
   (**Authentication → Users → Add user**). Le tout premier compte créé
   devient automatiquement `admin` ; les suivants sont créés en `operateur`
   par défaut — un administrateur change ensuite le rôle de chacun depuis
   **Paramètres**.

## Déploiement (Vercel + Supabase)

1. Pousser ce dépôt sur GitHub (déjà fait, branche `claude/tool-rental-app-a6budh`).
2. Importer le dépôt sur [vercel.com](https://vercel.com).
3. Renseigner `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   dans les variables d'environnement du projet Vercel.
4. Déployer.

## Modèle de fonctionnement

Chaque **affaire** (dossier client/chantier) regroupe :

- un ou plusieurs **devis**, avec des lignes typées (Operation, Stand By,
  Maintenance, Inspection, Restocking, Lost In Hole, Transport, Personnel,
  Serrage) ;
- une **Tool List** générée automatiquement depuis les lignes du devis
  (une ligne par unité physique — ex. 3× Float Sub ⇒ 3 lignes), modifiable
  indépendamment ensuite (ajout, suppression, mise à jour du n° de série, du
  propriétaire, du statut) ;
- des **Bons de Livraison** (autant que nécessaire), auxquels on affecte les
  équipements de la Tool List ;
- un **Service Ticket Enedril** (interne, avec tarifs) : personnel, lignes de
  transport dynamiques, pointage calendrier par équipement/personne
  (MOB / Stand-By / Operation / DEMOB / FIN, jours calculés automatiquement) ;
- la même vue en **Service Ticket Opérateur**, strictement identique mais sans
  aucune donnée commerciale (prix, marges) — c'est la vue envoyée au client ou
  utilisée sur le terrain ;
- des **documents** (fiches techniques, photos, certificats).

Le **catalogue outils** et les **clients** sont gérés indépendamment et
réutilisés dans les devis / la Tool List.

Le **tableau de bord** agrège : pipeline de devis (préparation / envoyé /
accepté / refusé), affaires en cours, CA prévisionnel, disponibilité du
matériel, taux d'utilisation, jours Operation / Stand-By facturés, coûts de
transport.

## Rôles

- **Administrateur** : accès complet, gestion des utilisateurs.
- **Commercial** : clients, devis, Tool Lists, BL.
- **Atelier / Logistique** : Tool Lists, catalogue, BL, préparation matériel,
  Service Tickets.
- **Opérateur** : accès en lecture au Service Ticket Opérateur uniquement
  (jamais aux prix ni aux informations commerciales, y compris au niveau de
  la base de données via RLS).

## Points connus / suite possible

- Le rapprochement automatique numéro de série ↔ fiche catalogue (section 11
  du cahier des charges) n'est pas encore implémenté : le catalogue et la
  Tool List sont saisis indépendamment pour l'instant.
- Le calendrier de pointage est un premier jet fonctionnel (clic pour faire
  défiler MOB → S → O → DEMOB → FIN) ; la mise en forme fine (grisé avant
  MOB / après FIN) est en place, d'autres finitions visuelles restent
  possibles.
- Le PDF du devis et du BL reprend la structure du classeur Excel d'origine
  mais pas sa mise en page pixel pour pixel.

# Football Team Manager

Application de gestion pour clubs et équipes de football américain — MVP
(Priorité 1 du cahier des charges) : clubs, saisons, équipes, joueurs, staff,
rôles, calendrier, disponibilités, présences, convocations.

## Stack technique

- **Frontend** : Next.js 14 (App Router) + React + Tailwind CSS
- **Backend** : Server Actions Next.js
- **Base de données** : PostgreSQL via [Supabase](https://supabase.com), avec
  Row Level Security pour l'isolation des données par club
- **Authentification** : Supabase Auth (email + mot de passe)
- **Hébergement conseillé** : Vercel (front) + Supabase (BDD, auth)

## Mise en route (développement local)

1. Installer les dépendances :
   ```bash
   npm install
   ```
2. Créer un projet sur [supabase.com](https://supabase.com).
3. Dans l'éditeur SQL du projet Supabase, exécuter le contenu de
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
   Cela crée toutes les tables, types, fonctions et policies RLS.
4. Copier `.env.example` vers `.env.local` et renseigner les valeurs trouvées
   dans **Project Settings → API** :
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
5. Lancer le serveur de développement :
   ```bash
   npm run dev
   ```
6. Créer un compte depuis `/signup`, puis créer votre club depuis l'écran
   d'onboarding — vous en devenez automatiquement administrateur.

## Déploiement (Vercel + Supabase)

1. Pousser ce dépôt sur GitHub.
2. Sur [vercel.com](https://vercel.com), importer le dépôt.
3. Renseigner `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   dans les paramètres du projet Vercel.
4. Déployer. Les mises à jour suivantes se feront automatiquement à chaque
   `git push` sur la branche principale.

## Modèle de données

Voir [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
Tables principales : `profiles`, `clubs`, `club_members` (rôle par club),
`seasons`, `teams`, `team_groups`, `players`, `staff_members`,
`calendar_events`, `trainings`, `training_drills`, `availabilities`
(déclarées par les joueurs), `attendances` (constatées par le staff),
`convocations` / `convocation_players`, `notifications`.

Un utilisateur peut appartenir à plusieurs clubs (`club_members`), avec un ou
plusieurs rôles par club. Les données sont isolées par club via des policies
Row Level Security (fonctions `is_club_member` / `is_club_staff`).

## Rôles gérés

`club_admin`, `dirigeant`, `head_coach`, `coach`, `medical`,
`equipment_manager`, `player`, `parent` (voir `lib/types.ts`). Pour le MVP,
les droits d'écriture sur les entités sportives (équipes, joueurs, staff,
calendrier, convocations) sont réservés à `club_admin` / `dirigeant` /
`head_coach` / `coach`. Un affinage plus fin par module (ex : accès limité
d'un coach de position à son groupe, accès restreint du référent santé) est
prévu dans une itération suivante.

## Périmètre couvert par cette première version

- Comptes utilisateurs, clubs, rôles et permissions de base
- Équipes et catégories
- Fiches joueurs et staff
- Calendrier d'événements (entraînement, match, réunion...)
- Disponibilités (déclarées par le joueur) et feuilles de présence (staff)
- Convocations avec réponses des joueurs

## Non couvert dans cette version (voir cahier des charges, phases suivantes)

- Éditeur de playbook animé, statistiques avancées, vidéo, scouting
- SMS (Twilio), notifications push, mode hors-ligne (PWA)
- Gestion fine du matériel et des documents, exports PDF/Excel
- Facturation / cotisations

## Points connus / suite possible

- Notifications : la table `notifications` existe mais aucune UI ni
  déclencheur automatique n'est encore branché (à faire : notifier sur
  nouvelle convocation, changement d'horaire, etc.).
- La création de comptes se fait via `/signup` (auto-inscription). Un écran
  "inviter un membre" pour les administrateurs de club reste à construire.
- Les permissions RLS sont volontairement simples pour le MVP (staff = accès
  large en écriture) ; une segmentation plus fine par rôle/poste est prévue
  au fil des priorités 2-3 du cahier des charges.

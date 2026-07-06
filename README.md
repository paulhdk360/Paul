# Béarn Forage Énergie — Application de pilotage

Application web multi-utilisateurs de pilotage d'activité pour BFE (chantiers,
foreuses, équipes, devis, facturation, achats, maintenance, planning,
statistiques). Reconstruction "professionnelle" du prototype HTML
`bearn-forage-pilotage.html`, avec une vraie base de données serveur,
plusieurs comptes utilisateurs, un hébergement accessible depuis n'importe
quel ordinateur, et une authentification par email / mot de passe.

## Stack technique

- **Frontend** : Next.js 14 (App Router) + React + Tailwind CSS
- **Backend** : routes/API et actions serveur Next.js
- **Base de données** : PostgreSQL via [Supabase](https://supabase.com)
- **Authentification** : Supabase Auth (email + mot de passe), rôles
  `admin` / `user`
- **Stockage des documents joints** : Supabase Storage (bucket `attachments`)
- **Génération PDF des devis** : jsPDF + jsPDF-AutoTable (identique au
  prototype), générée dans le navigateur au moment du téléchargement
- **Hébergement conseillé** : Vercel (front) + Supabase (BDD, auth, fichiers)

## Mise en route (développement local)

1. Installer les dépendances :
   ```bash
   npm install
   ```
2. Créer un projet sur [supabase.com](https://supabase.com) (gratuit pour
   démarrer).
3. Dans l'éditeur SQL du projet Supabase, exécuter le contenu du fichier
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
   Cela crée toutes les tables, les règles de sécurité (RLS) et le bucket de
   stockage `attachments`.
4. Copier `.env.example` vers `.env.local` et renseigner les deux valeurs
   trouvées dans **Project Settings → API** du projet Supabase :
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
5. Lancer le serveur de développement :
   ```bash
   npm run dev
   ```
6. Créer le premier compte utilisateur depuis le tableau de bord Supabase :
   **Authentication → Users → Add user**. Le tout premier compte créé
   devient automatiquement administrateur (les suivants sont créés avec le
   rôle "utilisateur" ; un administrateur peut ensuite changer les rôles
   depuis la page **Paramètres** de l'application).

## Déploiement (Vercel + Supabase)

1. Pousser ce dépôt sur GitHub (déjà fait).
2. Sur [vercel.com](https://vercel.com), importer le dépôt.
3. Renseigner les deux variables d'environnement (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`) dans les paramètres du projet Vercel.
4. Déployer. Les mises à jour suivantes se feront automatiquement à chaque
   `git push` sur la branche principale.
5. Créer les comptes des utilisateurs BFE depuis le tableau de bord Supabase
   (Authentication → Users → Invite user) — c'est la manière la plus simple
   d'administrer les accès sans compétence technique.

## Migration des données du prototype HTML

Si des données ont déjà été saisies dans le prototype `bearn-forage-pilotage.html`
(stockées dans le `localStorage` du navigateur), elles peuvent être migrées :

1. Dans le prototype HTML (ouvert dans le navigateur qui contient les
   données), ouvrir la console développeur et exécuter :
   ```js
   copy(JSON.stringify({
     chantiers: JSON.parse(localStorage.getItem('bfe_chantiers') || '[]'),
     foreuses: JSON.parse(localStorage.getItem('bfe_foreuses') || '[]'),
     equipes: JSON.parse(localStorage.getItem('bfe_equipes') || '[]'),
     devis: JSON.parse(localStorage.getItem('bfe_devis') || '[]'),
     factures: JSON.parse(localStorage.getItem('bfe_factures') || '[]'),
     achats: JSON.parse(localStorage.getItem('bfe_achats') || '[]'),
     maintenances: JSON.parse(localStorage.getItem('bfe_maintenances') || '[]'),
     files: JSON.parse(localStorage.getItem('bfe_files') || '[]'),
   }))
   ```
   Le presse-papiers contient alors un export JSON complet.
2. Coller ce contenu dans un fichier `.json`.
3. Dans l'application, aller dans **Paramètres → Importer un fichier JSON du
   prototype** et sélectionner ce fichier.

La page **Paramètres** permet aussi d'**exporter** à tout moment l'ensemble
des données de l'application au format JSON (sauvegarde).

## Modèle de données

Voir [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
pour le détail complet des tables : `chantiers`, `foreuses`, `equipes`,
`devis` (lignes de prestations en JSONB), `factures`, `achats`,
`maintenances`, `attachments` (pièces jointes), `profiles` (rôle
utilisateur). Les relations (foreuse affectée, équipe affectée, chantier
lié…) utilisent des identifiants plutôt que des noms, pour éviter les liens
cassés en cas de renommage.

## Points connus / suite possible

- Le projet cible Next.js 14.2.x (dernière version corrigée de la branche
  14) plutôt que Next.js 15/16, pour rester sur l'API `useFormState` de
  `react-dom` utilisée par les formulaires ; une montée de version vers
  Next 15/16 est possible ultérieurement mais demande d'adapter les
  Server Actions et le typage des `params`/`searchParams`.
- La création de comptes utilisateurs se fait depuis le tableau de bord
  Supabase (pas d'écran "inviter un utilisateur" dans l'app) afin de rester
  simple et de ne pas nécessiter de clé de service exposée côté serveur.

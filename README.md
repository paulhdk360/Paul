# Football Team Manager

Application de gestion pour clubs et équipes de football américain : clubs,
saisons, équipes, joueurs, staff, rôles, calendrier, disponibilités,
présences, convocations, prototype d'animation tactique, analyse vidéo.

## Stack technique

- **Frontend** : Next.js 14 (App Router) + React + Tailwind CSS
- **Backend** : Server Actions Next.js
- **Base de données** : PostgreSQL via [Neon](https://neon.tech)
- **Authentification** : [Auth.js](https://authjs.dev) (Credentials — email +
  mot de passe, haché avec bcrypt, stocké dans la base Neon). Aucun compte
  tiers requis pour l'authentification.
- **Stockage vidéo** : [Cloudflare R2](https://developers.cloudflare.com/r2/)
  (compatible S3), upload direct depuis le navigateur via URL présignée
- **Hébergement conseillé** : Vercel (front) + Neon (BDD) + Cloudflare R2
  (vidéos)

L'autorisation n'est **pas** gérée par des policies base de données (pas de
Row Level Security ici, contrairement à une architecture Supabase) : chaque
action serveur vérifie explicitement les droits de l'utilisateur avant toute
requête, via les helpers de `lib/auth-helpers.ts`
(`requireClubMember`, `requireClubStaff`, `requireClubAdmin`,
`requireOwnPlayer`).

## Mise en route (développement local)

1. Installer les dépendances :
   ```bash
   npm install
   ```
2. Créer un projet sur [neon.tech](https://neon.tech) (gratuit). Récupérer la
   chaîne de connexion (**Connection Details → Connection string**, choisir
   la version "Pooled connection").
3. Exécuter les migrations **dans l'ordre** sur cette base — via la console
   SQL de Neon, ou en local avec `psql` :
   ```bash
   psql "$DATABASE_URL" -f db/migrations/0001_init.sql
   psql "$DATABASE_URL" -f db/migrations/0002_video_analysis.sql
   psql "$DATABASE_URL" -f db/migrations/0003_plays.sql
   psql "$DATABASE_URL" -f db/migrations/0004_matches.sql
   ```
4. Créer un bucket sur [Cloudflare R2](https://dash.cloudflare.com/?to=/:account/r2)
   (gratuit jusqu'à 10 Go), puis un jeton d'API R2 (**Manage R2 API Tokens**,
   type "Object Read & Write", limité à ce bucket). Noter : Account ID,
   Access Key ID, Secret Access Key, nom du bucket.

   ⚠️ **Étape obligatoire, facile à oublier** : configurer le CORS du bucket
   (Bucket → **Settings** → **CORS Policy**), sinon l'upload direct depuis le
   navigateur échoue silencieusement. Exemple de règle :
   ```json
   [
     {
       "AllowedOrigins": ["https://ton-domaine.vercel.app", "http://localhost:3000"],
       "AllowedMethods": ["PUT", "GET", "HEAD"],
       "AllowedHeaders": ["*"],
       "MaxAgeSeconds": 3000
     }
   ]
   ```
5. Copier `.env.example` vers `.env.local` et renseigner :
   ```
   DATABASE_URL=...
   AUTH_SECRET=...          # génère avec: openssl rand -base64 32
   R2_ACCOUNT_ID=...
   R2_ACCESS_KEY_ID=...
   R2_SECRET_ACCESS_KEY=...
   R2_BUCKET_NAME=videos
   ```
6. Lancer le serveur de développement :
   ```bash
   npm run dev
   ```
7. Créer un compte depuis `/signup`, puis créer votre club depuis l'écran
   d'onboarding — vous en devenez automatiquement administrateur.

## Déploiement (Vercel)

1. Pousser ce dépôt sur GitHub.
2. Sur [vercel.com](https://vercel.com), importer le dépôt.
3. Renseigner les mêmes variables d'environnement que ci-dessus
   (`DATABASE_URL`, `AUTH_SECRET`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`,
   `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`) dans les paramètres du projet
   Vercel.
4. Déployer. Les mises à jour suivantes se feront automatiquement à chaque
   `git push` sur la branche principale.

## Modèle de données

Voir [`db/migrations/0001_init.sql`](db/migrations/0001_init.sql),
[`db/migrations/0002_video_analysis.sql`](db/migrations/0002_video_analysis.sql),
[`db/migrations/0003_plays.sql`](db/migrations/0003_plays.sql) et
[`db/migrations/0004_matches.sql`](db/migrations/0004_matches.sql).

Tables principales : `users` (comptes + mot de passe haché), `clubs`,
`club_members` (rôle par club), `seasons`, `teams`, `team_groups`, `players`,
`staff_members`, `calendar_events`, `trainings` / `training_drills` (plan de
séance), `availabilities` (déclarées par les joueurs), `attendances`
(constatées par le staff), `convocations` / `convocation_players`,
`notifications`, `videos` / `video_clips` / `video_clip_players`, `plays` /
`play_positions` (jeux tactiques : formation + 11 joueurs, chacun avec une
route et une consigne), `matches` / `match_player_stats` (feuille de match :
score, adversaire, statistiques individuelles).

Un utilisateur peut appartenir à plusieurs clubs (`club_members`), avec un ou
plusieurs rôles par club.

## Rôles gérés

`club_admin`, `dirigeant`, `head_coach`, `coach`, `medical`,
`equipment_manager`, `player`, `parent` (voir `lib/types.ts`). Les droits
d'écriture sur les entités sportives (équipes, joueurs, staff, calendrier,
convocations, vidéos) sont réservés à `club_admin` / `dirigeant` /
`head_coach` / `coach`. Un affinage plus fin par module (ex : accès limité
d'un coach de position à son groupe, accès restreint du référent santé) est
prévu dans une itération suivante.

## Périmètre couvert par cette version

- Comptes utilisateurs, clubs, rôles et permissions de base
- Équipes et catégories
- Fiches joueurs et staff
- Calendrier d'événements (entraînement, match, réunion...)
- Disponibilités (déclarées par le joueur) et feuilles de présence (staff)
- Convocations avec réponses des joueurs
- Calendrier avec vues Liste, Mois et Année (pastilles colorées par type
  d'événement)
- Plans de séance d'entraînement : liste d'exercices (titre, objectif,
  durée, groupe, responsable, matériel) rattachée à chaque entraînement
- Feuilles de match : adversaire, domicile/extérieur, score, notes, et
  statistiques individuelles par joueur (11 statistiques courantes :
  passes, courses, réceptions, tacles, sacks, interceptions...)
- Tactiques : éditeur complet — 12 formations standards (attaque :
  I-Formation, Shotgun Spread, Singleback, Pistol, Wildcat, Trips, Empty ;
  défense : 4-3, 3-4, Nickel, 46, Dime, Quarters), 11 joueurs animés
  simultanément, "route tree" classique (Slant, Out, In, Post, Corner, Go,
  Curl, Comeback, Screen, Wheel) applicable en un clic puis modifiable
  segment par segment, consigne libre par joueur, sauvegarde en base par
  club (bibliothèque de jeux consultable/modifiable)
- Analyse vidéo : upload de match/entraînement (Cloudflare R2), découpage en
  plays tagués (joueurs, type de jeu, résultat, down/distance)

## Non couvert dans cette version

- Analyse vidéo automatique par IA (suivi des joueurs, reconnaissance de
  formation) — hors de portée d'un développement "maison", c'est le métier de
  solutions dédiées (Hudl, Catapult...)
- Statistiques avancées, scouting
- SMS (Twilio), notifications push, mode hors-ligne (PWA)
- Gestion fine du matériel et des documents, exports PDF/Excel
- Facturation / cotisations

## Points connus / suite possible

- Notifications : la table `notifications` existe mais aucune UI ni
  déclencheur automatique n'est encore branché.
- La création de comptes se fait via `/signup` (auto-inscription). Un écran
  "inviter un membre" pour les administrateurs de club reste à construire.
- Les vérifications de droits sont volontairement simples pour l'instant
  (staff = accès large en écriture) ; une segmentation plus fine par
  rôle/poste est prévue au fil des priorités 2-3 du cahier des charges.
- La liste de joueurs à tagger dans le module vidéo n'est pas encore filtrée
  par équipe.
- Éditeur de tactiques : le repositionnement d'un joueur se fait par
  coordonnées numériques (x/y en yards), pas encore par glisser-déposer sur
  le terrain. Changer de formation réinitialise les 11 joueurs. Les
  consignes défensives (couverture, zone, blitz) sont du texte libre, pas
  liées dynamiquement aux joueurs offensifs d'un autre jeu.
- Les statistiques de match sont saisies manuellement par le staff après
  coup (pas de calcul automatique à partir de la vidéo ou d'un boîtier de
  saisie en direct).
- La refonte visuelle (couleurs) couvre le tableau de bord, la navigation,
  les rôles/statuts et le calendrier ; certaines pages plus anciennes
  restent volontairement sobres, la passe n'a pas été exhaustive partout.
- `next-auth` est utilisé en version 5 (beta) — l'API est stable pour l'usage
  qui en est fait ici (Credentials + JWT), mais à surveiller lors des futures
  mises à jour.
- Le build affiche des avertissements "Node.js API… not supported in the Edge
  Runtime" (bcrypt, jose) car `middleware.ts` charge la config Auth.js
  complète. Sans conséquence en pratique ici : le middleware ne fait que
  vérifier la session (déchiffrement JWT, supporté par le runtime Edge de
  Vercel), il n'appelle jamais `authorize()` (qui utilise bcrypt et tourne
  uniquement côté route API Node). Si un jour ça pose un problème réel en
  production, la solution standard est de séparer la config en
  `auth.config.ts` (léger, utilisé par le middleware) et `auth.ts` (complet,
  utilisé par les routes serveur).

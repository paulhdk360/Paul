-- À exécuter UNE FOIS avant de relancer 0001_init.sql, si celui-ci a déjà
-- été partiellement exécuté (erreur "already exists"). Sans danger : ne
-- supprime que les objets créés par ce projet, pas vos données Supabase
-- internes (auth.users, etc.).

drop policy if exists "attachments storage: suppression authentifiée" on storage.objects;
drop policy if exists "attachments storage: dépôt authentifié" on storage.objects;
drop policy if exists "attachments storage: lecture authentifiée" on storage.objects;

drop table if exists public.attachments cascade;
drop table if exists public.maintenances cascade;
drop table if exists public.achats cascade;
drop table if exists public.factures cascade;
drop table if exists public.devis cascade;
drop table if exists public.chantiers cascade;
drop table if exists public.equipes cascade;
drop table if exists public.foreuses cascade;

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.set_updated_at() cascade;
drop function if exists public.is_admin() cascade;

drop table if exists public.profiles cascade;

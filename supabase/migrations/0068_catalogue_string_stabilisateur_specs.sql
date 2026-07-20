-- String Stabilisateur-specific fields. Reuses modele (Type), diametre (OD
-- Body), connexion/connexion_bas (Conn up/down), profil and rechargement
-- (Profil blade / Rechargement blade — same concepts already used for
-- Junk Mill) and numero_serie — only the fields genuinely new to this
-- family need a column.
alter table catalogue_outils add column non_mag_steel text;
alter table catalogue_outils add column blade text;
alter table catalogue_outils add column od_blades text;
alter table catalogue_outils add column nombre_blade text;
alter table catalogue_outils add column longueur_rechargement_attaques text;
alter table catalogue_outils add column inclinaison_blade text;

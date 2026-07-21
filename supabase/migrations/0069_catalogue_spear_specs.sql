-- Spear-specific fields. Reuses grapple, diametre_interieur (ID),
-- connexion/connexion_bas (Conn up/down), modele (Type) and numero_serie —
-- only the fields genuinely new to this family need a column.
-- reference_associee is shared with Bull Nose Nut ("monté sur S/N" — the
-- reference of the tool it's assembled onto).
alter table catalogue_outils add column nominal_catch_size text;
alter table catalogue_outils add column ca text;
alter table catalogue_outils add column duty_class text;
alter table catalogue_outils add column od_mandrel text;
alter table catalogue_outils add column reference_associee text;

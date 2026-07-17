-- PDM-specific fields: the motor's own numero_serie already exists, but the
-- stator/rotor currently mounted inside it need their own serial numbers
-- captured too (distinct from the Stator/Rotor catalogue entries
-- themselves, which may not exist yet), plus lobe configuration, stage
-- count, and rotor material — all read off the "Lobes (stage)" and "Rotor"
-- columns of the source fleet sheet.
alter table catalogue_outils add column numero_serie_stator text;
alter table catalogue_outils add column numero_serie_rotor text;
alter table catalogue_outils add column lobes text;
alter table catalogue_outils add column stage text;
alter table catalogue_outils add column rotor_matiere text;

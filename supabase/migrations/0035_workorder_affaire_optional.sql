-- Atelier can also open a workorder by hand — preventive maintenance, or
-- prep work on a tool before any job even exists — not only ones
-- auto-generated from a Pointage retour once a BL is fully treated.
-- affaire_id becomes optional to allow a workorder with no affaire at all.
alter table workorders alter column affaire_id drop not null;

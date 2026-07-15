-- nombre_personnel: how many people worked this workorder — combined with
-- the existing heures field and the affaire's atelier_tarif_horaire, this
-- feeds a real atelier labor cost into computeAffaireRentabilite instead of
-- relying only on the manually-entered aggregate atelier_heures.
-- cout_materiel: total € cost of material consumed on this workorder
-- (carbures/inserts/materiel_soudure track quantities, not a price — atelier
-- enters the actual cost here since there's no per-material price list).
alter table workorders add column nombre_personnel integer;
alter table workorders add column cout_materiel numeric;

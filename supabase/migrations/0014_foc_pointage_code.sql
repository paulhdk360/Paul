-- Adds "FOC" (Free Of Charge) as a valid pointage code, alongside the
-- existing MOB/S/O/DEMOB/FIN/LIH cycle. A day pointed FOC is on-site
-- activity that isn't billed — the billing engine already only sums
-- known billable codes (S/MOB/DEMOB for Stand-By, O for Operation), so
-- FOC days are automatically excluded from every total with no further
-- schema change needed.
alter type pointage_code add value if not exists 'FOC';

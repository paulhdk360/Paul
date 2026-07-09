-- Location vs Vente is a decision made once, at affaire creation — it drives
-- which devis template applies to the whole affaire, not something chosen
-- per devis. Move the field there and drop the short-lived devis column.
alter table affaires add column type_transaction text;
alter table devis drop column if exists type_transaction;

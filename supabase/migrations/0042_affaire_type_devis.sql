-- Standard vs Forfait (lump-sum) devis is decided once, at affaire creation,
-- alongside Location/Vente — it drives whether the devis editor shows the
-- "Forfait" tab and template insertion for a Location affaire.
alter table affaires add column type_devis text not null default 'Standard';

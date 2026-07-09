-- Lets a devis be classified by line of business (for the dashboard's CA
-- breakdown) independently of its existing statut workflow.
alter table devis add column type_activite text;
alter table devis add column type_transaction text;

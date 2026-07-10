-- Adds the fields needed for a full "fiche employé": postal address and
-- date of birth (also lays the groundwork for a future birthday reminder,
-- same cron pattern already used for formations/parc matériel expirations).
-- CV, certificats médicaux etc. are handled separately via the existing
-- polymorphic "attachments" table (link_type = 'employes'), no schema
-- change needed there.
alter table employes
  add column adresse text,
  add column date_naissance date;

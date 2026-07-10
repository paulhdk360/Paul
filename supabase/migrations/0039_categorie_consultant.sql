-- New personnel category: consultants sit alongside bureaux/atelier/chantier
-- rather than under one of them. Standalone migration — ALTER TYPE ADD VALUE
-- cannot run in the same transaction as a query referencing the new value.
alter type categorie_personnel add value if not exists 'consultant';

-- Internal-only flag: has the client's purchase order actually come back
-- before shipping the equipment? Never rendered on the devis PDF itself —
-- it's tracked purely for Enedril's own follow-up.
alter table devis add column bon_commande_recu boolean not null default false;

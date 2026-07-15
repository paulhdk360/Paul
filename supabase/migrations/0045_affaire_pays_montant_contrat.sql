-- pays: filterable worksite country, distinct from the client's own
-- registered address/country — a job can run in a different country than
-- where the client company is headquartered.
alter table affaires add column pays text;

-- montant_contrat: manually-set total contract value used as the basis for
-- progress ("avancement") invoicing — kept independent from devis totals
-- since a Forfait, a standard Location, or a Vente all compute their totals
-- very differently, and the user needs to be able to set/correct this
-- figure directly regardless of which devis template was used.
alter table affaires add column montant_contrat numeric;

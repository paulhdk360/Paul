-- Aligns the prospects table on Paul's actual tracking spreadsheet:
-- real statuts (mail/relance/RDV workflow, not a generic sales-cycle one),
-- plus priorité, circuit, ville, marché, dates and intérêt.
alter table prospects drop constraint prospects_statut_check;
alter table prospects add constraint prospects_statut_check
  check (statut in ('À contacter', 'Mail envoyé', 'Relancé', 'Contacté', 'RDV fixé', 'RDV effectué', 'Intéressé', 'Non intéressé', 'À recontacter'));

alter table prospects add column priorite text;
alter table prospects add column circuit text;
alter table prospects add column ville text;
alter table prospects add column marche text;
alter table prospects add column date_envoi_mail date;
alter table prospects add column date_visite date;
alter table prospects add column interet text;

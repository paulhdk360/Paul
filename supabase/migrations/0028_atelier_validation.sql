-- Lets atelier flag that they've finished processing an affaire's returns
-- (Tool List/BL/Pointage retour), which fires a notification to
-- admin/commercial/administratif_logistique so they know it's ready to
-- follow up on — atelier has no visibility into any other part of the
-- affaire to signal this otherwise, since they're locked out of Aperçu.
alter table affaires add column atelier_valide boolean not null default false;

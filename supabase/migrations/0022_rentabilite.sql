-- Profitability ("Rentabilité") tab on the affaire: revenue comes from the
-- devis lines (same convention as the dashboard's CA figures), purchases
-- come from the achats table (already linked via affaire_id), and these two
-- new columns cover the remaining charges the app has no other source for.
-- cout_personnel is a manual entry (no internal wage/day-rate data exists
-- anywhere in the schema — service_ticket_personnel only stores the rate
-- billed to the client). cout_reel on service_ticket_transport captures the
-- real cost paid to the carrier, kept separate from prix_unitaire which is
-- the marked-up price billed to the client.
alter table affaires add column cout_personnel numeric;
alter table service_ticket_transport add column cout_reel numeric;

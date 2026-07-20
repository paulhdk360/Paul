-- Marks a devis as a response to a tender/call for bids, so the dashboard
-- can track how many affaires come through that channel (and eventually a
-- win rate) separately from spontaneous quotes.
alter table devis add column appel_offres boolean not null default false;

-- Serrage as a per-equipment add-on charge (alongside UC/LIH/Inspection/
-- Restocking), independent of the existing standalone "Serrage" devis line
-- type used for services not tied to a specific tool.

alter table devis_lignes add column prix_serrage numeric;

alter table tool_list_items add column prix_serrage numeric;
alter table tool_list_items add column serrage_facture boolean not null default false;

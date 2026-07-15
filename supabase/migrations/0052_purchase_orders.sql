-- Inspection PO: équipements marqués "À inspecter" au pointage retour sont
-- envoyés à une société externe, qui facture ensuite Enedril en référençant
-- ce PO. Un PO reste "Ouvert" et continue de regrouper les outils envoyés en
-- inspection sur une même affaire jusqu'à ce que la facture arrive et qu'il
-- soit clôturé (voir getOrCreateOpenPurchaseOrder).
create table purchase_orders (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,
  affaire_id uuid not null references affaires (id) on delete cascade,
  fournisseur text,
  statut text not null default 'Ouvert',
  montant_facture numeric,
  notes text,
  created_at timestamptz not null default now()
);

alter table tool_list_items add column purchase_order_id uuid references purchase_orders (id) on delete set null;

create index if not exists idx_purchase_orders_affaire_id on purchase_orders (affaire_id);
create index if not exists idx_tool_list_items_purchase_order_id on tool_list_items (purchase_order_id);

alter table purchase_orders enable row level security;

create policy "purchase_orders_select" on purchase_orders for select to authenticated using (true);
create policy "purchase_orders_write" on purchase_orders for all to authenticated
  using (current_role_is(array['admin', 'commercial', 'atelier', 'direction', 'administratif_logistique']::user_role[]))
  with check (current_role_is(array['admin', 'commercial', 'atelier', 'direction', 'administratif_logistique']::user_role[]));

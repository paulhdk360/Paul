-- Atelier is now locked down to Tool List / BL / Pointage retour only (app
-- code already redirects them away from every other page) and to entering
-- achats for the "Atelier" category exclusively — never Bureaux, Opérateurs
-- or affaire-linked purchases, which stay visible only to
-- admin/commercial/direction/administratif_logistique.
drop policy if exists "achats_select" on achats;
drop policy if exists "achats_write" on achats;

create policy "achats_select" on achats for select to authenticated
  using (
    not current_role_is(array['atelier']::user_role[]) or categorie = 'Atelier'
  );

create policy "achats_write" on achats for all to authenticated
  using (
    current_role_is(array['admin', 'commercial', 'direction', 'administratif_logistique']::user_role[])
    or (current_role_is(array['atelier']::user_role[]) and categorie = 'Atelier')
  )
  with check (
    current_role_is(array['admin', 'commercial', 'direction', 'administratif_logistique']::user_role[])
    or (current_role_is(array['atelier']::user_role[]) and categorie = 'Atelier')
  );

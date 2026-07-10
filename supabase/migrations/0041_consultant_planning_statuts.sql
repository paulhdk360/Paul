-- Give the new Consultant category a starter set of planning statuses,
-- mirroring the generic Bureaux ones, so its Planning tab isn't empty.
insert into planning_statuts (categorie, libelle, couleur, ordre) values
  ('consultant', 'Présent', '#1C9A6C', 1),
  ('consultant', 'Mission', '#1477C6', 2),
  ('consultant', 'Congés', '#C98A1E', 3),
  ('consultant', 'Autre', '#5B6B85', 4);

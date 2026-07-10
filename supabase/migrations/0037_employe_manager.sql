-- Reporting line for each employee, needed to build an organigramme
-- (org chart). Self-referencing FK on employes; set null rather than
-- cascading a delete so removing a manager doesn't wipe out their reports,
-- it just leaves them unattached (they become a root in the chart).
alter table employes add column manager_id uuid references employes (id) on delete set null;

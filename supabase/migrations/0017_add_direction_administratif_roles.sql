-- Two new user roles: "Direction" (leadership — same business-data reach as
-- commercial, extended to the operational tier atelier already has, so they
-- can see everything without needing admin's user-management power) and
-- "Administratif / Logistique" (peer to atelier — same operational write
-- access: catalogue, tool list, BL, service tickets — for admin/logistics
-- staff who aren't in the workshop but run the same paperwork).
--
-- Kept in its own migration, separate from the policies that reference these
-- values (migration 0018): Postgres won't let a new enum value be used by a
-- query in the same transaction that added it.
alter type user_role add value if not exists 'direction';
alter type user_role add value if not exists 'administratif_logistique';

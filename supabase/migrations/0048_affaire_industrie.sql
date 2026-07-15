-- Which industry the affaire's job serves — a separate axis from
-- type_activite (Fishing/DD/...) and type_transaction (Location/Vente),
-- used to filter affaires and break down CA % by industry on the dashboard.
alter table affaires add column industrie text;

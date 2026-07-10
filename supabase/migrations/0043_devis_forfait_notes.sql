-- Free-text block shown right under the Forfait lines table (contractual
-- notes/conditions specific to a lump-sum devis — mob/demob terms, revision
-- formulas, etc.), both in the editor and on the generated PDF.
alter table devis add column forfait_notes text;

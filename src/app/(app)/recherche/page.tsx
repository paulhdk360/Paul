import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import type { Affaire, CatalogueOutil, Client, Devis } from "@/lib/types";

export default async function RecherchePage({ searchParams }: { searchParams: { q?: string } }) {
  const { profile } = await requireUser();
  if (profile.role === "operateur") redirect("/service-ticket-operateur");

  const q = (searchParams.q ?? "").trim();
  if (!q) {
    return (
      <div>
        <div className="font-display text-[30px] font-bold tracking-wide text-navy">Recherche</div>
        <div className="mt-4 text-text-muted">Tapez un terme dans la barre de recherche pour commencer.</div>
      </div>
    );
  }

  const supabase = createClient();
  const like = `%${q}%`;
  const [affairesRes, clientsRes, catalogueRes, toolListRes, devisRes] = await Promise.all([
    supabase
      .from("affaires")
      .select("*")
      .or(`reference.ilike.${like},chantier.ilike.${like},well_location.ilike.${like}`)
      .limit(15),
    supabase.from("clients").select("*").ilike("raison_sociale", like).limit(15),
    supabase
      .from("catalogue_outils")
      .select("*")
      .or(`designation.ilike.${like},numero_article.ilike.${like},famille.ilike.${like}`)
      .limit(15),
    supabase
      .from("tool_list_items")
      .select("*, affaires(id, reference)")
      .or(`designation.ilike.${like},numero_serie.ilike.${like},reference_article.ilike.${like}`)
      .limit(15),
    supabase.from("devis").select("*, affaires(id, reference)").ilike("reference", like).limit(15),
  ]);

  const affaires = (affairesRes.data ?? []) as Affaire[];
  const clients = (clientsRes.data ?? []) as Client[];
  const catalogue = (catalogueRes.data ?? []) as CatalogueOutil[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toolList = (toolListRes.data ?? []) as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const devis = (devisRes.data ?? []) as any[];

  const totalCount = affaires.length + clients.length + catalogue.length + toolList.length + devis.length;

  return (
    <div>
      <div className="font-display text-[30px] font-bold tracking-wide text-navy">Recherche</div>
      <div className="mb-6 text-[13.5px] text-text-muted">
        {totalCount} résultat(s) pour « {q} »
      </div>

      <ResultSection title="Affaires">
        {affaires.map((a) => (
          <ResultRow key={a.id} href={`/affaires/${a.id}`} title={a.reference} subtitle={[a.chantier, a.well_location].filter(Boolean).join(" · ")} />
        ))}
      </ResultSection>

      <ResultSection title="Devis">
        {devis.map((d: Devis & { affaires: { id: string; reference: string } | null }) => (
          <ResultRow
            key={d.id}
            href={d.affaires ? `/affaires/${d.affaires.id}/devis/${d.id}` : "#"}
            title={`${d.reference} (${d.version})`}
            subtitle={d.affaires ? `Affaire ${d.affaires.reference}` : ""}
          />
        ))}
      </ResultSection>

      <ResultSection title="Clients">
        {clients.map((c) => (
          <ResultRow key={c.id} href="/clients" title={c.raison_sociale} subtitle={c.email_general ?? c.telephone_general ?? ""} />
        ))}
      </ResultSection>

      <ResultSection title="Catalogue outils">
        {catalogue.map((o) => (
          <ResultRow key={o.id} href="/catalogue" title={o.designation} subtitle={[o.numero_article, o.statut].filter(Boolean).join(" · ")} />
        ))}
      </ResultSection>

      <ResultSection title="Tool List / équipements">
        {toolList.map((item) => (
          <ResultRow
            key={item.id}
            href={item.affaires ? `/affaires/${item.affaires.id}/tool-list` : "#"}
            title={item.designation.split("\n")[0]}
            subtitle={[item.numero_serie, item.affaires ? `Affaire ${item.affaires.reference}` : null].filter(Boolean).join(" · ")}
          />
        ))}
      </ResultSection>

      {totalCount === 0 && <div className="rounded-[10px] border border-border bg-bg-card p-10 text-center text-text-muted">Aucun résultat.</div>}
    </div>
  );
}

function ResultSection({ title, children }: { title: string; children: React.ReactNode }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children;
  const count = Array.isArray(items) ? items.length : items ? 1 : 0;
  if (count === 0) return null;
  return (
    <div className="mb-6">
      <div className="mb-2 font-display text-[16px] font-semibold text-navy">{title}</div>
      <div className="overflow-hidden rounded-[10px] border border-border bg-bg-card">{children}</div>
    </div>
  );
}

function ResultRow({ href, title, subtitle }: { href: string; title: string; subtitle: string }) {
  return (
    <Link href={href} className="flex items-center justify-between border-b border-border/60 px-4 py-2.5 text-[13px] last:border-b-0 hover:bg-bg-sunken">
      <span className="font-medium text-text-dark">{title}</span>
      {subtitle && <span className="text-[12px] text-text-muted">{subtitle}</span>}
    </Link>
  );
}

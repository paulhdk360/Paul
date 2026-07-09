import { dateRange } from "@/lib/calendar";
import { computeDevisTotals } from "@/lib/devis";
import { computeEquipementTotals, computePersonnelTotals, computeTransportTotal } from "@/lib/serviceTicketTotals";
import type {
  Achat,
  Affaire,
  Devis,
  DevisLigne,
  PointageCode,
  ServiceTicket,
  ServiceTicketDay,
  ServiceTicketPersonnel,
  ServiceTicketTransport,
  ToolListItem,
} from "@/lib/types";

export interface RentabiliteInput {
  affaire: Affaire;
  devis: Devis[];
  lignes: DevisLigne[];
  ticket: ServiceTicket | null;
  personnel: ServiceTicketPersonnel[];
  transport: ServiceTicketTransport[];
  equipements: ToolListItem[];
  days: ServiceTicketDay[];
  achats: Achat[];
}

export interface RentabiliteResult {
  isVente: boolean;
  hasTicket: boolean;
  revenu: number;
  achatsTotal: number;
  transportCoutReel: number;
  coutPersonnel: number;
  chargesTotal: number;
  marge: number;
  margePct: number | null;
}

// Location revenue is realized on the Service Ticket, not the devis — a
// rental quote's line totals deliberately exclude Stand-By/Operation
// day-rates (they're settled later from actual days pointed), so using the
// devis for a Location affaire would massively understate its real CA. Vente
// has no Service Ticket billing model, so its devis totals (unit price × qty,
// covering the Vente/Transport/Packaging tabs) are the real revenue.
export function computeAffaireRentabilite(input: RentabiliteInput): RentabiliteResult {
  const { affaire, devis, lignes, ticket, personnel, transport, equipements, days, achats } = input;
  const isVente = affaire.type_transaction === "Vente";

  let revenu = 0;
  if (isVente) {
    const lignesByDevis = new Map<string, DevisLigne[]>();
    for (const l of lignes) {
      const arr = lignesByDevis.get(l.devis_id) ?? [];
      arr.push(l);
      lignesByDevis.set(l.devis_id, arr);
    }
    const devisRetenus = devis.filter((d) => d.statut === "Accepté" || d.statut === "Envoyé");
    revenu = devisRetenus.reduce((sum, d) => sum + computeDevisTotals(lignesByDevis.get(d.id) ?? [], d.tva).ht, 0);
  } else if (ticket) {
    const dates = dateRange(ticket.period_start, ticket.period_end);
    const pointageMap = new Map<string, PointageCode>(days.map((d) => [`${d.entity_id}:${d.date}`, d.code]));
    const personnelTotal = computePersonnelTotals(personnel, dates, pointageMap).reduce((sum, r) => sum + r.total, 0);
    const equipementTotal = computeEquipementTotals(equipements, dates, pointageMap).reduce((sum, r) => sum + r.total, 0);
    revenu = personnelTotal + equipementTotal + computeTransportTotal(transport);
  }

  const achatsTotal = achats.reduce((sum, a) => sum + (a.montant || 0), 0);
  const transportCoutReel = transport.reduce((sum, t) => sum + (t.cout_reel || 0) * (t.quantite || 1), 0);
  const coutPersonnel = affaire.cout_personnel || 0;
  const chargesTotal = achatsTotal + transportCoutReel + coutPersonnel;
  const marge = revenu - chargesTotal;
  const margePct = revenu > 0 ? (marge / revenu) * 100 : null;

  return { isVente, hasTicket: !!ticket, revenu, achatsTotal, transportCoutReel, coutPersonnel, chargesTotal, marge, margePct };
}

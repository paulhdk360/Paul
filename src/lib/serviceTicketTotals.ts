import { computeDayCounts, countCodeDays } from "@/lib/calendar";
import type { PointageCode, ServiceTicketPersonnel, ServiceTicketTransport, ToolListItem } from "@/lib/types";

export interface PersonnelTotalRow {
  personnel: ServiceTicketPersonnel;
  joursS: number;
  joursO: number;
  total: number;
}

export interface EquipementTotalRow {
  item: ToolListItem;
  joursStandBy: number;
  joursOperation: number;
  montantStandBy: number;
  montantOperation: number;
  maintenance: number;
  inspection: number;
  restocking: number;
  lih: number;
  uc: number;
  total: number;
}

function codesFor(pointage: Map<string, PointageCode>, entityId: string, dates: string[]) {
  return dates.map((d) => pointage.get(`${entityId}:${d}`));
}

export function computePersonnelTotals(
  personnel: ServiceTicketPersonnel[],
  dates: string[],
  pointage: Map<string, PointageCode>,
): PersonnelTotalRow[] {
  return personnel.map((p) => {
    const codes = codesFor(pointage, p.id, dates);
    const joursS = countCodeDays(codes, "S");
    const joursO = countCodeDays(codes, "O");
    const total = (p.tarif_mob || 0) + (p.tarif_demob || 0) + (p.tarif_jour || 0) * (joursS + joursO);
    return { personnel: p, joursS, joursO, total };
  });
}

export function computeTransportTotal(transport: ServiceTicketTransport[]): number {
  return transport.reduce((sum, t) => sum + (t.prix_unitaire || 0) * (t.quantite || 0), 0);
}

// Billing rules from the Enedril paper workflow:
// - MOB/DEMOB/S days bill at the Stand-By rate; O days at the Operation rate.
// - A single Operation day (any amount) auto-triggers one flat Maintenance
//   charge for that equipment, never multiplied by day count.
// - Inspection and Restocking are manual one-time flags, independent of the
//   calendar entirely.
// - Lost In Hole immediately stops day-counting for that equipment and
//   bills its own flat amount once, instead of further Stand-By/Operation.
export function computeEquipementTotals(
  items: ToolListItem[],
  dates: string[],
  pointage: Map<string, PointageCode>,
): EquipementTotalRow[] {
  return items.map((item) => {
    const codes = codesFor(pointage, item.id, dates);
    const { standByDays, operationDays, hasOperation, hasLih } = computeDayCounts(codes);

    const montantStandBy = standByDays * (item.prix_stand_by || 0);
    const montantOperation = operationDays * (item.prix_operation || 0);
    const maintenance = hasOperation ? item.prix_maintenance || 0 : 0;
    const inspection = item.inspection_facturee ? item.prix_inspection || 0 : 0;
    const restocking = item.restocking_facture ? item.prix_restocking || 0 : 0;
    const lih = hasLih ? item.prix_lih || 0 : 0;
    const uc = item.prix_uc || 0;
    const total = montantStandBy + montantOperation + maintenance + inspection + restocking + lih + uc;

    return {
      item,
      joursStandBy: standByDays,
      joursOperation: operationDays,
      montantStandBy,
      montantOperation,
      maintenance,
      inspection,
      restocking,
      lih,
      uc,
      total,
    };
  });
}

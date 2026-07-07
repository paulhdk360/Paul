import { countCodeDays } from "@/lib/calendar";
import type { PointageCode, ServiceTicketPersonnel, ServiceTicketTransport, ToolListItem } from "@/lib/types";

export interface PersonnelTotalRow {
  personnel: ServiceTicketPersonnel;
  joursS: number;
  joursO: number;
  total: number;
}

export interface EquipementTotalRow {
  item: ToolListItem;
  joursS: number;
  joursO: number;
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

export function computeEquipementTotals(
  items: ToolListItem[],
  dates: string[],
  pointage: Map<string, PointageCode>,
): EquipementTotalRow[] {
  return items.map((item) => {
    const codes = codesFor(pointage, item.id, dates);
    const joursS = countCodeDays(codes, "S");
    const joursO = countCodeDays(codes, "O");
    const total =
      joursS * (item.prix_stand_by || 0) +
      joursO * (item.prix_operation || 0) +
      (item.prix_uc || 0) +
      (item.prix_lih || 0) +
      (item.prix_inspection || 0) +
      (item.prix_restocking || 0);
    return { item, joursS, joursO, total };
  });
}

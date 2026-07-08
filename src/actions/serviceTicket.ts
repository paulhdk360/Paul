"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ServiceTicket, ServiceTicketPersonnel, ServiceTicketTransport, PointageCode } from "@/lib/types";

export async function ensureTicket(affaireId: string, defaults: Partial<ServiceTicket>) {
  const supabase = createClient();
  const { data: existing } = await supabase
    .from("service_tickets")
    .select("*")
    .eq("affaire_id", affaireId)
    .maybeSingle();
  if (existing) return existing as ServiceTicket;

  const { data: row, error } = await supabase
    .from("service_tickets")
    .insert({ ...defaults, affaire_id: affaireId })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath(`/affaires/${affaireId}/service-ticket`);
  return row as ServiceTicket;
}

export async function updateTicket(id: string, affaireId: string, data: Partial<ServiceTicket>) {
  const supabase = createClient();
  const { error } = await supabase.from("service_tickets").update(data).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/affaires/${affaireId}/service-ticket`);
}

export async function addPersonnel(ticketId: string, affaireId: string, data: Partial<ServiceTicketPersonnel>) {
  const supabase = createClient();
  const { error } = await supabase.from("service_ticket_personnel").insert({ ...data, ticket_id: ticketId });
  if (error) throw new Error(error.message);
  revalidatePath(`/affaires/${affaireId}/service-ticket`);
}

export async function updatePersonnel(id: string, affaireId: string, data: Partial<ServiceTicketPersonnel>) {
  const supabase = createClient();
  const { error } = await supabase.from("service_ticket_personnel").update(data).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/affaires/${affaireId}/service-ticket`);
}

export async function removePersonnel(id: string, affaireId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("service_ticket_personnel").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/affaires/${affaireId}/service-ticket`);
}

export async function addTransportLine(ticketId: string, affaireId: string, data: Partial<ServiceTicketTransport>) {
  const supabase = createClient();
  const { error } = await supabase.from("service_ticket_transport").insert({ ...data, ticket_id: ticketId });
  if (error) throw new Error(error.message);
  revalidatePath(`/affaires/${affaireId}/service-ticket`);
}

export async function updateTransportLine(id: string, affaireId: string, data: Partial<ServiceTicketTransport>) {
  const supabase = createClient();
  const { error } = await supabase.from("service_ticket_transport").update(data).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/affaires/${affaireId}/service-ticket`);
}

export async function removeTransportLine(id: string, affaireId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("service_ticket_transport").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/affaires/${affaireId}/service-ticket`);
}

// Toggles a single calendar cell: cycling through the pointage codes and
// back to "empty" clears the row for that entity/date.
export async function setPointage(
  ticketId: string,
  affaireId: string,
  entityType: "personnel" | "equipement",
  entityId: string,
  date: string,
  code: PointageCode | null,
) {
  const supabase = createClient();
  if (code === null) {
    const { error } = await supabase
      .from("service_ticket_days")
      .delete()
      .eq("ticket_id", ticketId)
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .eq("date", date);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("service_ticket_days")
      .upsert(
        { ticket_id: ticketId, entity_type: entityType, entity_id: entityId, date, code },
        { onConflict: "ticket_id,entity_type,entity_id,date" },
      );
    if (error) throw new Error(error.message);

    // Matches the paper workflow: a day worked in Operation wears the tool,
    // so it's automatically flagged for maintenance on the Tool List; Lost
    // In Hole marks the tool as lost. Routed through a security-definer RPC
    // (not a direct table write) so an opérateur pointing their own ticket
    // can trigger it without getting general Tool List write access.
    if (entityType === "equipement" && code === "O") {
      await supabase.rpc("set_tool_list_statut", { item_id: entityId, new_statut: "Maintenance" });
      revalidatePath(`/affaires/${affaireId}/tool-list`);
    }
    if (entityType === "equipement" && code === "LIH") {
      await supabase.rpc("set_tool_list_statut", { item_id: entityId, new_statut: "Perdu (LIH)" });
      revalidatePath(`/affaires/${affaireId}/tool-list`);
    }
  }
  revalidatePath(`/affaires/${affaireId}/service-ticket`);
  revalidatePath(`/affaires/${affaireId}/service-ticket-operateur`);
}

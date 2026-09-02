import { auth } from "@/auth";
import { sql } from "@/lib/db";

/**
 * Remplace les policies Row Level Security de la version Supabase : chaque
 * action serveur qui écrit en base doit appeler l'un de ces helpers avant
 * toute requête, pour vérifier explicitement les droits de l'utilisateur
 * connecté sur le club concerné.
 */

export async function getSessionUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function requireUserId(): Promise<string> {
  const userId = await getSessionUserId();
  if (!userId) throw new Error("Non authentifié.");
  return userId;
}

export async function requireClubMember(clubId: string): Promise<string> {
  const userId = await requireUserId();
  const rows = await sql`
    select 1 from club_members where club_id = ${clubId} and user_id = ${userId} limit 1
  `;
  if (rows.length === 0) throw new Error("Accès refusé : vous n'êtes pas membre de ce club.");
  return userId;
}

const STAFF_ROLE_LIST = ["club_admin", "dirigeant", "head_coach", "coach"];

export async function requireClubStaff(clubId: string): Promise<string> {
  const userId = await requireUserId();
  const rows = await sql`
    select 1 from club_members
    where club_id = ${clubId} and user_id = ${userId} and role = any(${STAFF_ROLE_LIST})
    limit 1
  `;
  if (rows.length === 0) throw new Error("Accès refusé : action réservée au staff du club.");
  return userId;
}

export async function requireClubAdmin(clubId: string): Promise<string> {
  const userId = await requireUserId();
  const rows = await sql`
    select 1 from club_members where club_id = ${clubId} and user_id = ${userId} and role = 'club_admin' limit 1
  `;
  if (rows.length === 0) throw new Error("Accès refusé : action réservée aux administrateurs du club.");
  return userId;
}

/** Vérifie que le joueur ciblé est bien rattaché au compte de l'utilisateur connecté. */
export async function requireOwnPlayer(playerId: string): Promise<string> {
  const userId = await requireUserId();
  const rows = await sql`select 1 from players where id = ${playerId} and user_id = ${userId} limit 1`;
  if (rows.length === 0) throw new Error("Accès refusé : ce joueur n'est pas rattaché à votre compte.");
  return userId;
}

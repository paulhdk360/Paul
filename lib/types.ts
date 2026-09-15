export type UserRole =
  | "club_admin"
  | "dirigeant"
  | "head_coach"
  | "coach"
  | "medical"
  | "equipment_manager"
  | "player"
  | "parent";

export const ROLE_LABELS: Record<UserRole, string> = {
  club_admin: "Administrateur du club",
  dirigeant: "Dirigeant",
  head_coach: "Head coach",
  coach: "Coach",
  medical: "Référent santé",
  equipment_manager: "Responsable matériel",
  player: "Joueur",
  parent: "Parent",
};

export const STAFF_ROLES: UserRole[] = ["club_admin", "dirigeant", "head_coach", "coach"];

export const ROLE_BADGE_COLORS: Record<UserRole, string> = {
  club_admin: "bg-violet-500/20 text-violet-300 ring-1 ring-inset ring-violet-500/30",
  dirigeant: "bg-indigo-500/20 text-indigo-300 ring-1 ring-inset ring-indigo-500/30",
  head_coach: "bg-amber-500/20 text-amber-300 ring-1 ring-inset ring-amber-500/30",
  coach: "bg-sky-500/20 text-sky-300 ring-1 ring-inset ring-sky-500/30",
  medical: "bg-rose-500/20 text-rose-300 ring-1 ring-inset ring-rose-500/30",
  equipment_manager: "bg-slate-500/20 text-slate-300 ring-1 ring-inset ring-slate-500/30",
  player: "bg-emerald-500/20 text-emerald-300 ring-1 ring-inset ring-emerald-500/30",
  parent: "bg-teal-500/20 text-teal-300 ring-1 ring-inset ring-teal-500/30",
};

export const PLAY_TYPE_OPTIONS = [
  "Course",
  "Passe",
  "Coup d'envoi",
  "Botté",
  "Field Goal",
  "Transformation",
  "Défense",
  "Retour",
  "Special Teams",
];

export type PlayerStatus =
  | "active"
  | "trial"
  | "injured"
  | "limited"
  | "unavailable"
  | "suspended"
  | "inactive"
  | "archived";

export const PLAYER_STATUS_LABELS: Record<PlayerStatus, string> = {
  active: "Actif",
  trial: "En essai",
  injured: "Blessé",
  limited: "Limité",
  unavailable: "Indisponible",
  suspended: "Suspendu",
  inactive: "Inactif",
  archived: "Archivé",
};

export const PLAYER_STATUS_COLORS: Record<PlayerStatus, string> = {
  active: "bg-emerald-500/20 text-emerald-300 ring-1 ring-inset ring-emerald-500/30",
  trial: "bg-sky-500/20 text-sky-300 ring-1 ring-inset ring-sky-500/30",
  injured: "bg-red-500/20 text-red-300 ring-1 ring-inset ring-red-500/30",
  limited: "bg-amber-500/20 text-amber-300 ring-1 ring-inset ring-amber-500/30",
  unavailable: "bg-orange-500/20 text-orange-300 ring-1 ring-inset ring-orange-500/30",
  suspended: "bg-rose-500/20 text-rose-300 ring-1 ring-inset ring-rose-500/30",
  inactive: "bg-slate-500/20 text-slate-300 ring-1 ring-inset ring-slate-500/30",
  archived: "bg-slate-500/10 text-slate-400 ring-1 ring-inset ring-slate-500/20",
};

export type EventType =
  | "training"
  | "match"
  | "tournament"
  | "staff_meeting"
  | "player_meeting"
  | "video_session"
  | "fitness_test"
  | "travel"
  | "club_event"
  | "admin_deadline"
  | "individual_meeting";

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  training: "Entraînement",
  match: "Match",
  tournament: "Tournoi",
  staff_meeting: "Réunion staff",
  player_meeting: "Réunion joueurs",
  video_session: "Séance vidéo",
  fitness_test: "Test physique",
  travel: "Déplacement",
  club_event: "Événement du club",
  admin_deadline: "Échéance administrative",
  individual_meeting: "Entretien individuel",
};

/** Couleur de fond utilisée pour les pastilles/puces d'événement dans le calendrier. */
export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  training: "bg-emerald-500",
  match: "bg-red-500",
  tournament: "bg-orange-500",
  staff_meeting: "bg-indigo-500",
  player_meeting: "bg-sky-500",
  video_session: "bg-violet-500",
  fitness_test: "bg-amber-500",
  travel: "bg-slate-500",
  club_event: "bg-pink-500",
  admin_deadline: "bg-rose-600",
  individual_meeting: "bg-teal-500",
};

export const EVENT_TYPE_BADGE_COLORS: Record<EventType, string> = {
  training: "bg-emerald-500/20 text-emerald-300 ring-1 ring-inset ring-emerald-500/30",
  match: "bg-red-500/20 text-red-300 ring-1 ring-inset ring-red-500/30",
  tournament: "bg-orange-500/20 text-orange-300 ring-1 ring-inset ring-orange-500/30",
  staff_meeting: "bg-indigo-500/20 text-indigo-300 ring-1 ring-inset ring-indigo-500/30",
  player_meeting: "bg-sky-500/20 text-sky-300 ring-1 ring-inset ring-sky-500/30",
  video_session: "bg-violet-500/20 text-violet-300 ring-1 ring-inset ring-violet-500/30",
  fitness_test: "bg-amber-500/20 text-amber-300 ring-1 ring-inset ring-amber-500/30",
  travel: "bg-slate-500/20 text-slate-300 ring-1 ring-inset ring-slate-500/30",
  club_event: "bg-pink-500/20 text-pink-300 ring-1 ring-inset ring-pink-500/30",
  admin_deadline: "bg-rose-500/20 text-rose-300 ring-1 ring-inset ring-rose-500/30",
  individual_meeting: "bg-teal-500/20 text-teal-300 ring-1 ring-inset ring-teal-500/30",
};

export type AvailabilityStatus = "present" | "absent" | "uncertain" | "late" | "partial";

export const AVAILABILITY_STATUS_LABELS: Record<AvailabilityStatus, string> = {
  present: "Présent",
  absent: "Absent",
  uncertain: "Incertain",
  late: "En retard",
  partial: "Disponible partiellement",
};

export type AttendanceStatus =
  | "present"
  | "absent_justified"
  | "absent_unjustified"
  | "late"
  | "left_early"
  | "injured"
  | "observer"
  | "exempted";

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "Présent",
  absent_justified: "Absent justifié",
  absent_unjustified: "Absent non justifié",
  late: "Retard",
  left_early: "Départ anticipé",
  injured: "Blessé",
  observer: "Observateur",
  exempted: "Exempté",
};

export type ConvocationResponse = "pending" | "accepted" | "declined" | "uncertain";

export const CONVOCATION_RESPONSE_LABELS: Record<ConvocationResponse, string> = {
  pending: "En attente",
  accepted: "Confirmé",
  declined: "Refusé",
  uncertain: "Incertain",
};

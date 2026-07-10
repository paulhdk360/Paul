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

const TONES: Record<string, string> = {
  neutral: "bg-bg-sunken text-text-muted border-border",
  blue: "bg-blue/10 text-blue border-blue/30",
  navy: "bg-navy/10 text-navy border-navy/30",
  success: "bg-success/10 text-success border-success/30",
  warning: "bg-warning/10 text-warning border-warning/30",
  danger: "bg-danger/10 text-danger border-danger/30",
};

const STATUT_TONE: Record<string, keyof typeof TONES> = {
  "Devis en préparation": "neutral",
  "Devis envoyé": "blue",
  "Devis accepté": "success",
  "Devis refusé": "danger",
  "En cours": "blue",
  Terminée: "neutral",
  Brouillon: "neutral",
  Envoyé: "blue",
  Accepté: "success",
  Refusé: "danger",
  Disponible: "success",
  "En location": "blue",
  Maintenance: "warning",
  Indisponible: "danger",
  "En stock": "neutral",
  Préparé: "blue",
  Expédié: "warning",
  "Sur site": "success",
  Retour: "neutral",
  "Perdu (LIH)": "danger",
  Réservé: "blue",
  "Sur chantier": "success",
  "En transit": "warning",
  "Retour à la base": "neutral",
  "En attente d'inspection": "warning",
  "À recharger": "warning",
  "À rectifier": "danger",
  "À repeindre": "warning",
};

export function Badge({ label, tone }: { label: string; tone?: keyof typeof TONES }) {
  const resolvedTone = tone ?? STATUT_TONE[label] ?? "neutral";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold ${TONES[resolvedTone]}`}>
      {label}
    </span>
  );
}

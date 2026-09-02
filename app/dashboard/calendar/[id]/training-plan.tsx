"use client";

import { useRef, useState, useTransition } from "react";
import { addDrill, applySuggestedPlan, deleteDrill, updateTrainingInfo } from "@/lib/actions/trainings";
import {
  DRILL_CATEGORY_COLORS,
  DRILL_CATEGORY_LABELS,
  DRILL_CATEGORY_ORDER,
  DRILL_TEMPLATES,
  type DrillCategory,
} from "@/lib/drills";
import { TrainingTimeline } from "./training-timeline";

type Drill = {
  id: string;
  title: string;
  objective: string | null;
  duration_minutes: number | null;
  group_name: string | null;
  description: string | null;
  equipment: string | null;
  staff_name: string | null;
  category: DrillCategory;
};

export function TrainingPlan({
  eventId,
  startAt,
  canManage,
  training,
  drills,
  staff,
}: {
  eventId: string;
  startAt: string;
  canManage: boolean;
  training: { objective: string | null; weather: string | null; notes: string | null };
  drills: Drill[];
  staff: { id: string; first_name: string; last_name: string }[];
}) {
  const [savingInfo, setSavingInfo] = useState(false);
  const [addingDrill, setAddingDrill] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isSuggesting, startSuggestTransition] = useTransition();

  const titleRef = useRef<HTMLInputElement>(null);
  const objectiveRef = useRef<HTMLInputElement>(null);
  const durationRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const categoryRef = useRef<HTMLSelectElement>(null);

  function applyTemplate(templateId: string) {
    const template = DRILL_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;
    if (titleRef.current) titleRef.current.value = template.title;
    if (objectiveRef.current) objectiveRef.current.value = template.objective;
    if (durationRef.current) durationRef.current.value = String(template.durationMinutes);
    if (descriptionRef.current) descriptionRef.current.value = template.description;
    if (categoryRef.current) categoryRef.current.value = template.category;
  }

  const drillsByCategory = DRILL_CATEGORY_ORDER.map((category) => ({
    category,
    items: drills.filter((d) => d.category === category),
  })).filter((g) => g.items.length > 0);

  const totalMinutes = drills.reduce((sum, d) => sum + (d.duration_minutes ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="mb-4 text-lg font-medium">🏋️ Plan de séance</h2>
        {canManage ? (
          <form
            action={async (formData) => {
              setSavingInfo(true);
              try {
                await updateTrainingInfo(eventId, formData);
              } finally {
                setSavingInfo(false);
              }
            }}
            className="grid grid-cols-1 gap-3 sm:grid-cols-3"
          >
            <div>
              <label className="label text-xs">Objectif de la séance</label>
              <input className="input" name="objective" defaultValue={training.objective ?? ""} />
            </div>
            <div>
              <label className="label text-xs">Météo</label>
              <input className="input" name="weather" defaultValue={training.weather ?? ""} />
            </div>
            <div>
              <label className="label text-xs">Notes</label>
              <input className="input" name="notes" defaultValue={training.notes ?? ""} />
            </div>
            <div className="sm:col-span-3">
              <button className="btn" type="submit" disabled={savingInfo}>
                {savingInfo ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-1 text-sm">
            {training.objective && (
              <p>
                <span className="font-medium">Objectif : </span>
                {training.objective}
              </p>
            )}
            {training.weather && (
              <p>
                <span className="font-medium">Météo : </span>
                {training.weather}
              </p>
            )}
            {training.notes && (
              <p>
                <span className="font-medium">Notes : </span>
                {training.notes}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-medium">Exercices ({drills.length})</h2>
          <div className="flex items-center gap-2">
            {totalMinutes > 0 && <span className="badge bg-amber-100 text-amber-800">{totalMinutes} min au total</span>}
            {canManage && (
              <button
                type="button"
                className="btn-secondary text-xs"
                disabled={isSuggesting}
                onClick={() => startSuggestTransition(() => applySuggestedPlan(eventId))}
              >
                {isSuggesting ? "Génération..." : "✨ Suggérer un plan de séance (2h)"}
              </button>
            )}
          </div>
        </div>

        {drills.length > 0 && (
          <div className="mb-5">
            <TrainingTimeline startAt={startAt} drills={drills} />
          </div>
        )}

        <div className="space-y-5">
          {drillsByCategory.map((group) => (
            <div key={group.category}>
              <p className={`badge mb-2 ${DRILL_CATEGORY_COLORS[group.category]}`}>
                {DRILL_CATEGORY_LABELS[group.category]}
              </p>
              <ul className="space-y-3">
                {group.items.map((drill) => (
                  <li key={drill.id} className="rounded-lg border border-slate-200 bg-emerald-50/40 p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">
                          {drill.title}
                          {drill.duration_minutes ? (
                            <span className="ml-2 badge bg-amber-100 text-amber-800">{drill.duration_minutes} min</span>
                          ) : null}
                          {drill.group_name ? (
                            <span className="ml-2 badge bg-sky-100 text-sky-800">{drill.group_name}</span>
                          ) : null}
                        </p>
                        {drill.objective && <p className="mt-1 text-sm text-slate-600">🎯 {drill.objective}</p>}
                        {drill.description && <p className="mt-1 text-sm text-slate-600">{drill.description}</p>}
                        <p className="mt-1 text-xs text-slate-500">
                          {drill.staff_name ? `Responsable : ${drill.staff_name}` : ""}
                          {drill.equipment ? ` · Matériel : ${drill.equipment}` : ""}
                        </p>
                      </div>
                      {canManage && (
                        <button
                          type="button"
                          className="text-xs text-red-600 hover:underline"
                          disabled={isDeleting}
                          onClick={() => startDeleteTransition(() => deleteDrill(drill.id, eventId))}
                        >
                          Supprimer
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {drills.length === 0 && <p className="py-4 text-center text-sm text-slate-500">Aucun exercice ajouté.</p>}
        </div>

        {canManage && (
          <div className="mt-4 border-t border-slate-200 pt-4">
            {addingDrill ? (
              <form
                action={async (formData) => {
                  await addDrill(eventId, formData);
                  setAddingDrill(false);
                }}
                className="space-y-3"
              >
                <div>
                  <label className="label text-xs">Modèle d'exercice (optionnel)</label>
                  <select
                    className="input border-gold-500 bg-gold-50"
                    defaultValue=""
                    onChange={(e) => {
                      applyTemplate(e.target.value);
                      e.target.value = "";
                    }}
                  >
                    <option value="">Choisir un modèle...</option>
                    {DRILL_CATEGORY_ORDER.map((category) => (
                      <optgroup key={category} label={DRILL_CATEGORY_LABELS[category]}>
                        {DRILL_TEMPLATES.filter((t) => t.category === category).map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label text-xs">Titre</label>
                    <input ref={titleRef} className="input" name="title" required autoFocus />
                  </div>
                  <div>
                    <label className="label text-xs">Durée (minutes)</label>
                    <input ref={durationRef} className="input" name="duration_minutes" type="number" min={1} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label text-xs">Catégorie</label>
                    <select ref={categoryRef} className="input" name="category" defaultValue="team">
                      {DRILL_CATEGORY_ORDER.map((category) => (
                        <option key={category} value={category}>
                          {DRILL_CATEGORY_LABELS[category]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label text-xs">Responsable</label>
                    <select className="input" name="responsible_staff_id">
                      <option value="">—</option>
                      {staff.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.first_name} {s.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label text-xs">Groupe concerné</label>
                  <input className="input" name="group_name" placeholder="Ex : Ligne offensive" />
                </div>
                <div>
                  <label className="label text-xs">Objectif</label>
                  <input ref={objectiveRef} className="input" name="objective" />
                </div>
                <div>
                  <label className="label text-xs">Description</label>
                  <textarea ref={descriptionRef} className="input" name="description" rows={2} />
                </div>
                <div>
                  <label className="label text-xs">Matériel</label>
                  <input className="input" name="equipment" placeholder="Ex : Plots, chasubles" />
                </div>
                <div className="flex gap-2">
                  <button className="btn" type="submit">
                    Ajouter l'exercice
                  </button>
                  <button className="btn-secondary" type="button" onClick={() => setAddingDrill(false)}>
                    Annuler
                  </button>
                </div>
              </form>
            ) : (
              <button className="btn-secondary" type="button" onClick={() => setAddingDrill(true)}>
                + Ajouter un exercice
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// src/pages/LogEntry.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/hooks/useSession";
import { useDailyDiary } from "@/hooks/useDailyDiary";
import {
    DAILY_CATEGORIES,
    ACTIONS,
    MOOD_OPTIONS,
    BODY_LOCATIONS,
    BODY_LOCATION_LABELS,
    groupedSymptoms,
    symptomLabel,
    actionLabel,
} from "@/lib/dailyOptions";
import type { DailyCategory } from "@/types/daily";

export default function LogEntry() {
    const navigate = useNavigate();
    const { user } = useSession();

    const today = new Date().toISOString().slice(0, 10);
    const diary = useDailyDiary(user?.id, { from: today, to: today });

    const [category, setCategory] = useState<DailyCategory>("symptom");
    const [symptomKey, setSymptomKey] = useState("");
    const [symptomCustom, setSymptomCustom] = useState("");
    const [actionKey, setActionKey] = useState("");
    const [actionCustom, setActionCustom] = useState("");
    const [severity, setSeverity] = useState(3);
    const [bodyLocation, setBodyLocation] = useState("");
    const [durationMinutes, setDurationMinutes] = useState("");
    const [medName, setMedName] = useState("");
    const [medDose, setMedDose] = useState("");
    const [notes, setNotes] = useState("");
    const [moodValue, setMoodValue] = useState(3);

    if (!user) return null;

    const canSave = (() => {
        if (category === "symptom") return !!symptomKey || symptomCustom.trim().length > 0;
        if (category === "action") return !!actionKey || actionCustom.trim().length > 0;
        if (category === "mood") return true;
        return notes.trim().length > 0;
    })();

    const handleSave = async () => {
        const base: Record<string, unknown> = {
            category,
            notes: notes.trim() || null,
        };

        if (category === "symptom") {
            base.symptom_key = symptomKey || null;
            base.symptom_custom =
                symptomKey === "other" ? symptomCustom.trim() || null : null;
            base.severity = severity;
            base.body_location = bodyLocation || null;
            base.duration_minutes = durationMinutes ? Number(durationMinutes) : null;
            base.title =
                symptomKey === "other"
                    ? symptomCustom.trim()
                    : symptomLabel(symptomKey);
        } else if (category === "action") {
            base.action_key = actionKey || null;
            base.action_custom =
                actionKey === "other_action" ? actionCustom.trim() || null : null;
            base.medication_name =
                actionKey === "took_medication" ? medName.trim() || null : null;
            base.medication_dose =
                actionKey === "took_medication" ? medDose.trim() || null : null;
            base.title =
                actionKey === "other_action"
                    ? actionCustom.trim()
                    : actionLabel(actionKey);
        } else if (category === "mood") {
            base.severity = moodValue;
            base.title = MOOD_OPTIONS.find((m) => m.value === moodValue)?.label ?? "";
        }

        try {
            await diary.addEntry.mutateAsync(base);
            navigate(-1);
        } catch {
            /* error surfaces below */
        }
    };

    const symptomGroups = groupedSymptoms();

    return (
        <div className="max-w-3xl mx-auto px-4 py-6 animate-fade-in pb-32">
            {/* Back */}
            <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground -ml-2 mb-4 h-11"
            >
                <ChevronLeft className="w-4 h-4" /> Back
            </button>

            {/* Header */}
            <h1 className="text-2xl font-black tracking-tight text-foreground mb-1">
                Log an entry
            </h1>
            <p className="text-sm text-muted-foreground mb-5">
                Record a symptom, an action you took, your mood, or a note.
            </p>

            {/* Category picker */}
            <div className="rounded-2xl bg-card px-4 py-4 mb-4">
                <Label className="text-xs font-semibold text-muted-foreground">
                    Type
                </Label>
                <div className="mt-2 flex gap-1.5 flex-wrap">
                    {DAILY_CATEGORIES.map((c) => (
                        <button
                            key={c.key}
                            type="button"
                            onClick={() => setCategory(c.key)}
                            className={`h-9 px-3 rounded-2xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${category === c.key
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground active:bg-secondary"
                                }`}
                        >
                            <span>{c.icon}</span> {c.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Symptom form */}
            {category === "symptom" && (
                <div className="rounded-2xl bg-card px-4 py-4 mb-4 space-y-4">
                    <div>
                        <Label className="text-xs font-semibold text-muted-foreground">
                            What's happening?
                        </Label>
                        <select
                            value={symptomKey}
                            onChange={(e) => setSymptomKey(e.target.value)}
                            className="mt-1 w-full h-11 rounded-2xl bg-muted border-0 px-3 text-sm"
                        >
                            <option value="">— Pick a symptom —</option>
                            {symptomGroups.map(([group, items]) => (
                                <optgroup key={group} label={group}>
                                    {items.map((s) => (
                                        <option key={s.key} value={s.key}>
                                            {s.label}
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>

                    {symptomKey === "other" && (
                        <div>
                            <Label className="text-xs font-semibold text-muted-foreground">
                                Describe it
                            </Label>
                            <Input
                                value={symptomCustom}
                                onChange={(e) => setSymptomCustom(e.target.value)}
                                placeholder="e.g. right eye hurts when I look up"
                                className="mt-1 h-11 rounded-2xl bg-muted border-0"
                            />
                        </div>
                    )}

                    <div>
                        <Label className="text-xs font-semibold text-muted-foreground">
                            Severity: {severity}/10
                        </Label>
                        <input
                            type="range"
                            min={0}
                            max={10}
                            value={severity}
                            onChange={(e) => setSeverity(Number(e.target.value))}
                            className="mt-2 w-full accent-primary"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label className="text-xs font-semibold text-muted-foreground">
                                Where?
                            </Label>
                            <select
                                value={bodyLocation}
                                onChange={(e) => setBodyLocation(e.target.value)}
                                className="mt-1 w-full h-11 rounded-2xl bg-muted border-0 px-3 text-sm"
                            >
                                <option value="">—</option>
                                {BODY_LOCATIONS.map((loc) => (
                                    <option key={loc} value={loc}>
                                        {BODY_LOCATION_LABELS[loc] ?? loc}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <Label className="text-xs font-semibold text-muted-foreground">
                                Duration (min)
                            </Label>
                            <Input
                                type="number"
                                inputMode="numeric"
                                value={durationMinutes}
                                onChange={(e) => setDurationMinutes(e.target.value)}
                                placeholder="45"
                                className="mt-1 h-11 rounded-2xl bg-muted border-0"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Action form */}
            {category === "action" && (
                <div className="rounded-2xl bg-card px-4 py-4 mb-4 space-y-4">
                    <div>
                        <Label className="text-xs font-semibold text-muted-foreground">
                            What did you do?
                        </Label>
                        <select
                            value={actionKey}
                            onChange={(e) => setActionKey(e.target.value)}
                            className="mt-1 w-full h-11 rounded-2xl bg-muted border-0 px-3 text-sm"
                        >
                            <option value="">— Pick an action —</option>
                            {ACTIONS.map((a) => (
                                <option key={a.key} value={a.key}>
                                    {a.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {actionKey === "other_action" && (
                        <div>
                            <Label className="text-xs font-semibold text-muted-foreground">
                                Describe it
                            </Label>
                            <Input
                                value={actionCustom}
                                onChange={(e) => setActionCustom(e.target.value)}
                                placeholder="e.g. took warm tea with honey"
                                className="mt-1 h-11 rounded-2xl bg-muted border-0"
                            />
                        </div>
                    )}

                    {actionKey === "took_medication" && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-semibold text-muted-foreground">
                                    Medication
                                </Label>
                                <Input
                                    value={medName}
                                    onChange={(e) => setMedName(e.target.value)}
                                    placeholder="Panadol"
                                    className="mt-1 h-11 rounded-2xl bg-muted border-0"
                                />
                            </div>
                            <div>
                                <Label className="text-xs font-semibold text-muted-foreground">
                                    Dose
                                </Label>
                                <Input
                                    value={medDose}
                                    onChange={(e) => setMedDose(e.target.value)}
                                    placeholder="500mg"
                                    className="mt-1 h-11 rounded-2xl bg-muted border-0"
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Mood form */}
            {category === "mood" && (
                <div className="rounded-2xl bg-card px-4 py-4 mb-4">
                    <Label className="text-xs font-semibold text-muted-foreground">
                        How are you feeling?
                    </Label>
                    <div className="mt-2 grid grid-cols-5 gap-2">
                        {MOOD_OPTIONS.map((m) => (
                            <button
                                key={m.value}
                                type="button"
                                onClick={() => setMoodValue(m.value)}
                                className={`py-3 rounded-2xl text-center transition-colors ${moodValue === m.value
                                    ? "bg-primary/15 border border-primary/40"
                                    : "bg-muted border border-transparent"
                                    }`}
                            >
                                <div className="text-2xl">{m.emoji}</div>
                                <div className="text-[10px] text-muted-foreground mt-0.5">
                                    {m.label}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Notes */}
            <div className="rounded-2xl bg-card px-4 py-4 mb-4">
                <Label className="text-xs font-semibold text-muted-foreground">
                    Notes (optional)
                </Label>
                <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Anything else you want to remember…"
                    className="mt-1 rounded-2xl bg-muted border-0"
                />
            </div>

            {diary.addEntry.isError && (
                <p className="text-xs text-destructive mb-3">
                    {(diary.addEntry.error as Error)?.message ?? "Could not save"}
                </p>
            )}

            {/* Actions — fixed bottom, same style as exam page */}
            <div className="fixed bottom-0 left-0 right-0 z-30 bg-background border-t border-border">
                <div
                    className="max-w-3xl mx-auto px-4 py-3 flex gap-3"
                    style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
                >
                    <Button
                        variant="secondary"
                        onClick={() => navigate(-1)}
                        className="flex-1 h-12 rounded-2xl"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!canSave || diary.addEntry.isPending}
                        className="flex-1 h-12 rounded-2xl"
                    >
                        {diary.addEntry.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-1.5" /> Save entry
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
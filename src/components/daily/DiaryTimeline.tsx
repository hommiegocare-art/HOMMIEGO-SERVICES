// src/components/daily/DiaryTimeline.tsx
import { useState } from "react";
import {
    Trash2,
    Pencil,
    Check,
    Loader2,
    Save,
    X,
    Lock,
    Activity,
    Smile,
    FileText,
    Pill,
    Heart,
    StickyNote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDailyDiary } from "@/hooks/useDailyDiary";
import { symptomLabel, actionLabel, MOOD_OPTIONS } from "@/lib/dailyOptions";
import type { DailyEntry } from "@/types/daily";

function dayLabel(iso: string): string {
    const d = new Date(iso + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.floor(
        (today.getTime() - d.getTime()) / (24 * 3600 * 1000),
    );
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return d.toLocaleDateString(undefined, { weekday: "long" });
    return d.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
}

function timeLabel(iso: string): string {
    return new Date(iso).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function DiaryTimeline({
    clientId,
    range,
}: {
    clientId: string;
    range: { from: string; to: string };
}) {
    const diary = useDailyDiary(clientId, range);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editDraft, setEditDraft] = useState<Partial<DailyEntry>>({});

    if (diary.isLoading) {
        return (
            <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-20 rounded-2xl skeleton-shimmer" />
                ))}
            </div>
        );
    }

    if (diary.entries.length === 0) {
        return (
            <div className="rounded-2xl bg-muted/60 border border-border px-4 py-8 text-center">
                <FileText className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                    Nothing logged in this period yet.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {diary.days.map((day) => {
                const list = diary.byDay.get(day) ?? [];
                return (
                    <div key={day}>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1.5 px-1">
                            {dayLabel(day)}
                        </p>
                        <div className="space-y-2">
                            {list.map((entry) =>
                                editingId === entry.id ? (
                                    <EditCard
                                        key={entry.id}
                                        draft={editDraft}
                                        setDraft={setEditDraft}
                                        saving={diary.updateEntry.isPending}
                                        onCancel={() => {
                                            setEditingId(null);
                                            setEditDraft({});
                                        }}
                                        onSave={() => {
                                            diary.updateEntry.mutate(
                                                {
                                                    id: entry.id,
                                                    patch: {
                                                        title:
                                                            (editDraft.title as string) ||
                                                            null,
                                                        notes:
                                                            (editDraft.notes as string) ||
                                                            null,
                                                    },
                                                },
                                                {
                                                    onSuccess: () => {
                                                        setEditingId(null);
                                                        setEditDraft({});
                                                    },
                                                },
                                            );
                                        }}
                                    />
                                ) : (
                                    <EntryCard
                                        key={entry.id}
                                        entry={entry}
                                        isOwner={diary.isOwner}
                                        onEdit={() => {
                                            setEditingId(entry.id);
                                            setEditDraft({
                                                title: entry.title,
                                                notes: entry.notes,
                                            });
                                        }}
                                        onDelete={() => {
                                            if (
                                                confirm(
                                                    "Delete this entry? This cannot be undone.",
                                                )
                                            ) {
                                                diary.deleteEntry.mutate(entry.id);
                                            }
                                        }}
                                        onResolve={() =>
                                            diary.resolveEntry.mutate(entry.id)
                                        }
                                    />
                                ),
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* ---------------- Category metadata ---------------- */

function categoryMeta(entry: DailyEntry) {
    switch (entry.category) {
        case "symptom":
            return {
                icon: <Activity className="w-3.5 h-3.5" />,
                label: "Symptom",
                tone: "text-destructive",
            };
        case "mood":
            return {
                icon: <Smile className="w-3.5 h-3.5" />,
                label: "Mood",
                tone: "text-primary",
            };
        case "action":
            return entry.medication_name
                ? {
                    icon: <Pill className="w-3.5 h-3.5" />,
                    label: "Medication",
                    tone: "text-success",
                }
                : {
                    icon: <Heart className="w-3.5 h-3.5" />,
                    label: "Action",
                    tone: "text-success",
                };
        default:
            return {
                icon: <StickyNote className="w-3.5 h-3.5" />,
                label: "Note",
                tone: "text-muted-foreground",
            };
    }
}

/* ---------------- Entry card ---------------- */

function EntryCard({
    entry,
    isOwner,
    onEdit,
    onDelete,
    onResolve,
}: {
    entry: DailyEntry;
    isOwner: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onResolve: () => void;
}) {
    const title = (() => {
        if (entry.title) return entry.title;
        if (entry.category === "symptom") return symptomLabel(entry.symptom_key);
        if (entry.category === "action") return actionLabel(entry.action_key);
        if (entry.category === "mood") {
            return (
                MOOD_OPTIONS.find((m) => m.value === entry.severity)?.label ?? "Mood"
            );
        }
        return "Note";
    })();

    const meta = categoryMeta(entry);
    const hasActions = isOwner;

    return (
        <div className="rounded-2xl bg-muted/60 overflow-hidden">
            {/* ---- Content — edge-to-edge with just a light gutter ---- */}
            <div className="px-3 py-3">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-foreground truncate">
                        {title}
                    </p>
                    {entry.category === "symptom" && entry.severity != null && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive font-semibold">
                            {entry.severity}/10
                        </span>
                    )}
                    {entry.resolved && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                            <Check className="w-3 h-3" /> Resolved
                        </span>
                    )}
                    {entry.visibility === "private" && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">
                            <Lock className="w-3 h-3" /> Private
                        </span>
                    )}
                </div>

                <p className="text-[11px] text-muted-foreground mt-0.5">
                    {timeLabel(entry.logged_at)}
                    {entry.medication_name
                        ? ` · ${entry.medication_name}${entry.medication_dose
                            ? ` ${entry.medication_dose}`
                            : ""
                        }`
                        : ""}
                </p>

                {entry.notes && (
                    <p className="text-xs text-foreground mt-1 whitespace-pre-line">
                        {entry.notes}
                    </p>
                )}
            </div>

            {/* ---- Bottom row: category chip + actions, edge-to-edge ---- */}
            <div className="flex items-stretch border-t border-border/60">
                {/* Category chip — non-tappable, tinted by type */}
                <div
                    className={`
                        flex items-center gap-1.5 px-3
                        text-[10px] font-bold uppercase tracking-wider
                        border-r border-border/60
                        ${meta.tone}
                    `}
                >
                    {meta.icon}
                    <span>{meta.label}</span>
                </div>

                {/* Actions */}
                <div className="flex-1 flex items-stretch">
                    {entry.category === "symptom" && !entry.resolved && (
                        <ActionBtn
                            icon={<Check className="w-4 h-4" />}
                            label="Resolve"
                            tone="success"
                            onClick={onResolve}
                        />
                    )}
                    {hasActions && (
                        <>
                            <ActionBtn
                                icon={<Pencil className="w-4 h-4" />}
                                label="Edit"
                                tone="neutral"
                                onClick={onEdit}
                            />
                            <ActionBtn
                                icon={<Trash2 className="w-4 h-4" />}
                                label="Delete"
                                tone="destructive"
                                onClick={onDelete}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ---------------- Bottom action button ---------------- */

function ActionBtn({
    icon,
    label,
    tone,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    tone: "success" | "neutral" | "destructive";
    onClick: () => void;
}) {
    const color =
        tone === "success"
            ? "text-success"
            : tone === "destructive"
                ? "text-destructive"
                : "text-muted-foreground";
    return (
        <button
            type="button"
            onClick={onClick}
            className={`
                flex-1 flex items-center justify-center gap-1.5 py-2.5
                text-[11px] font-semibold
                active:bg-muted transition-colors
                border-r border-border/60 last:border-r-0
                ${color}
            `}
        >
            {icon}
            <span>{label}</span>
        </button>
    );
}

/* ---------------- Edit card ---------------- */

function EditCard({
    draft,
    setDraft,
    saving,
    onCancel,
    onSave,
}: {
    draft: Partial<DailyEntry>;
    setDraft: React.Dispatch<React.SetStateAction<Partial<DailyEntry>>>;
    saving: boolean;
    onCancel: () => void;
    onSave: () => void;
}) {
    return (
        <div className="rounded-2xl bg-muted/60 overflow-hidden">
            <div className="px-3 py-3 space-y-2">
                <div>
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Title
                    </Label>
                    <Input
                        value={(draft.title as string) ?? ""}
                        onChange={(e) =>
                            setDraft((d) => ({ ...d, title: e.target.value }))
                        }
                        className="mt-1 h-10 rounded-2xl bg-background border-0"
                    />
                </div>
                <div>
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Notes
                    </Label>
                    <Textarea
                        value={(draft.notes as string) ?? ""}
                        onChange={(e) =>
                            setDraft((d) => ({ ...d, notes: e.target.value }))
                        }
                        rows={2}
                        className="mt-1 rounded-2xl bg-background border-0"
                    />
                </div>
            </div>

            {/* Bottom action row — matches read-only card */}
            <div className="flex items-stretch border-t border-border/60">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold text-muted-foreground active:bg-muted transition-colors border-r border-border/60"
                >
                    <X className="w-4 h-4" />
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={onSave}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold text-primary active:bg-muted transition-colors disabled:opacity-60"
                >
                    {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Save
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
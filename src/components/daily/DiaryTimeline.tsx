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
                    <div key={i} className="h-16 rounded-2xl skeleton-shimmer" />
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
                        <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1.5">
                            {dayLabel(day)}
                        </p>
                        <div className="space-y-2">
                            {list.map((entry) =>
                                editingId === entry.id ? (
                                    <div
                                        key={entry.id}
                                        className="rounded-2xl bg-muted/60 px-3 py-3 space-y-2"
                                    >
                                        <div>
                                            <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                                Title
                                            </Label>
                                            <Input
                                                value={(editDraft.title as string) ?? ""}
                                                onChange={(e) =>
                                                    setEditDraft((d) => ({
                                                        ...d,
                                                        title: e.target.value,
                                                    }))
                                                }
                                                className="mt-1 h-10 rounded-2xl bg-background border-0"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                                Notes
                                            </Label>
                                            <Textarea
                                                value={(editDraft.notes as string) ?? ""}
                                                onChange={(e) =>
                                                    setEditDraft((d) => ({
                                                        ...d,
                                                        notes: e.target.value,
                                                    }))
                                                }
                                                rows={2}
                                                className="mt-1 rounded-2xl bg-background border-0"
                                            />
                                        </div>
                                        <div className="flex gap-2 pt-1">
                                            <Button
                                                variant="secondary"
                                                onClick={() => {
                                                    setEditingId(null);
                                                    setEditDraft({});
                                                }}
                                                className="flex-1 h-10 rounded-2xl"
                                            >
                                                <X className="w-3.5 h-3.5 mr-1.5" /> Cancel
                                            </Button>
                                            <Button
                                                onClick={() => {
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
                                                disabled={diary.updateEntry.isPending}
                                                className="flex-1 h-10 rounded-2xl"
                                            >
                                                {diary.updateEntry.isPending ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <Save className="w-3.5 h-3.5 mr-1.5" /> Save
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <EntryRow
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

function EntryRow({
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

    const icon = (() => {
        switch (entry.category) {
            case "symptom":
                return <Activity className="w-3.5 h-3.5 text-destructive" />;
            case "mood":
                return <Smile className="w-3.5 h-3.5 text-primary" />;
            default:
                return <FileText className="w-3.5 h-3.5 text-muted-foreground" />;
        }
    })();

    return (
        <div className="rounded-2xl bg-muted/60 px-3 py-2.5">
            <div className="flex items-start gap-2">
                <span className="h-8 w-8 rounded-xl bg-background inline-flex items-center justify-center shrink-0">
                    {icon}
                </span>
                <div className="flex-1 min-w-0">
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

                {isOwner && (
                    <div className="flex items-center gap-0.5 shrink-0">
                        {entry.category === "symptom" && !entry.resolved && (
                            <button
                                onClick={onResolve}
                                className="h-8 w-8 rounded-lg inline-flex items-center justify-center text-primary active:bg-background"
                                aria-label="Mark resolved"
                                title="Mark resolved"
                            >
                                <Check className="w-3.5 h-3.5" />
                            </button>
                        )}
                        <button
                            onClick={onEdit}
                            className="h-8 w-8 rounded-lg inline-flex items-center justify-center text-muted-foreground active:bg-background"
                            aria-label="Edit"
                        >
                            <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={onDelete}
                            className="h-8 w-8 rounded-lg inline-flex items-center justify-center text-destructive active:bg-background"
                            aria-label="Delete"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
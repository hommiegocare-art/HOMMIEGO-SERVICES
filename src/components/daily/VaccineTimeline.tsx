// src/components/daily/VaccineTimeline.tsx
import { Check, Clock, AlertTriangle, Circle } from "lucide-react";
import { useVaccineStatus } from "@/hooks/usePregnancy";
import type { DailyChildProfile, DailyChildEvent } from "@/types/daily";

export function VaccineTimeline({
    child,
    events,
}: {
    child: DailyChildProfile;
    events: DailyChildEvent[];
}) {
    const schedule = useVaccineStatus(child, events);

    if (schedule.length === 0) return null;

    const doneCount = schedule.filter((v) => v.status === "done").length;
    const overdueCount = schedule.filter((v) => v.status === "overdue").length;
    const dueCount = schedule.filter((v) => v.status === "due").length;
    const pct = Math.round((doneCount / schedule.length) * 100);

    return (
        <div className="rounded-2xl bg-muted/60 px-3 py-3">
            {/* Header + progress */}
            <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-foreground">
                    Immunization schedule
                </p>
                <span className="text-[10px] font-semibold text-muted-foreground">
                    {doneCount} / {schedule.length} ({pct}%)
                </span>
            </div>

            <div className="h-1.5 w-full rounded-full bg-background overflow-hidden mb-3">
                <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${pct}%` }}
                />
            </div>

            {/* Summary chips */}
            {(overdueCount > 0 || dueCount > 0) && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                    {overdueCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px] font-semibold">
                            <AlertTriangle className="w-3 h-3" /> {overdueCount} overdue
                        </span>
                    )}
                    {dueCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                            <Clock className="w-3 h-3" /> {dueCount} due
                        </span>
                    )}
                </div>
            )}

            {/* Schedule rows */}
            <div className="space-y-1">
                {schedule.map((v) => (
                    <div
                        key={v.key}
                        className="flex items-center gap-2 rounded-xl bg-background px-2.5 py-2"
                    >
                        <span className="shrink-0">
                            {v.status === "done" && (
                                <Check className="w-3.5 h-3.5 text-primary" />
                            )}
                            {v.status === "due" && (
                                <Clock className="w-3.5 h-3.5 text-primary" />
                            )}
                            {v.status === "overdue" && (
                                <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                            )}
                            {v.status === "upcoming" && (
                                <Circle className="w-3.5 h-3.5 text-muted-foreground/40" />
                            )}
                        </span>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">
                                {v.label}
                                {v.dose > 0 && (
                                    <span className="text-muted-foreground">
                                        {" "}
                                        · dose {v.dose}
                                    </span>
                                )}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                                {v.age_label}
                                {v.done_on
                                    ? ` · given ${new Date(v.done_on).toLocaleDateString(
                                        undefined,
                                        { day: "numeric", month: "short", year: "numeric" },
                                    )}`
                                    : ""}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
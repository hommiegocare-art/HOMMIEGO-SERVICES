// src/components/daily/DailyDiaryCard.tsx
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Calendar,
    Plus,
    Activity,
    HeartPulse,
    Printer,
    Flame,
    Clock,
    Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
    useDailyDiary,
    rangeForLastNDays,
    rangeForMonth,
} from "@/hooks/useDailyDiary";
import { useNavigate } from "react-router-dom";
import { DiaryTimeline } from "@/components/daily/DiaryTimeline";
import { PregnancyCard } from "@/components/daily/PregnancyCard";
import { ChildCard } from "./ChildCard";

type Tab = "timeline" | "heatmap" | "trends";

// ------------------------------------------------------------
// Helpers (unchanged)
// ------------------------------------------------------------

function todayLocal(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function yesterdayLocal(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function computeStreak(daysSet: Set<string>): number {
    if (daysSet.size === 0) return 0;
    const today = todayLocal();
    const yesterday = yesterdayLocal();
    let cursor: Date | null = null;
    if (daysSet.has(today)) cursor = new Date();
    else if (daysSet.has(yesterday)) {
        cursor = new Date();
        cursor.setDate(cursor.getDate() - 1);
    } else return 0;

    let streak = 0;
    while (cursor) {
        const y = cursor.getFullYear();
        const m = String(cursor.getMonth() + 1).padStart(2, "0");
        const d = String(cursor.getDate()).padStart(2, "0");
        const key = `${y}-${m}-${d}`;
        if (!daysSet.has(key)) break;
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
}

function timeAgo(iso: string): string {
    const t = new Date(iso).getTime();
    if (isNaN(t)) return "";
    const sec = Math.floor((Date.now() - t) / 1000);
    if (sec < 60) return "just now";
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const days = Math.floor(hr / 24);
    if (days === 1) return "yesterday";
    if (days < 30) return `${days}d ago`;
    const mo = Math.floor(days / 30);
    return mo === 1 ? "1 month ago" : `${mo} months ago`;
}

function daysSince(iso: string): number {
    const t = new Date(iso).getTime();
    if (isNaN(t)) return 0;
    return Math.floor((Date.now() - t) / (24 * 3600 * 1000));
}

// ------------------------------------------------------------
// Component
// ------------------------------------------------------------
export function DailyDiaryCard({
    clientId,
    defaultRangeDays = 30,
}: {
    clientId?: string;
    defaultRangeDays?: number;
}) {
    const [tab, setTab] = useState<Tab>("timeline");
    const navigate = useNavigate();
    const [rangeDays, setRangeDays] = useState<number>(defaultRangeDays);

    const range = useMemo(
        () =>
            rangeDays > 0
                ? rangeForLastNDays(rangeDays)
                : rangeForMonth(0),
        [rangeDays],
    );

    const diary = useDailyDiary(clientId, range);

    const patientSex = useQuery({
        queryKey: ["patient-sex", clientId],
        enabled: !!clientId,
        staleTime: 5 * 60_000,
        queryFn: async () => {
            const { data } = await supabase
                .from("profiles")
                .select("gender")
                .eq("id", clientId!)
                .maybeSingle();
            return (data?.gender as string | null) ?? null;
        },
    });

    const isFemale = useMemo(() => {
        const g = (patientSex.data ?? "").toLowerCase().trim();
        return g === "female" || g === "f";
    }, [patientSex.data]);

    const daysSet = useMemo(() => new Set(diary.days), [diary.days]);
    const streak = useMemo(() => computeStreak(daysSet), [daysSet]);

    const lastEntry = useMemo(() => {
        if (diary.entries.length === 0) return null;
        return diary.entries[0];
    }, [diary.entries]);

    const staleDays = lastEntry ? daysSince(lastEntry.logged_at) : null;
    const lastColor =
        staleDays == null
            ? "text-muted-foreground"
            : staleDays > 7
                ? "text-destructive"
                : staleDays > 3
                    ? "text-amber-600"
                    : "text-muted-foreground";

    const isEmpty = diary.totals.total === 0;

    if (!clientId) return null;

    return (
        <>
            {/*
                Card is now edge-to-edge capable: no px-4 on the wrapper.
                Each section provides its own px-4, EXCEPT the EmptyCTA
                which is a full-width tappable row.
            */}
            <div className="rounded-2xl bg-card py-4 mb-3 overflow-hidden">
                {/* ---------- Header ---------- */}
                <div className="flex items-center justify-between mb-2 px-4">
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        <HeartPulse className="w-4 h-4 text-primary shrink-0" />
                        <p className="text-sm font-bold text-foreground truncate">
                            Daily health diary
                        </p>

                        {streak >= 2 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-700 px-2 py-0.5 text-[10px] font-semibold shrink-0">
                                <Flame className="w-3 h-3" /> {streak} days
                            </span>
                        )}

                        {!isEmpty && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold shrink-0">
                                {diary.totals.total} entries
                            </span>
                        )}
                    </div>

                    {diary.isOwner && (
                        <div className="flex items-center gap-1.5 shrink-0">
                            <button
                                onClick={() => navigate("/health/print")}
                                className="h-9 w-9 rounded-2xl inline-flex items-center justify-center text-muted-foreground active:bg-muted"
                                title="Print / Save PDF"
                                aria-label="Print / Save PDF"
                            >
                                <Printer className="w-3.5 h-3.5" />
                            </button>
                            <Button
                                onClick={() => navigate("/health/log")}
                                size="sm"
                                className="h-9 rounded-2xl"
                            >
                                <Plus className="w-3.5 h-3.5 mr-1" /> Log
                            </Button>
                        </div>
                    )}
                </div>

                {/* ---------- Last-logged line ---------- */}
                {lastEntry && (
                    <div className="flex items-center gap-1.5 mb-3 text-[11px] px-4">
                        <Clock className={`w-3 h-3 ${lastColor}`} />
                        <span className={lastColor}>
                            {diary.isOwner ? "Last logged " : "Last entry: "}
                            <strong>{timeAgo(lastEntry.logged_at)}</strong>
                        </span>
                    </div>
                )}

                {/* ---------- Empty state CTA — EDGE TO EDGE ---------- */}
                {isEmpty && diary.isOwner && (
                    <EmptyCTA onLog={() => navigate("/health/log")} />
                )}

                {/* ---------- Range chips ---------- */}
                <div className="flex gap-1.5 mt-4 mb-3 flex-wrap px-4">
                    {[
                        { label: "7 days", days: 7 },
                        { label: "30 days", days: 30 },
                        { label: "This month", days: 0 },
                    ].map((r) => (
                        <button
                            key={r.label}
                            onClick={() => setRangeDays(r.days)}
                            className={`h-8 px-3 rounded-2xl text-xs font-semibold ${rangeDays === r.days
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground active:bg-secondary"
                                }`}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>

                {/* ---------- Tabs (edge-to-edge scroll) ---------- */}
                <div className="px-4 mb-4 overflow-x-auto">
                    <div className="flex gap-1 min-w-max">
                        {(["timeline", "heatmap", "trends"] as Tab[]).map((t) => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className={`h-9 px-3 rounded-2xl text-xs font-semibold whitespace-nowrap capitalize transition-colors ${tab === t
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground active:bg-secondary"
                                    }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ---------- Bodies ---------- */}
                <div className="px-4">
                    {tab === "timeline" && (
                        <DiaryTimeline clientId={clientId} range={range} />
                    )}

                    {tab === "heatmap" && (
                        <HeatmapTab
                            range={range}
                            byDay={diary.byDay}
                            isLoading={diary.isLoading}
                        />
                    )}

                    {tab === "trends" && (
                        <TrendsTab
                            entries={diary.entries}
                            totals={diary.totals}
                            isLoading={diary.isLoading}
                        />
                    )}
                </div>
            </div>

            {isFemale && <PregnancyCard clientId={clientId} />}
            {isFemale && <ChildCard motherId={clientId} />}
        </>
    );
}

// ------------------------------------------------------------
// Empty state CTA — native-feeling, full-width, tappable
// ------------------------------------------------------------
function EmptyCTA({ onLog }: { onLog: () => void }) {
    return (
        <button
            type="button"
            onClick={onLog}
            className="w-full flex items-center gap-3 px-4 py-3 bg-primary/5 active:bg-primary/10 transition-colors text-left"
        >

            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">
                    Start your health diary
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    Log symptoms, meds, or how you feel.
                </p>
            </div>
            <Plus className="w-4 h-4 text-primary shrink-0" />
        </button>
    );
}

// ============================================================
// Heatmap
// ============================================================
function HeatmapTab({
    range,
    byDay,
    isLoading,
}: {
    range: { from: string; to: string };
    byDay: Map<string, unknown[]>;
    isLoading: boolean;
}) {
    if (isLoading) {
        return <div className="h-40 rounded-2xl skeleton-shimmer" />;
    }

    const days: string[] = [];
    const d = new Date(range.from + "T00:00:00");
    const end = new Date(range.to + "T00:00:00");
    while (d <= end) {
        days.push(d.toISOString().slice(0, 10));
        d.setDate(d.getDate() + 1);
    }

    const maxCount = Math.max(
        1,
        ...days.map((day) => (byDay.get(day)?.length ?? 0)),
    );

    return (
        <div>
            <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                    Each square is one day. Darker = more entries.
                </p>
            </div>
            <div
                className="grid gap-1"
                style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}
            >
                {days.map((day) => {
                    const count = byDay.get(day)?.length ?? 0;
                    const intensity = count / maxCount;
                    return (
                        <div
                            key={day}
                            title={`${day} · ${count} entries`}
                            className="aspect-square rounded-md"
                            style={{
                                background:
                                    count === 0
                                        ? "hsl(var(--muted))"
                                        : `hsl(var(--primary) / ${0.15 + intensity * 0.85})`,
                            }}
                        />
                    );
                })}
            </div>
        </div>
    );
}

// ============================================================
// Trends
// ============================================================
function TrendsTab({
    entries,
    totals,
    isLoading,
}: {
    entries: { category: string; symptom_key: string | null; title: string | null }[];
    totals: {
        total: number;
        symptoms: number;
        actions: number;
        outcomes: number;
        moods: number;
        notes: number;
    };
    isLoading: boolean;
}) {
    if (isLoading) {
        return <div className="h-40 rounded-2xl skeleton-shimmer" />;
    }

    const symptomCounts = new Map<string, number>();
    for (const e of entries) {
        if (e.category === "symptom") {
            const key = e.symptom_key ?? e.title ?? "other";
            symptomCounts.set(key, (symptomCounts.get(key) ?? 0) + 1);
        }
    }
    const topSymptoms = Array.from(symptomCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
                <Stat label="Symptoms" value={String(totals.symptoms)} />
                <Stat label="Actions" value={String(totals.actions)} />
                <Stat label="Moods" value={String(totals.moods)} />
                <Stat label="Notes" value={String(totals.notes)} />
            </div>

            {topSymptoms.length > 0 && (
                <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1.5">
                        Most frequent symptoms
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {topSymptoms.map(([key, count]) => (
                            <span
                                key={key}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-xs font-medium text-foreground"
                            >
                                {key.replace(/_/g, " ")}
                                <span className="text-muted-foreground">×{count}</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {topSymptoms.length === 0 && (
                <div className="rounded-2xl bg-muted/60 border border-border px-4 py-6 text-center">
                    <Activity className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">
                        No symptoms logged in this period.
                    </p>
                </div>
            )}
        </div>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl bg-muted px-3 py-3 text-center">
            <p className="text-lg font-black text-foreground">{value}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                {label}
            </p>
        </div>
    );
}
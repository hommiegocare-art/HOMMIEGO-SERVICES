// src/lib/healthAnalytics.ts
// Pure calculation functions — no React, no Supabase. Easy to test.
import type {
    DailyEntry,
    DailyPregnancy,
    DailyPregnancyEvent,
    DailyChildProfile,
    DailyChildEvent,
} from "@/types/daily";

// ============================================================
// Shared types
// ============================================================

export type TrendPoint = { date: string; value: number };
export type Slice = {
    key: string;
    label: string;
    count: number;
    color: string;
};
export type Insight = {
    tone: "good" | "warn" | "alert";
    title: string;
    body: string;
};

// ============================================================
// Diary analytics
// ============================================================

/** Group entries into a per-day count series over `days` days, ending today. */
export function dailyCountSeries(
    entries: DailyEntry[],
    days = 30,
): TrendPoint[] {
    const counts = new Map<string, number>();
    for (const e of entries) {
        const key = e.entry_date.slice(0, 10);
        counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return buildDailySeries(counts, days);
}

/** Pie slices: share of each category (symptom / action / mood / note / outcome). */
export function categorySlices(entries: DailyEntry[]): Slice[] {
    const colors: Record<string, string> = {
        symptom: "hsl(var(--destructive))",
        action: "hsl(var(--success))",
        mood: "hsl(var(--primary))",
        outcome: "hsl(38 92% 50%)",
        note: "hsl(var(--muted-foreground))",
    };
    const counts = new Map<string, number>();
    for (const e of entries) {
        counts.set(e.category, (counts.get(e.category) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([key, count]) => ({
        key,
        label: key.charAt(0).toUpperCase() + key.slice(1) + "s",
        count,
        color: colors[key] ?? "hsl(var(--primary))",
    }));
}

/** Top N symptoms by frequency. */
export function topSymptomSeries(entries: DailyEntry[], n = 6): Slice[] {
    const counts = new Map<string, number>();
    for (const e of entries) {
        if (e.category !== "symptom") continue;
        const key = e.symptom_key ?? e.title ?? "other";
        counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const sorted = Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, n);
    return sorted.map(([key, count], i) => ({
        key,
        label: key.replace(/_/g, " "),
        count,
        color: `hsl(var(--primary) / ${1 - i * 0.12})`,
    }));
}

/** Average severity per day (only symptom entries with severity). */
export function severitySeries(
    entries: DailyEntry[],
    days = 30,
): TrendPoint[] {
    const bucket = new Map<string, number[]>();
    for (const e of entries) {
        if (e.category !== "symptom" || e.severity == null) continue;
        const key = e.entry_date.slice(0, 10);
        if (!bucket.has(key)) bucket.set(key, []);
        bucket.get(key)!.push(e.severity);
    }
    const averaged = new Map<string, number>();
    for (const [k, vals] of bucket) {
        averaged.set(k, vals.reduce((a, b) => a + b, 0) / vals.length);
    }
    return buildDailySeries(averaged, days);
}

/** Compare last N days vs previous N days for a filtered metric. */
export function compareWindows(
    entries: DailyEntry[],
    pick: (e: DailyEntry) => boolean,
    windowDays = 7,
): { current: number; previous: number; deltaPct: number } {
    const now = new Date();
    const cut1 = new Date(now);
    cut1.setDate(cut1.getDate() - windowDays);
    const cut2 = new Date(now);
    cut2.setDate(cut2.getDate() - windowDays * 2);
    const iso = (d: Date) => d.toISOString().slice(0, 10);

    let current = 0;
    let previous = 0;
    for (const e of entries) {
        if (!pick(e)) continue;
        const day = e.entry_date.slice(0, 10);
        if (day > iso(cut1)) current++;
        else if (day > iso(cut2)) previous++;
    }
    const deltaPct =
        previous === 0
            ? current > 0
                ? 100
                : 0
            : Math.round(((current - previous) / previous) * 100);
    return { current, previous, deltaPct };
}

/**
 * Plain-English insights. Split into FACT (fire even with 1 entry)
 * and TREND (need 2+ weeks of comparison data).
 */
export function buildInsights(entries: DailyEntry[]): Insight[] {
    const out: Insight[] = [];
    const weekAgo = new Date(Date.now() - 7 * 864e5)
        .toISOString()
        .slice(0, 10);

    // ---------- FACT insights ----------

    if (entries.length === 1) {
        out.push({
            tone: "good",
            title: "You started logging",
            body: "First entry recorded. This page fills up as you keep logging.",
        });
    }

    if (entries.length === 2) {
        out.push({
            tone: "good",
            title: "Two entries in",
            body: "Trends need a few more days to appear. Keep going.",
        });
    }

    const lastSymptom = entries.find((e) => e.category === "symptom");
    if (lastSymptom && lastSymptom.severity != null) {
        const s = lastSymptom.severity;
        const label =
            lastSymptom.title ?? lastSymptom.symptom_key ?? "symptom";
        if (s >= 7) {
            out.push({
                tone: "alert",
                title: "Recent high-severity symptom",
                body: `"${label}" rated ${s}/10. Consider contacting a clinician if it persists.`,
            });
        } else if (s >= 4) {
            out.push({
                tone: "warn",
                title: "Moderate symptom logged",
                body: `"${label}" rated ${s}/10. Keep an eye on it.`,
            });
        }
    }

    const severe = entries.filter(
        (e) => e.category === "symptom" && (e.severity ?? 0) >= 7,
    );
    if (severe.length >= 2) {
        out.push({
            tone: "alert",
            title: `${severe.length} severe symptoms`,
            body: `You've logged ${severe.length} entries rated 7/10 or higher.`,
        });
    }

    const unresolved = entries.filter(
        (e) => e.category === "symptom" && !e.resolved,
    );
    if (unresolved.length >= 3) {
        out.push({
            tone: "warn",
            title: `${unresolved.length} unresolved symptoms`,
            body: 'Tap "Resolve" on an entry once a symptom has passed.',
        });
    }

    const meds = entries.filter((e) => !!e.medication_name);
    if (meds.length >= 1) {
        const latest = meds[0];
        out.push({
            tone: "good",
            title: "Medication on record",
            body: `Last logged: ${latest.medication_name}${latest.medication_dose ? ` (${latest.medication_dose})` : ""
                }.`,
        });
    }

    const lastMood = entries.find((e) => e.category === "mood");
    if (lastMood && lastMood.title) {
        out.push({
            tone: "good",
            title: `Mood: ${lastMood.title}`,
            body: "Most recent mood log. Mood trends appear after a few entries.",
        });
    }

    const entriesThisWeek = entries.filter(
        (e) => e.entry_date.slice(0, 10) >= weekAgo,
    ).length;
    if (entries.length >= 2 && entriesThisWeek === 0) {
        out.push({
            tone: "warn",
            title: "No entries this week",
            body: "Your last log was over 7 days ago. A quick note keeps your history accurate.",
        });
    }

    // ---------- TREND insights ----------

    const sym = compareWindows(entries, (e) => e.category === "symptom");
    if (sym.previous >= 2) {
        if (sym.deltaPct >= 50 && sym.current >= 3) {
            out.push({
                tone: "alert",
                title: "Symptoms rising",
                body: `${sym.current} symptoms this week, up ${sym.deltaPct}% from last week.`,
            });
        } else if (sym.deltaPct <= -40 && sym.previous >= 3) {
            out.push({
                tone: "good",
                title: "Symptoms easing",
                body: `Symptoms dropped ${Math.abs(sym.deltaPct)}% compared to last week.`,
            });
        }
    }

    // Deduplicate by title
    const seen = new Set<string>();
    return out.filter((i) => {
        if (seen.has(i.title)) return false;
        seen.add(i.title);
        return true;
    });
}

// ============================================================
// Pregnancy analytics
// ============================================================

/** Kick count per day from pregnancy events. */
export function kickSeries(
    events: DailyPregnancyEvent[],
    days = 30,
): TrendPoint[] {
    const bucket = new Map<string, number>();
    for (const e of events) {
        if (e.event_type !== "kick_session" || e.kick_count == null) continue;
        const key = e.entry_date.slice(0, 10);
        bucket.set(key, (bucket.get(key) ?? 0) + e.kick_count);
    }
    return buildDailySeries(bucket, days);
}

/** Contraction average duration (seconds) per day. */
export function contractionDurationSeries(
    events: DailyPregnancyEvent[],
    days = 30,
): TrendPoint[] {
    const bucket = new Map<string, number[]>();
    for (const e of events) {
        if (
            e.event_type !== "contraction" ||
            e.contraction_duration_seconds == null
        )
            continue;
        const key = e.entry_date.slice(0, 10);
        if (!bucket.has(key)) bucket.set(key, []);
        bucket.get(key)!.push(e.contraction_duration_seconds);
    }
    const averaged = new Map<string, number>();
    for (const [k, vals] of bucket) {
        averaged.set(k, vals.reduce((a, b) => a + b, 0) / vals.length);
    }
    return buildDailySeries(averaged, days);
}

/** Weight (kg) per day — most recent entry per day wins. */
export function pregnancyWeightSeries(
    events: DailyPregnancyEvent[],
    days = 90,
): TrendPoint[] {
    const bucket = new Map<string, number>();
    for (const e of events) {
        if (e.event_type !== "weight" || e.weight_kg == null) continue;
        const key = e.entry_date.slice(0, 10);
        bucket.set(key, e.weight_kg);
    }
    return buildDailySeries(bucket, days);
}

/** Systolic BP per day. */
export function bpSystolicSeries(
    events: DailyPregnancyEvent[],
    days = 90,
): TrendPoint[] {
    const bucket = new Map<string, number>();
    for (const e of events) {
        if (e.event_type !== "bp" || e.bp_systolic == null) continue;
        const key = e.entry_date.slice(0, 10);
        bucket.set(key, e.bp_systolic);
    }
    return buildDailySeries(bucket, days);
}

/** Diastolic BP per day. */
export function bpDiastolicSeries(
    events: DailyPregnancyEvent[],
    days = 90,
): TrendPoint[] {
    const bucket = new Map<string, number>();
    for (const e of events) {
        if (e.event_type !== "bp" || e.bp_diastolic == null) continue;
        const key = e.entry_date.slice(0, 10);
        bucket.set(key, e.bp_diastolic);
    }
    return buildDailySeries(bucket, days);
}

/** Compute pregnancy week / trimester / days to due from LMP or EDD. */
export function pregnancyProgress(p: DailyPregnancy): {
    week: number;
    trimester: 1 | 2 | 3 | 0;
    daysToDue: number | null;
} {
    if (!p.lmp && !p.edd) return { week: 0, trimester: 0, daysToDue: null };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let lmp: Date;
    if (p.lmp) {
        lmp = new Date(p.lmp);
    } else {
        // Derive from EDD (EDD = LMP + 280 days)
        const edd = new Date(p.edd!);
        lmp = new Date(edd);
        lmp.setDate(lmp.getDate() - 280);
    }

    const diffDays = Math.floor(
        (today.getTime() - lmp.getTime()) / 86_400_000,
    );
    const week = Math.max(0, Math.floor(diffDays / 7));
    const trimester: 1 | 2 | 3 | 0 =
        week < 1 ? 0 : week < 13 ? 1 : week < 28 ? 2 : 3;

    let daysToDue: number | null = null;
    if (p.edd) {
        daysToDue = Math.ceil(
            (new Date(p.edd).getTime() - today.getTime()) / 86_400_000,
        );
    } else if (p.lmp) {
        const edd = new Date(lmp);
        edd.setDate(edd.getDate() + 280);
        daysToDue = Math.ceil((edd.getTime() - today.getTime()) / 86_400_000);
    }

    return { week, trimester, daysToDue };
}

// ============================================================
// Child analytics
// ============================================================

/** Child weight over time, one point per event date. */
export function childWeightSeries(events: DailyChildEvent[]): TrendPoint[] {
    return childMetricSeries(events, "weight_kg");
}

/** Child height over time. */
export function childHeightSeries(events: DailyChildEvent[]): TrendPoint[] {
    return childMetricSeries(events, "height_cm");
}

/** Child head circumference over time. */
export function childHeadSeries(events: DailyChildEvent[]): TrendPoint[] {
    return childMetricSeries(events, "head_circumference_cm");
}

/** Child MUAC (mid-upper arm circumference) over time. */
export function childMuacSeries(events: DailyChildEvent[]): TrendPoint[] {
    return childMetricSeries(events, "muac_cm");
}

function childMetricSeries(
    events: DailyChildEvent[],
    key: "weight_kg" | "height_cm" | "head_circumference_cm" | "muac_cm",
): TrendPoint[] {
    const bucket = new Map<string, number>();
    for (const e of events) {
        const v = e[key];
        if (v == null) continue;
        const day = e.entry_date.slice(0, 10);
        bucket.set(day, Number(v)); // latest per day
    }
    return Array.from(bucket.entries())
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([date, value]) => ({ date, value }));
}

/** Count of vaccines logged. */
export function vaccineCount(events: DailyChildEvent[]): number {
    return events.filter((e) => e.event_type === "vaccine").length;
}

/** Count of clinic visits logged. */
export function clinicVisitCount(events: DailyChildEvent[]): number {
    return events.filter((e) => e.event_type === "clinic_visit").length;
}

/** Illness / injury breakdown by illness_type. */
export function illnessSlices(events: DailyChildEvent[]): Slice[] {
    const counts = new Map<string, number>();
    for (const e of events) {
        if (e.event_type !== "illness" && e.event_type !== "injury") continue;
        const key = e.illness_type ?? e.event_type;
        counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);
    if (total === 0) return [];
    return Array.from(counts.entries()).map(([key, count], i) => ({
        key,
        label: key.replace(/_/g, " "),
        count,
        color: `hsl(var(--destructive) / ${0.9 - i * 0.12})`,
    }));
}

/** Group child events by event_type for counting. */
export function childEventSlices(events: DailyChildEvent[]): Slice[] {
    const counts = new Map<string, number>();
    for (const e of events) {
        counts.set(e.event_type, (counts.get(e.event_type) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([key, count], i) => ({
        key,
        label: key.replace(/_/g, " "),
        count,
        color: `hsl(var(--primary) / ${1 - i * 0.08})`,
    }));
}

/** Kids younger than 5 (still in the tracking window). */
export function activeChildren(
    children: DailyChildProfile[],
): DailyChildProfile[] {
    return children.filter((c) => c.is_active);
}

// ============================================================
// Shared helpers
// ============================================================

/** Turn a bucket map into a continuous daily series ending today. */
function buildDailySeries(
    bucket: Map<string, number>,
    days: number,
): TrendPoint[] {
    const out: TrendPoint[] = [];
    const d = new Date();
    d.setDate(d.getDate() - (days - 1));
    for (let i = 0; i < days; i++) {
        const key = d.toISOString().slice(0, 10);
        out.push({ date: key, value: bucket.get(key) ?? 0 });
        d.setDate(d.getDate() + 1);
    }
    return out;
}
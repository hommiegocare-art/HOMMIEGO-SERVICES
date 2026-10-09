// src/hooks/useDailyDiary.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import type { DailyEntry } from "@/types/daily";

// ============================================================
// Bundle — grouped view + raw list
// ============================================================
export type DiaryBundle = {
    entries: DailyEntry[];
    byDay: Map<string, DailyEntry[]>;   // key = yyyy-mm-dd
    days: string[];                     // sorted desc, unique days
    totals: {
        total: number;
        symptoms: number;
        actions: number;
        outcomes: number;
        moods: number;
        notes: number;
    };
};

const EMPTY: DiaryBundle = {
    entries: [],
    byDay: new Map(),
    days: [],
    totals: {
        total: 0,
        symptoms: 0,
        actions: 0,
        outcomes: 0,
        moods: 0,
        notes: 0,
    },
};

function groupEntries(entries: DailyEntry[]): DiaryBundle {
    const byDay = new Map<string, DailyEntry[]>();
    const totals = {
        total: entries.length,
        symptoms: 0,
        actions: 0,
        outcomes: 0,
        moods: 0,
        notes: 0,
    };

    for (const e of entries) {
        const day = e.entry_date.slice(0, 10);
        if (!byDay.has(day)) byDay.set(day, []);
        byDay.get(day)!.push(e);

        switch (e.category) {
            case "symptom": totals.symptoms++; break;
            case "action": totals.actions++; break;
            case "outcome": totals.outcomes++; break;
            case "mood": totals.moods++; break;
            case "note": totals.notes++; break;
        }
    }

    // sort each day's entries newest-first by logged_at
    for (const list of byDay.values()) {
        list.sort(
            (a, b) =>
                new Date(b.logged_at).getTime() -
                new Date(a.logged_at).getTime(),
        );
    }

    const days = Array.from(byDay.keys()).sort((a, b) => (a < b ? 1 : -1));

    return { entries, byDay, days, totals };
}

// ============================================================
// Fetch — range query
// ============================================================
async function fetchDiary(
    clientId: string,
    from: string,
    to: string,
): Promise<DailyEntry[]> {
    const { data, error } = await supabase
        .from("daily_entries")
        .select("*")
        .eq("client_id", clientId)
        .gte("entry_date", from)
        .lte("entry_date", to)
        .order("entry_date", { ascending: false })
        .order("logged_at", { ascending: false })
        .limit(1000);

    if (error) throw error;
    return (data ?? []) as DailyEntry[];
}

// ============================================================
// Date helpers
// ============================================================
function isoDate(d: Date): string {
    return d.toISOString().slice(0, 10);
}

export function rangeForMonth(offsetMonths = 0): { from: string; to: string } {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth() + offsetMonths, 1);
    const last = new Date(now.getFullYear(), now.getMonth() + offsetMonths + 1, 0);
    return { from: isoDate(first), to: isoDate(last) };
}

export function rangeForLastNDays(n: number): { from: string; to: string } {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - (n - 1));
    return { from: isoDate(from), to: isoDate(to) };
}

// ============================================================
// Main hook
// ============================================================
export function useDailyDiary(
    clientId: string | undefined,
    range: { from: string; to: string },
) {
    const { user } = useSession();
    const qc = useQueryClient();

    const queryKey = [
        "daily-entries",
        clientId,
        range.from,
        range.to,
    ] as const;

    const query = useQuery({
        queryKey,
        enabled: !!clientId,
        staleTime: 30_000,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
        queryFn: () => fetchDiary(clientId!, range.from, range.to),
    });

    const bundle = useMemo<DiaryBundle>(
        () => (query.data ? groupEntries(query.data) : EMPTY),
        [query.data],
    );

    const isOwner = !!user && user.id === clientId;
    const isCaregiver = user?.role === "caregiver";

    const invalidate = () =>
        qc.invalidateQueries({ queryKey: ["daily-entries", clientId] });

    // ---------------------------------------------------------
    // Add — patient only
    // ---------------------------------------------------------
    const addEntry = useMutation({
        mutationFn: async (row: Partial<DailyEntry>) => {
            if (!clientId) throw new Error("No client id");
            const payload = {
                client_id: clientId,
                entry_date: row.entry_date ?? isoDate(new Date()),
                category: row.category ?? "note",
                symptom_key: row.symptom_key ?? null,
                symptom_custom: row.symptom_custom ?? null,
                action_key: row.action_key ?? null,
                action_custom: row.action_custom ?? null,
                title: row.title ?? null,
                notes: row.notes ?? null,
                severity: row.severity ?? null,
                body_location: row.body_location ?? null,
                duration_minutes: row.duration_minutes ?? null,
                medication_name: row.medication_name ?? null,
                medication_dose: row.medication_dose ?? null,
                resolved: row.resolved ?? false,
                resolved_at: row.resolved_at ?? null,
                visibility: row.visibility ?? "caregivers",
            };
            const { data, error } = await supabase
                .from("daily_entries")
                .insert(payload)
                .select()
                .single();
            if (error) throw error;
            return data as DailyEntry;
        },
        onSuccess: () => invalidate(),
    });

    // ---------------------------------------------------------
    // Update — patient only
    // ---------------------------------------------------------
    const updateEntry = useMutation({
        mutationFn: async ({
            id,
            patch,
        }: {
            id: string;
            patch: Partial<DailyEntry>;
        }) => {
            const { error } = await supabase
                .from("daily_entries")
                .update(patch)
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => invalidate(),
    });

    // ---------------------------------------------------------
    // Delete — patient only
    // ---------------------------------------------------------
    const deleteEntry = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("daily_entries")
                .delete()
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => invalidate(),
    });

    // ---------------------------------------------------------
    // Resolve a symptom (shortcut for the "it's gone" flow)
    // ---------------------------------------------------------
    const resolveEntry = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("daily_entries")
                .update({
                    resolved: true,
                    resolved_at: new Date().toISOString(),
                })
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => invalidate(),
    });

    return {
        // data
        bundle,
        entries: bundle.entries,
        byDay: bundle.byDay,
        days: bundle.days,
        totals: bundle.totals,

        // state
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        isOwner,
        isCaregiver,

        // mutations
        addEntry,
        updateEntry,
        deleteEntry,
        resolveEntry,
    };
}

// ============================================================
// Convenience hook — today's entries only
// ============================================================
export function useTodayEntries(clientId: string | undefined) {
    const today = isoDate(new Date());
    const range = useMemo(() => ({ from: today, to: today }), [today]);
    return useDailyDiary(clientId, range);
}

// ============================================================
// Convenience hook — rolling 30 days (for the caregiver view)
// ============================================================
export function useLast30Days(clientId: string | undefined) {
    const range = useMemo(() => rangeForLastNDays(30), []);
    return useDailyDiary(clientId, range);
}
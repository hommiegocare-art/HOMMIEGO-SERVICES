// src/hooks/useHealthInsights.ts
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type {
    DailyEntry,
    DailyPregnancy,
    DailyPregnancyEvent,
    DailyChildProfile,
    DailyChildEvent,
} from "@/types/daily";

export type HealthInsights = {
    entries: DailyEntry[];
    pregnancy: DailyPregnancy | null;
    pregnancyEvents: DailyPregnancyEvent[];
    children: DailyChildProfile[];
    childEvents: DailyChildEvent[];
};

export function useHealthInsights(
    clientId: string | undefined,
    days = 90,
    options: { includeMaternal?: boolean } = {},
) {
    const { includeMaternal = true } = options;

    const from = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() - days);
        return d.toISOString().slice(0, 10);
    }, [days]);

    const to = useMemo(() => new Date().toISOString().slice(0, 10), []);

    return useQuery({
        queryKey: [
            "health-insights",
            clientId,
            from,
            to,
            includeMaternal,
        ],
        enabled: !!clientId,
        staleTime: 60_000,
        queryFn: async (): Promise<HealthInsights> => {
            // Diary is always fetched
            const entriesPromise = supabase
                .from("daily_entries")
                .select("*")
                .eq("client_id", clientId!)
                .gte("entry_date", from)
                .lte("entry_date", to)
                .order("logged_at", { ascending: false });

            // Maternal queries are skipped for male patients
            const pregPromise = includeMaternal
                ? supabase
                    .from("daily_pregnancy")
                    .select("*")
                    .eq("client_id", clientId!)
                    .eq("is_active", true)
                    .maybeSingle()
                : Promise.resolve({ data: null, error: null });

            const pregEventsPromise = includeMaternal
                ? supabase
                    .from("daily_pregnancy_events")
                    .select("*")
                    .eq("client_id", clientId!)
                    .gte("entry_date", from)
                    .lte("entry_date", to)
                : Promise.resolve({ data: [], error: null });

            const childrenPromise = includeMaternal
                ? supabase
                    .from("daily_child_profiles")
                    .select("*")
                    .eq("mother_id", clientId!)
                    .eq("is_active", true)
                : Promise.resolve({ data: [], error: null });

            const childEventsPromise = includeMaternal
                ? supabase
                    .from("daily_child_events")
                    .select("*")
                    .eq("mother_id", clientId!)
                    .gte("entry_date", from)
                    .lte("entry_date", to)
                : Promise.resolve({ data: [], error: null });

            const [
                entriesRes,
                pregRes,
                pregEventsRes,
                childrenRes,
                childEventsRes,
            ] = await Promise.all([
                entriesPromise,
                pregPromise,
                pregEventsPromise,
                childrenPromise,
                childEventsPromise,
            ]);

            // Normalize entry_date to "yyyy-mm-dd" in case DB returns full timestamps
            const norm = <T extends { entry_date: string }>(
                rows: T[] | null | undefined,
            ): T[] =>
                (rows ?? []).map((r) => ({
                    ...r,
                    entry_date: r.entry_date.slice(0, 10),
                }));

            return {
                entries: norm(entriesRes.data) as DailyEntry[],
                pregnancy: (pregRes.data as DailyPregnancy | null) ?? null,
                pregnancyEvents: norm(
                    pregEventsRes.data,
                ) as DailyPregnancyEvent[],
                children: (childrenRes.data ?? []) as DailyChildProfile[],
                childEvents: norm(childEventsRes.data) as DailyChildEvent[],
            };
        },
    });
}
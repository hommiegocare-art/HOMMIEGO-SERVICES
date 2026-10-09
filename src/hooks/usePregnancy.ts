// src/hooks/usePregnancy.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import {
    KENYA_VACCINE_SCHEDULE,
    ageMonths,
    weeksSince,
} from "@/lib/dailyOptions";
import type {
    DailyPregnancy,
    DailyPregnancyEvent,
    DailyBirth,
    DailyChildProfile,
    DailyChildEvent,
} from "@/types/daily";

// ============================================================
// Date helpers
// ============================================================
function isoDate(d: Date): string {
    return d.toISOString().slice(0, 10);
}

function addDays(d: Date, days: number): Date {
    const out = new Date(d);
    out.setDate(out.getDate() + days);
    return out;
}

// Standard Naegele's rule: EDD = LMP + 280 days
export function eddFromLmp(lmp: string): string {
    const d = new Date(lmp);
    return isoDate(addDays(d, 280));
}

export function weekFromLmp(lmp: string | null): number {
    return weeksSince(lmp ?? undefined);
}

// ============================================================
// 1. PREGNANCY — profile
// ============================================================
export function usePregnancy(clientId: string | undefined) {
    const { user } = useSession();
    const qc = useQueryClient();

    const query = useQuery({
        queryKey: ["daily-pregnancy", clientId],
        enabled: !!clientId,
        staleTime: 60_000,
        refetchOnMount: "always",
        queryFn: async () => {
            const { data, error } = await supabase
                .from("daily_pregnancy")
                .select("*")
                .eq("client_id", clientId!)
                .maybeSingle();
            if (error) throw error;
            return (data as DailyPregnancy) ?? null;
        },
    });

    const isOwner = !!user && user.id === clientId;
    const isCaregiver = user?.role === "caregiver";

    const invalidate = () =>
        qc.invalidateQueries({ queryKey: ["daily-pregnancy", clientId] });

    const startPregnancy = useMutation({
        mutationFn: async (row: Partial<DailyPregnancy>) => {
            if (!clientId) throw new Error("No client id");
            const payload: Partial<DailyPregnancy> = {
                client_id: clientId,
                lmp: row.lmp ?? null,
                edd: row.edd ?? (row.lmp ? eddFromLmp(row.lmp) : null),
                gravida: row.gravida ?? null,
                para: row.para ?? null,
                risk_level: row.risk_level ?? "low",
                care_provider: row.care_provider ?? null,
                care_provider_phone: row.care_provider_phone ?? null,
                birth_plan: row.birth_plan ?? null,
                notes: row.notes ?? null,
                is_active: true,
            };
            const { error } = await supabase
                .from("daily_pregnancy")
                .upsert(payload, { onConflict: "client_id" });
            if (error) throw error;
        },
        onSuccess: () => invalidate(),
    });

    const updatePregnancy = useMutation({
        mutationFn: async (patch: Partial<DailyPregnancy>) => {
            if (!clientId) throw new Error("No client id");
            // If LMP changed and EDD wasn't explicitly provided, recompute EDD
            const finalPatch: Partial<DailyPregnancy> = { ...patch };
            if (patch.lmp && !patch.edd) {
                finalPatch.edd = eddFromLmp(patch.lmp);
            }
            const { error } = await supabase
                .from("daily_pregnancy")
                .update(finalPatch)
                .eq("client_id", clientId);
            if (error) throw error;
        },
        onSuccess: () => invalidate(),
    });

    const endPregnancy = useMutation({
        mutationFn: async () => {
            if (!clientId) throw new Error("No client id");
            const { error } = await supabase
                .from("daily_pregnancy")
                .update({ is_active: false })
                .eq("client_id", clientId);
            if (error) throw error;
        },
        onSuccess: () => invalidate(),
    });

    const pregnancy = query.data ?? null;
    const currentWeek = pregnancy?.lmp ? weekFromLmp(pregnancy.lmp) : 0;
    const trimester = currentWeek
        ? currentWeek <= 12
            ? 1
            : currentWeek <= 27
                ? 2
                : 3
        : 0;
    const daysToDue = pregnancy?.edd
        ? Math.max(
            0,
            Math.round(
                (new Date(pregnancy.edd).getTime() - Date.now()) /
                (24 * 3600 * 1000),
            ),
        )
        : null;

    return {
        pregnancy,
        currentWeek,
        trimester,
        daysToDue,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        isOwner,
        isCaregiver,
        startPregnancy,
        updatePregnancy,
        endPregnancy,
    };
}

// ============================================================
// 2. PREGNANCY EVENTS — kicks, contractions, weights, ANC
// ============================================================
export function usePregnancyEvents(
    clientId: string | undefined,
    range: { from: string; to: string },
) {
    const { user } = useSession();
    const qc = useQueryClient();

    const queryKey = [
        "daily-pregnancy-events",
        clientId,
        range.from,
        range.to,
    ] as const;

    const query = useQuery({
        queryKey,
        enabled: !!clientId,
        staleTime: 30_000,
        refetchOnMount: "always",
        queryFn: async () => {
            const { data, error } = await supabase
                .from("daily_pregnancy_events")
                .select("*")
                .eq("client_id", clientId!)
                .gte("entry_date", range.from)
                .lte("entry_date", range.to)
                .order("entry_date", { ascending: false })
                .order("logged_at", { ascending: false })
                .limit(500);
            if (error) throw error;
            return (data ?? []) as DailyPregnancyEvent[];
        },
    });

    const events = query.data ?? [];

    const byType = useMemo(() => {
        const m = new Map<string, DailyPregnancyEvent[]>();
        for (const e of events) {
            if (!m.has(e.event_type)) m.set(e.event_type, []);
            m.get(e.event_type)!.push(e);
        }
        return m;
    }, [events]);

    const isOwner = !!user && user.id === clientId;
    const isCaregiver = user?.role === "caregiver";

    const invalidate = () =>
        qc.invalidateQueries({
            queryKey: ["daily-pregnancy-events", clientId],
        });

    const addEvent = useMutation({
        mutationFn: async (row: Partial<DailyPregnancyEvent>) => {
            if (!clientId) throw new Error("No client id");
            const { error } = await supabase
                .from("daily_pregnancy_events")
                .insert({
                    client_id: clientId,
                    event_type: row.event_type ?? "note",
                    entry_date: row.entry_date ?? isoDate(new Date()),
                    kick_count: row.kick_count ?? null,
                    kick_duration_minutes: row.kick_duration_minutes ?? null,
                    contraction_duration_seconds:
                        row.contraction_duration_seconds ?? null,
                    contraction_interval_minutes:
                        row.contraction_interval_minutes ?? null,
                    contraction_intensity: row.contraction_intensity ?? null,
                    weight_kg: row.weight_kg ?? null,
                    bp_systolic: row.bp_systolic ?? null,
                    bp_diastolic: row.bp_diastolic ?? null,
                    fundal_height_cm: row.fundal_height_cm ?? null,
                    milestone_key: row.milestone_key ?? null,
                    appointment_with: row.appointment_with ?? null,
                    appointment_notes: row.appointment_notes ?? null,
                    notes: row.notes ?? null,
                    visibility: row.visibility ?? "caregivers",
                });
            if (error) throw error;
        },
        onSuccess: () => invalidate(),
    });

    const updateEvent = useMutation({
        mutationFn: async ({
            id,
            patch,
        }: {
            id: string;
            patch: Partial<DailyPregnancyEvent>;
        }) => {
            const { error } = await supabase
                .from("daily_pregnancy_events")
                .update(patch)
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => invalidate(),
    });

    const deleteEvent = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("daily_pregnancy_events")
                .delete()
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => invalidate(),
    });

    return {
        events,
        byType,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        isOwner,
        isCaregiver,
        addEvent,
        updateEvent,
        deleteEvent,
    };
}

// ============================================================
// 3. BIRTHS — delivery records
// ============================================================
export function useBirths(motherId: string | undefined) {
    const { user } = useSession();
    const qc = useQueryClient();

    const query = useQuery({
        queryKey: ["daily-births", motherId],
        enabled: !!motherId,
        staleTime: 60_000,
        refetchOnMount: "always",
        queryFn: async () => {
            const { data, error } = await supabase
                .from("daily_births")
                .select("*")
                .eq("mother_id", motherId!)
                .order("birth_date", { ascending: false });
            if (error) throw error;
            return (data ?? []) as DailyBirth[];
        },
    });

    const isOwner = !!user && user.id === motherId;
    const isCaregiver = user?.role === "caregiver";

    const invalidate = () =>
        qc.invalidateQueries({ queryKey: ["daily-births", motherId] });

    const addBirth = useMutation({
        mutationFn: async (row: Partial<DailyBirth>) => {
            if (!motherId) throw new Error("No mother id");
            const { data, error } = await supabase
                .from("daily_births")
                .insert({
                    mother_id: motherId,
                    pregnancy_client_id: row.pregnancy_client_id ?? motherId,
                    birth_date: row.birth_date ?? isoDate(new Date()),
                    birth_time: row.birth_time ?? null,
                    gestational_age_weeks: row.gestational_age_weeks ?? null,
                    gestational_age_days: row.gestational_age_days ?? null,
                    delivery_type: row.delivery_type ?? null,
                    delivery_location: row.delivery_location ?? null,
                    attended_by: row.attended_by ?? null,
                    labour_duration_hours: row.labour_duration_hours ?? null,
                    baby_weight_kg: row.baby_weight_kg ?? null,
                    baby_length_cm: row.baby_length_cm ?? null,
                    head_circumference_cm: row.head_circumference_cm ?? null,
                    apgar_1min: row.apgar_1min ?? null,
                    apgar_5min: row.apgar_5min ?? null,
                    outcome: row.outcome ?? "live_birth",
                    complications: row.complications ?? null,
                    nicu_admitted: row.nicu_admitted ?? false,
                    nicu_days: row.nicu_days ?? null,
                    notes: row.notes ?? null,
                })
                .select()
                .single();
            if (error) throw error;
            return data as DailyBirth;
        },
        onSuccess: () => invalidate(),
    });

    const updateBirth = useMutation({
        mutationFn: async ({
            id,
            patch,
        }: {
            id: string;
            patch: Partial<DailyBirth>;
        }) => {
            const { error } = await supabase
                .from("daily_births")
                .update(patch)
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => invalidate(),
    });

    const deleteBirth = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("daily_births")
                .delete()
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => invalidate(),
    });

    return {
        births: query.data ?? [],
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        isOwner,
        isCaregiver,
        addBirth,
        updateBirth,
        deleteBirth,
    };
}

// ============================================================
// 4. CHILDREN — profiles
// ============================================================
export function useChildren(motherId: string | undefined) {
    const { user } = useSession();
    const qc = useQueryClient();

    const query = useQuery({
        queryKey: ["daily-children", motherId],
        enabled: !!motherId,
        staleTime: 60_000,
        refetchOnMount: "always",
        queryFn: async () => {
            const { data, error } = await supabase
                .from("daily_child_profiles")
                .select("*")
                .eq("mother_id", motherId!)
                .order("date_of_birth", { ascending: false });
            if (error) throw error;
            return (data ?? []) as DailyChildProfile[];
        },
    });

    const isOwner = !!user && user.id === motherId;
    const isCaregiver = user?.role === "caregiver";

    const invalidate = () =>
        qc.invalidateQueries({ queryKey: ["daily-children", motherId] });

    const addChild = useMutation({
        mutationFn: async (row: Partial<DailyChildProfile>) => {
            if (!motherId) throw new Error("No mother id");
            const trackingEnd = row.date_of_birth
                ? isoDate(addDays(new Date(row.date_of_birth), 365 * 5))
                : null;
            const { data, error } = await supabase
                .from("daily_child_profiles")
                .insert({
                    mother_id: motherId,
                    birth_id: row.birth_id ?? null,
                    full_name: row.full_name ?? "Unnamed baby",
                    nickname: row.nickname ?? null,
                    sex: row.sex ?? "unknown",
                    date_of_birth:
                        row.date_of_birth ?? isoDate(new Date()),
                    birth_weight_kg: row.birth_weight_kg ?? null,
                    birth_length_cm: row.birth_length_cm ?? null,
                    birth_head_circumference_cm:
                        row.birth_head_circumference_cm ?? null,
                    delivery_type: row.delivery_type ?? null,
                    is_active: true,
                    tracking_end_date: row.tracking_end_date ?? trackingEnd,
                    primary_facility: row.primary_facility ?? null,
                    primary_facility_phone:
                        row.primary_facility_phone ?? null,
                    notes: row.notes ?? null,
                })
                .select()
                .single();
            if (error) throw error;
            return data as DailyChildProfile;
        },
        onSuccess: () => invalidate(),
    });

    const updateChild = useMutation({
        mutationFn: async ({
            id,
            patch,
        }: {
            id: string;
            patch: Partial<DailyChildProfile>;
        }) => {
            const { error } = await supabase
                .from("daily_child_profiles")
                .update(patch)
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => invalidate(),
    });

    const deleteChild = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("daily_child_profiles")
                .delete()
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => invalidate(),
    });

    return {
        children: query.data ?? [],
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        isOwner,
        isCaregiver,
        addChild,
        updateChild,
        deleteChild,
    };
}

// ============================================================
// 5. CHILD EVENTS — clinic, vaccines, growth, milestones
// ============================================================
export function useChildEvents(
    childId: string | undefined,
    motherId: string | undefined,
    range: { from: string; to: string } = { from: "1900-01-01", to: "2100-01-01" },
) {
    const { user } = useSession();
    const qc = useQueryClient();

    const queryKey = [
        "daily-child-events",
        childId,
        range.from,
        range.to,
    ] as const;

    const query = useQuery({
        queryKey,
        enabled: !!childId,
        staleTime: 30_000,
        refetchOnMount: "always",
        queryFn: async () => {
            const { data, error } = await supabase
                .from("daily_child_events")
                .select("*")
                .eq("child_id", childId!)
                .gte("entry_date", range.from)
                .lte("entry_date", range.to)
                .order("entry_date", { ascending: false })
                .order("logged_at", { ascending: false })
                .limit(500);
            if (error) throw error;
            return (data ?? []) as DailyChildEvent[];
        },
    });

    const events = query.data ?? [];

    const isOwner = !!user && user.id === motherId;
    const isCaregiver = user?.role === "caregiver";

    const invalidate = () =>
        qc.invalidateQueries({
            queryKey: ["daily-child-events", childId],
        });

    const addEvent = useMutation({
        mutationFn: async (row: Partial<DailyChildEvent>) => {
            if (!childId || !motherId) throw new Error("Missing ids");
            const { error } = await supabase
                .from("daily_child_events")
                .insert({
                    child_id: childId,
                    mother_id: motherId,
                    event_type: row.event_type ?? "note",
                    entry_date: row.entry_date ?? isoDate(new Date()),
                    visit_reason: row.visit_reason ?? null,
                    facility: row.facility ?? null,
                    attended_by: row.attended_by ?? null,
                    vaccine_key: row.vaccine_key ?? null,
                    vaccine_dose: row.vaccine_dose ?? null,
                    weight_kg: row.weight_kg ?? null,
                    height_cm: row.height_cm ?? null,
                    head_circumference_cm: row.head_circumference_cm ?? null,
                    muac_cm: row.muac_cm ?? null,
                    illness_type: row.illness_type ?? null,
                    severity: row.severity ?? null,
                    medication_name: row.medication_name ?? null,
                    medication_dose: row.medication_dose ?? null,
                    resolved: row.resolved ?? false,
                    resolved_at: row.resolved_at ?? null,
                    milestone_key: row.milestone_key ?? null,
                    title: row.title ?? null,
                    notes: row.notes ?? null,
                    visibility: row.visibility ?? "caregivers",
                });
            if (error) throw error;
        },
        onSuccess: () => invalidate(),
    });

    const updateEvent = useMutation({
        mutationFn: async ({
            id,
            patch,
        }: {
            id: string;
            patch: Partial<DailyChildEvent>;
        }) => {
            const { error } = await supabase
                .from("daily_child_events")
                .update(patch)
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => invalidate(),
    });

    const deleteEvent = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("daily_child_events")
                .delete()
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => invalidate(),
    });

    return {
        events,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        isOwner,
        isCaregiver,
        addEvent,
        updateEvent,
        deleteEvent,
    };
}

// ============================================================
// 6. VACCINE STATUS — compute due/overdue/done against Kenya EPI
// ============================================================
export type VaccineStatus = {
    key: string;
    label: string;
    dose: number;
    age_label: string;
    status: "done" | "due" | "overdue" | "upcoming";
    done_on: string | null;
};

export function useVaccineStatus(
    child: DailyChildProfile | null,
    events: DailyChildEvent[],
): VaccineStatus[] {
    return useMemo(() => {
        if (!child) return [];
        const dob = new Date(child.date_of_birth);
        if (isNaN(dob.getTime())) return [];

        const now = new Date();
        const ageDays = Math.floor(
            (now.getTime() - dob.getTime()) / (24 * 3600 * 1000),
        );

        // Map of what's already been recorded
        const givenMap = new Map<
            string,
            { date: string; dose: number }
        >();
        for (const e of events) {
            if (e.event_type === "vaccine" && e.vaccine_key) {
                const prev = givenMap.get(e.vaccine_key);
                if (
                    !prev ||
                    (e.vaccine_dose ?? 0) > prev.dose
                ) {
                    givenMap.set(e.vaccine_key, {
                        date: e.entry_date,
                        dose: e.vaccine_dose ?? 0,
                    });
                }
            }
        }

        return KENYA_VACCINE_SCHEDULE.map((v) => {
            const given = givenMap.get(v.key);
            let status: VaccineStatus["status"] = "upcoming";
            if (given) {
                status = "done";
            } else if (ageDays >= v.age_days_max) {
                status = "overdue";
            } else if (ageDays >= v.age_days_min) {
                status = "due";
            } else {
                status = "upcoming";
            }
            return {
                key: v.key,
                label: v.label,
                dose: v.dose,
                age_label: v.age_label,
                status,
                done_on: given?.date ?? null,
            };
        });
    }, [child, events]);
}

// ============================================================
// 7. CHILDHOOD SUMMARY — for the mother dashboard
// ============================================================
export function useChildhoodSummary(motherId: string | undefined) {
    const childrenQ = useChildren(motherId);
    const children = childrenQ.data ?? [];

    const activeChildren = useMemo(
        () => children.filter((c) => c.is_active),
        [children],
    );

    const childrenWithAge = useMemo(
        () =>
            activeChildren.map((c) => ({
                child: c,
                ageMonths: ageMonths(c.date_of_birth),
            })),
        [activeChildren],
    );

    return {
        ...childrenQ,
        children: activeChildren,
        childrenWithAge,
    };
}
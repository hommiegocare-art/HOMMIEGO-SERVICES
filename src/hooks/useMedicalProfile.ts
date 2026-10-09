// src/hooks/useMedicalProfile.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import type {
    ClientMedicalProfile,
    MedicalAllergy,
    MedicalMedication,
    MedicalCondition,
    MedicalSurgery,
    MedicalImmunization,
    MedicalFamilyHistoryRow,
    MedicalPregnancy,
    MedicalVisit,
} from "@/types/db";

// ============================================================
// Bundle type — everything for one patient in one object
// ============================================================
export type MedicalBundle = {
    profile: ClientMedicalProfile | null;
    allergies: MedicalAllergy[];
    medications: MedicalMedication[];
    conditions: MedicalCondition[];
    surgeries: MedicalSurgery[];
    immunizations: MedicalImmunization[];
    familyHistory: MedicalFamilyHistoryRow[];
    pregnancies: MedicalPregnancy[];
    visits: MedicalVisit[];
};

const EMPTY: MedicalBundle = {
    profile: null,
    allergies: [],
    medications: [],
    conditions: [],
    surgeries: [],
    immunizations: [],
    familyHistory: [],
    pregnancies: [],
    visits: [],
};

// ============================================================
// Fetch — parallel load of every medical table for one client
// ============================================================
async function fetchMedicalBundle(clientId: string): Promise<MedicalBundle> {
    const [
        profileRes,
        allergiesRes,
        medsRes,
        conditionsRes,
        surgeriesRes,
        immunizationsRes,
        familyRes,
        pregnanciesRes,
        visitsRes,
    ] = await Promise.all([
        supabase.from("client_medical_profile").select("*").eq("client_id", clientId).maybeSingle(),
        supabase.from("medical_allergies").select("*").eq("client_id", clientId).order("created_at"),
        supabase.from("medical_medications").select("*").eq("client_id", clientId).order("created_at"),
        supabase.from("medical_conditions").select("*").eq("client_id", clientId).order("created_at"),
        supabase.from("medical_surgeries").select("*").eq("client_id", clientId).order("created_at"),
        supabase.from("medical_immunizations").select("*").eq("client_id", clientId).order("administered_on", { ascending: false }),
        supabase.from("medical_family_history").select("*").eq("client_id", clientId).order("created_at"),
        supabase.from("medical_pregnancies").select("*").eq("client_id", clientId).order("year", { ascending: false }),
        supabase.from("medical_visits").select("*").eq("client_id", clientId).order("visit_date", { ascending: false }),
    ]);

    const firstError =
        profileRes.error ||
        allergiesRes.error ||
        medsRes.error ||
        conditionsRes.error ||
        surgeriesRes.error ||
        immunizationsRes.error ||
        familyRes.error ||
        pregnanciesRes.error ||
        visitsRes.error;
    if (firstError) throw firstError;

    return {
        profile: (profileRes.data as ClientMedicalProfile) ?? null,
        allergies: (allergiesRes.data ?? []) as MedicalAllergy[],
        medications: (medsRes.data ?? []) as MedicalMedication[],
        conditions: (conditionsRes.data ?? []) as MedicalCondition[],
        surgeries: (surgeriesRes.data ?? []) as MedicalSurgery[],
        immunizations: (immunizationsRes.data ?? []) as MedicalImmunization[],
        familyHistory: (familyRes.data ?? []) as MedicalFamilyHistoryRow[],
        pregnancies: (pregnanciesRes.data ?? []) as MedicalPregnancy[],
        visits: (visitsRes.data ?? []) as MedicalVisit[],
    };
}

// ============================================================
// Completion percent — computed client-side for live UI
// Mirrors the DB trigger's check_cols set
// ============================================================
const COMPLETION_FIELDS: (keyof ClientMedicalProfile)[] = [
    "blood_type",
    "date_of_birth",
    "sex_at_birth",
    "height_cm",
    "weight_kg",
    "allergies",
    "current_medications",
    "chronic_conditions",
    "past_surgeries",
    "family_history",
    "smoking_status",
    "alcohol_use",
    "living_situation",
    "next_of_kin_name",
    "next_of_kin_phone",
    "has_hypertension",
    "has_diabetes",
    "has_asthma",
    "has_heart_disease",
    "medication_adherence",
];

export function computeCompletion(profile: ClientMedicalProfile | null): number {
    if (!profile) return 0;
    let filled = 0;
    for (const k of COMPLETION_FIELDS) {
        const v = profile[k];
        if (v === null || v === undefined || v === "" || v === false) continue;
        if (Array.isArray(v) && v.length === 0) continue;
        filled++;
    }
    return Math.round((filled / COMPLETION_FIELDS.length) * 100);
}

// ============================================================
// The hook — pass the client's user id
// ============================================================
export function useMedicalProfile(clientId: string | undefined) {
    const { user } = useSession();
    const qc = useQueryClient();

    const queryKey = ["medical", clientId] as const;

    const query = useQuery({
        queryKey,
        enabled: !!clientId,
        staleTime: 30_000,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
        queryFn: () => fetchMedicalBundle(clientId!),
    });

    const bundle = query.data ?? EMPTY;
    const completionPercent = computeCompletion(bundle.profile);

    // Who is the viewer relative to this patient?
    const isOwner = !!user && user.id === clientId;
    const isCaregiver = user?.role === "caregiver";
    const isLocked = !!bundle.profile?.is_locked;

    const invalidate = () => qc.invalidateQueries({ queryKey: ["medical", clientId] });
    const invalidateAudit = () =>
        qc.invalidateQueries({ queryKey: ["medical-audit", clientId] });

    // ------------------------------------------------------------
    // Main profile row — patient-editable fields
    // ------------------------------------------------------------
    const updateMain = useMutation({
        mutationFn: async (patch: Partial<ClientMedicalProfile>) => {
            if (!clientId) throw new Error("No client id");
            const { error } = await supabase
                .from("client_medical_profile")
                .update(patch)                       // ← plain update
                .eq("client_id", clientId);
            if (error) throw error;
        },
        onSuccess: () => {
            invalidate();
            invalidateAudit();
        },
    });

    // ------------------------------------------------------------
    // Generic child-table helpers
    // ------------------------------------------------------------
    type ChildTable =
        | "medical_allergies"
        | "medical_medications"
        | "medical_conditions"
        | "medical_surgeries"
        | "medical_immunizations"
        | "medical_family_history"
        | "medical_pregnancies";

    const addChild = <T extends Record<string, unknown>>(table: ChildTable) =>
        useMutation({
            mutationFn: async (row: T) => {
                if (!clientId) throw new Error("No client id");
                const { error } = await supabase
                    .from(table)
                    .insert({ client_id: clientId, ...row });
                if (error) throw error;
            },
            onSuccess: () => {
                invalidate();
                invalidateAudit();
            },
        });

    const updateChild = <T extends Record<string, unknown>>(table: ChildTable) =>
        useMutation({
            mutationFn: async ({ id, patch }: { id: string; patch: T }) => {
                const { error } = await supabase.from(table).update(patch).eq("id", id);
                if (error) throw error;
            },
            onSuccess: () => {
                invalidate();
                invalidateAudit();
            },
        });

    const deleteChild = (table: ChildTable) =>
        useMutation({
            mutationFn: async (id: string) => {
                const { error } = await supabase.from(table).delete().eq("id", id);
                if (error) throw error;
            },
            onSuccess: () => {
                invalidate();
                invalidateAudit();
            },
        });

    // Named mutations per table (so call sites read cleanly)
    const addAllergy = addChild("medical_allergies");
    const updateAllergy = updateChild("medical_allergies");
    const deleteAllergy = deleteChild("medical_allergies");

    const addMedication = addChild("medical_medications");
    const updateMedication = updateChild("medical_medications");
    const deleteMedication = deleteChild("medical_medications");

    const addCondition = addChild("medical_conditions");
    const updateCondition = updateChild("medical_conditions");
    const deleteCondition = deleteChild("medical_conditions");

    const addSurgery = addChild("medical_surgeries");
    const updateSurgery = updateChild("medical_surgeries");
    const deleteSurgery = deleteChild("medical_surgeries");

    const addImmunization = addChild("medical_immunizations");
    const updateImmunization = updateChild("medical_immunizations");
    const deleteImmunization = deleteChild("medical_immunizations");

    const addFamilyHistory = addChild("medical_family_history");
    const updateFamilyHistory = updateChild("medical_family_history");
    const deleteFamilyHistory = deleteChild("medical_family_history");

    const addPregnancy = addChild("medical_pregnancies");
    const updatePregnancy = updateChild("medical_pregnancies");
    const deletePregnancy = deleteChild("medical_pregnancies");

    // ------------------------------------------------------------
    // Visits (nurse exams) — separate because of locking
    // ------------------------------------------------------------
    const createVisit = useMutation({
        mutationFn: async (row: Partial<MedicalVisit>) => {
            if (!clientId) throw new Error("No client id");
            const { data, error } = await supabase
                .from("medical_visits")
                .insert({ client_id: clientId, ...row })
                .select()
                .single();
            if (error) throw error;
            return data as MedicalVisit;
        },
        onSuccess: () => {
            invalidate();
            invalidateAudit();
        },
    });

    const updateVisit = useMutation({
        mutationFn: async ({ id, patch }: { id: string; patch: Partial<MedicalVisit> }) => {
            const { error } = await supabase
                .from("medical_visits")
                .update(patch)
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            invalidate();
            invalidateAudit();
        },
    });
    const deleteVisit = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("medical_visits")
                .delete()
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            invalidate();
            invalidateAudit();
        },
    });
    const signAndLockVisit = useMutation({
        mutationFn: async ({
            id,
            nurse_name,
            nurse_reg_number,
        }: {
            id: string;
            nurse_name: string;
            nurse_reg_number: string;
        }) => {
            const { error } = await supabase
                .from("medical_visits")
                .update({
                    nurse_name,
                    nurse_reg_number,
                    locked_at: new Date().toISOString(),
                    locked_by: user?.id ?? null,
                })
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            invalidate();
            invalidateAudit();
        },
    });

    const unlockVisit = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("medical_visits")
                .update({ locked_at: null, locked_by: null })
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            invalidate();
            invalidateAudit();
        },
    });

    // ------------------------------------------------------------
    // Sign & lock the MAIN profile row (nurse signs off the history)
    // ------------------------------------------------------------
    const signAndLockProfile = useMutation({
        mutationFn: async () => {
            if (!clientId) throw new Error("No client id");
            const { error } = await supabase
                .from("client_medical_profile")
                .update({
                    verified_by_nurse: true,
                    is_locked: true,
                    locked_at: new Date().toISOString(),
                    locked_by: user?.id ?? null,
                })
                .eq("client_id", clientId);
            if (error) throw error;
        },
        onSuccess: () => {
            invalidate();
            invalidateAudit();
        },
    });

    const unlockProfile = useMutation({
        mutationFn: async () => {
            if (!clientId) throw new Error("No client id");
            const { error } = await supabase
                .from("client_medical_profile")
                .update({
                    is_locked: false,
                    locked_at: null,
                    locked_by: null,
                })
                .eq("client_id", clientId);
            if (error) throw error;
        },
        onSuccess: () => {
            invalidate();
            invalidateAudit();
        },
    });

    return {
        // raw data
        bundle,
        profile: bundle.profile,
        allergies: bundle.allergies,
        medications: bundle.medications,
        conditions: bundle.conditions,
        surgeries: bundle.surgeries,
        immunizations: bundle.immunizations,
        familyHistory: bundle.familyHistory,
        pregnancies: bundle.pregnancies,
        visits: bundle.visits,

        // state
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        completionPercent,
        isOwner,
        isCaregiver,
        isLocked,

        // mutations — main
        updateMain,
        signAndLockProfile,
        unlockProfile,

        // mutations — allergies
        addAllergy,
        updateAllergy,
        deleteAllergy,

        // mutations — medications
        addMedication,
        updateMedication,
        deleteMedication,

        // mutations — conditions
        addCondition,
        updateCondition,
        deleteCondition,

        // mutations — surgeries
        addSurgery,
        updateSurgery,
        deleteSurgery,

        // mutations — immunizations
        addImmunization,
        updateImmunization,
        deleteImmunization,

        // mutations — family history
        addFamilyHistory,
        updateFamilyHistory,
        deleteFamilyHistory,

        // mutations — pregnancies
        addPregnancy,
        updatePregnancy,
        deletePregnancy,

        // mutations — visits
        createVisit,
        updateVisit,
        deleteVisit,
        signAndLockVisit,
        unlockVisit,
    };
}

// ============================================================
// Audit trail hook — read-only, admin/nurse view
// ============================================================
export function useMedicalAudit(clientId: string | undefined) {
    return useQuery({
        queryKey: ["medical-audit", clientId],
        enabled: !!clientId,
        staleTime: 30_000,
        queryFn: async () => {
            const { data, error } = await supabase
                .from("medical_audit_log")
                .select("*")
                .eq("client_id", clientId!)
                .order("created_at", { ascending: false })
                .limit(200);
            if (error) throw error;
            return data;
        },
    });
}
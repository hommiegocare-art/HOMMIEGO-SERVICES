// src/pages/CaregiverMedicalExam.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    ChevronLeft,
    Stethoscope,
    ShieldCheck,
    AlertTriangle,
    Loader2,
    Lock,
    Save,
    FileSignature,
    Activity,
    HeartPulse,
    Brain,
    Wind,
    User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { useMedicalProfile } from "@/hooks/useMedicalProfile";
import { isWithinWindow, hoursLeft, windowExpiryLabel } from "@/lib/medicalWindow";
import {
    ROS_FLAGS,
    ROS_GROUP_NOTE_FIELD,
    CONSCIOUSNESS_LEVELS,
    groupedRosFlags,
    type RosGroup,
} from "@/lib/medicalOptions";
import type {
    MedicalVisit,
    ConsciousnessLevel,
    ClientMedicalProfile,
} from "@/types/db";

// ============================================================
// Page
// ============================================================
export default function CaregiverMedicalExam() {
    const { clientId, visitId } = useParams<{ clientId: string; visitId?: string }>();
    const navigate = useNavigate();
    const { user } = useSession();
    const med = useMedicalProfile(clientId);

    const isNew = !visitId;
    const existingVisit = useMemo(
        () => med.visits.find((v) => v.id === visitId) ?? null,
        [med.visits, visitId],
    );

    if (!user || user.role !== "caregiver") {
        return (
            <div className="max-w-3xl mx-auto px-4 py-12 text-center">
                <p className="text-sm text-muted-foreground">
                    Only caregivers can open the exam page.
                </p>
            </div>
        );
    }

    if (med.isLoading) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-3">
                <div className="h-8 w-40 rounded-2xl skeleton-shimmer" />
                <div className="h-32 rounded-2xl skeleton-shimmer" />
                <div className="h-64 rounded-2xl skeleton-shimmer" />
            </div>
        );
    }

    if (!med.profile && !isNew) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-12 text-center">
                <p className="text-sm text-muted-foreground">
                    Patient medical record not found.
                </p>
            </div>
        );
    }

    const locked = !!existingVisit?.locked_at;
    const signedByMe = existingVisit?.locked_by === user.id;

    return (
        <div className="max-w-3xl mx-auto px-4 py-6 animate-fade-in pb-32">
            <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground -ml-2 mb-4 h-11"
            >
                <ChevronLeft className="w-4 h-4" /> Back
            </button>

            <div className="flex items-center gap-2 mb-1">
                <Stethoscope className="w-5 h-5 text-primary" />
                <h1 className="text-2xl font-black tracking-tight text-foreground">
                    {isNew ? "New examination" : "Examination"}
                </h1>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
                {isNew
                    ? "Record your findings. Sign and lock the exam when done."
                    : locked
                        ? "This examination is signed and locked."
                        : "Continue and sign when done."}
            </p>

            <PatientSummary med={med} />

            {locked && !signedByMe && (
                <div className="rounded-2xl bg-muted/60 border border-border px-4 py-3 mt-3 mb-4 flex items-start gap-2">
                    <Lock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground">
                        This exam was signed by{" "}
                        <span className="font-semibold">{existingVisit?.nurse_name}</span>
                        {existingVisit?.nurse_reg_number
                            ? ` (${existingVisit.nurse_reg_number})`
                            : ""}
                        . You cannot edit it.
                    </p>
                </div>
            )}

            <ExamForm
                med={med}
                existing={existingVisit}
                isNew={isNew}
                locked={locked}
                signedByMe={signedByMe}
                clientId={clientId!}
                onSigned={() => navigate(-1)}
            />
        </div>
    );
}

// ============================================================
// Read-only signature field
// ============================================================
function ReadOnlySignatureField({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div>
            <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                {label}
            </Label>
            <div className="mt-1 h-11 flex items-center rounded-2xl bg-muted px-3 text-sm text-foreground">
                {value || "—"}
            </div>
        </div>
    );
}

// ============================================================
// Patient summary
// ============================================================
function PatientSummary({ med }: { med: ReturnType<typeof useMedicalProfile> }) {
    const p = med.profile;
    if (!p) return null;

    const allAllergies = [
        ...(p.drug_allergies ?? []),
        ...(p.food_allergies ?? []),
        ...(p.environmental_allergies ?? []),
        ...(p.allergies ?? []),
        ...med.allergies.map((a) => a.allergen),
    ].filter(Boolean) as string[];

    const currentMeds = [
        ...(p.current_medications ?? []),
        ...med.medications
            .filter((m) => !m.stopped_on)
            .map((m) => `${m.name}${m.dose ? ` ${m.dose}` : ""}`),
    ].filter(Boolean) as string[];

    const conditions = [
        ...(p.chronic_conditions ?? []),
        ...med.conditions.map((c) => c.condition),
    ].filter(Boolean) as string[];

    const hasRedFlags =
        allAllergies.length > 0 ||
        p.has_hypertension ||
        p.has_diabetes ||
        p.has_hiv ||
        p.has_tb;

    return (
        <div className="rounded-2xl bg-card border border-border px-4 py-3 mb-3">
            <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-primary" />
                <p className="text-sm font-bold text-foreground">Patient summary</p>
                {hasRedFlags && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 text-destructive px-2 py-0.5 text-[10px] font-semibold">
                        <AlertTriangle className="w-3 h-3" /> Flags
                    </span>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
                <SummaryBlock label="Blood type" values={p.blood_type ? [p.blood_type] : []} />
                <SummaryBlock label="Age" values={ageFrom(p.date_of_birth)} />
                <SummaryBlock label="Allergies" values={allAllergies} tone="warn" />
                <SummaryBlock label="Conditions" values={conditions} />
                <SummaryBlock label="Medications" values={currentMeds} />
                <SummaryBlock
                    label="Next of kin"
                    values={[p.next_of_kin_name, p.next_of_kin_phone].filter(Boolean) as string[]}
                />
            </div>
        </div>
    );
}

function SummaryBlock({
    label,
    values,
    tone,
}: {
    label: string;
    values: string[];
    tone?: "warn";
}) {
    return (
        <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                {label}
            </p>
            {values.length === 0 ? (
                <p className="text-muted-foreground mt-0.5">—</p>
            ) : (
                <p
                    className={`mt-0.5 font-medium ${tone === "warn" ? "text-destructive" : "text-foreground"
                        }`}
                >
                    {values.join(", ")}
                </p>
            )}
        </div>
    );
}

function ageFrom(dob: string | null): string[] {
    if (!dob) return [];
    const d = new Date(dob);
    if (isNaN(d.getTime())) return [];
    const age = Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
    return [`${age}y`];
}

// ============================================================
// Exam form
// ============================================================
function ExamForm({
    med,
    existing,
    isNew,
    locked,
    signedByMe,
    clientId,
    onSigned,
}: {
    med: ReturnType<typeof useMedicalProfile>;
    existing: MedicalVisit | null;
    isNew: boolean;
    locked: boolean;
    signedByMe: boolean;
    clientId: string;
    onSigned: () => void;
}) {
    // 24-hour window: editable only within it (unless this is a fresh exam).
    const withinWindow = isNew ? true : isWithinWindow(existing?.created_at);
    const readOnly = (locked && !signedByMe) || (!isNew && !withinWindow);

    // Fetch current nurse's caregiver profile (reg number) + profile (name)
    const { data: myCaregiver } = useQuery({
        queryKey: ["caregiver-self"],
        enabled: !!med.isCaregiver,
        staleTime: 5 * 60_000,
        queryFn: async () => {
            const { data: auth } = await supabase.auth.getUser();
            const uid = auth.user?.id;
            if (!uid) return null;
            const { data, error } = await supabase
                .from("caregiver_profiles")
                .select("professional_title, license_number, license_type")
                .eq("user_id", uid)
                .maybeSingle();
            if (error) throw error;
            return data;
        },
    });

    const { data: myProfile } = useQuery({
        queryKey: ["profile-self"],
        enabled: !!med.isCaregiver,
        staleTime: 5 * 60_000,
        queryFn: async () => {
            const { data: auth } = await supabase.auth.getUser();
            const uid = auth.user?.id;
            if (!uid) return null;
            const { data, error } = await supabase
                .from("profiles")
                .select("display_name, legal_name")
                .eq("id", uid)
                .maybeSingle();
            if (error) throw error;
            return data;
        },
    });

    // Visit draft (medical_visits row) and ROS-flag draft (client_medical_profile)
    const [draft, setDraft] = useState<Partial<MedicalVisit>>(() => {
        if (existing) return { ...existing };
        return { visit_date: new Date().toISOString() };
    });

    const [rosDraft, setRosDraft] = useState<Partial<ClientMedicalProfile>>({});

    // Prefer an already-signed value on the visit; otherwise use the current
    // nurse's own profile. Never trust free text — prevents impersonation.
    const nurseName =
        existing?.nurse_name ??
        myProfile?.legal_name ??
        myProfile?.display_name ??
        "";
    const nurseReg =
        existing?.nurse_reg_number ??
        myCaregiver?.license_number ??
        "";

    const [signing, setSigning] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [declared, setDeclared] = useState(false);

    useEffect(() => {
        if (existing) setDraft({ ...existing });
    }, [existing]);

    useEffect(() => {
        if (!med.profile) return;
        const seed: Partial<ClientMedicalProfile> = {};
        for (const { key } of ROS_FLAGS) {
            (seed as Record<string, unknown>)[key as string] = med.profile[key];
        }
        setRosDraft(seed);
    }, [med.profile]);

    const set = <K extends keyof MedicalVisit>(k: K, v: MedicalVisit[K]) =>
        setDraft((d) => ({ ...d, [k]: v }));

    const saveVisit = async (): Promise<MedicalVisit | null> => {
        setErr(null);

        const payload: Partial<MedicalVisit> = { ...draft };
        delete payload.id;
        delete payload.created_at;
        delete payload.caregiver_id;
        delete payload.locked_at;
        delete payload.locked_by;
        delete payload.nurse_name;
        delete payload.nurse_reg_number;

        if (isNew) {
            const { data, error } = await supabase
                .from("medical_visits")
                .insert({ ...payload, client_id: clientId })
                .select()
                .single();
            if (error) throw error;
            return data as MedicalVisit;
        }

        if (existing) {
            const { error } = await supabase
                .from("medical_visits")
                .update(payload)
                .eq("id", existing.id);
            if (error) throw error;
            return existing;
        }

        return null;
    };

    const saveRos = async () => {
        const patch: Partial<ClientMedicalProfile> = {};
        for (const { key } of ROS_FLAGS) {
            (patch as Record<string, unknown>)[key as string] = (
                rosDraft as Record<string, unknown>
            )[key as string];
        }
        await med.updateMain.mutateAsync(patch);
    };

    const handleSaveDraft = async () => {
        try {
            setSigning(true);
            await saveVisit();
            await saveRos();
            med.updateMain.reset();
            await new Promise((r) => setTimeout(r, 200));
        } catch (e) {
            setErr(e instanceof Error ? e.message : "Save failed");
        } finally {
            setSigning(false);
        }
    };

    const handleSignAndLock = async () => {
        if (!nurseName.trim() || !nurseReg.trim()) {
            setErr("Enter your name and registration number to sign.");
            return;
        }
        try {
            setSigning(true);
            setErr(null);

            const saved = await saveVisit();
            await saveRos();

            if (saved) {
                const { error } = await supabase
                    .from("medical_visits")
                    .update({
                        nurse_name: nurseName.trim(),
                        nurse_reg_number: nurseReg.trim(),
                        locked_at: new Date().toISOString(),
                        locked_by: (await supabase.auth.getUser()).data.user?.id ?? null,
                        declared_at: new Date().toISOString(),
                    })
                    .eq("id", saved.id);
                if (error) throw error;
            }
            onSigned();
        } catch (e) {
            setErr(e instanceof Error ? e.message : "Sign failed");
        } finally {
            setSigning(false);
        }
    };

    const handleUnlock = async () => {
        if (!existing) return;
        try {
            setSigning(true);
            const { error } = await supabase
                .from("medical_visits")
                .update({ locked_at: null, locked_by: null })
                .eq("id", existing.id);
            if (error) throw error;
        } catch (e) {
            setErr(e instanceof Error ? e.message : "Unlock failed");
        } finally {
            setSigning(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* 24h window banner */}
            {!isNew && existing?.created_at && (
                withinWindow ? (
                    <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 px-4 py-2 text-xs text-amber-700">
                        You can edit this exam for{" "}
                        <strong>{hoursLeft(existing.created_at)}</strong> more hours
                        (until {windowExpiryLabel(existing.created_at)}).
                    </div>
                ) : (
                    <div className="rounded-2xl bg-muted/60 border border-border px-4 py-3 flex items-start gap-2">
                        <Lock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <p className="text-xs text-muted-foreground">
                            The 24-hour edit window has expired. This exam is now
                            read-only.
                        </p>
                    </div>
                )
            )}

            <Section icon={<Activity className="w-4 h-4" />} title="Vitals">
                <div className="grid grid-cols-2 gap-3">
                    <NumField label="Temperature (°C)" value={draft.exam_temperature_c ?? ""} onChange={(v) => set("exam_temperature_c", v)} disabled={readOnly} />
                    <NumField label="Pulse (bpm)" value={draft.exam_pulse_bpm ?? ""} onChange={(v) => set("exam_pulse_bpm", v)} disabled={readOnly} />
                    <NumField label="Respiratory rate" value={draft.exam_respiratory_rate ?? ""} onChange={(v) => set("exam_respiratory_rate", v)} disabled={readOnly} />
                    <Field label="Blood pressure" value={draft.exam_blood_pressure ?? ""} onChange={(v) => set("exam_blood_pressure", v)} placeholder="120/80" disabled={readOnly} />
                    <NumField label="SpO₂ (%)" value={draft.exam_oxygen_saturation ?? ""} onChange={(v) => set("exam_oxygen_saturation", v)} disabled={readOnly} />
                    <NumField label="Weight (kg)" value={draft.exam_weight_kg ?? ""} onChange={(v) => set("exam_weight_kg", v)} disabled={readOnly} />
                    <NumField label="Height (cm)" value={draft.exam_height_cm ?? ""} onChange={(v) => set("exam_height_cm", v)} disabled={readOnly} />
                    <SelectField
                        label="Consciousness"
                        value={draft.exam_consciousness ?? ""}
                        options={CONSCIOUSNESS_LEVELS}
                        onChange={(v) => set("exam_consciousness", (v || null) as ConsciousnessLevel | null)}
                        disabled={readOnly}
                    />
                </div>
            </Section>

            <Section icon={<Wind className="w-4 h-4" />} title="Review of systems">
                <RosGrid
                    rosDraft={rosDraft}
                    setRosDraft={setRosDraft}
                    visitDraft={draft}
                    setVisitDraft={setDraft}
                    disabled={readOnly}
                />
            </Section>

            <Section icon={<HeartPulse className="w-4 h-4" />} title="Physical examination">
                <LongField label="General appearance" value={draft.exam_general_appearance ?? ""} onChange={(v) => set("exam_general_appearance", v)} disabled={readOnly} />
                <LongField label="Head & neck" value={draft.exam_head_neck ?? ""} onChange={(v) => set("exam_head_neck", v)} disabled={readOnly} />
                <LongField label="Eyes & pupils" value={draft.exam_eyes_pupils ?? ""} onChange={(v) => set("exam_eyes_pupils", v)} disabled={readOnly} />
                <LongField label="ENT" value={draft.exam_ent ?? ""} onChange={(v) => set("exam_ent", v)} disabled={readOnly} />
                <LongField label="Cardiovascular" value={draft.exam_cardiovascular ?? ""} onChange={(v) => set("exam_cardiovascular", v)} disabled={readOnly} />
                <LongField label="Respiratory" value={draft.exam_respiratory ?? ""} onChange={(v) => set("exam_respiratory", v)} disabled={readOnly} />
                <LongField label="Abdominal" value={draft.exam_abdominal ?? ""} onChange={(v) => set("exam_abdominal", v)} disabled={readOnly} />
                <LongField label="Genitourinary" value={draft.exam_genitourinary ?? ""} onChange={(v) => set("exam_genitourinary", v)} disabled={readOnly} />
                <LongField label="Musculoskeletal" value={draft.exam_musculoskeletal ?? ""} onChange={(v) => set("exam_musculoskeletal", v)} disabled={readOnly} />
                <LongField label="Neurological" value={draft.exam_neurological ?? ""} onChange={(v) => set("exam_neurological", v)} disabled={readOnly} />
                <LongField label="Skin" value={draft.exam_skin ?? ""} onChange={(v) => set("exam_skin", v)} disabled={readOnly} />
                <LongField label="Extremities" value={draft.exam_extremities ?? ""} onChange={(v) => set("exam_extremities", v)} disabled={readOnly} />
                <LongField label="Lymph nodes" value={draft.exam_lymph_nodes ?? ""} onChange={(v) => set("exam_lymph_nodes", v)} disabled={readOnly} />
                <LongField label="Mental status" value={draft.exam_mental_status ?? ""} onChange={(v) => set("exam_mental_status", v)} disabled={readOnly} />
                <LongField label="Other findings" value={draft.exam_other_findings ?? ""} onChange={(v) => set("exam_other_findings", v)} disabled={readOnly} />
            </Section>

            <Section icon={<Brain className="w-4 h-4" />} title="Nursing diagnosis & plan">
                <LongField label="Nursing diagnosis" value={draft.nursing_diagnosis ?? ""} onChange={(v) => set("nursing_diagnosis", v)} disabled={readOnly} />
                <LongField label="Care plan" value={draft.care_plan ?? ""} onChange={(v) => set("care_plan", v)} disabled={readOnly} />
                <LongField label="Goals of care" value={draft.goals_of_care ?? ""} onChange={(v) => set("goals_of_care", v)} disabled={readOnly} />
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Review date" type="date" value={draft.review_date ?? ""} onChange={(v) => set("review_date", v)} disabled={readOnly} />
                    <Field label="Referred to" value={draft.referred_to ?? ""} onChange={(v) => set("referred_to", v)} disabled={readOnly} />
                </div>
                <LongField label="Referral reason" value={draft.referral_reason ?? ""} onChange={(v) => set("referral_reason", v)} disabled={readOnly} />
            </Section>

            {!readOnly && (
                <Section icon={<FileSignature className="w-4 h-4" />} title="Signature">
                    <div className="grid grid-cols-2 gap-3">
                        <ReadOnlySignatureField label="Full name" value={nurseName} />
                        <ReadOnlySignatureField
                            label="Registration number"
                            value={nurseReg}
                        />
                    </div>

                    {(!nurseName || !nurseReg) && (
                        <div className="rounded-2xl bg-destructive/10 px-3 py-2 text-xs text-destructive mt-2">
                            Your caregiver profile is missing{" "}
                            {!nurseName ? "a name" : ""}
                            {!nurseName && !nurseReg ? " and " : ""}
                            {!nurseReg ? "a licence number" : ""}. Update it in
                            Settings before signing.
                        </div>
                    )}

                    <label className="mt-3 flex items-start gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={declared}
                            onChange={(e) => setDeclared(e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                        />
                        <span className="text-xs text-foreground leading-snug">
                            I declare that all the information in this examination
                            was provided or verified by me during this visit, and
                            that the name and registration number shown are my own.
                        </span>
                    </label>

                    <p className="text-xs text-muted-foreground mt-2">
                        Signing locks this exam. It can only be unlocked by you within
                        24 hours.
                    </p>
                </Section>
            )}

            {err && (
                <div className="rounded-2xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {err}
                </div>
            )}

            <div className="fixed bottom-0 left-0 right-0 z-30 bg-background border-t border-border">
                <div
                    className="max-w-3xl mx-auto px-4 py-3 flex gap-3"
                    style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
                >
                    {!readOnly && (
                        <>
                            <Button
                                variant="secondary"
                                onClick={handleSaveDraft}
                                disabled={signing}
                                className="flex-1 h-12 rounded-2xl"
                            >
                                {signing ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-1.5" /> Save draft
                                    </>
                                )}
                            </Button>
                            <Button
                                onClick={handleSignAndLock}
                                disabled={signing || !nurseName.trim() || !nurseReg.trim() || !declared}
                                className="flex-1 h-12 rounded-2xl"
                            >
                                {signing ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <ShieldCheck className="w-4 h-4 mr-1.5" /> Sign & lock
                                    </>
                                )}
                            </Button>
                        </>
                    )}

                    {locked && signedByMe && (
                        <Button
                            variant="destructive"
                            onClick={handleUnlock}
                            disabled={signing}
                            className="flex-1 h-12 rounded-2xl"
                        >
                            <Lock className="w-4 h-4 mr-1.5" /> Unlock exam
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================================
// ROS grid — flags on profile + free-text per group on visit
// ============================================================
function RosGrid({
    rosDraft,
    setRosDraft,
    visitDraft,
    setVisitDraft,
    disabled,
}: {
    rosDraft: Partial<ClientMedicalProfile>;
    setRosDraft: (
        fn: (d: Partial<ClientMedicalProfile>) => Partial<ClientMedicalProfile>,
    ) => void;
    visitDraft: Partial<MedicalVisit>;
    setVisitDraft: (
        fn: (d: Partial<MedicalVisit>) => Partial<MedicalVisit>,
    ) => void;
    disabled: boolean;
}) {
    const groups = useMemo(() => groupedRosFlags(), []);

    return (
        <div className="space-y-4">
            {groups.map(([group, items]) => {
                const noteField = ROS_GROUP_NOTE_FIELD[group as RosGroup];
                const noteValue = noteField
                    ? ((visitDraft[noteField] as string | null) ?? "")
                    : "";
                return (
                    <div key={group}>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1.5">
                            {group}
                        </p>
                        <div className="grid grid-cols-2 gap-1.5">
                            {items.map(({ key, label }) => {
                                const on = !!rosDraft[key];
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        disabled={disabled}
                                        onClick={() =>
                                            setRosDraft((d) => ({ ...d, [key]: !on }))
                                        }
                                        className={`text-xs px-2.5 py-2 rounded-xl text-left transition-colors disabled:opacity-60 ${on
                                            ? "bg-primary/15 text-foreground border border-primary/40"
                                            : "bg-muted text-muted-foreground border border-transparent"
                                            }`}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                        {noteField && (
                            <Textarea
                                value={noteValue}
                                onChange={(e) =>
                                    setVisitDraft((d) => ({
                                        ...d,
                                        [noteField]: e.target.value,
                                    }))
                                }
                                placeholder={`Anything else in ${group.toLowerCase()} the patient reports?`}
                                rows={2}
                                disabled={disabled}
                                className="mt-1.5 rounded-2xl bg-muted border-0 text-sm"
                            />
                        )}
                    </div>
                );
            })}

            <LongField
                label="Other symptoms (not covered above)"
                value={(visitDraft.ros_other as string) ?? ""}
                onChange={(v) => setVisitDraft((d) => ({ ...d, ros_other: v }))}
                disabled={disabled}
            />
        </div>
    );
}

// ============================================================
// Primitives
// ============================================================
function Section({
    icon,
    title,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl bg-card px-4 py-4">
            <div className="flex items-center gap-2 mb-3">
                <span className="text-primary">{icon}</span>
                <p className="text-sm font-bold text-foreground">{title}</p>
            </div>
            <div className="space-y-3">{children}</div>
        </div>
    );
}

function Field({
    label,
    value,
    onChange,
    type = "text",
    placeholder,
    disabled,
}: {
    label: string;
    value: string | number;
    onChange: (v: string) => void;
    type?: string;
    placeholder?: string;
    disabled?: boolean;
}) {
    return (
        <div>
            <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                {label}
            </Label>
            <Input
                type={type}
                value={String(value)}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className="mt-1 h-11 rounded-2xl bg-muted border-0"
            />
        </div>
    );
}

function NumField({
    label,
    value,
    onChange,
    disabled,
}: {
    label: string;
    value: number | string;
    onChange: (v: number | null) => void;
    disabled?: boolean;
}) {
    return (
        <div>
            <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                {label}
            </Label>
            <Input
                type="number"
                inputMode="decimal"
                value={value === null || value === undefined ? "" : String(value)}
                onChange={(e) => {
                    const v = e.target.value;
                    onChange(v === "" ? null : Number(v));
                }}
                disabled={disabled}
                className="mt-1 h-11 rounded-2xl bg-muted border-0"
            />
        </div>
    );
}

function SelectField<T extends string>({
    label,
    value,
    options,
    onChange,
    disabled,
}: {
    label: string;
    value: T | "";
    options: readonly T[];
    onChange: (v: T | "") => void;
    disabled?: boolean;
}) {
    return (
        <div>
            <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                {label}
            </Label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value as T | "")}
                disabled={disabled}
                className="mt-1 w-full h-11 rounded-2xl bg-muted border-0 px-3 text-sm"
            >
                <option value="">—</option>
                {options.map((o) => (
                    <option key={o} value={o}>
                        {o}
                    </option>
                ))}
            </select>
        </div>
    );
}

function LongField({
    label,
    value,
    onChange,
    disabled,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    disabled?: boolean;
}) {
    return (
        <div>
            <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                {label}
            </Label>
            <Textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={2}
                disabled={disabled}
                className="mt-1 rounded-2xl bg-muted border-0"
            />
        </div>
    );
}
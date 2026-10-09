// src/components/profile/MedicalProfileCard.tsx
import { useEffect, useRef, useState } from "react";
import {
    HeartPulse,
    Lock,
    ShieldCheck,
    Check,
    Plus,
    Trash2,
    Loader2,
    Pencil,
    X,
    Save,
    ChevronDown,
    Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMedicalProfile } from "@/hooks/useMedicalProfile";
import { useSession } from "@/hooks/useSession";
import { isWithinWindow } from "@/lib/medicalWindow";
import type {
    ClientMedicalProfile,
    MedicalAllergy,
    MedicalMedication,
    MedicalCondition,
    MedicalSurgery,
    MedicalFamilyHistoryRow,
    MedicalPregnancy,
    MedicalVisit,
} from "@/types/db";
import { Link } from "react-router-dom";
// ============================================================
// Tabs
// ============================================================
const TABS = [
    { key: "basics", label: "Basics" },
    { key: "history", label: "History" },
    { key: "meds", label: "Meds" },
    { key: "allergies", label: "Allergies" },
    { key: "conditions", label: "Conditions" },
    { key: "surgeries", label: "Surgeries" },
    { key: "family", label: "Family" },
    { key: "social", label: "Social" },
    { key: "obgyn", label: "OB/GYN" },
    { key: "ros", label: "ROS" },
    { key: "prefs", label: "Preferences" },
    { key: "exams", label: "Exams" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// ============================================================
// Main component
// ============================================================
export function MedicalProfileCard({ clientId }: { clientId?: string }) {
    const { user } = useSession();
    const targetId = clientId ?? user?.id;
    const med = useMedicalProfile(targetId);
    const [tab, setTab] = useState<TabKey>("basics");

    if (!targetId) return null;

    if (med.isLoading) {
        return <div className="h-40 rounded-2xl skeleton-shimmer mb-3" />;
    }

    const locked = med.isLocked;
    const nurseVerified = med.profile?.verified_by_nurse ?? false;
    const canEdit = med.isOwner && !locked;

    // Patients always own their data; nurses are limited to the 24-hour window.
    const canEditRow = <T extends { created_at?: string }>(row: T): boolean =>
        med.isOwner || isWithinWindow(row.created_at);

    return (
        <div className="rounded-2xl bg-card px-4 py-4 mb-3">
            {/* ---- Header ---- */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                    <HeartPulse className="w-4 h-4 text-primary shrink-0" />
                    <p className="text-sm font-bold text-foreground truncate">
                        Medical profile
                    </p>
                    {nurseVerified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-semibold shrink-0">
                            <ShieldCheck className="w-3 h-3" /> Verified
                        </span>
                    )}
                    {locked && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-[10px] font-semibold shrink-0">
                            <Lock className="w-3 h-3" /> Locked
                        </span>
                    )}
                </div>
                <span className="text-xs font-semibold text-muted-foreground shrink-0">
                    {med.completionPercent}%
                </span>
            </div>

            {/* ---- Completion bar ---- */}
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mb-4">
                <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${med.completionPercent}%` }}
                />
            </div>

            {locked && (
                <div className="rounded-xl bg-muted/60 border border-border px-3 py-2 mb-4 text-xs text-muted-foreground">
                    This record was signed by a nurse and is locked. Ask support to
                    amend.
                </div>
            )}

            {/* ---- Tabs ---- */}
            <div className="-mx-4 px-4 mb-4 overflow-x-auto">
                <div className="flex gap-1 min-w-max">
                    {TABS.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`h-9 px-3 rounded-2xl text-xs font-semibold whitespace-nowrap transition-colors ${tab === t.key
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground active:bg-secondary"
                                }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ---- Tab bodies ---- */}
            {tab === "basics" && <TabBasics med={med} canEdit={canEdit} />}
            {tab === "history" && <TabHistory med={med} canEdit={canEdit} />}
            {tab === "meds" && <TabMeds med={med} canEdit={canEdit} canEditRow={canEditRow} />}
            {tab === "allergies" && <TabAllergies med={med} canEdit={canEdit} canEditRow={canEditRow} />}
            {tab === "conditions" && <TabConditions med={med} canEdit={canEdit} canEditRow={canEditRow} />}
            {tab === "surgeries" && <TabSurgeries med={med} canEdit={canEdit} canEditRow={canEditRow} />}
            {tab === "family" && <TabFamily med={med} canEdit={canEdit} canEditRow={canEditRow} />}
            {tab === "social" && <TabSocial med={med} canEdit={canEdit} />}
            {tab === "obgyn" && <TabObGyn med={med} canEdit={canEdit} canEditRow={canEditRow} />}
            {tab === "ros" && <TabRos med={med} />}
            {tab === "prefs" && <TabPrefs med={med} canEdit={canEdit} />}
            {tab === "exams" && <TabExams med={med} clientId={targetId} />}
        </div>
    );
}

// ============================================================
// Types for tab props
// ============================================================
type Med = ReturnType<typeof useMedicalProfile>;
type CanEditRow = <T extends { created_at?: string }>(row: T) => boolean;

// ============================================================
// TAB: Basics
// ============================================================
function TabBasics({ med, canEdit }: { med: Med; canEdit: boolean }) {
    return (
        <AutoSaveSection>
            <FieldGrid>
                <Field label="Blood type" editable={canEdit} keyName="blood_type" profile={med.profile} updateMain={med.updateMain} />
                <Field label="Date of birth" editable={canEdit} type="date" keyName="date_of_birth" profile={med.profile} updateMain={med.updateMain} />
                <SelectField label="Sex at birth" editable={canEdit} keyName="sex_at_birth" options={["male", "female", "intersex"]} profile={med.profile} updateMain={med.updateMain} />
                <Field label="Gender identity" editable={canEdit} keyName="gender_identity" profile={med.profile} updateMain={med.updateMain} />
                <Field label="Height (cm)" editable={canEdit} type="number" keyName="height_cm" profile={med.profile} updateMain={med.updateMain} />
                <Field label="Weight (kg)" editable={canEdit} type="number" keyName="weight_kg" profile={med.profile} updateMain={med.updateMain} />
                <Field label="Marital status" editable={canEdit} keyName="marital_status" profile={med.profile} updateMain={med.updateMain} />
                <Field label="Occupation" editable={canEdit} keyName="occupation" profile={med.profile} updateMain={med.updateMain} />
                <Field label="National ID" editable={canEdit} keyName="national_id" profile={med.profile} updateMain={med.updateMain} />
                <Field label="NHIF / SHA" editable={canEdit} keyName="nhif_sha_number" profile={med.profile} updateMain={med.updateMain} />
                <Field label="Next of kin" editable={canEdit} keyName="next_of_kin_name" profile={med.profile} updateMain={med.updateMain} />
                <Field label="NOK phone" editable={canEdit} keyName="next_of_kin_phone" profile={med.profile} updateMain={med.updateMain} />
                <Field label="NOK relationship" editable={canEdit} keyName="next_of_kin_relationship" profile={med.profile} updateMain={med.updateMain} />
                <Field label="Preferred hospital" editable={canEdit} keyName="preferred_hospital" profile={med.profile} updateMain={med.updateMain} />
            </FieldGrid>
        </AutoSaveSection>
    );
}

// ============================================================
// TAB: History
// ============================================================
function TabHistory({ med, canEdit }: { med: Med; canEdit: boolean }) {
    const p = med.profile;
    const FLAGS: [keyof ClientMedicalProfile, string][] = [
        ["has_hypertension", "Hypertension"],
        ["has_diabetes", "Diabetes"],
        ["has_asthma", "Asthma"],
        ["has_copd", "COPD"],
        ["has_heart_disease", "Heart disease"],
        ["has_stroke", "Stroke"],
        ["has_epilepsy", "Epilepsy"],
        ["has_cancer", "Cancer"],
        ["has_hiv", "HIV"],
        ["hiv_on_art", "On ART"],
        ["has_tb", "TB"],
        ["has_mental_health_condition", "Mental health"],
        ["has_kidney_disease", "Kidney disease"],
        ["has_liver_disease", "Liver disease"],
    ];

    return (
        <AutoSaveSection>
            <div className="grid grid-cols-2 gap-2 mb-4">
                {FLAGS.map(([key, label]) => (
                    <CheckboxField
                        key={key}
                        label={label}
                        editable={canEdit}
                        keyName={key}
                        profile={p}
                        updateMain={med.updateMain}
                    />
                ))}
            </div>

            <FieldGrid>
                <Field label="Diabetes type" editable={canEdit} keyName="diabetes_type" profile={p} updateMain={med.updateMain} />
                <Field label="Cancer details" editable={canEdit} keyName="cancer_details" profile={p} updateMain={med.updateMain} />
                <Field label="Mental health details" editable={canEdit} keyName="mental_health_details" profile={p} updateMain={med.updateMain} />
                <Field label="Other chronic conditions" editable={canEdit} keyName="other_chronic_conditions" profile={p} updateMain={med.updateMain} />
                <Field label="Implant details" editable={canEdit} keyName="implant_details" profile={p} updateMain={med.updateMain} />
                <Field label="Anesthesia reaction" editable={canEdit} keyName="anesthesia_reaction_details" profile={p} updateMain={med.updateMain} />
            </FieldGrid>

            <LongField label="Medical history (free text)" editable={canEdit} keyName="medical_history" profile={p} updateMain={med.updateMain} />
            <LongField label="Special needs" editable={canEdit} keyName="special_needs" profile={p} updateMain={med.updateMain} />
            <LongField label="Notes" editable={canEdit} keyName="notes" profile={p} updateMain={med.updateMain} />
        </AutoSaveSection>
    );
}

// ============================================================
// TAB: Meds
// ============================================================
function TabMeds({ med, canEdit, canEditRow }: { med: Med; canEdit: boolean; canEditRow: CanEditRow }) {
    return (
        <ChildTableEditor<MedicalMedication>
            canEdit={canEdit}
            canEditRow={canEditRow}
            rows={med.medications}
            emptyText="No medications recorded yet."
            onAdd={(row) => med.addMedication.mutate(row as Record<string, unknown>)}
            onUpdate={(id, patch) =>
                med.updateMedication.mutate({ id, patch: patch as Record<string, unknown> })
            }
            onDelete={(id) => med.deleteMedication.mutate(id)}
            addBusy={med.addMedication.isPending}
            rowTitle={(r) => r.name}
            rowSubtitle={(r) =>
                [r.dose, r.frequency, r.route, r.indication].filter(Boolean).join(" · ")
            }
            blank={{
                name: "",
                dose: "",
                frequency: "",
                route: "",
                indication: "",
                started_on: "",
                stopped_on: "",
                prescribed_by: "",
                adherence: "",
                notes: "",
            }}
            fields={[
                { key: "name", label: "Name", required: true },
                { key: "dose", label: "Dose" },
                { key: "frequency", label: "Frequency" },
                { key: "route", label: "Route" },
                { key: "indication", label: "Indication" },
                { key: "started_on", label: "Started on", type: "date" },
                { key: "stopped_on", label: "Stopped on", type: "date" },
                { key: "prescribed_by", label: "Prescribed by" },
                { key: "adherence", label: "Adherence (good/partial/poor)" },
                { key: "notes", label: "Notes" },
            ]}
        />
    );
}

// ============================================================
// TAB: Allergies
// ============================================================
function TabAllergies({ med, canEdit, canEditRow }: { med: Med; canEdit: boolean; canEditRow: CanEditRow }) {
    return (
        <ChildTableEditor<MedicalAllergy>
            canEdit={canEdit}
            canEditRow={canEditRow}
            rows={med.allergies}
            emptyText="No allergies recorded."
            onAdd={(row) => med.addAllergy.mutate(row as Record<string, unknown>)}
            onUpdate={(id, patch) =>
                med.updateAllergy.mutate({ id, patch: patch as Record<string, unknown> })
            }
            onDelete={(id) => med.deleteAllergy.mutate(id)}
            addBusy={med.addAllergy.isPending}
            rowTitle={(r) => r.allergen}
            rowSubtitle={(r) =>
                [r.category, r.severity, r.reaction].filter(Boolean).join(" · ")
            }
            blank={{
                allergen: "",
                category: "",
                reaction: "",
                severity: "",
                confirmed: false,
                notes: "",
            }}
            fields={[
                { key: "allergen", label: "Allergen", required: true },
                { key: "category", label: "Category (drug/food/environmental)" },
                { key: "reaction", label: "Reaction" },
                { key: "severity", label: "Severity (mild/moderate/severe)" },
                { key: "notes", label: "Notes" },
            ]}
        />
    );
}

// ============================================================
// TAB: Conditions
// ============================================================
function TabConditions({ med, canEdit, canEditRow }: { med: Med; canEdit: boolean; canEditRow: CanEditRow }) {
    return (
        <ChildTableEditor<MedicalCondition>
            canEdit={canEdit}
            canEditRow={canEditRow}
            rows={med.conditions}
            emptyText="No chronic conditions recorded."
            onAdd={(row) => med.addCondition.mutate(row as Record<string, unknown>)}
            onUpdate={(id, patch) =>
                med.updateCondition.mutate({ id, patch: patch as Record<string, unknown> })
            }
            onDelete={(id) => med.deleteCondition.mutate(id)}
            addBusy={med.addCondition.isPending}
            rowTitle={(r) => r.condition}
            rowSubtitle={(r) =>
                [r.current_status, r.diagnosed_on, r.managed_by].filter(Boolean).join(" · ")
            }
            blank={{
                condition: "",
                diagnosed_on: "",
                severity: "",
                current_status: "",
                managed_by: "",
                notes: "",
            }}
            fields={[
                { key: "condition", label: "Condition", required: true },
                { key: "diagnosed_on", label: "Diagnosed on", type: "date" },
                { key: "severity", label: "Severity" },
                { key: "current_status", label: "Status (active/resolved)" },
                { key: "managed_by", label: "Managed by" },
                { key: "notes", label: "Notes" },
            ]}
        />
    );
}

// ============================================================
// TAB: Surgeries
// ============================================================
function TabSurgeries({ med, canEdit, canEditRow }: { med: Med; canEdit: boolean; canEditRow: CanEditRow }) {
    return (
        <ChildTableEditor<MedicalSurgery>
            canEdit={canEdit}
            canEditRow={canEditRow}
            rows={med.surgeries}
            emptyText="No surgeries recorded."
            onAdd={(row) => med.addSurgery.mutate(row as Record<string, unknown>)}
            onUpdate={(id, patch) =>
                med.updateSurgery.mutate({ id, patch: patch as Record<string, unknown> })
            }
            onDelete={(id) => med.deleteSurgery.mutate(id)}
            addBusy={med.addSurgery.isPending}
            rowTitle={(r) => r.procedure}
            rowSubtitle={(r) =>
                [r.performed_on, r.hospital].filter(Boolean).join(" · ")
            }
            blank={{
                procedure: "",
                performed_on: "",
                hospital: "",
                surgeon: "",
                anesthesia_type: "",
                complications: "",
                notes: "",
            }}
            fields={[
                { key: "procedure", label: "Procedure", required: true },
                { key: "performed_on", label: "Performed on", type: "date" },
                { key: "hospital", label: "Hospital" },
                { key: "surgeon", label: "Surgeon" },
                { key: "anesthesia_type", label: "Anesthesia" },
                { key: "complications", label: "Complications" },
                { key: "notes", label: "Notes" },
            ]}
        />
    );
}

// ============================================================
// TAB: Family history
// ============================================================
function TabFamily({ med, canEdit, canEditRow }: { med: Med; canEdit: boolean; canEditRow: CanEditRow }) {
    return (
        <ChildTableEditor<MedicalFamilyHistoryRow>
            canEdit={canEdit}
            canEditRow={canEditRow}
            rows={med.familyHistory}
            emptyText="No family history recorded."
            onAdd={(row) => med.addFamilyHistory.mutate(row as Record<string, unknown>)}
            onUpdate={(id, patch) =>
                med.updateFamilyHistory.mutate({ id, patch: patch as Record<string, unknown> })
            }
            onDelete={(id) => med.deleteFamilyHistory.mutate(id)}
            addBusy={med.addFamilyHistory.isPending}
            rowTitle={(r) => r.relative}
            rowSubtitle={(r) =>
                [r.condition, r.status, r.age_at_diagnosis ? `age ${r.age_at_diagnosis}` : null]
                    .filter(Boolean)
                    .join(" · ")
            }
            blank={{
                relative: "",
                condition: "",
                age_at_diagnosis: "",
                status: "",
                cause_of_death: "",
                notes: "",
            }}
            fields={[
                { key: "relative", label: "Relative", required: true },
                { key: "condition", label: "Condition", required: true },
                { key: "age_at_diagnosis", label: "Age at diagnosis", type: "number" },
                { key: "status", label: "Status (alive/deceased)" },
                { key: "cause_of_death", label: "Cause of death" },
                { key: "notes", label: "Notes" },
            ]}
        />
    );
}

// ============================================================
// TAB: Social
// ============================================================
function TabSocial({ med, canEdit }: { med: Med; canEdit: boolean }) {
    const p = med.profile;
    return (
        <AutoSaveSection>
            <FieldGrid>
                <Field label="Smoking status" editable={canEdit} keyName="smoking_status" profile={p} updateMain={med.updateMain} />
                <Field label="Pack-years" editable={canEdit} type="number" keyName="smoking_pack_years" profile={p} updateMain={med.updateMain} />
                <Field label="Alcohol use" editable={canEdit} keyName="alcohol_use" profile={p} updateMain={med.updateMain} />
                <Field label="Units / week" editable={canEdit} type="number" keyName="alcohol_units_per_week" profile={p} updateMain={med.updateMain} />
                <Field label="Recreational drugs" editable={canEdit} keyName="recreational_drugs" profile={p} updateMain={med.updateMain} />
                <Field label="Exercise" editable={canEdit} keyName="exercise_frequency" profile={p} updateMain={med.updateMain} />
                <Field label="Sleep (hrs/night)" editable={canEdit} type="number" keyName="sleep_hours" profile={p} updateMain={med.updateMain} />
                <Field label="Living situation" editable={canEdit} keyName="living_situation" profile={p} updateMain={med.updateMain} />
                <Field label="Caregiver at home" editable={canEdit} keyName="caregiver_name" profile={p} updateMain={med.updateMain} />
                <Field label="Caregiver phone" editable={canEdit} keyName="caregiver_phone" profile={p} updateMain={med.updateMain} />
                <Field label="Pets" editable={canEdit} keyName="pets" profile={p} updateMain={med.updateMain} />
                <Field label="Exposure history" editable={canEdit} keyName="exposure_history" profile={p} updateMain={med.updateMain} />
            </FieldGrid>
            <LongField label="Diet notes" editable={canEdit} keyName="diet_notes" profile={p} updateMain={med.updateMain} />
            <LongField label="Home safety notes" editable={canEdit} keyName="home_safety_notes" profile={p} updateMain={med.updateMain} />
            <LongField label="Family history (narrative)" editable={canEdit} keyName="family_history_details" profile={p} updateMain={med.updateMain} />
        </AutoSaveSection>
    );
}

// ============================================================
// TAB: OB/GYN
// ============================================================
function TabObGyn({ med, canEdit, canEditRow }: { med: Med; canEdit: boolean; canEditRow: CanEditRow }) {
    const p = med.profile;
    return (
        <AutoSaveSection>
            <div className="mb-3">
                <CheckboxField
                    label="Currently pregnant"
                    editable={canEdit}
                    keyName="is_pregnant"
                    profile={p}
                    updateMain={med.updateMain}
                />
                <CheckboxField
                    label="Menopause"
                    editable={canEdit}
                    keyName="menopause"
                    profile={p}
                    updateMain={med.updateMain}
                />
            </div>
            <FieldGrid>
                <Field label="Gravida" editable={canEdit} type="number" keyName="gravida" profile={p} updateMain={med.updateMain} />
                <Field label="Para" editable={canEdit} type="number" keyName="para" profile={p} updateMain={med.updateMain} />
                <Field label="Abortions" editable={canEdit} type="number" keyName="abortions" profile={p} updateMain={med.updateMain} />
                <Field label="Living children" editable={canEdit} type="number" keyName="living_children" profile={p} updateMain={med.updateMain} />
                <Field label="LMP" editable={canEdit} type="date" keyName="last_menstrual_period" profile={p} updateMain={med.updateMain} />
                <Field label="Contraception method" editable={canEdit} keyName="contraception_method" profile={p} updateMain={med.updateMain} />
                <Field label="Cervical screening" editable={canEdit} type="date" keyName="cervical_screening_last" profile={p} updateMain={med.updateMain} />
                <Field label="Breast screening" editable={canEdit} type="date" keyName="breast_screening_last" profile={p} updateMain={med.updateMain} />
            </FieldGrid>
            <LongField label="Family planning goals" editable={canEdit} keyName="family_planning_goals" profile={p} updateMain={med.updateMain} />
            <LongField label="Planned pregnancy timeline" editable={canEdit} keyName="planned_pregnancy_timeline" profile={p} updateMain={med.updateMain} />
            <LongField label="Gynecological issues" editable={canEdit} keyName="gynecological_issues" profile={p} updateMain={med.updateMain} />

            <div className="mt-5 pt-4 border-t border-border">
                <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-3">
                    Pregnancy history
                </p>
                <ChildTableEditor<MedicalPregnancy>
                    canEdit={canEdit}
                    canEditRow={canEditRow}
                    rows={med.pregnancies}
                    emptyText="No pregnancies recorded."
                    onAdd={(row) => med.addPregnancy.mutate(row as Record<string, unknown>)}
                    onUpdate={(id, patch) =>
                        med.updatePregnancy.mutate({ id, patch: patch as Record<string, unknown> })
                    }
                    onDelete={(id) => med.deletePregnancy.mutate(id)}
                    addBusy={med.addPregnancy.isPending}
                    rowTitle={(r) => (r.year ? String(r.year) : "Pregnancy")}
                    rowSubtitle={(r) => [r.outcome, r.delivery_type].filter(Boolean).join(" · ")}
                    blank={{
                        year: "",
                        outcome: "",
                        delivery_type: "",
                        complications: "",
                        baby_weight_kg: "",
                        baby_health_notes: "",
                    }}
                    fields={[
                        { key: "year", label: "Year", type: "number" },
                        { key: "outcome", label: "Outcome (live_birth/miscarriage/termination)" },
                        { key: "delivery_type", label: "Delivery (vaginal/cesarean)" },
                        { key: "complications", label: "Complications" },
                        { key: "baby_weight_kg", label: "Baby weight (kg)", type: "number" },
                        { key: "baby_health_notes", label: "Baby health notes" },
                    ]}
                />
            </div>
        </AutoSaveSection>
    );
}

// ============================================================
// TAB: ROS — read-only
// ============================================================
function TabRos({ med }: { med: Med }) {
    const p = med.profile;
    const ROS: [keyof ClientMedicalProfile, string][] = [
        ["ros_fever", "Fever"],
        ["ros_weight_loss", "Weight loss"],
        ["ros_fatigue", "Fatigue"],
        ["ros_night_sweats", "Night sweats"],
        ["ros_chest_pain", "Chest pain"],
        ["ros_shortness_of_breath", "Shortness of breath"],
        ["ros_palpitations", "Palpitations"],
        ["ros_cough", "Cough"],
        ["ros_wheezing", "Wheezing"],
        ["ros_abdominal_pain", "Abdominal pain"],
        ["ros_nausea", "Nausea"],
        ["ros_vomiting", "Vomiting"],
        ["ros_diarrhea", "Diarrhea"],
        ["ros_constipation", "Constipation"],
        ["ros_blood_in_stool", "Blood in stool"],
        ["ros_headache", "Headache"],
        ["ros_dizziness", "Dizziness"],
        ["ros_seizures", "Seizures"],
        ["ros_numbness", "Numbness"],
        ["ros_weakness", "Weakness"],
        ["ros_vision_changes", "Vision changes"],
        ["ros_hearing_loss", "Hearing loss"],
        ["ros_sore_throat", "Sore throat"],
        ["ros_urinary_issues", "Urinary issues"],
        ["ros_blood_in_urine", "Blood in urine"],
        ["ros_joint_pain", "Joint pain"],
        ["ros_back_pain", "Back pain"],
        ["ros_muscle_weakness", "Muscle weakness"],
        ["ros_skin_rash", "Skin rash"],
        ["ros_itching", "Itching"],
        ["ros_wounds", "Wounds"],
        ["ros_anxiety", "Anxiety"],
        ["ros_depression", "Depression"],
        ["ros_sleep_issues", "Sleep issues"],
    ];

    return (
        <div>
            <ReadOnlyBanner>
                Review of systems is filled by a nurse during exam. You can't edit
                this section.
            </ReadOnlyBanner>
            <div className="grid grid-cols-2 gap-1.5 mt-3">
                {ROS.map(([key, label]) => (
                    <div
                        key={key}
                        className={`text-xs px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 ${p?.[key]
                            ? "bg-primary/10 text-foreground"
                            : "bg-muted text-muted-foreground"
                            }`}
                    >
                        {p?.[key] ? (
                            <Check className="w-3 h-3 text-primary shrink-0" />
                        ) : (
                            <X className="w-3 h-3 shrink-0 opacity-40" />
                        )}
                        <span className="truncate">{label}</span>
                    </div>
                ))}
            </div>
            {p?.ros_other && (
                <div className="mt-3">
                    <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
                        Other
                    </p>
                    <p className="text-sm text-foreground mt-0.5">{p.ros_other}</p>
                </div>
            )}
        </div>
    );
}

// ============================================================
// TAB: Preferences
// ============================================================
function TabPrefs({ med, canEdit }: { med: Med; canEdit: boolean }) {
    const p = med.profile;
    return (
        <AutoSaveSection>
            <FieldGrid>
                <Field label="Preferred visit time" editable={canEdit} keyName="preferred_visit_time" profile={p} updateMain={med.updateMain} />
                <Field label="Communication" editable={canEdit} keyName="communication_preferences" profile={p} updateMain={med.updateMain} />
                <Field label="Religious preferences" editable={canEdit} keyName="religious_preferences" profile={p} updateMain={med.updateMain} />
                <Field label="Cultural preferences" editable={canEdit} keyName="cultural_preferences" profile={p} updateMain={med.updateMain} />
                <Field label="Dietary restrictions" editable={canEdit} keyName="dietary_restrictions" profile={p} updateMain={med.updateMain} />
                <Field label="Mobility aids" editable={canEdit} keyName="mobility_aids" profile={p} updateMain={med.updateMain} />
            </FieldGrid>
            <LongField label="Advance directive" editable={canEdit} keyName="advance_directive" profile={p} updateMain={med.updateMain} />
            <div className="grid grid-cols-2 gap-2 mt-3">
                <CheckboxField label="Hearing aids" editable={canEdit} keyName="hearing_aids" profile={p} updateMain={med.updateMain} />
                <CheckboxField label="Vision aids" editable={canEdit} keyName="vision_aids" profile={p} updateMain={med.updateMain} />
                <CheckboxField label="Cognitive impairment" editable={canEdit} keyName="cognitive_impairment" profile={p} updateMain={med.updateMain} />
                <CheckboxField label="DNR status" editable={canEdit} keyName="dnr_status" profile={p} updateMain={med.updateMain} />
                <CheckboxField label="Organ donor" editable={canEdit} keyName="organ_donor" profile={p} updateMain={med.updateMain} />
            </div>
        </AutoSaveSection>
    );
}

// ============================================================
// TAB: Exams — read-only
// ============================================================
function TabExams({ med, clientId }: { med: Med; clientId: string }) {
    if (med.visits.length === 0) {
        return (
            <div>
                <ReadOnlyBanner>
                    No examinations yet. When a nurse visits, they'll record the exam
                    here.
                </ReadOnlyBanner>
            </div>
        );
    }
    return (
        <div className="space-y-3">
            {med.visits.map((v) => {
                const editable = med.isCaregiver && isWithinWindow(v.created_at);
                return (
                    <div key={v.id} className="space-y-1">
                        <VisitRow visit={v} />
                        {editable && clientId && (
                            <div className="flex items-center gap-2 pl-1">
                                <Link
                                    to={`/medical/${clientId}/exam/${v.id}`}
                                    className="inline-flex items-center gap-1 text-xs text-primary font-semibold h-9 px-3 rounded-xl active:bg-muted"
                                >
                                    <Pencil className="w-3 h-3" /> Edit
                                </Link>
                                <button
                                    onClick={() => {
                                        if (confirm("Delete this examination? This cannot be undone.")) {
                                            med.deleteVisit.mutate(v.id);
                                        }
                                    }}
                                    disabled={med.deleteVisit.isPending}
                                    className="inline-flex items-center gap-1 text-xs text-destructive font-semibold h-9 px-3 rounded-xl active:bg-muted disabled:opacity-60"
                                >
                                    <Trash2 className="w-3 h-3" /> Delete
                                </button>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function VisitRow({ visit }: { visit: MedicalVisit }) {
    const [open, setOpen] = useState(false);
    const dateLabel = new Date(visit.visit_date).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
    });

    return (
        <div className="rounded-2xl bg-muted/60 overflow-hidden">
            <button
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center gap-3 px-3 py-3 text-left active:bg-muted"
            >
                <Stethoscope className="w-4 h-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                        Exam · {dateLabel}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                        {visit.nurse_name || "Nurse"} {visit.locked_at ? "· Signed" : "· Draft"}
                    </p>
                </div>
                <ChevronDown
                    className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""
                        }`}
                />
            </button>
            {open && (
                <div className="px-3 pb-3 space-y-3 text-sm">
                    <VitalsRow visit={visit} />

                    {/* ---- Review of systems (free-text notes) ---- */}
                    {visit.ros_constitutional_notes && (
                        <ExamField label="ROS · Constitutional" value={visit.ros_constitutional_notes} />
                    )}
                    {visit.ros_cardiovascular_notes && (
                        <ExamField label="ROS · Cardiovascular" value={visit.ros_cardiovascular_notes} />
                    )}
                    {visit.ros_respiratory_notes && (
                        <ExamField label="ROS · Respiratory" value={visit.ros_respiratory_notes} />
                    )}
                    {visit.ros_gastrointestinal_notes && (
                        <ExamField label="ROS · Gastrointestinal" value={visit.ros_gastrointestinal_notes} />
                    )}
                    {visit.ros_neurological_notes && (
                        <ExamField label="ROS · Neurological" value={visit.ros_neurological_notes} />
                    )}
                    {visit.ros_heent_notes && (
                        <ExamField label="ROS · HEENT" value={visit.ros_heent_notes} />
                    )}
                    {visit.ros_genitourinary_notes && (
                        <ExamField label="ROS · Genitourinary" value={visit.ros_genitourinary_notes} />
                    )}
                    {visit.ros_musculoskeletal_notes && (
                        <ExamField label="ROS · Musculoskeletal" value={visit.ros_musculoskeletal_notes} />
                    )}
                    {visit.ros_skin_notes && (
                        <ExamField label="ROS · Skin" value={visit.ros_skin_notes} />
                    )}
                    {visit.ros_psychiatric_notes && (
                        <ExamField label="ROS · Psychiatric" value={visit.ros_psychiatric_notes} />
                    )}
                    {visit.ros_other && (
                        <ExamField label="ROS · Other" value={visit.ros_other} />
                    )}

                    {/* ---- Physical examination ---- */}
                    <ExamField label="General appearance" value={visit.exam_general_appearance} />
                    <ExamField label="Consciousness" value={visit.exam_consciousness} />
                    <ExamField label="Cardiovascular" value={visit.exam_cardiovascular} />
                    <ExamField label="Respiratory" value={visit.exam_respiratory} />
                    <ExamField label="Abdominal" value={visit.exam_abdominal} />
                    <ExamField label="Neurological" value={visit.exam_neurological} />
                    <ExamField label="Skin" value={visit.exam_skin} />
                    <ExamField label="Extremities" value={visit.exam_extremities} />
                    <ExamField label="Other findings" value={visit.exam_other_findings} />

                    {/* ---- Diagnosis & plan ---- */}
                    <ExamField label="Nursing diagnosis" value={visit.nursing_diagnosis} />
                    <ExamField label="Care plan" value={visit.care_plan} />
                    <ExamField label="Referred to" value={visit.referred_to} />

                    {visit.locked_at && visit.nurse_name && (
                        <div className="flex items-center gap-2 rounded-xl bg-primary/10 text-primary px-3 py-2 text-xs font-semibold">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Signed by {visit.nurse_name}
                            {visit.nurse_reg_number ? ` · ${visit.nurse_reg_number}` : ""}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function VitalsRow({ visit }: { visit: MedicalVisit }) {
    const cells: [string, string | number | null][] = [
        ["Temp", visit.exam_temperature_c ? `${visit.exam_temperature_c}°C` : null],
        ["Pulse", visit.exam_pulse_bpm],
        ["RR", visit.exam_respiratory_rate],
        ["BP", visit.exam_blood_pressure],
        ["SpO₂", visit.exam_oxygen_saturation],
        ["Wt", visit.exam_weight_kg],
    ];
    const any = cells.some(([, v]) => v !== null && v !== undefined && v !== "");
    if (!any) return null;
    return (
        <div className="grid grid-cols-3 gap-2">
            {cells.map(([label, v]) =>
                v === null || v === undefined || v === "" ? null : (
                    <div key={label} className="rounded-xl bg-background px-2 py-2 text-center">
                        <p className="text-xs font-bold text-foreground">{v}</p>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            {label}
                        </p>
                    </div>
                ),
            )}
        </div>
    );
}

function ExamField({ label, value }: { label: string; value: string | null }) {
    if (!value) return null;
    return (
        <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                {label}
            </p>
            <p className="text-sm text-foreground mt-0.5 whitespace-pre-line">{value}</p>
        </div>
    );
}

// ============================================================
// Primitives
// ============================================================
function AutoSaveSection({ children }: { children: React.ReactNode }) {
    return <div className="space-y-3">{children}</div>;
}

function FieldGrid({ children }: { children: React.ReactNode }) {
    return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

function Field({
    label,
    editable,
    type = "text",
    keyName,
    profile,
    updateMain,
}: {
    label: string;
    editable: boolean;
    type?: string;
    keyName: keyof ClientMedicalProfile;
    profile: ClientMedicalProfile | null;
    updateMain: Med["updateMain"];
}) {
    const value = (profile?.[keyName] ?? "") as string | number;
    const [local, setLocal] = useState<string>(String(value));
    const dirty = useRef(false);

    useEffect(() => {
        if (!dirty.current) setLocal(String(value));
    }, [value]);

    if (!editable) {
        return (
            <div>
                <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>
                <p className="mt-1 text-sm text-foreground">{value ? String(value) : "—"}</p>
            </div>
        );
    }

    return (
        <div>
            <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>
            <Input
                type={type}
                value={local}
                onChange={(e) => {
                    dirty.current = true;
                    setLocal(e.target.value);
                }}
                onBlur={() => {
                    if (!dirty.current) return;
                    const next = local.trim() === "" ? null : local;
                    const prev = profile?.[keyName];
                    if (String(prev ?? "") !== String(next ?? "")) {
                        updateMain.mutate({ [keyName]: next } as Partial<ClientMedicalProfile>);
                    }
                    dirty.current = false;
                }}
                className="mt-1 h-10 rounded-2xl bg-muted border-0"
            />
        </div>
    );
}

function SelectField({
    label,
    editable,
    keyName,
    options,
    profile,
    updateMain,
}: {
    label: string;
    editable: boolean;
    keyName: keyof ClientMedicalProfile;
    options: string[];
    profile: ClientMedicalProfile | null;
    updateMain: Med["updateMain"];
}) {
    const value = (profile?.[keyName] ?? "") as string;
    if (!editable) {
        return (
            <div>
                <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>
                <p className="mt-1 text-sm text-foreground">{value || "—"}</p>
            </div>
        );
    }
    return (
        <div>
            <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>
            <select
                value={value}
                onChange={(e) => {
                    const next = e.target.value || null;
                    updateMain.mutate({ [keyName]: next } as Partial<ClientMedicalProfile>);
                }}
                className="mt-1 w-full h-10 rounded-2xl bg-muted border-0 px-3 text-sm"
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

function CheckboxField({
    label,
    editable,
    keyName,
    profile,
    updateMain,
}: {
    label: string;
    editable: boolean;
    keyName: keyof ClientMedicalProfile;
    profile: ClientMedicalProfile | null;
    updateMain: Med["updateMain"];
}) {
    const checked = !!profile?.[keyName];
    if (!editable) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-muted/60">
                {checked ? (
                    <Check className="w-3.5 h-3.5 text-primary" />
                ) : (
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                )}
                <span className="text-xs text-foreground">{label}</span>
            </div>
        );
    }
    return (
        <button
            type="button"
            onClick={() =>
                updateMain.mutate({ [keyName]: !checked } as Partial<ClientMedicalProfile>)
            }
            className={`flex items-center gap-2 px-3 py-2 rounded-2xl text-left transition-colors ${checked ? "bg-primary/10" : "bg-muted"
                }`}
        >
            {checked ? (
                <Check className="w-3.5 h-3.5 text-primary shrink-0" />
            ) : (
                <X className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            )}
            <span className="text-xs text-foreground">{label}</span>
        </button>
    );
}

function LongField({
    label,
    editable,
    keyName,
    profile,
    updateMain,
}: {
    label: string;
    editable: boolean;
    keyName: keyof ClientMedicalProfile;
    profile: ClientMedicalProfile | null;
    updateMain: Med["updateMain"];
}) {
    const value = (profile?.[keyName] ?? "") as string;
    const [local, setLocal] = useState(value);
    const dirty = useRef(false);

    useEffect(() => {
        if (!dirty.current) setLocal(value);
    }, [value]);

    if (!editable) {
        if (!value) return null;
        return (
            <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                    {label}
                </p>
                <p className="text-sm text-foreground mt-0.5 whitespace-pre-line">{value}</p>
            </div>
        );
    }

    return (
        <div>
            <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>
            <Textarea
                value={local}
                onChange={(e) => {
                    dirty.current = true;
                    setLocal(e.target.value);
                }}
                onBlur={() => {
                    if (!dirty.current) return;
                    const next = local.trim() === "" ? null : local;
                    if ((profile?.[keyName] ?? null) !== next) {
                        updateMain.mutate({ [keyName]: next } as Partial<ClientMedicalProfile>);
                    }
                    dirty.current = false;
                }}
                rows={3}
                className="mt-1 rounded-2xl bg-muted border-0"
            />
        </div>
    );
}

function ReadOnlyBanner({ children }: { children: React.ReactNode }) {
    return (
        <div className="rounded-2xl bg-muted/60 border border-border px-3 py-2 text-xs text-muted-foreground">
            {children}
        </div>
    );
}

// ============================================================
// Child table editor
// ============================================================
type FieldSpec = {
    key: string;
    label: string;
    type?: "text" | "date" | "number";
    required?: boolean;
};

function ChildTableEditor<T extends { id: string; created_at?: string }>({
    canEdit,
    canEditRow,
    rows,
    emptyText,
    onAdd,
    onUpdate,
    onDelete,
    addBusy,
    rowTitle,
    rowSubtitle,
    blank,
    fields,
}: {
    canEdit: boolean;
    canEditRow?: (row: T) => boolean;
    rows: T[];
    emptyText: string;
    onAdd: (row: Record<string, unknown>) => void;
    onUpdate: (id: string, patch: Record<string, unknown>) => void;
    onDelete: (id: string) => void;
    addBusy: boolean;
    rowTitle: (r: T) => string;
    rowSubtitle: (r: T) => string;
    blank: Record<string, unknown>;
    fields: FieldSpec[];
}) {
    const [adding, setAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [draft, setDraft] = useState<Record<string, unknown>>({});

    const startAdd = () => {
        setDraft(blank);
        setAdding(true);
        setEditingId(null);
    };
    const startEdit = (row: T) => {
        const d: Record<string, unknown> = {};
        for (const f of fields) d[f.key] = (row as Record<string, unknown>)[f.key] ?? "";
        setDraft(d);
        setEditingId(row.id);
        setAdding(false);
    };
    const cancel = () => {
        setAdding(false);
        setEditingId(null);
        setDraft({});
    };
    const submit = () => {
        const cleaned: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(draft)) {
            cleaned[k] = v === "" ? null : v;
        }
        if (editingId) onUpdate(editingId, cleaned);
        else onAdd(cleaned);
        cancel();
    };
    const canSubmit = fields
        .filter((f) => f.required)
        .every((f) => String(draft[f.key] ?? "").trim() !== "");

    return (
        <div className="space-y-2">
            {rows.length === 0 && !adding && (
                <p className="text-xs text-muted-foreground py-2">{emptyText}</p>
            )}

            {rows.map((r) =>
                editingId === r.id ? null : (
                    <div
                        key={r.id}
                        className="rounded-2xl bg-muted/60 px-3 py-2.5 flex items-start gap-3"
                    >
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                                {rowTitle(r)}
                            </p>
                            {rowSubtitle(r) && (
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                    {rowSubtitle(r)}
                                </p>
                            )}
                        </div>

                        {/* Locked chip when outside the 24h window */}
                        {canEdit && canEditRow && !canEditRow(r) && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-[10px] font-semibold shrink-0">
                                <Lock className="w-3 h-3" /> Locked
                            </span>
                        )}

                        {canEdit && (canEditRow ? canEditRow(r) : true) && (
                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    onClick={() => startEdit(r)}
                                    className="h-8 w-8 rounded-xl inline-flex items-center justify-center text-muted-foreground active:bg-muted"
                                    aria-label="Edit"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirm("Delete this entry?")) onDelete(r.id);
                                    }}
                                    className="h-8 w-8 rounded-xl inline-flex items-center justify-center text-destructive active:bg-muted"
                                    aria-label="Delete"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}
                    </div>
                ),
            )}

            {(adding || editingId) && (
                <div className="rounded-2xl bg-muted/60 px-3 py-3 space-y-2">
                    {fields.map((f) => (
                        <div key={f.key}>
                            <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                {f.label}
                                {f.required && <span className="text-destructive"> *</span>}
                            </Label>
                            <Input
                                type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                                value={String(draft[f.key] ?? "")}
                                onChange={(e) =>
                                    setDraft((d) => ({ ...d, [f.key]: e.target.value }))
                                }
                                className="mt-1 h-10 rounded-2xl bg-background border-0"
                            />
                        </div>
                    ))}
                    <div className="flex gap-2 pt-1">
                        <Button
                            variant="secondary"
                            onClick={cancel}
                            className="flex-1 h-10 rounded-2xl"
                        >
                            <X className="w-3.5 h-3.5 mr-1.5" /> Cancel
                        </Button>
                        <Button
                            onClick={submit}
                            disabled={!canSubmit || addBusy}
                            className="flex-1 h-10 rounded-2xl"
                        >
                            {addBusy ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <Save className="w-3.5 h-3.5 mr-1.5" /> Save
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}

            {canEdit && !adding && !editingId && (
                <Button
                    variant="outline"
                    onClick={startAdd}
                    className="w-full h-10 rounded-2xl"
                >
                    <Plus className="w-3.5 h-3.5 mr-1.5" /> Add
                </Button>
            )}
        </div>
    );
}
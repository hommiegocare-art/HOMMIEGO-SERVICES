// src/components/profile/MedicalAuditTrail.tsx
import { useMemo, useState } from "react";
import {
    History,
    Lock,
    Plus,
    Pencil,
    Trash2,
    ChevronDown,
    User as UserIcon,
    ShieldCheck,
} from "lucide-react";
import { useMedicalAudit } from "@/hooks/useMedicalProfile";
import type { MedicalAuditEntry } from "@/types/db";

// ============================================================
// Human-friendly labels for tables and columns
// ============================================================
const TABLE_LABELS: Record<string, string> = {
    client_medical_profile: "Medical profile",
    medical_allergies: "Allergy",
    medical_medications: "Medication",
    medical_conditions: "Condition",
    medical_surgeries: "Surgery",
    medical_immunizations: "Immunization",
    medical_family_history: "Family history",
    medical_pregnancies: "Pregnancy",
    medical_visits: "Examination",
};

const COLUMN_LABELS: Record<string, string> = {
    // top-level
    blood_type: "Blood type",
    date_of_birth: "Date of birth",
    sex_at_birth: "Sex at birth",
    gender_identity: "Gender identity",
    height_cm: "Height (cm)",
    weight_kg: "Weight (kg)",
    marital_status: "Marital status",
    occupation: "Occupation",
    next_of_kin_name: "Next of kin",
    next_of_kin_phone: "NOK phone",
    next_of_kin_relationship: "NOK relationship",
    preferred_hospital: "Preferred hospital",

    presenting_complaint: "Presenting complaint",
    history_of_present_illness: "History of present illness",
    pain_score: "Pain score",
    pain_location: "Pain location",
    pain_character: "Pain character",
    functional_status: "Functional status",

    has_hypertension: "Hypertension",
    has_diabetes: "Diabetes",
    diabetes_type: "Diabetes type",
    has_asthma: "Asthma",
    has_copd: "COPD",
    has_heart_disease: "Heart disease",
    has_stroke: "Stroke",
    has_epilepsy: "Epilepsy",
    has_cancer: "Cancer",
    has_hiv: "HIV",
    hiv_on_art: "On ART",
    has_tb: "TB",
    has_mental_health_condition: "Mental health condition",
    has_kidney_disease: "Kidney disease",
    has_liver_disease: "Liver disease",

    current_medications: "Current medications",
    drug_allergies: "Drug allergies",
    food_allergies: "Food allergies",
    environmental_allergies: "Environmental allergies",
    allergies: "Allergies",
    chronic_conditions: "Chronic conditions",
    past_surgeries: "Past surgeries",
    family_history: "Family history",

    smoking_status: "Smoking",
    alcohol_use: "Alcohol use",
    exercise_frequency: "Exercise",
    living_situation: "Living situation",

    // visit fields
    exam_temperature_c: "Temperature",
    exam_pulse_bpm: "Pulse",
    exam_respiratory_rate: "Respiratory rate",
    exam_blood_pressure: "Blood pressure",
    exam_oxygen_saturation: "SpO₂",
    exam_weight_kg: "Weight",
    exam_height_cm: "Height",
    exam_general_appearance: "General appearance",
    exam_cardiovascular: "Cardiovascular",
    exam_respiratory: "Respiratory",
    exam_abdominal: "Abdominal",
    exam_neurological: "Neurological",
    nursing_diagnosis: "Nursing diagnosis",
    care_plan: "Care plan",
    goals_of_care: "Goals",
    referred_to: "Referred to",
    nurse_name: "Nurse name",
    nurse_reg_number: "Reg number",
    locked_at: "Locked at",
    locked_by: "Locked by",

    // child table names
    allergen: "Allergen",
    category: "Category",
    reaction: "Reaction",
    severity: "Severity",
    name: "Name",
    dose: "Dose",
    frequency: "Frequency",
    route: "Route",
    indication: "Indication",
    condition: "Condition",
    procedure: "Procedure",
    relative: "Relative",
    vaccine: "Vaccine",
};

// Fields that should never appear in the diff UI (noise)
const HIDDEN_COLUMNS = new Set([
    "id",
    "client_id",
    "caregiver_id",
    "created_at",
    "updated_at",
    "updated_by",
    "patient_updated_at",
    "nurse_updated_at",
    "nurse_updated_by",
    "row_id",
    "table_name",
    "actor_id",
    "actor_role",
    "action",
    "changed_columns",
    "before_data",
    "after_data",
]);

// ============================================================
// Main component
// ============================================================
export function MedicalAuditTrail({ clientId }: { clientId: string | undefined }) {
    const { data, isLoading } = useMedicalAudit(clientId);
    const [expanded, setExpanded] = useState<string | null>(null);

    if (isLoading) {
        return (
            <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-14 rounded-2xl skeleton-shimmer" />
                ))}
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="rounded-2xl bg-muted/60 border border-border px-4 py-6 text-center">
                <History className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                    No changes recorded yet.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {data.map((entry) => (
                <AuditRow
                    key={entry.id}
                    entry={entry}
                    open={expanded === entry.id}
                    onToggle={() =>
                        setExpanded((v) => (v === entry.id ? null : entry.id))
                    }
                />
            ))}
        </div>
    );
}

// ============================================================
// One audit row
// ============================================================
function AuditRow({
    entry,
    open,
    onToggle,
}: {
    entry: MedicalAuditEntry;
    open: boolean;
    onToggle: () => void;
}) {
    const label = TABLE_LABELS[entry.table_name] ?? entry.table_name;

    const { icon, tone, verb } = useMemo(() => {
        switch (entry.action) {
            case "insert":
                return {
                    icon: <Plus className="w-3.5 h-3.5" />,
                    tone: "text-emerald-600 bg-emerald-500/10",
                    verb: "Added",
                };
            case "update":
                return {
                    icon: <Pencil className="w-3.5 h-3.5" />,
                    tone: "text-primary bg-primary/10",
                    verb: "Updated",
                };
            case "delete":
                return {
                    icon: <Trash2 className="w-3.5 h-3.5" />,
                    tone: "text-destructive bg-destructive/10",
                    verb: "Deleted",
                };
            case "lock":
                return {
                    icon: <Lock className="w-3.5 h-3.5" />,
                    tone: "text-amber-600 bg-amber-500/10",
                    verb: "Locked",
                };
            default:
                return {
                    icon: <History className="w-3.5 h-3.5" />,
                    tone: "text-muted-foreground bg-muted",
                    verb: "Changed",
                };
        }
    }, [entry.action]);

    const changedSummary = useMemo(() => {
        if (entry.action !== "update") return null;
        const cols = (entry.changed_columns ?? []).filter(
            (c) => !HIDDEN_COLUMNS.has(c),
        );
        if (cols.length === 0) return null;
        if (cols.length <= 3) {
            return cols.map((c) => COLUMN_LABELS[c] ?? c).join(", ");
        }
        return `${cols.length} fields`;
    }, [entry]);

    const ts = new Date(entry.created_at);
    const timeLabel = ts.toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full flex items-start gap-3 px-3 py-3 text-left active:bg-muted"
            >
                <span
                    className={`h-8 w-8 rounded-xl inline-flex items-center justify-center shrink-0 ${tone}`}
                >
                    {icon}
                </span>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                        {verb} · {label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {changedSummary ? `${changedSummary} · ` : ""}
                        {timeLabel}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 inline-flex items-center gap-1">
                        <UserIcon className="w-3 h-3" />
                        {entry.actor_role === "caregiver"
                            ? "Caregiver"
                            : entry.actor_role === "client"
                                ? "Patient"
                                : entry.actor_role === "admin"
                                    ? "Admin"
                                    : "Unknown"}
                    </p>
                </div>
                <ChevronDown
                    className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""
                        }`}
                />
            </button>

            {open && (
                <div className="px-3 pb-3 pt-0 border-t border-border">
                    <DiffView entry={entry} />
                </div>
            )}
        </div>
    );
}

// ============================================================
// Diff view — before/after table
// ============================================================
function DiffView({ entry }: { entry: MedicalAuditEntry }) {
    const rows = useMemo(() => buildDiffRows(entry), [entry]);

    if (rows.length === 0) {
        return (
            <p className="text-xs text-muted-foreground py-3">
                No field-level changes to show.
            </p>
        );
    }

    return (
        <div className="pt-3 space-y-1">
            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">
                <span>Before</span>
                <span />
                <span>After</span>
            </div>
            {rows.map((r) => (
                <div
                    key={r.key}
                    className="grid grid-cols-[1fr_auto_1fr] gap-2 items-start text-xs"
                >
                    <div className="rounded-xl bg-muted px-2.5 py-2 min-w-0">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-0.5">
                            {r.label}
                        </p>
                        <p className="text-foreground break-words whitespace-pre-line">
                            {formatValue(r.before)}
                        </p>
                    </div>
                    <span className="text-muted-foreground self-center">→</span>
                    <div className="rounded-xl bg-primary/10 px-2.5 py-2 min-w-0">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-primary mb-0.5">
                            {r.label}
                        </p>
                        <p className="text-foreground break-words whitespace-pre-line">
                            {formatValue(r.after)}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ============================================================
// Helpers
// ============================================================
type DiffRow = {
    key: string;
    label: string;
    before: unknown;
    after: unknown;
};

function buildDiffRows(entry: MedicalAuditEntry): DiffRow[] {
    const before = (entry.before_data ?? {}) as Record<string, unknown>;
    const after = (entry.after_data ?? {}) as Record<string, unknown>;

    // For insert: only "after" exists → show all non-hidden fields as new
    if (entry.action === "insert") {
        return Object.keys(after)
            .filter((k) => !HIDDEN_COLUMNS.has(k))
            .filter((k) => !isEmpty(after[k]))
            .map((k) => ({
                key: k,
                label: COLUMN_LABELS[k] ?? k,
                before: null,
                after: after[k],
            }));
    }

    // For delete: only "before" exists → show all non-hidden fields as removed
    if (entry.action === "delete") {
        return Object.keys(before)
            .filter((k) => !HIDDEN_COLUMNS.has(k))
            .filter((k) => !isEmpty(before[k]))
            .map((k) => ({
                key: k,
                label: COLUMN_LABELS[k] ?? k,
                before: before[k],
                after: null,
            }));
    }

    // For update: use changed_columns to limit the diff
    const cols =
        entry.changed_columns && entry.changed_columns.length > 0
            ? entry.changed_columns
            : unionKeys(before, after);

    return cols
        .filter((k) => !HIDDEN_COLUMNS.has(k))
        .filter((k) => !isEqual(before[k], after[k]))
        .map((k) => ({
            key: k,
            label: COLUMN_LABELS[k] ?? k,
            before: before[k],
            after: after[k],
        }));
}

function unionKeys(
    a: Record<string, unknown>,
    b: Record<string, unknown>,
): string[] {
    const s = new Set([...Object.keys(a), ...Object.keys(b)]);
    return Array.from(s);
}

function isEmpty(v: unknown): boolean {
    if (v === null || v === undefined) return true;
    if (v === "") return true;
    if (Array.isArray(v) && v.length === 0) return true;
    return false;
}

function isEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    try {
        return JSON.stringify(a) === JSON.stringify(b);
    } catch {
        return false;
    }
}

function formatValue(v: unknown): string {
    if (v === null || v === undefined || v === "") return "—";
    if (typeof v === "boolean") return v ? "Yes" : "No";
    if (Array.isArray(v)) return v.length === 0 ? "—" : v.join(", ");
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
}

// ============================================================
// Wrapper card (for embedding in a page or profile)
// ============================================================
export function MedicalAuditTrailCard({ clientId }: { clientId: string | undefined }) {
    return (
        <div className="rounded-2xl bg-card px-4 py-4">
            <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <p className="text-sm font-bold text-foreground">Audit trail</p>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
                Every change to this medical record, with the actor and timestamp.
            </p>
            <MedicalAuditTrail clientId={clientId} />
        </div>
    );
}
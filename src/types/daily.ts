// src/types/daily.ts
// Types for the daily health diary + pregnancy + child tracking module.
// Kept separate from src/types/db.ts so the core schema stays lean.

// ============================================================
// Enums / unions
// ============================================================

export type DailyCategory = "symptom" | "action" | "outcome" | "mood" | "note";

export type DailyVisibility = "private" | "caregivers" | "public";

export type PregnancyRiskLevel = "low" | "moderate" | "high";

export type PregnancyEventType =
    | "kick_session"
    | "contraction"
    | "weight"
    | "bp"
    | "appointment"
    | "milestone"
    | "ultrasound"
    | "lab_result"
    | "note";

export type ContractionIntensity = "mild" | "moderate" | "strong";

export type BirthOutcome = "live_birth" | "stillbirth" | "neonatal_death";

export type BirthDeliveryType =
    | "vaginal"
    | "cesarean"
    | "assisted"
    | "breech"
    | "other";

export type ChildSex = "male" | "female" | "intersex" | "unknown";

export type ChildEventType =
    // Clinic / health
    | "clinic_visit"
    | "vaccine"
    | "illness"
    | "injury"
    | "hospital_admission"
    | "medication"
    // Growth
    | "weight"
    | "height"
    | "head_circumference"
    | "muac"
    // Development
    | "milestone"
    | "feeding"
    | "sleep"
    | "teething"
    | "potty_training"
    // Nutrition
    | "vitamin_a"
    | "deworming"
    | "nutrition_supplement"
    // Free text
    | "note";

// ============================================================
// Tables
// ============================================================

export type DailyEntry = {
    id: string;
    client_id: string;

    entry_date: string;        // date (yyyy-mm-dd)
    logged_at: string;         // timestamptz

    category: DailyCategory;

    symptom_key: string | null;
    symptom_custom: string | null;
    action_key: string | null;
    action_custom: string | null;

    title: string | null;
    notes: string | null;

    severity: number | null;   // 0..10
    body_location: string | null;
    duration_minutes: number | null;
    medication_name: string | null;
    medication_dose: string | null;
    resolved: boolean;
    resolved_at: string | null;

    visibility: DailyVisibility;

    created_at: string;
    updated_at: string;
};

export type DailyPregnancy = {
    client_id: string;

    lmp: string | null;        // date
    edd: string | null;        // date
    gravida: number | null;
    para: number | null;

    risk_level: PregnancyRiskLevel;

    care_provider: string | null;
    care_provider_phone: string | null;
    birth_plan: string | null;
    notes: string | null;

    is_active: boolean;

    created_at: string;
    updated_at: string;
};

export type DailyPregnancyEvent = {
    id: string;
    client_id: string;

    event_type: PregnancyEventType;
    entry_date: string;
    logged_at: string;

    kick_count: number | null;
    kick_duration_minutes: number | null;

    contraction_duration_seconds: number | null;
    contraction_interval_minutes: number | null;
    contraction_intensity: ContractionIntensity | null;

    weight_kg: number | null;
    bp_systolic: number | null;
    bp_diastolic: number | null;
    fundal_height_cm: number | null;

    milestone_key: string | null;
    appointment_with: string | null;
    appointment_notes: string | null;

    notes: string | null;

    visibility: DailyVisibility;

    created_at: string;
};

export type DailyBirth = {
    id: string;
    mother_id: string;
    pregnancy_client_id: string | null;

    birth_date: string;
    birth_time: string | null;
    gestational_age_weeks: number | null;
    gestational_age_days: number | null;

    delivery_type: BirthDeliveryType | null;
    delivery_location: string | null;
    attended_by: string | null;
    labour_duration_hours: number | null;

    baby_weight_kg: number | null;
    baby_length_cm: number | null;
    head_circumference_cm: number | null;
    apgar_1min: number | null;
    apgar_5min: number | null;

    outcome: BirthOutcome;
    complications: string | null;
    nicu_admitted: boolean;
    nicu_days: number | null;

    notes: string | null;

    created_at: string;
    updated_at: string;
};

export type DailyChildProfile = {
    id: string;
    mother_id: string;
    birth_id: string | null;

    full_name: string;
    nickname: string | null;
    sex: ChildSex;
    date_of_birth: string;

    birth_weight_kg: number | null;
    birth_length_cm: number | null;
    birth_head_circumference_cm: number | null;
    delivery_type: BirthDeliveryType | null;

    is_active: boolean;
    tracking_end_date: string | null;

    primary_facility: string | null;
    primary_facility_phone: string | null;

    notes: string | null;

    created_at: string;
    updated_at: string;
};

export type DailyChildEvent = {
    id: string;
    child_id: string;
    mother_id: string;

    event_type: ChildEventType;
    entry_date: string;
    logged_at: string;

    visit_reason: string | null;
    facility: string | null;
    attended_by: string | null;
    vaccine_key: string | null;
    vaccine_dose: number | null;

    weight_kg: number | null;
    height_cm: number | null;
    head_circumference_cm: number | null;
    muac_cm: number | null;

    illness_type: string | null;
    severity: number | null;
    medication_name: string | null;
    medication_dose: string | null;
    resolved: boolean;
    resolved_at: string | null;

    milestone_key: string | null;

    title: string | null;
    notes: string | null;

    visibility: DailyVisibility;

    created_at: string;
};

// ============================================================
// Supabase table registration — import this into src/types/db.ts
// ============================================================
// In db.ts, do:
//   import type {
//     DailyEntry, DailyPregnancy, DailyPregnancyEvent,
//     DailyBirth, DailyChildProfile, DailyChildEvent,
//   } from "./daily";
//
//   Then inside Database.public.Tables, add these six entries:
//
//     daily_entries:           { Row: DailyEntry;          Insert: Partial<DailyEntry>;          Update: Partial<DailyEntry> };
//     daily_pregnancy:         { Row: DailyPregnancy;      Insert: Partial<DailyPregnancy>;      Update: Partial<DailyPregnancy> };
//     daily_pregnancy_events:  { Row: DailyPregnancyEvent; Insert: Partial<DailyPregnancyEvent>; Update: Partial<DailyPregnancyEvent> };
//     daily_births:            { Row: DailyBirth;          Insert: Partial<DailyBirth>;          Update: Partial<DailyBirth> };
//     daily_child_profiles:    { Row: DailyChildProfile;   Insert: Partial<DailyChildProfile>;   Update: Partial<DailyChildProfile> };
//     daily_child_events:      { Row: DailyChildEvent;     Insert: Partial<DailyChildEvent>;     Update: Partial<DailyChildEvent> };
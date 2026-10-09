// src/lib/dailyOptions.ts
// Curated option lists for the daily health diary, pregnancy, and child tracking.

import type {
    DailyCategory,
    ChildEventType,
    PregnancyEventType,
} from "@/types/daily";

// ============================================================
// DIARY — categories
// ============================================================
export const DAILY_CATEGORIES: { key: DailyCategory; label: string; icon: string }[] = [
    { key: "symptom", label: "Symptom", icon: "🤒" },
    { key: "action", label: "Action taken", icon: "💊" },
    { key: "outcome", label: "Outcome", icon: "✅" },
    { key: "mood", label: "Mood", icon: "🙂" },
    { key: "note", label: "Note", icon: "📝" },
];

// ============================================================
// SYMPTOMS — the everyday picker
// ============================================================
export type SymptomOption = {
    key: string;
    label: string;
    group: string;
};

export const SYMPTOMS: SymptomOption[] = [
    // General
    { key: "fever", label: "Fever", group: "General" },
    { key: "chills", label: "Chills", group: "General" },
    { key: "fatigue", label: "Fatigue / tiredness", group: "General" },
    { key: "body_aches", label: "Body aches", group: "General" },
    { key: "night_sweats", label: "Night sweats", group: "General" },
    { key: "weight_loss", label: "Weight loss", group: "General" },
    { key: "weight_gain", label: "Weight gain", group: "General" },
    { key: "loss_of_appetite", label: "Loss of appetite", group: "General" },

    // Head & Neuro
    { key: "headache", label: "Headache", group: "Head & Neuro" },
    { key: "migraine", label: "Migraine", group: "Head & Neuro" },
    { key: "dizziness", label: "Dizziness", group: "Head & Neuro" },
    { key: "fainting", label: "Fainting", group: "Head & Neuro" },
    { key: "numbness", label: "Numbness / tingling", group: "Head & Neuro" },
    { key: "memory_problems", label: "Memory problems", group: "Head & Neuro" },
    { key: "confusion", label: "Confusion", group: "Head & Neuro" },

    // Respiratory
    { key: "cough", label: "Cough", group: "Respiratory" },
    { key: "sore_throat", label: "Sore throat", group: "Respiratory" },
    { key: "runny_nose", label: "Runny / blocked nose", group: "Respiratory" },
    { key: "sneezing", label: "Sneezing", group: "Respiratory" },
    { key: "wheezing", label: "Wheezing", group: "Respiratory" },
    { key: "shortness_of_breath", label: "Shortness of breath", group: "Respiratory" },
    { key: "chest_tightness", label: "Chest tightness", group: "Respiratory" },
    { key: "loss_of_smell", label: "Loss of smell / taste", group: "Respiratory" },

    // Heart & Chest
    { key: "chest_pain", label: "Chest pain", group: "Heart & Chest" },
    { key: "palpitations", label: "Palpitations", group: "Heart & Chest" },
    { key: "leg_swelling", label: "Leg / ankle swelling", group: "Heart & Chest" },

    // Digestive
    { key: "stomach_pain", label: "Stomach / abdominal pain", group: "Digestive" },
    { key: "nausea", label: "Nausea", group: "Digestive" },
    { key: "vomiting", label: "Vomiting", group: "Digestive" },
    { key: "diarrhea", label: "Diarrhea", group: "Digestive" },
    { key: "constipation", label: "Constipation", group: "Digestive" },
    { key: "heartburn", label: "Heartburn / reflux", group: "Digestive" },
    { key: "bloating", label: "Bloating", group: "Digestive" },
    { key: "blood_in_stool", label: "Blood in stool", group: "Digestive" },

    // Urinary
    { key: "painful_urination", label: "Painful urination", group: "Urinary" },
    { key: "frequent_urination", label: "Frequent urination", group: "Urinary" },
    { key: "blood_in_urine", label: "Blood in urine", group: "Urinary" },

    // Musculoskeletal
    { key: "back_pain", label: "Back pain", group: "Muscles & Joints" },
    { key: "neck_pain", label: "Neck pain", group: "Muscles & Joints" },
    { key: "joint_pain", label: "Joint pain", group: "Muscles & Joints" },
    { key: "muscle_pain", label: "Muscle pain", group: "Muscles & Joints" },
    { key: "muscle_cramps", label: "Muscle cramps", group: "Muscles & Joints" },

    // Skin
    { key: "rash", label: "Rash", group: "Skin" },
    { key: "itching", label: "Itching", group: "Skin" },
    { key: "wound", label: "Wound / cut", group: "Skin" },
    { key: "ulcer", label: "Ulcer / sore", group: "Skin" },
    { key: "swelling", label: "Swelling", group: "Skin" },

    // Mental / Mood
    { key: "anxiety", label: "Anxiety", group: "Mental health" },
    { key: "low_mood", label: "Low mood / sadness", group: "Mental health" },
    { key: "stress", label: "Stress", group: "Mental health" },
    { key: "poor_sleep", label: "Poor sleep", group: "Mental health" },
    { key: "irritability", label: "Irritability", group: "Mental health" },

    // Women's health
    { key: "menstrual_pain", label: "Menstrual pain / cramps", group: "Women's health" },
    { key: "irregular_periods", label: "Irregular periods", group: "Women's health" },
    { key: "vaginal_discharge", label: "Unusual vaginal discharge", group: "Women's health" },
    { key: "breast_pain", label: "Breast pain / lump", group: "Women's health" },

    // Sexual / reproductive
    { key: "unprotected_sex", label: "Unprotected sex", group: "Sexual health" },
    { key: "genital_sore", label: "Genital sore / ulcer", group: "Sexual health" },
    { key: "painful_sex", label: "Painful sex", group: "Sexual health" },

    // Injury / other
    { key: "injury", label: "Injury / accident", group: "Other" },
    { key: "burn", label: "Burn", group: "Other" },
    { key: "bite", label: "Animal / insect bite", group: "Other" },
    { key: "other", label: "Other (type your own)", group: "Other" },
];

// Group lookup for rendering the picker
export function groupedSymptoms(): [string, SymptomOption[]][] {
    const m = new Map<string, SymptomOption[]>();
    for (const s of SYMPTOMS) {
        if (!m.has(s.group)) m.set(s.group, []);
        m.get(s.group)!.push(s);
    }
    return Array.from(m.entries());
}

export function symptomLabel(key: string | null): string {
    if (!key) return "";
    return SYMPTOMS.find((s) => s.key === key)?.label ?? key;
}

// ============================================================
// ACTIONS — what the patient did
// ============================================================
export type ActionOption = {
    key: string;
    label: string;
    group: string;
};

export const ACTIONS: ActionOption[] = [
    // Medication
    { key: "took_medication", label: "Took medication", group: "Medication" },
    { key: "took_painkiller", label: "Took painkiller", group: "Medication" },
    { key: "took_antimalarial", label: "Took antimalarial", group: "Medication" },
    { key: "took_antibiotic", label: "Took antibiotic", group: "Medication" },
    { key: "applied_cream", label: "Applied cream / ointment", group: "Medication" },

    // Rest & care
    { key: "rested", label: "Rested", group: "Rest & care" },
    { key: "slept", label: "Slept", group: "Rest & care" },
    { key: "drank_water", label: "Drank more water", group: "Rest & care" },
    { key: "ate_light", label: "Ate light meal", group: "Rest & care" },
    { key: "compressed", label: "Applied compress (hot / cold)", group: "Rest & care" },

    // Movement
    { key: "walked", label: "Walked / exercised", group: "Movement" },
    { key: "stretched", label: "Stretched", group: "Movement" },
    { key: "bed_rest", label: "Bed rest", group: "Movement" },

    // Medical care
    { key: "visited_clinic", label: "Visited clinic / hospital", group: "Medical care" },
    { key: "called_nurse", label: "Called a nurse", group: "Medical care" },
    { key: "self_test", label: "Did a self-test (e.g. malaria, pregnancy)", group: "Medical care" },
    { key: "first_aid", label: "Applied first aid", group: "Medical care" },

    // Other
    { key: "other_action", label: "Other (type your own)", group: "Other" },
];

export function actionLabel(key: string | null): string {
    if (!key) return "";
    return ACTIONS.find((a) => a.key === key)?.label ?? key;
}

// ============================================================
// MOOD — 5-point scale
// ============================================================
export const MOOD_OPTIONS: { value: number; label: string; emoji: string }[] = [
    { value: 1, label: "Very bad", emoji: "😣" },
    { value: 2, label: "Bad", emoji: "🙁" },
    { value: 3, label: "Okay", emoji: "😐" },
    { value: 4, label: "Good", emoji: "🙂" },
    { value: 5, label: "Very good", emoji: "😄" },
];

// ============================================================
// BODY LOCATIONS — for pinpointing pain
// ============================================================
export const BODY_LOCATIONS = [
    "head", "left_eye", "right_eye", "both_eyes", "forehead", "back_of_head",
    "ear", "nose", "throat", "mouth", "teeth", "neck",
    "chest", "upper_abdomen", "lower_abdomen", "left_side", "right_side", "pelvis",
    "upper_back", "lower_back", "shoulder", "arm", "elbow", "wrist", "hand",
    "hip", "thigh", "knee", "shin", "ankle", "foot",
    "skin", "genital", "other",
] as const;

export const BODY_LOCATION_LABELS: Record<string, string> = {
    head: "Head", left_eye: "Left eye", right_eye: "Right eye", both_eyes: "Both eyes",
    forehead: "Forehead", back_of_head: "Back of head", ear: "Ear", nose: "Nose",
    throat: "Throat", mouth: "Mouth", teeth: "Teeth", neck: "Neck",
    chest: "Chest", upper_abdomen: "Upper abdomen", lower_abdomen: "Lower abdomen",
    left_side: "Left side", right_side: "Right side", pelvis: "Pelvis",
    upper_back: "Upper back", lower_back: "Lower back", shoulder: "Shoulder",
    arm: "Arm", elbow: "Elbow", wrist: "Wrist", hand: "Hand",
    hip: "Hip", thigh: "Thigh", knee: "Knee", shin: "Shin",
    ankle: "Ankle", foot: "Foot", skin: "Skin", genital: "Genital area",
    other: "Other",
};

// ============================================================
// PREGNANCY — event types + milestone keys
// ============================================================
export const PREGNANCY_EVENT_TYPES: {
    key: PregnancyEventType;
    label: string;
    icon: string;
}[] = [
        { key: "kick_session", label: "Kick count", icon: "👶" },
        { key: "contraction", label: "Contraction", icon: "⏱" },
        { key: "weight", label: "Weight check", icon: "⚖️" },
        { key: "bp", label: "Blood pressure", icon: "🩺" },
        { key: "appointment", label: "ANC visit", icon: "📅" },
        { key: "ultrasound", label: "Ultrasound", icon: "📷" },
        { key: "lab_result", label: "Lab result", icon: "🧪" },
        { key: "milestone", label: "Milestone", icon: "🏆" },
        { key: "note", label: "Note", icon: "📝" },
    ];

export const PREGNANCY_MILESTONES = [
    "positive_test",
    "first_anc_visit",
    "first_ultrasound",
    "first_heartbeat",
    "end_of_first_trimester",
    "gender_reveal",
    "first_kick_felt",
    "end_of_second_trimester",
    "baby_shower",
    "hospital_bag_ready",
    "birth_plan_ready",
    "maternity_leave_started",
];

// ============================================================
// CHILD — event types + vaccine schedule (Kenya EPI)
// ============================================================
export const CHILD_EVENT_TYPES: {
    key: ChildEventType;
    label: string;
    icon: string;
}[] = [
        { key: "clinic_visit", label: "Clinic visit", icon: "🏥" },
        { key: "vaccine", label: "Vaccine", icon: "💉" },
        { key: "weight", label: "Weight", icon: "⚖️" },
        { key: "height", label: "Height", icon: "📏" },
        { key: "head_circumference", label: "Head circumference", icon: "🎯" },
        { key: "muac", label: "MUAC", icon: "💪" },
        { key: "illness", label: "Illness", icon: "🤒" },
        { key: "injury", label: "Injury", icon: "🩹" },
        { key: "medication", label: "Medication", icon: "💊" },
        { key: "milestone", label: "Development milestone", icon: "🏆" },
        { key: "feeding", label: "Feeding", icon: "🍼" },
        { key: "sleep", label: "Sleep", icon: "😴" },
        { key: "teething", label: "Teething", icon: "🦷" },
        { key: "potty_training", label: "Potty training", icon: "🚽" },
        { key: "vitamin_a", label: "Vitamin A", icon: "🅰️" },
        { key: "deworming", label: "Deworming", icon: "🐛" },
        { key: "nutrition_supplement", label: "Nutrition supplement", icon: "🥣" },
        { key: "note", label: "Note", icon: "📝" },
    ];

// ------------------------------------------------------------
// Kenya EPI vaccine schedule
// (Key WHO/Kenya routine immunisation schedule)
// ------------------------------------------------------------
export type VaccineScheduleItem = {
    key: string;
    label: string;
    dose: number;
    age_label: string;
    age_days_min: number;
    age_days_max: number;
};

export const KENYA_VACCINE_SCHEDULE: VaccineScheduleItem[] = [
    // At birth
    { key: "bcg", label: "BCG", dose: 1, age_label: "At birth", age_days_min: 0, age_days_max: 14 },
    { key: "opv_birth", label: "OPV (birth dose)", dose: 0, age_label: "At birth", age_days_min: 0, age_days_max: 14 },

    // 6 weeks
    { key: "opv_1", label: "OPV 1", dose: 1, age_label: "6 weeks", age_days_min: 42, age_days_max: 60 },
    { key: "penta_1", label: "Penta 1 (DPT-HepB-Hib)", dose: 1, age_label: "6 weeks", age_days_min: 42, age_days_max: 60 },
    { key: "pcv_1", label: "PCV 1", dose: 1, age_label: "6 weeks", age_days_min: 42, age_days_max: 60 },
    { key: "rota_1", label: "Rotavirus 1", dose: 1, age_label: "6 weeks", age_days_min: 42, age_days_max: 60 },

    // 10 weeks
    { key: "opv_2", label: "OPV 2", dose: 2, age_label: "10 weeks", age_days_min: 70, age_days_max: 90 },
    { key: "penta_2", label: "Penta 2", dose: 2, age_label: "10 weeks", age_days_min: 70, age_days_max: 90 },
    { key: "pcv_2", label: "PCV 2", dose: 2, age_label: "10 weeks", age_days_min: 70, age_days_max: 90 },
    { key: "rota_2", label: "Rotavirus 2", dose: 2, age_label: "10 weeks", age_days_min: 70, age_days_max: 90 },

    // 14 weeks
    { key: "opv_3", label: "OPV 3", dose: 3, age_label: "14 weeks", age_days_min: 98, age_days_max: 120 },
    { key: "penta_3", label: "Penta 3", dose: 3, age_label: "14 weeks", age_days_min: 98, age_days_max: 120 },
    { key: "pcv_3", label: "PCV 3", dose: 3, age_label: "14 weeks", age_days_min: 98, age_days_max: 120 },
    { key: "ipv", label: "IPV", dose: 1, age_label: "14 weeks", age_days_min: 98, age_days_max: 120 },

    // 6 months
    { key: "vitamin_a_1", label: "Vitamin A 1", dose: 1, age_label: "6 months", age_days_min: 180, age_days_max: 210 },

    // 9 months
    { key: "measles_rubella_1", label: "Measles-Rubella 1", dose: 1, age_label: "9 months", age_days_min: 270, age_days_max: 300 },
    { key: "yellow_fever", label: "Yellow Fever", dose: 1, age_label: "9 months", age_days_min: 270, age_days_max: 300 },

    // 12 months
    { key: "vitamin_a_2", label: "Vitamin A 2", dose: 2, age_label: "12 months", age_days_min: 360, age_days_max: 390 },

    // 18 months
    { key: "measles_rubella_2", label: "Measles-Rubella 2", dose: 2, age_label: "18 months", age_days_min: 540, age_days_max: 570 },
    { key: "vitamin_a_3", label: "Vitamin A 3", dose: 3, age_label: "18 months", age_days_min: 540, age_days_max: 570 },

    // 24 months
    { key: "vitamin_a_4", label: "Vitamin A 4", dose: 4, age_label: "24 months", age_days_min: 720, age_days_max: 750 },
];

// ------------------------------------------------------------
// Child development milestones
// ------------------------------------------------------------
export type ChildMilestone = {
    key: string;
    label: string;
    group: string;
    typical_age_months: number;
};

export const CHILD_MILESTONES: ChildMilestone[] = [
    // 0–3 months
    { key: "first_smile", label: "First smile", group: "Social", typical_age_months: 2 },
    { key: "lifts_head", label: "Lifts head briefly", group: "Motor", typical_age_months: 2 },
    { key: "coos", label: "Coos / makes sounds", group: "Language", typical_age_months: 2 },
    { key: "follows_objects", label: "Follows objects with eyes", group: "Cognitive", typical_age_months: 3 },

    // 4–6 months
    { key: "rolls_over", label: "Rolls over", group: "Motor", typical_age_months: 5 },
    { key: "sits_with_support", label: "Sits with support", group: "Motor", typical_age_months: 6 },
    { key: "reaches_for_toys", label: "Reaches for toys", group: "Motor", typical_age_months: 5 },
    { key: "laughs", label: "Laughs out loud", group: "Social", typical_age_months: 4 },

    // 7–9 months
    { key: "sits_unsupported", label: "Sits without support", group: "Motor", typical_age_months: 8 },
    { key: "crawls", label: "Crawls", group: "Motor", typical_age_months: 9 },
    { key: "babbles", label: "Babbles (ba-ba, da-da)", group: "Language", typical_age_months: 8 },
    { key: "stranger_anxiety", label: "Shows stranger anxiety", group: "Social", typical_age_months: 8 },

    // 10–12 months
    { key: "pulls_to_stand", label: "Pulls to stand", group: "Motor", typical_age_months: 10 },
    { key: "first_words", label: "First real words", group: "Language", typical_age_months: 12 },
    { key: "pincer_grasp", label: "Pincer grasp", group: "Motor", typical_age_months: 10 },
    { key: "waves_bye", label: "Waves bye-bye", group: "Social", typical_age_months: 11 },

    // 13–18 months
    { key: "walks_alone", label: "Walks alone", group: "Motor", typical_age_months: 15 },
    { key: "says_many_words", label: "Says several words", group: "Language", typical_age_months: 18 },
    { key: "points_wants", label: "Points to show wants", group: "Social", typical_age_months: 15 },
    { key: "scribbles", label: "Scribbles with crayon", group: "Cognitive", typical_age_months: 18 },

    // 19–24 months
    { key: "runs", label: "Runs", group: "Motor", typical_age_months: 24 },
    { key: "two_word_sentences", label: "Two-word sentences", group: "Language", typical_age_months: 24 },
    { key: "kicks_ball", label: "Kicks a ball", group: "Motor", typical_age_months: 24 },
    { key: "toilet_trained", label: "Uses toilet with help", group: "Self-care", typical_age_months: 24 },

    // 3–5 years
    { key: "dresses_self", label: "Dresses self", group: "Self-care", typical_age_months: 48 },
    { key: "draws_person", label: "Draws a person", group: "Cognitive", typical_age_months: 48 },
    { key: "speaks_sentences", label: "Speaks full sentences", group: "Language", typical_age_months: 36 },
    { key: "plays_with_others", label: "Plays with other children", group: "Social", typical_age_months: 48 },
    { key: "counts_to_ten", label: "Counts to 10", group: "Cognitive", typical_age_months: 60 },
];

export function groupedChildMilestones(): [string, ChildMilestone[]][] {
    const m = new Map<string, ChildMilestone[]>();
    for (const item of CHILD_MILESTONES) {
        if (!m.has(item.group)) m.set(item.group, []);
        m.get(item.group)!.push(item);
    }
    return Array.from(m.entries());
}

// ------------------------------------------------------------
// Child illness quick-picker (short list, different from adult)
// ------------------------------------------------------------
export const CHILD_ILLNESSES = [
    { key: "fever", label: "Fever" },
    { key: "cough", label: "Cough" },
    { key: "cold", label: "Common cold" },
    { key: "diarrhea", label: "Diarrhea" },
    { key: "vomiting", label: "Vomiting" },
    { key: "rash", label: "Rash" },
    { key: "ear_infection", label: "Ear infection" },
    { key: "chest_infection", label: "Chest infection" },
    { key: "malaria", label: "Malaria" },
    { key: "malnutrition", label: "Malnutrition" },
    { key: "worms", label: "Worms" },
    { key: "teething", label: "Teething" },
    { key: "other", label: "Other" },
];

// ============================================================
// Helpers — month calculation for pregnancy week
// ============================================================
export function weeksSince(dateStr: string | null | undefined): number {
    if (!dateStr) return 0;
    const then = new Date(dateStr).getTime();
    if (isNaN(then)) return 0;
    const now = Date.now();
    return Math.floor((now - then) / (7 * 24 * 3600 * 1000));
}

export function ageMonths(dateStr: string): number {
    const dob = new Date(dateStr);
    if (isNaN(dob.getTime())) return 0;
    const now = new Date();
    return (
        (now.getFullYear() - dob.getFullYear()) * 12 +
        (now.getMonth() - dob.getMonth())
    );
}

export function ageLabel(dateStr: string): string {
    const months = ageMonths(dateStr);
    if (months < 1) return "Newborn";
    if (months < 24) return `${months} mo`;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    return rem === 0 ? `${years}y` : `${years}y ${rem}m`;
}
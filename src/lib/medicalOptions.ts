// src/lib/medicalOptions.ts
import type { ClientMedicalProfile, MedicalVisit } from "@/types/db";

// ============================================================
// ROS — Review of Systems
// ============================================================
export type RosFlag = {
    key: keyof ClientMedicalProfile;
    label: string;
    group: RosGroup;
};

export type RosGroup =
    | "Constitutional"
    | "Cardiovascular"
    | "Respiratory"
    | "Gastrointestinal"
    | "Neurological"
    | "HEENT"
    | "Genitourinary"
    | "Musculoskeletal"
    | "Skin"
    | "Psychiatric";

export const ROS_FLAGS: RosFlag[] = [
    // ---------------------------------------------
    // Constitutional (10)
    // ---------------------------------------------
    { key: "ros_fever", label: "Fever", group: "Constitutional" },
    { key: "ros_chills", label: "Chills / rigors", group: "Constitutional" },
    { key: "ros_night_sweats", label: "Night sweats", group: "Constitutional" },
    { key: "ros_weight_loss", label: "Weight loss", group: "Constitutional" },
    { key: "ros_weight_gain", label: "Weight gain", group: "Constitutional" },
    { key: "ros_loss_of_appetite", label: "Loss of appetite", group: "Constitutional" },
    { key: "ros_fatigue", label: "Fatigue", group: "Constitutional" },
    { key: "ros_malaise", label: "General malaise", group: "Constitutional" },
    { key: "ros_poor_sleep", label: "Poor sleep", group: "Constitutional" },
    { key: "ros_dehydration", label: "Dehydration", group: "Constitutional" },

    // ---------------------------------------------
    // Cardiovascular (8)
    // ---------------------------------------------
    { key: "ros_chest_pain", label: "Chest pain", group: "Cardiovascular" },
    { key: "ros_palpitations", label: "Palpitations", group: "Cardiovascular" },
    { key: "ros_shortness_of_breath", label: "Shortness of breath", group: "Cardiovascular" },
    { key: "ros_orthopnea", label: "Orthopnea (breathless lying flat)", group: "Cardiovascular" },
    { key: "ros_pnd", label: "Wakes up breathless (PND)", group: "Cardiovascular" },
    { key: "ros_leg_swelling", label: "Leg / ankle swelling", group: "Cardiovascular" },
    { key: "ros_fainting", label: "Fainting / syncope", group: "Cardiovascular" },
    { key: "ros_cold_extremities", label: "Cold hands / feet", group: "Cardiovascular" },

    // ---------------------------------------------
    // Respiratory (9)
    // ---------------------------------------------
    { key: "ros_cough", label: "Cough", group: "Respiratory" },
    { key: "ros_productive_cough", label: "Productive cough (sputum)", group: "Respiratory" },
    { key: "ros_hemoptysis", label: "Blood in sputum", group: "Respiratory" },
    { key: "ros_wheezing", label: "Wheezing", group: "Respiratory" },
    { key: "ros_night_cough", label: "Night-time cough", group: "Respiratory" },
    { key: "ros_sore_throat", label: "Sore throat", group: "Respiratory" },
    { key: "ros_runny_nose", label: "Runny / blocked nose", group: "Respiratory" },
    { key: "ros_sneezing", label: "Sneezing", group: "Respiratory" },
    { key: "ros_chest_tightness", label: "Chest tightness", group: "Respiratory" },

    // ---------------------------------------------
    // Gastrointestinal (12)
    // ---------------------------------------------
    { key: "ros_abdominal_pain", label: "Abdominal pain", group: "Gastrointestinal" },
    { key: "ros_nausea", label: "Nausea", group: "Gastrointestinal" },
    { key: "ros_vomiting", label: "Vomiting", group: "Gastrointestinal" },
    { key: "ros_vomiting_blood", label: "Vomiting blood", group: "Gastrointestinal" },
    { key: "ros_diarrhea", label: "Diarrhea", group: "Gastrointestinal" },
    { key: "ros_constipation", label: "Constipation", group: "Gastrointestinal" },
    { key: "ros_blood_in_stool", label: "Blood in stool", group: "Gastrointestinal" },
    { key: "ros_black_stool", label: "Black / tarry stool", group: "Gastrointestinal" },
    { key: "ros_bloating", label: "Bloating", group: "Gastrointestinal" },
    { key: "ros_heartburn", label: "Heartburn / reflux", group: "Gastrointestinal" },
    { key: "ros_jaundice", label: "Yellow eyes / skin (jaundice)", group: "Gastrointestinal" },
    { key: "ros_difficulty_swallowing", label: "Difficulty swallowing", group: "Gastrointestinal" },

    // ---------------------------------------------
    // Neurological (12)
    // ---------------------------------------------
    { key: "ros_headache", label: "Headache", group: "Neurological" },
    { key: "ros_dizziness", label: "Dizziness", group: "Neurological" },
    { key: "ros_vertigo", label: "Vertigo", group: "Neurological" },
    { key: "ros_fainting_neuro", label: "Loss of consciousness", group: "Neurological" },
    { key: "ros_seizures", label: "Seizures", group: "Neurological" },
    { key: "ros_tremor", label: "Tremor / shaking", group: "Neurological" },
    { key: "ros_numbness", label: "Numbness", group: "Neurological" },
    { key: "ros_tingling", label: "Tingling / pins & needles", group: "Neurological" },
    { key: "ros_weakness", label: "Weakness", group: "Neurological" },
    { key: "ros_memory_loss", label: "Memory loss / confusion", group: "Neurological" },
    { key: "ros_speech_difficulty", label: "Speech difficulty", group: "Neurological" },
    { key: "ros_gait_problems", label: "Gait / balance problems", group: "Neurological" },

    // ---------------------------------------------
    // HEENT (10)
    // ---------------------------------------------
    { key: "ros_vision_changes", label: "Vision changes", group: "HEENT" },
    { key: "ros_blurred_vision", label: "Blurred vision", group: "HEENT" },
    { key: "ros_eye_pain", label: "Eye pain / redness", group: "HEENT" },
    { key: "ros_double_vision", label: "Double vision", group: "HEENT" },
    { key: "ros_hearing_loss", label: "Hearing loss", group: "HEENT" },
    { key: "ros_ear_pain", label: "Ear pain / discharge", group: "HEENT" },
    { key: "ros_tinnitus", label: "Ringing in ears (tinnitus)", group: "HEENT" },
    { key: "ros_nosebleed", label: "Nosebleeds", group: "HEENT" },
    { key: "ros_dental_pain", label: "Dental / gum problems", group: "HEENT" },
    { key: "ros_hoarseness", label: "Hoarseness / voice change", group: "HEENT" },

    // ---------------------------------------------
    // Genitourinary (10)
    // ---------------------------------------------
    { key: "ros_urinary_issues", label: "Urinary issues", group: "Genitourinary" },
    { key: "ros_dysuria", label: "Painful urination", group: "Genitourinary" },
    { key: "ros_frequency", label: "Frequent urination", group: "Genitourinary" },
    { key: "ros_urgency", label: "Urgency", group: "Genitourinary" },
    { key: "ros_nocturia", label: "Waking at night to urinate", group: "Genitourinary" },
    { key: "ros_incontinence", label: "Incontinence", group: "Genitourinary" },
    { key: "ros_retention", label: "Difficulty passing urine", group: "Genitourinary" },
    { key: "ros_blood_in_urine", label: "Blood in urine", group: "Genitourinary" },
    { key: "ros_discharge", label: "Genital discharge", group: "Genitourinary" },
    { key: "ros_sexual_dysfunction", label: "Sexual dysfunction", group: "Genitourinary" },

    // ---------------------------------------------
    // Musculoskeletal (10)
    // ---------------------------------------------
    { key: "ros_joint_pain", label: "Joint pain", group: "Musculoskeletal" },
    { key: "ros_joint_swelling", label: "Joint swelling", group: "Musculoskeletal" },
    { key: "ros_joint_stiffness", label: "Morning joint stiffness", group: "Musculoskeletal" },
    { key: "ros_back_pain", label: "Back pain", group: "Musculoskeletal" },
    { key: "ros_neck_pain", label: "Neck pain / stiffness", group: "Musculoskeletal" },
    { key: "ros_muscle_weakness", label: "Muscle weakness", group: "Musculoskeletal" },
    { key: "ros_muscle_cramps", label: "Muscle cramps", group: "Musculoskeletal" },
    { key: "ros_limited_mobility", label: "Limited mobility", group: "Musculoskeletal" },
    { key: "ros_falls", label: "Falls", group: "Musculoskeletal" },
    { key: "ros_bone_pain", label: "Bone pain", group: "Musculoskeletal" },

    // ---------------------------------------------
    // Skin (10)
    // ---------------------------------------------
    { key: "ros_skin_rash", label: "Skin rash", group: "Skin" },
    { key: "ros_itching", label: "Itching", group: "Skin" },
    { key: "ros_dry_skin", label: "Dry / cracked skin", group: "Skin" },
    { key: "ros_wounds", label: "Wounds", group: "Skin" },
    { key: "ros_ulcers", label: "Ulcers / bedsores", group: "Skin" },
    { key: "ros_skin_infection", label: "Skin infection", group: "Skin" },
    { key: "ros_hair_loss", label: "Hair loss", group: "Skin" },
    { key: "ros_nail_changes", label: "Nail changes", group: "Skin" },
    { key: "ros_swelling_skin", label: "Localised swelling", group: "Skin" },
    { key: "ros_skin_discoloration", label: "Discoloration / bruising", group: "Skin" },

    // ---------------------------------------------
    // Psychiatric (10)
    // ---------------------------------------------
    { key: "ros_anxiety", label: "Anxiety", group: "Psychiatric" },
    { key: "ros_depression", label: "Depression", group: "Psychiatric" },
    { key: "ros_sleep_issues", label: "Sleep issues", group: "Psychiatric" },
    { key: "ros_irritability", label: "Irritability", group: "Psychiatric" },
    { key: "ros_mood_swings", label: "Mood swings", group: "Psychiatric" },
    { key: "ros_panic_attacks", label: "Panic attacks", group: "Psychiatric" },
    { key: "ros_hallucinations", label: "Hallucinations", group: "Psychiatric" },
    { key: "ros_suicidal_thoughts", label: "Suicidal thoughts", group: "Psychiatric" },
    { key: "ros_poor_concentration", label: "Poor concentration", group: "Psychiatric" },
    { key: "ros_social_withdrawal", label: "Social withdrawal", group: "Psychiatric" },
];

// ============================================================
// Free-text note field per group — stored on medical_visits
// ============================================================
export const ROS_GROUP_NOTE_FIELD: Record<RosGroup, keyof MedicalVisit> = {
    Constitutional: "ros_constitutional_notes",
    Cardiovascular: "ros_cardiovascular_notes",
    Respiratory: "ros_respiratory_notes",
    Gastrointestinal: "ros_gastrointestinal_notes",
    Neurological: "ros_neurological_notes",
    HEENT: "ros_heent_notes",
    Genitourinary: "ros_genitourinary_notes",
    Musculoskeletal: "ros_musculoskeletal_notes",
    Skin: "ros_skin_notes",
    Psychiatric: "ros_psychiatric_notes",
};

// ============================================================
// Consciousness levels (used in vitals)
// ============================================================
export const CONSCIOUSNESS_LEVELS = [
    "alert",
    "drowsy",
    "confused",
    "unresponsive",
] as const;

// ============================================================
// Helper: group ROS flags by their group name for rendering
// ============================================================
export function groupedRosFlags(): [RosGroup, RosFlag[]][] {
    const m = new Map<RosGroup, RosFlag[]>();
    for (const item of ROS_FLAGS) {
        if (!m.has(item.group)) m.set(item.group, []);
        m.get(item.group)!.push(item);
    }
    return Array.from(m.entries());
}
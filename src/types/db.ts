// src/types/db.ts
import type {
    DailyEntry,
    DailyPregnancy,
    DailyPregnancyEvent,
    DailyBirth,
    DailyChildProfile,
    DailyChildEvent,
} from "./daily";

// Re-export so consumers can import from either path
export type {
    DailyEntry,
    DailyPregnancy,
    DailyPregnancyEvent,
    DailyBirth,
    DailyChildProfile,
    DailyChildEvent,
} from "./daily";
export type UserRole = "client" | "caregiver" | "admin";
export type ConnectionStatus = "pending" | "accepted" | "declined" | "ended" | "blocked";
export type BookingStatus =
    | "pending_payment"
    | "paid_escrow"
    | "accepted"
    | "en_route"
    | "arrived"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "disputed"
    | "refunded";
export type PaymentStatus = "unpaid" | "held" | "released" | "refunded" | "failed";
export type EscrowStatus = "held" | "released" | "refunded" | "disputed";
export type PayoutStatus = "pending" | "processing" | "paid" | "failed";
export type CpdSource = "course" | "workshop" | "conference" | "self_study" | "milestone" | "other";
export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";
export type VisitType = "routine" | "emergency" | "follow_up" | "assessment" | "therapy" | "other";

// ---- Medical enums ----
export type AllergyCategory = "drug" | "food" | "environmental";
export type AllergySeverity = "mild" | "moderate" | "severe";
export type MedicationAdherence = "good" | "partial" | "poor";
export type ConditionStatus = "active" | "resolved";
export type FamilyMemberStatus = "alive" | "deceased";
export type PregnancyOutcome = "live_birth" | "miscarriage" | "termination";
export type PainCharacter = "sharp" | "dull" | "burning" | "aching" | "cramping" | "other";
export type FunctionalStatus = "independent" | "assisted" | "bedbound";
export type SmokingStatus = "never" | "former" | "current";
export type AlcoholUse = "none" | "occasional" | "moderate" | "heavy";
export type ExerciseFrequency = "none" | "1-2x" | "3-4x" | "5+x";
export type ConsciousnessLevel = "alert" | "drowsy" | "confused" | "unresponsive";
export type ImmunizationStatus = "up_to_date" | "partial" | "none" | "unknown";
export type MaritalStatus = "single" | "married" | "divorced" | "widowed" | "separated";
export type SexAtBirth = "male" | "female" | "intersex";
export type DeliveryType = "vaginal" | "cesarean";
export type AuditAction = "insert" | "update" | "delete" | "lock";
export type AuditActorRole = "client" | "caregiver" | "admin" | "unknown";

export type Profile = {
    id: string;
    role: UserRole;
    display_name: string;
    avatar_url: string | null;
    county: string | null;
    city: string | null;
    preferred_language: string | null;
    legal_name: string | null;
    email: string | null;
    phone_number: string | null;
    date_of_birth: string | null;
    gender: string | null;
    is_active: boolean;
    is_banned: boolean;
    onboarded_at: string | null;
    last_seen_at: string | null;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
};

export type CaregiverProfile = {
    user_id: string;
    professional_title: string;
    bio: string | null;
    specialties: string[];
    languages: string[];
    years_experience: number;
    license_number: string | null;
    license_type: string | null;
    license_expiry: string | null;
    credentials: unknown[];
    verification_status: VerificationStatus;
    verified_at: string | null;
    verification_notes: string | null;
    service_area_counties: string[];
    is_available: boolean;
    accepting_new_clients: boolean;
    peer_consultation_opt_in: boolean;
    average_rating: number;
    total_reviews: number;
    total_bookings: number;
    completed_bookings: number;
    created_at: string;
    updated_at: string;
    last_seen_at: string | null;
};

export type ClientProfile = {
    user_id: string;
    living_situation: string | null;
    mobility: string | null;
    cognitive_status: string | null;
    care_notes: string | null;
    pref_caregiver_gender: string | null;
    pref_languages: string[];
    pref_time_of_day: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    allow_caregiver_handover: boolean;
    created_at: string;
    updated_at: string;
};

export type ClientPrivacySettings = {
    client_id: string;
    show_display_name: boolean;
    show_legal_name: boolean;
    show_avatar: boolean;
    show_county_city: boolean;
    show_exact_address: boolean;
    show_medical_history: boolean;
    show_medications: boolean;
    show_conditions: boolean;
    show_allergies: boolean;
    show_emergency_contacts: boolean;
    show_insurance: boolean;
    show_contact_phone: boolean;
    updated_at: string;
};

export type Connection = {
    id: string;
    client_id: string;
    caregiver_id: string;
    status: ConnectionStatus;
    initiated_by: string;
    request_note: string | null;
    accepted_at: string | null;
    declined_at: string | null;
    ended_at: string | null;
    ended_reason: string | null;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
};

export type Category = {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    applies_to: UserRole;
    priority: number;
    created_at: string;
};

export type Service = {
    id: string;
    caregiver_id: string;
    category_id: string | null;
    title: string;
    short_description: string | null;
    description: string | null;
    price: number | null;
    pricing_type: string;
    duration_minutes: number | null;
    cover_image: string | null;
    is_active: boolean;
    is_featured: boolean;
    is_free_consultation: boolean;   // ← ADD THIS LINE
    views_count: number;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
};
export type Booking = {
    id: string;
    client_id: string;
    caregiver_id: string;
    service_id: string | null;
    connection_id: string | null;
    status: BookingStatus;
    payment_status: PaymentStatus;
    scheduled_at: string | null;
    duration_minutes: number | null;
    notes: string | null;
    whatsapp_number: string | null;
    address_snapshot: string | null;
    latitude: number | null;
    longitude: number | null;
    total_amount: number;
    commission_amount: number;
    provider_payout_amount: number;
    arrived_at: string | null;
    started_at: string | null;
    completed_at: string | null;
    cancelled_at: string | null;
    cancellation_reason: string | null;
    created_at: string;
    updated_at: string;
};

export type BookingStatusHistory = {
    id: string;
    booking_id: string;
    status: BookingStatus;
    changed_by: string | null;
    note: string | null;
    created_at: string;
};

export type BookingQrToken = {
    id: string;
    booking_id: string;
    token: string;
    expires_at: string;
    consumed_at: string | null;
    created_at: string;
};

export type ArrivalVerification = {
    id: string;
    booking_id: string;
    scanned_by: string;
    token_used: string;
    latitude: number | null;
    longitude: number | null;
    scanned_at: string;
};

export type MpesaPayment = {
    id: string;
    booking_id: string;
    client_id: string;
    merchant_request_id: string | null;
    checkout_request_id: string | null;
    phone_number: string;
    amount: number;
    status: string;
    mpesa_receipt_number: string | null;
    transaction_date: string | null;
    result_code: string | null;
    result_description: string | null;
    metadata: unknown;
    created_at: string;
};

export type EscrowTransaction = {
    id: string;
    booking_id: string;
    amount: number;
    currency: string;
    status: EscrowStatus;
    mpesa_receipt: string | null;
    held_at: string;
    released_at: string | null;
    refunded_at: string | null;
    metadata: unknown;
};

export type Payout = {
    id: string;
    caregiver_id: string;
    booking_id: string | null;
    amount: number;
    phone_number: string;
    status: PayoutStatus;
    mpesa_receipt: string | null;
    failure_reason: string | null;
    created_at: string;
    completed_at: string | null;
};

export type VisitNote = {
    id: string;
    booking_id: string | null;
    client_id: string;
    caregiver_id: string;
    visit_type: VisitType;
    chief_complaint: string | null;
    assessment: string | null;
    plan: string | null;
    vitals: unknown;
    medications_given: unknown;
    interventions: string[];
    follow_up_required: boolean;
    follow_up_date: string | null;
    clinical_notes: string | null;
    attachments: unknown[];
    visit_date: string;
    duration_minutes: number | null;
    created_at: string;
    updated_at: string;
};

export type Review = {
    id: string;
    booking_id: string;
    service_id: string | null;
    client_id: string;
    caregiver_id: string;
    rating: number;
    comment: string | null;
    created_at: string;
};

export type Notification = {
    id: string;
    user_id: string;
    title: string;
    body: string | null;
    type: string | null;
    link: string | null;
    is_read: boolean;
    created_at: string;
};

export type CpdEvent = {
    id: string;
    caregiver_id: string;
    title: string;
    provider: string | null;
    source: CpdSource;
    hours: number;
    points: number;
    event_date: string;
    certificate_url: string | null;
    notes: string | null;
    created_at: string;
};

export type ServiceMilestone = {
    id: string;
    caregiver_id: string;
    milestone: number;
    points_awarded: number;
    certificate_url: string | null;
    awarded_at: string;
};

export type CaregiverFollow = {
    follower_id: string;
    followee_id: string;
    created_at: string;
};

// Discovery view row shapes
export type CaregiverDiscoveryRow = {
    caregiver_id: string;
    display_name: string;
    avatar_url: string | null;
    county: string | null;
    city: string | null;
    professional_title: string | null;
    specialties: string[] | null;
    languages: string[] | null;
    years_experience: number | null;
    average_rating: number | null;
    total_reviews: number | null;
    total_bookings: number | null;
    is_available: boolean | null;
    accepting_new_clients: boolean | null;
    peer_consultation_opt_in: boolean | null;
    verification_status: VerificationStatus | null;
};

export type ClientDiscoveryRow = {
    client_id: string;
    display_name: string;
    avatar_url: string | null;
    county: string | null;
    city: string | null;
    living_situation: string | null;
    mobility: string | null;
    cognitive_status: string | null;
    pref_languages: string[] | null;
    pref_caregiver_gender: string | null;
    pref_time_of_day: string | null;
    show_medical_history: boolean;
    show_medications: boolean;
    show_conditions: boolean;
    show_allergies: boolean;
    created_at: string;
};

// ============================================================
// MEDICAL — main profile (one row per client)
// Matches the extended client_medical_profile table
// ============================================================
export type ClientMedicalProfile = {
    client_id: string;

    // Legacy flat fields (kept for back-compat)
    blood_type: string | null;
    allergies: string[];
    chronic_conditions: string[];
    current_medications: string[];
    past_surgeries: string[];
    family_history: string | null;
    medical_history: string | null;
    special_needs: string | null;
    preferred_hospital: string | null;
    notes: string | null;

    // ---- Demographics ----
    date_of_birth: string | null;
    sex_at_birth: SexAtBirth | null;
    gender_identity: string | null;
    height_cm: number | null;
    weight_kg: number | null;
    national_id: string | null;
    nhif_sha_number: string | null;
    marital_status: MaritalStatus | null;
    occupation: string | null;
    next_of_kin_name: string | null;
    next_of_kin_phone: string | null;
    next_of_kin_relationship: string | null;

    // ---- Presenting complaint (nurse intake) ----
    presenting_complaint: string | null;
    history_of_present_illness: string | null;
    onset_date: string | null;
    pain_score: number | null;
    pain_location: string | null;
    pain_character: PainCharacter | null;
    functional_status: FunctionalStatus | null;

    // ---- Past medical history flags ----
    has_hypertension: boolean;
    has_diabetes: boolean;
    diabetes_type: string | null;
    has_asthma: boolean;
    has_copd: boolean;
    has_heart_disease: boolean;
    has_stroke: boolean;
    has_epilepsy: boolean;
    has_cancer: boolean;
    cancer_details: string | null;
    has_hiv: boolean;
    hiv_on_art: boolean;
    has_tb: boolean;
    has_mental_health_condition: boolean;
    mental_health_details: string | null;
    has_kidney_disease: boolean;
    has_liver_disease: boolean;
    other_chronic_conditions: string | null;

    // ---- Surgical extras ----
    has_implant: boolean;
    implant_details: string | null;
    anesthesia_reaction: boolean;
    anesthesia_reaction_details: string | null;

    // ---- Medications ----
    medication_adherence: MedicationAdherence | null;
    on_blood_thinners: boolean;
    on_insulin: boolean;
    on_steroids: boolean;
    herbal_remedies: string | null;

    // ---- Allergies ----
    drug_allergies: string[];
    food_allergies: string[];
    environmental_allergies: string[];
    allergy_reactions: string | null;
    latex_allergy: boolean;

    // ---- Family history flags ----
    family_history_diabetes: boolean;
    family_history_hypertension: boolean;
    family_history_heart_disease: boolean;
    family_history_cancer: boolean;
    family_history_mental_illness: boolean;
    family_history_genetic_disorders: string | null;
    family_history_details: string | null;

    // ---- Social history ----
    smoking_status: SmokingStatus | null;
    smoking_pack_years: number | null;
    alcohol_use: AlcoholUse | null;
    alcohol_units_per_week: number | null;
    recreational_drugs: string | null;
    exercise_frequency: ExerciseFrequency | null;
    diet_notes: string | null;
    sleep_hours: number | null;
    living_situation: string | null;
    caregiver_at_home: boolean;
    caregiver_name: string | null;
    caregiver_phone: string | null;
    home_safety_notes: string | null;
    pets: string | null;
    exposure_history: string | null;

    // ---- Obstetric / gynecological ----
    is_pregnant: boolean;
    gravida: number | null;
    para: number | null;
    abortions: number | null;
    living_children: number | null;
    last_menstrual_period: string | null;
    menopause: boolean;
    contraception_method: string | null;
    family_planning_goals: string | null;
    desires_more_children: boolean | null;
    planned_pregnancy_timeline: string | null;
    cervical_screening_last: string | null;
    breast_screening_last: string | null;
    gynecological_issues: string | null;

    // ---- Pediatric ----
    birth_weight_kg: number | null;
    delivery_type: DeliveryType | null;
    gestational_age_weeks: number | null;
    birth_complications: string | null;
    breastfed: boolean | null;
    breastfeeding_duration_months: number | null;
    immunization_status: ImmunizationStatus | null;
    developmental_milestones: string | null;
    schooling_status: string | null;

    // ---- Immunization summary ----
    immunizations_up_to_date: boolean;
    immunization_notes: string | null;
    covid_vaccinated: boolean;
    covid_doses: number | null;
    tetanus_last: string | null;
    flu_vaccine_last: string | null;

    // ---- Review of systems (ROS) ----
    // ---- Review of systems (ROS) ----
    // Constitutional
    ros_fever: boolean;
    ros_chills: boolean;
    ros_night_sweats: boolean;
    ros_weight_loss: boolean;
    ros_weight_gain: boolean;
    ros_loss_of_appetite: boolean;
    ros_fatigue: boolean;
    ros_malaise: boolean;
    ros_poor_sleep: boolean;
    ros_dehydration: boolean;

    // Cardiovascular
    ros_chest_pain: boolean;
    ros_palpitations: boolean;
    ros_shortness_of_breath: boolean;
    ros_orthopnea: boolean;
    ros_pnd: boolean;
    ros_leg_swelling: boolean;
    ros_fainting: boolean;
    ros_cold_extremities: boolean;

    // Respiratory
    ros_cough: boolean;
    ros_productive_cough: boolean;
    ros_hemoptysis: boolean;
    ros_wheezing: boolean;
    ros_night_cough: boolean;
    ros_sore_throat: boolean;
    ros_runny_nose: boolean;
    ros_sneezing: boolean;
    ros_chest_tightness: boolean;

    // Gastrointestinal
    ros_abdominal_pain: boolean;
    ros_nausea: boolean;
    ros_vomiting: boolean;
    ros_vomiting_blood: boolean;
    ros_diarrhea: boolean;
    ros_constipation: boolean;
    ros_blood_in_stool: boolean;
    ros_black_stool: boolean;
    ros_bloating: boolean;
    ros_heartburn: boolean;
    ros_jaundice: boolean;
    ros_difficulty_swallowing: boolean;

    // Neurological
    ros_headache: boolean;
    ros_dizziness: boolean;
    ros_vertigo: boolean;
    ros_fainting_neuro: boolean;
    ros_seizures: boolean;
    ros_tremor: boolean;
    ros_numbness: boolean;
    ros_tingling: boolean;
    ros_weakness: boolean;
    ros_memory_loss: boolean;
    ros_speech_difficulty: boolean;
    ros_gait_problems: boolean;

    // HEENT
    ros_vision_changes: boolean;
    ros_blurred_vision: boolean;
    ros_eye_pain: boolean;
    ros_double_vision: boolean;
    ros_hearing_loss: boolean;
    ros_ear_pain: boolean;
    ros_tinnitus: boolean;
    ros_nosebleed: boolean;
    ros_dental_pain: boolean;
    ros_hoarseness: boolean;

    // Genitourinary
    ros_urinary_issues: boolean;
    ros_dysuria: boolean;
    ros_frequency: boolean;
    ros_urgency: boolean;
    ros_nocturia: boolean;
    ros_incontinence: boolean;
    ros_retention: boolean;
    ros_blood_in_urine: boolean;
    ros_discharge: boolean;
    ros_sexual_dysfunction: boolean;

    // Musculoskeletal
    ros_joint_pain: boolean;
    ros_joint_swelling: boolean;
    ros_joint_stiffness: boolean;
    ros_back_pain: boolean;
    ros_neck_pain: boolean;
    ros_muscle_weakness: boolean;
    ros_muscle_cramps: boolean;
    ros_limited_mobility: boolean;
    ros_falls: boolean;
    ros_bone_pain: boolean;

    // Skin
    ros_skin_rash: boolean;
    ros_itching: boolean;
    ros_dry_skin: boolean;
    ros_wounds: boolean;
    ros_ulcers: boolean;
    ros_skin_infection: boolean;
    ros_hair_loss: boolean;
    ros_nail_changes: boolean;
    ros_swelling_skin: boolean;
    ros_skin_discoloration: boolean;

    // Psychiatric
    ros_anxiety: boolean;
    ros_depression: boolean;
    ros_sleep_issues: boolean;
    ros_irritability: boolean;
    ros_mood_swings: boolean;
    ros_panic_attacks: boolean;
    ros_hallucinations: boolean;
    ros_suicidal_thoughts: boolean;
    ros_poor_concentration: boolean;
    ros_social_withdrawal: boolean;

    ros_other: string | null;

    // ---- Preferences ----
    preferred_visit_time: string | null;
    communication_preferences: string | null;
    religious_preferences: string | null;
    cultural_preferences: string | null;
    dietary_restrictions: string | null;
    mobility_aids: string | null;
    hearing_aids: boolean;
    vision_aids: boolean;
    cognitive_impairment: boolean;
    advance_directive: string | null;
    dnr_status: boolean;
    organ_donor: boolean;

    // ---- Metadata / locking ----
    patient_updated_at: string | null;
    nurse_updated_at: string | null;
    nurse_updated_by: string | null;
    verified_by_nurse: boolean;
    locked_at: string | null;
    locked_by: string | null;
    updated_by: string | null;
    completion_percent: number;
    is_locked: boolean;

    updated_at: string;
};

// ============================================================
// MEDICAL — child tables (one row per item)
// ============================================================

export type MedicalAllergy = {
    id: string;
    client_id: string;
    allergen: string;
    category: AllergyCategory | null;
    reaction: string | null;
    severity: AllergySeverity | null;
    confirmed: boolean;
    notes: string | null;
    created_at: string;
};

export type MedicalMedication = {
    id: string;
    client_id: string;
    name: string;
    dose: string | null;
    frequency: string | null;
    route: string | null;
    indication: string | null;
    started_on: string | null;
    stopped_on: string | null;
    prescribed_by: string | null;
    adherence: MedicationAdherence | null;
    notes: string | null;
    created_at: string;
};

export type MedicalCondition = {
    id: string;
    client_id: string;
    condition: string;
    diagnosed_on: string | null;
    severity: string | null;
    current_status: ConditionStatus | null;
    managed_by: string | null;
    notes: string | null;
    created_at: string;
};

export type MedicalSurgery = {
    id: string;
    client_id: string;
    procedure: string;
    performed_on: string | null;
    hospital: string | null;
    surgeon: string | null;
    anesthesia_type: string | null;
    complications: string | null;
    notes: string | null;
    created_at: string;
};

export type MedicalImmunization = {
    id: string;
    client_id: string;
    vaccine: string;
    dose_number: number | null;
    administered_on: string | null;
    administered_at: string | null;
    lot_number: string | null;
    notes: string | null;
    created_at: string;
};

export type MedicalFamilyHistoryRow = {
    id: string;
    client_id: string;
    relative: string;
    condition: string;
    age_at_diagnosis: number | null;
    status: FamilyMemberStatus | null;
    cause_of_death: string | null;
    notes: string | null;
    created_at: string;
};

export type MedicalPregnancy = {
    id: string;
    client_id: string;
    year: number | null;
    outcome: PregnancyOutcome | null;
    delivery_type: DeliveryType | null;
    complications: string | null;
    baby_weight_kg: number | null;
    baby_health_notes: string | null;
    created_at: string;
};

export type MedicalVisit = {
    id: string;
    client_id: string;
    caregiver_id: string | null;
    visit_date: string;

    exam_general_appearance: string | null;
    exam_consciousness: ConsciousnessLevel | null;
    exam_temperature_c: number | null;
    exam_pulse_bpm: number | null;
    exam_respiratory_rate: number | null;
    exam_blood_pressure: string | null;
    exam_oxygen_saturation: number | null;
    exam_weight_kg: number | null;
    exam_height_cm: number | null;
    exam_head_neck: string | null;
    exam_eyes_pupils: string | null;
    exam_ent: string | null;
    exam_cardiovascular: string | null;
    exam_respiratory: string | null;
    exam_abdominal: string | null;
    exam_genitourinary: string | null;
    exam_musculoskeletal: string | null;
    exam_neurological: string | null;
    exam_skin: string | null;
    exam_extremities: string | null;
    exam_lymph_nodes: string | null;
    exam_mental_status: string | null;
    exam_other_findings: string | null;

    nursing_diagnosis: string | null;
    care_plan: string | null;
    goals_of_care: string | null;
    review_date: string | null;
    referred_to: string | null;
    referral_reason: string | null;

    nurse_name: string | null;
    nurse_reg_number: string | null;
    locked_at: string | null;
    locked_by: string | null;

    // Free-text ROS notes per body system (nurse's narrative)
    ros_constitutional_notes: string | null;
    ros_cardiovascular_notes: string | null;
    ros_respiratory_notes: string | null;
    ros_gastrointestinal_notes: string | null;
    ros_neurological_notes: string | null;
    ros_heent_notes: string | null;
    ros_genitourinary_notes: string | null;
    ros_musculoskeletal_notes: string | null;
    ros_skin_notes: string | null;
    ros_psychiatric_notes: string | null;
    ros_other: string | null;

    // Attestation timestamp (set when nurse signs)
    declared_at: string | null;

    created_at: string;
};

export type MedicalAuditEntry = {
    id: string;
    table_name: string;
    row_id: string;
    client_id: string;
    actor_id: string;
    actor_role: AuditActorRole;
    action: AuditAction;
    changed_columns: string[] | null;
    before_data: Record<string, unknown> | null;
    after_data: Record<string, unknown> | null;
    created_at: string;
};

export type ClientEmergencyContact = {
    id: string;
    client_id: string;
    full_name: string;
    relationship: string | null;
    phone_number: string;
    alternate_phone: string | null;
    email: string | null;
    priority: number;
    created_at: string;
};

export type ClientInsurance = {
    client_id: string;
    provider: string | null;
    policy_number: string | null;
    expiry_date: string | null;
    notes: string | null;
    updated_at: string;
};
// ============================================================
// CHAT — ephemeral 1:1 messaging
// ============================================================

export type ChatMessage = {
    id: string;
    connection_id: string;
    sender_id: string;
    body: string | null;
    ciphertext: string | null;
    nonce: string | null;
    sender_public_key: string | null;
    ttl_seconds: number | null;
    created_at: string;
    delivered_at: string | null;
    read_at: string | null;
    expires_at: string;
    tombstoned: boolean;
    edited_at: string | null;
    deleted_at: string | null;
    reply_to_id: string | null;
};
export type ChatAttachment = {
    id: string;
    message_id: string | null;
    connection_id: string;
    uploader_id: string;
    kind: "image" | "video";
    cloudinary_public_id: string;
    cloudinary_url: string;
    mime_type: string | null;
    bytes: number | null;
    width: number | null;
    height: number | null;
    duration_seconds: number | null;
    created_at: string;
    deleted_at: string | null;
};
export type ChatConnectionSettings = {
    connection_id: string;
    default_ttl_seconds: number | null;
    disappearing_enabled: boolean;
    updated_by: string | null;
    updated_at: string;
};

export type Report = {
    id: string;
    reporter_id: string;
    reported_user_id: string;
    connection_id: string | null;
    booking_id: string | null;
    reason: string;
    notes: string | null;
    status: "open" | "reviewing" | "resolved" | "dismissed";
    created_at: string;
    resolved_at: string | null;
};

// ============================================================
// Supabase Database shape
// ============================================================
export type Database = {
    public: {
        Tables: {
            profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
            caregiver_profiles: { Row: CaregiverProfile; Insert: Partial<CaregiverProfile>; Update: Partial<CaregiverProfile> };
            client_profiles: { Row: ClientProfile; Insert: Partial<ClientProfile>; Update: Partial<ClientProfile> };
            client_privacy_settings: { Row: ClientPrivacySettings; Insert: Partial<ClientPrivacySettings>; Update: Partial<ClientPrivacySettings> };
            connections: { Row: Connection; Insert: Partial<Connection>; Update: Partial<Connection> };
            categories: { Row: Category; Insert: Partial<Category>; Update: Partial<Category> };
            services: { Row: Service; Insert: Partial<Service>; Update: Partial<Service> };
            bookings: { Row: Booking; Insert: Partial<Booking>; Update: Partial<Booking> };
            booking_status_history: { Row: BookingStatusHistory; Insert: Partial<BookingStatusHistory>; Update: Partial<BookingStatusHistory> };
            booking_qr_tokens: { Row: BookingQrToken; Insert: Partial<BookingQrToken>; Update: Partial<BookingQrToken> };
            arrival_verifications: { Row: ArrivalVerification; Insert: Partial<ArrivalVerification>; Update: Partial<ArrivalVerification> };
            mpesa_payments: { Row: MpesaPayment; Insert: Partial<MpesaPayment>; Update: Partial<MpesaPayment> };
            escrow_transactions: { Row: EscrowTransaction; Insert: Partial<EscrowTransaction>; Update: Partial<EscrowTransaction> };
            payouts: { Row: Payout; Insert: Partial<Payout>; Update: Partial<Payout> };
            visit_notes: { Row: VisitNote; Insert: Partial<VisitNote>; Update: Partial<VisitNote> };
            reviews: { Row: Review; Insert: Partial<Review>; Update: Partial<Review> };
            notifications: { Row: Notification; Insert: Partial<Notification>; Update: Partial<Notification> };
            cpd_events: { Row: CpdEvent; Insert: Partial<CpdEvent>; Update: Partial<CpdEvent> };
            service_milestones: { Row: ServiceMilestone; Insert: Partial<ServiceMilestone>; Update: Partial<ServiceMilestone> };
            caregiver_follows: { Row: CaregiverFollow; Insert: Partial<CaregiverFollow>; Update: Partial<CaregiverFollow> };

            // ---- Medical ----
            client_medical_profile: { Row: ClientMedicalProfile; Insert: Partial<ClientMedicalProfile>; Update: Partial<ClientMedicalProfile> };
            medical_allergies: { Row: MedicalAllergy; Insert: Partial<MedicalAllergy>; Update: Partial<MedicalAllergy> };
            medical_medications: { Row: MedicalMedication; Insert: Partial<MedicalMedication>; Update: Partial<MedicalMedication> };
            medical_conditions: { Row: MedicalCondition; Insert: Partial<MedicalCondition>; Update: Partial<MedicalCondition> };
            medical_surgeries: { Row: MedicalSurgery; Insert: Partial<MedicalSurgery>; Update: Partial<MedicalSurgery> };
            medical_immunizations: { Row: MedicalImmunization; Insert: Partial<MedicalImmunization>; Update: Partial<MedicalImmunization> };
            medical_family_history: { Row: MedicalFamilyHistoryRow; Insert: Partial<MedicalFamilyHistoryRow>; Update: Partial<MedicalFamilyHistoryRow> };
            medical_pregnancies: { Row: MedicalPregnancy; Insert: Partial<MedicalPregnancy>; Update: Partial<MedicalPregnancy> };
            medical_visits: { Row: MedicalVisit; Insert: Partial<MedicalVisit>; Update: Partial<MedicalVisit> };
            medical_audit_log: { Row: MedicalAuditEntry; Insert: Partial<MedicalAuditEntry>; Update: Partial<MedicalAuditEntry> };
            // ---- Daily (health diary, pregnancy, child) ----
            daily_entries: { Row: DailyEntry; Insert: Partial<DailyEntry>; Update: Partial<DailyEntry> };
            daily_pregnancy: { Row: DailyPregnancy; Insert: Partial<DailyPregnancy>; Update: Partial<DailyPregnancy> };
            daily_pregnancy_events: { Row: DailyPregnancyEvent; Insert: Partial<DailyPregnancyEvent>; Update: Partial<DailyPregnancyEvent> };
            daily_births: { Row: DailyBirth; Insert: Partial<DailyBirth>; Update: Partial<DailyBirth> };
            daily_child_profiles: { Row: DailyChildProfile; Insert: Partial<DailyChildProfile>; Update: Partial<DailyChildProfile> };
            daily_child_events: { Row: DailyChildEvent; Insert: Partial<DailyChildEvent>; Update: Partial<DailyChildEvent> };
            client_emergency_contacts: { Row: ClientEmergencyContact; Insert: Partial<ClientEmergencyContact>; Update: Partial<ClientEmergencyContact> };
            client_insurance: { Row: ClientInsurance; Insert: Partial<ClientInsurance>; Update: Partial<ClientInsurance> };

            // ---- Chat module ----
            // ---- Chat module ----
            chat_messages: { Row: ChatMessage; Insert: Partial<ChatMessage>; Update: Partial<ChatMessage> };
            chat_attachments: { Row: ChatAttachment; Insert: Partial<ChatAttachment>; Update: Partial<ChatAttachment> };
            chat_connection_settings: { Row: ChatConnectionSettings; Insert: Partial<ChatConnectionSettings>; Update: Partial<ChatConnectionSettings> };
            reports: { Row: Report; Insert: Partial<Report>; Update: Partial<Report> };

        };
        Views: {
            caregiver_discovery_view: { Row: CaregiverDiscoveryRow };
            client_discovery_view: { Row: ClientDiscoveryRow };
            caregiver_cpd_totals: { Row: { caregiver_id: string; cpd_points: number; cpd_hours: number; milestones_earned: number } };
        };
        Enums: {
            user_role: UserRole;
            connection_status: ConnectionStatus;
            booking_status: BookingStatus;
            payment_status: PaymentStatus;
            escrow_status: EscrowStatus;
            payout_status: PayoutStatus;
            cpd_source: CpdSource;
            verification_status: VerificationStatus;
            visit_type: VisitType;
        };
    };
};
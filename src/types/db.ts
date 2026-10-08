// src/types/db.ts

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

export type ClientMedicalProfile = {
    client_id: string;
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
    updated_at: string;
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

// Supabase Database shape (minimum needed for typed client)
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
            client_medical_profile: { Row: ClientMedicalProfile; Insert: Partial<ClientMedicalProfile>; Update: Partial<ClientMedicalProfile> };
            client_emergency_contacts: { Row: ClientEmergencyContact; Insert: Partial<ClientEmergencyContact>; Update: Partial<ClientEmergencyContact> };
            client_insurance: { Row: ClientInsurance; Insert: Partial<ClientInsurance>; Update: Partial<ClientInsurance> };
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
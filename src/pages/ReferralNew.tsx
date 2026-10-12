// src/pages/ReferralNew.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
    ArrowLeft,
    Building2,
    Loader2,
    Send,
    ShieldCheck,
    Stethoscope,
    AlertCircle,
    MessageCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";

// ---- types -----------------------------------------------------------------

type HospitalRole =
    | "doctor" | "nurse" | "discharge_officer"
    | "social_worker" | "admin" | "staff";

type ReferralServiceType =
    | "home_nursing" | "wound_care" | "medication_admin" | "physiotherapy"
    | "elderly_care" | "postnatal" | "transport" | "lab_delivery" | "other";

type MyMembership = {
    id: string;
    hospital_id: string;
    role: HospitalRole;
    is_active: boolean;
    hospital: { id: string; name: string; county: string | null } | null;
};

const SERVICE_LABEL: Record<ReferralServiceType, string> = {
    home_nursing: "Home nursing",
    wound_care: "Wound care",
    medication_admin: "Medication administration",
    physiotherapy: "Physiotherapy",
    elderly_care: "Elderly care",
    postnatal: "Postnatal care",
    transport: "Transport",
    lab_delivery: "Lab sample / result delivery",
    other: "Other",
};

const SERVICE_ORDER: ReferralServiceType[] = [
    "home_nursing", "wound_care", "medication_admin", "physiotherapy",
    "elderly_care", "postnatal", "transport", "lab_delivery", "other",
];

const URGENCY_ORDER = ["routine", "soon", "urgent"] as const;
type Urgency = (typeof URGENCY_ORDER)[number];

const URGENCY_LABEL: Record<Urgency, string> = {
    routine: "Routine",
    soon: "Within 48 hours",
    urgent: "Urgent",
};

// ---- fetches ---------------------------------------------------------------

async function fetchMyMemberships(userId: string): Promise<MyMembership[]> {
    const { data, error } = await supabase
        .from("hospital_members")
        .select(
            "id, hospital_id, role, is_active, hospital:hospitals(id, name, county)"
        )
        .eq("user_id", userId)
        .eq("is_active", true);
    if (error) throw error;
    return (data ?? []) as unknown as MyMembership[];
}

// ---- WhatsApp helpers ------------------------------------------------------

function buildReferralMessage(opts: {
    patientName: string | null;
    doctorName: string | null;
    hospitalName: string | null;
    services: ReferralServiceType[];
    urgency: Urgency;
    startDate: string;
    endDate: string;
    link: string;
}): string {
    const {
        patientName, doctorName, hospitalName, services, urgency,
        startDate, endDate, link,
    } = opts;

    const greeting = patientName ? `Hello ${patientName},` : "Hello,";
    const who = [doctorName, hospitalName ? `at ${hospitalName}` : null]
        .filter(Boolean)
        .join(" ");

    const lines: string[] = [greeting, ""];

    if (who) {
        lines.push(`${who} has recommended home care for you after discharge.`);
    } else {
        lines.push("A clinician at your hospital has recommended home care for you.");
    }

    lines.push("");
    if (services.length > 0) {
        lines.push(`Services: ${services.map((s) => SERVICE_LABEL[s]).join(", ")}`);
    }
    lines.push(`Urgency: ${URGENCY_LABEL[urgency]}`);
    if (startDate || endDate) {
        const window = [startDate, endDate].filter(Boolean).join(" → ");
        lines.push(`Care window: ${window}`);
    }

    lines.push("");
    lines.push("Tap to review and accept:");
    lines.push(link);
    lines.push("");
    lines.push("— HommieCare");

    return lines.join("\n");
}

function toWaNumber(raw: string): string {
    // wa.me wants digits only, no +, no spaces.
    const digits = raw.replace(/\D/g, "");
    if (digits.startsWith("254")) return digits;
    if (digits.startsWith("0")) return "254" + digits.slice(1);
    return digits;
}

function buildWhatsAppLink(number: string, message: string): string {
    return `https://wa.me/${toWaNumber(number)}?text=${encodeURIComponent(message)}`;
}

function openWhatsApp(link: string): boolean {
    try {
        const w = window.open(link, "_blank", "noopener,noreferrer");
        return !!w;
    } catch {
        return false;
    }
}

// ---- page ------------------------------------------------------------------

export default function ReferralNew() {
    const { user } = useSession();
    const navigate = useNavigate();

    const membershipsQuery = useQuery({
        queryKey: ["hospital_members", "mine", "active", user?.id],
        enabled: !!user,
        staleTime: 60_000,
        queryFn: () => fetchMyMemberships(user!.id),
    });

    const memberships = membershipsQuery.data ?? [];

    const [memberId, setMemberId] = useState<string>("");
    const [patientName, setPatientName] = useState("");
    const [patientPhone, setPatientPhone] = useState("");
    const [services, setServices] = useState<ReferralServiceType[]>([
        "home_nursing",
    ]);
    const [urgency, setUrgency] = useState<Urgency>("routine");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [noteToPatient, setNoteToPatient] = useState("");
    const [noteToCaregiver, setNoteToCaregiver] = useState("");

    const [submitted, setSubmitted] = useState<{
        id: string;
        waLink: string;
        waOpened: boolean;
    } | null>(null);

    useEffect(() => {
        if (!memberId && memberships.length === 1) {
            setMemberId(memberships[0].id);
        }
    }, [memberships, memberId]);

    const selectedMember = useMemo(
        () => memberships.find((m) => m.id === memberId) ?? null,
        [memberships, memberId]
    );

    const canSubmit =
        !!user &&
        !!selectedMember &&
        patientPhone.trim().length >= 9 &&
        services.length > 0;

    const mutation = useMutation({
        mutationFn: async () => {
            if (!user || !selectedMember) throw new Error("Missing hospital");

            const normalizedPhone = normalisePhone(patientPhone);

            const { data, error } = await supabase
                .from("referrals")
                .insert({
                    hospital_id: selectedMember.hospital_id,
                    referring_member_id: selectedMember.id,
                    referring_user_id: user.id,
                    patient_phone: normalizedPhone,
                    patient_name: patientName.trim() || null,
                    services_needed: services,
                    urgency,
                    recommended_start_date: startDate || null,
                    recommended_end_date: endDate || null,
                    note_to_patient: noteToPatient.trim() || null,
                    note_to_caregiver: noteToCaregiver.trim() || null,
                })
                .select("id")
                .single();
            if (error) throw error;

            const referralId = (data as { id: string }).id;

            // Build the WhatsApp link.
            const appUrl =
                typeof window !== "undefined"
                    ? window.location.origin
                    : "";
            const link = `${appUrl}/referral/${referralId}`;

            const message = buildReferralMessage({
                patientName: patientName.trim() || null,
                doctorName: user.display_name ?? null,
                hospitalName: selectedMember.hospital?.name ?? null,
                services,
                urgency,
                startDate,
                endDate,
                link,
            });

            const waLink = buildWhatsAppLink(normalizedPhone, message);
            const waOpened = openWhatsApp(waLink);

            // Record that we tried to send it. Best-effort — if this write fails
            // we don't want to break the flow.
            supabase
                .from("referrals")
                .update({ consent_sent_at: new Date().toISOString() })
                .eq("id", referralId)
                .then(() => {
                    /* ignore */
                });

            return { id: referralId, waLink, waOpened };
        },
        onSuccess: (result) => setSubmitted(result),
    });

    if (membershipsQuery.isLoading) return <PageSkeleton />;

    if (memberships.length === 0) {
        return <NoHospitalCard />;
    }

    if (submitted) {
        return (
            <SuccessCard
                referralId={submitted.id}
                waLink={submitted.waLink}
                waOpened={submitted.waOpened}
                onAnother={() => {
                    setSubmitted(null);
                    setPatientName("");
                    setPatientPhone("");
                    setServices(["home_nursing"]);
                    setUrgency("routine");
                    setStartDate("");
                    setEndDate("");
                    setNoteToPatient("");
                    setNoteToCaregiver("");
                }}
                onViewAll={() => navigate("/referrals")}
            />
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-2 sm:px-4 pb-24 lg:pb-8 animate-fade-in">
            <header className="pt-4 pb-3 flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    aria-label="Back"
                    className="h-9 w-9 rounded-full inline-flex items-center justify-center active:bg-muted transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                    <h1 className="text-xl font-black tracking-tight text-foreground">
                        New referral
                    </h1>
                    <p className="text-xs text-muted-foreground">
                        Send a patient home with a care plan
                    </p>
                </div>
            </header>

            {/* Hospital picker ---------------------------------------------------- */}
            {memberships.length > 1 && (
                <Section title="Referring from">
                    <div className="rounded-2xl bg-card p-3 space-y-1.5">
                        {memberships.map((m) => (
                            <button
                                key={m.id}
                                type="button"
                                onClick={() => setMemberId(m.id)}
                                className={
                                    "w-full text-left rounded-xl px-3 py-2.5 transition-colors " +
                                    (memberId === m.id
                                        ? "bg-primary/10"
                                        : "active:bg-muted")
                                }
                            >
                                <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                                    <span className="text-sm font-bold text-foreground truncate">
                                        {m.hospital?.name ?? "Unknown hospital"}
                                    </span>
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-0.5 capitalize">
                                    {m.role.replace(/_/g, " ")}
                                    {m.hospital?.county ? ` · ${m.hospital.county}` : ""}
                                </p>
                            </button>
                        ))}
                    </div>
                </Section>
            )}

            {memberships.length === 1 && selectedMember && (
                <Section title="Referring from">
                    <div className="rounded-2xl bg-card p-3 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-foreground truncate">
                                {selectedMember.hospital?.name ?? "Unknown hospital"}
                            </p>
                            <p className="text-[11px] text-muted-foreground capitalize">
                                {selectedMember.role.replace(/_/g, " ")}
                            </p>
                        </div>
                    </div>
                </Section>
            )}

            {/* Patient ------------------------------------------------------------ */}
            <Section title="Patient">
                <div className="space-y-3">
                    <Field label="Phone number *">
                        <Input
                            value={patientPhone}
                            onChange={(e) => setPatientPhone(e.target.value)}
                            placeholder="+254 7XX XXX XXX"
                            inputMode="tel"
                            className="h-11 rounded-2xl bg-muted border-0"
                        />
                        <p className="text-[11px] text-muted-foreground mt-1.5 inline-flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            We'll open WhatsApp with a ready-to-send message for this number.
                        </p>
                    </Field>

                    <Field label="Patient name">
                        <Input
                            value={patientName}
                            onChange={(e) => setPatientName(e.target.value)}
                            placeholder="Optional — helps the caregiver on arrival"
                            className="h-11 rounded-2xl bg-muted border-0"
                        />
                    </Field>
                </div>
            </Section>

            {/* Services ----------------------------------------------------------- */}
            <Section title="Services needed *">
                <div className="flex flex-wrap gap-1.5">
                    {SERVICE_ORDER.map((s) => {
                        const active = services.includes(s);
                        return (
                            <button
                                key={s}
                                type="button"
                                onClick={() =>
                                    setServices((prev) =>
                                        active ? prev.filter((x) => x !== s) : [...prev, s]
                                    )
                                }
                                className={
                                    "h-9 px-3 rounded-full text-xs font-bold transition-colors " +
                                    (active
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-foreground active:bg-secondary")
                                }
                            >
                                {SERVICE_LABEL[s]}
                            </button>
                        );
                    })}
                </div>
            </Section>

            {/* Urgency ------------------------------------------------------------ */}
            <Section title="Urgency">
                <div className="flex flex-wrap gap-1.5">
                    {URGENCY_ORDER.map((u) => (
                        <button
                            key={u}
                            type="button"
                            onClick={() => setUrgency(u)}
                            className={
                                "h-9 px-3 rounded-full text-xs font-bold transition-colors " +
                                (urgency === u
                                    ? u === "urgent"
                                        ? "bg-destructive/10 text-destructive"
                                        : "bg-primary text-primary-foreground"
                                    : "bg-muted text-foreground active:bg-secondary")
                            }
                        >
                            {URGENCY_LABEL[u]}
                        </button>
                    ))}
                </div>
            </Section>

            {/* Care window -------------------------------------------------------- */}
            <Section title="Recommended care window">
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Start">
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="h-11 rounded-2xl bg-muted border-0"
                        />
                    </Field>
                    <Field label="End">
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="h-11 rounded-2xl bg-muted border-0"
                        />
                    </Field>
                </div>
            </Section>

            {/* Notes -------------------------------------------------------------- */}
            <Section title="Note to patient">
                <textarea
                    value={noteToPatient}
                    onChange={(e) => setNoteToPatient(e.target.value)}
                    placeholder="What you'd like them to know — plain language, no jargon."
                    rows={3}
                    className="w-full rounded-2xl bg-muted border-0 p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-border"
                />
            </Section>

            <Section title="Note to caregiver">
                <textarea
                    value={noteToCaregiver}
                    onChange={(e) => setNoteToCaregiver(e.target.value)}
                    placeholder="Clinical context — diagnosis, wound status, medication schedule, red flags."
                    rows={4}
                    className="w-full rounded-2xl bg-muted border-0 p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-border"
                />
            </Section>

            {/* Submit ------------------------------------------------------------- */}
            {mutation.isError && (
                <div className="rounded-2xl bg-destructive/10 p-3 mb-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-xs text-destructive">
                        {(mutation.error as Error)?.message ??
                            "Could not send the referral. Try again."}
                    </p>
                </div>
            )}

            <button
                type="button"
                onClick={() => mutation.mutate()}
                disabled={!canSubmit || mutation.isPending}
                className="w-full h-11 rounded-2xl bg-primary text-primary-foreground text-sm font-bold inline-flex items-center justify-center gap-2 active:opacity-90 transition-opacity disabled:opacity-50"
            >
                {mutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <Send className="w-4 h-4" />
                )}
                Send referral
            </button>

            <p className="text-[11px] text-muted-foreground text-center mt-3 inline-flex items-center gap-1 justify-center w-full">
                <ShieldCheck className="w-3 h-3" />
                WhatsApp will open with the message ready. The patient must accept
                before a care team is created.
            </p>
        </div>
    );
}

// ---- pieces ----------------------------------------------------------------

function Section({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className="mb-5">
            <h2 className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground mb-1.5">
                {title}
            </h2>
            {children}
        </section>
    );
}

function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {label}
            </label>
            <div className="mt-1.5">{children}</div>
        </div>
    );
}

function PageSkeleton() {
    return (
        <div className="max-w-3xl mx-auto px-2 sm:px-4 py-6 space-y-4">
            <div className="h-8 w-48 rounded-2xl skeleton-shimmer" />
            <div className="h-16 rounded-2xl skeleton-shimmer" />
            <div className="h-32 rounded-2xl skeleton-shimmer" />
            <div className="h-32 rounded-2xl skeleton-shimmer" />
        </div>
    );
}

function NoHospitalCard() {
    return (
        <div className="max-w-md mx-auto px-4 py-12 text-center animate-fade-in">
            <Stethoscope className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h2 className="text-base font-bold text-foreground">
                Join a hospital first
            </h2>
            <p className="text-sm text-muted-foreground mt-1.5">
                Referrals are attributed to the facility you practise at. Join one or
                create it if it isn't listed.
            </p>
            <Link
                to="/hospital/join"
                className="mt-5 inline-flex h-11 px-5 rounded-2xl bg-primary text-primary-foreground text-sm font-bold items-center justify-center gap-2 active:opacity-90 transition-opacity"
            >
                <Building2 className="w-4 h-4" />
                Join or create a hospital
            </Link>
        </div>
    );
}

function SuccessCard({
    referralId,
    waLink,
    waOpened,
    onAnother,
    onViewAll,
}: {
    referralId: string;
    waLink: string;
    waOpened: boolean;
    onAnother: () => void;
    onViewAll: () => void;
}) {
    return (
        <div className="max-w-md mx-auto px-4 py-12 text-center animate-fade-in">
            <div className="h-14 w-14 rounded-full bg-success/10 mx-auto flex items-center justify-center mb-4">
                <MessageCircle className="w-6 h-6 text-success" />
            </div>
            <h2 className="text-base font-bold text-foreground">
                {waOpened ? "WhatsApp is opening" : "Referral saved"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1.5">
                {waOpened
                    ? "Tap Send in WhatsApp to deliver the message to your patient."
                    : "We couldn't open WhatsApp automatically. Tap below to open it manually."}
            </p>
            <p className="text-[11px] text-muted-foreground mt-2 font-mono">
                #{referralId.slice(0, 8)}
            </p>

            <div className="mt-6 flex flex-col gap-2">
                <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-11 rounded-2xl bg-primary text-primary-foreground text-sm font-bold inline-flex items-center justify-center gap-2 active:opacity-90 transition-opacity"
                >
                    <MessageCircle className="w-4 h-4" />
                    {waOpened ? "Open WhatsApp again" : "Open WhatsApp"}
                </a>
                <button
                    type="button"
                    onClick={onViewAll}
                    className="h-11 rounded-2xl bg-muted text-foreground text-sm font-bold active:bg-secondary transition-colors"
                >
                    View my referrals
                </button>
                <button
                    type="button"
                    onClick={onAnother}
                    className="h-11 rounded-2xl bg-muted text-foreground text-sm font-bold active:bg-secondary transition-colors"
                >
                    Send another
                </button>
            </div>
        </div>
    );
}

// ---- helpers ---------------------------------------------------------------

function normalisePhone(raw: string): string {
    const digits = raw.replace(/[^\d+]/g, "");
    if (digits.startsWith("+")) return digits;
    if (digits.startsWith("0")) return "+254" + digits.slice(1);
    if (digits.startsWith("254")) return "+" + digits;
    return "+254" + digits;
}
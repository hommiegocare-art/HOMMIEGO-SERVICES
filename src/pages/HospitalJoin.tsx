// src/pages/HospitalJoin.tsx
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Search,
    MapPin,
    Building2,
    ShieldCheck,
    Plus,
    X,
    Loader2,
    CheckCircle2,
    ArrowRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { VerifiedBadge } from "@/components/brand/VerifiedBadge";

const KENYA_COUNTIES = [
    "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo-Marakwet", "Embu", "Garissa",
    "Homa Bay", "Isiolo", "Kajiado", "Kakamega", "Kericho", "Kiambu", "Kilifi",
    "Kirinyaga", "Kisii", "Kisumu", "Kitui", "Kwale", "Laikipia", "Lamu", "Machakos",
    "Makueni", "Mandera", "Marsabit", "Meru", "Migori", "Mombasa", "Murang'a",
    "Nairobi", "Nakuru", "Nandi", "Narok", "Nyamira", "Nyandarua", "Nyeri", "Samburu",
    "Siaya", "Taita-Taveta", "Tana River", "Tharaka-Nithi", "Trans Nzoia", "Turkana",
    "Uasin Gishu", "Vihiga", "Wajir", "West Pokot",
] as const;

type HospitalRole =
    | "doctor" | "nurse" | "discharge_officer"
    | "social_worker" | "admin" | "staff";

type Hospital = {
    id: string;
    name: string;
    county: string | null;
    city: string | null;
    physical_address: string | null;
    verified: boolean;
};

type Membership = {
    id: string;
    hospital_id: string;
    user_id: string;
    role: HospitalRole;
    is_active: boolean;
};

const ROLE_LABEL: Record<HospitalRole, string> = {
    doctor: "Doctor",
    nurse: "Nurse",
    discharge_officer: "Discharge officer",
    social_worker: "Social worker",
    admin: "Hospital admin",
    staff: "Staff",
};

const ROLE_ORDER: HospitalRole[] = [
    "doctor", "nurse", "discharge_officer", "social_worker", "admin", "staff",
];

// ---- fetches ---------------------------------------------------------------

async function fetchHospitals(search: string): Promise<Hospital[]> {
    let q = supabase
        .from("hospitals")
        .select("id, name, county, city, physical_address, verified")
        .is("deleted_at", null)
        .order("name", { ascending: true })
        .limit(50);

    const s = search.trim().replace(/[,()]/g, " ");
    if (s) q = q.or(`name.ilike.%${s}%,county.ilike.%${s}%,city.ilike.%${s}%`);

    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as Hospital[];
}

async function fetchMyMemberships(userId: string): Promise<Membership[]> {
    const { data, error } = await supabase
        .from("hospital_members")
        .select("id, hospital_id, user_id, role, is_active")
        .eq("user_id", userId);
    if (error) throw error;
    return (data ?? []) as Membership[];
}

// ---- page ------------------------------------------------------------------

export default function HospitalJoin() {
    const { user } = useSession();
    const navigate = useNavigate();
    const qc = useQueryClient();
    const [params] = useSearchParams();
    const prefillHospitalId = params.get("hospitalId");

    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [joinTarget, setJoinTarget] = useState<Hospital | null>(null);
    const [createOpen, setCreateOpen] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setSearch(searchInput), 300);
        return () => clearTimeout(t);
    }, [searchInput]);

    const hospitalsQuery = useQuery({
        queryKey: ["hospitals", "search", search],
        enabled: !!user,
        staleTime: 60_000,
        queryFn: () => fetchHospitals(search),
    });

    const membershipsQuery = useQuery({
        queryKey: ["hospital_members", "mine", user?.id],
        enabled: !!user,
        staleTime: 60_000,
        queryFn: () => fetchMyMemberships(user!.id),
    });

    const memberOfByHospital = useMemo(() => {
        const m = new Map<string, Membership>();
        for (const row of membershipsQuery.data ?? []) {
            if (row.is_active) m.set(row.hospital_id, row);
        }
        return m;
    }, [membershipsQuery.data]);

    useEffect(() => {
        if (!prefillHospitalId) return;
        if (membershipsQuery.isLoading) return;

        const alreadyMember = memberOfByHospital.has(prefillHospitalId);
        if (alreadyMember) {
            navigate("/referrals", { replace: true });
            return;
        }

        if (joinTarget) return;
        const found = (hospitalsQuery.data ?? []).find(
            (h) => h.id === prefillHospitalId
        );
        if (found) setJoinTarget(found);
    }, [
        prefillHospitalId,
        hospitalsQuery.data,
        memberOfByHospital,
        membershipsQuery.isLoading,
        joinTarget,
        navigate,
    ]);

    const rows = hospitalsQuery.data ?? [];

    return (
        <div className="max-w-3xl mx-auto px-2 sm:px-4 pb-24 lg:pb-8 animate-fade-in">
            <header className="pt-4 pb-3">
                <h1 className="text-2xl font-black tracking-tight text-foreground">
                    Join a hospital
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Find your facility to send post-discharge referrals.
                </p>
            </header>

            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search by hospital name, county, or city"
                    className="pl-9 h-11 rounded-2xl bg-muted border-0"
                />
            </div>

            <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="w-full h-11 rounded-2xl bg-primary text-primary-foreground text-sm font-bold inline-flex items-center justify-center gap-2 active:opacity-90 transition-opacity mb-5"
            >
                <Plus className="w-4 h-4" />
                Create a new hospital
            </button>

            {hospitalsQuery.isLoading ? (
                <ListSkeleton />
            ) : rows.length === 0 ? (
                <EmptyState search={search} onCreate={() => setCreateOpen(true)} />
            ) : (
                <ul className="space-y-2">
                    {rows.map((h) => {
                        const member = memberOfByHospital.get(h.id);
                        return (
                            <li key={h.id}>
                                <HospitalRow
                                    hospital={h}
                                    membership={member ?? null}
                                    onJoin={() => {
                                        if (member) {
                                            navigate("/referrals");
                                        } else {
                                            setJoinTarget(h);
                                        }
                                    }}
                                />
                            </li>
                        );
                    })}
                </ul>
            )}

            {joinTarget && user && (
                <JoinSheet
                    hospital={joinTarget}
                    userId={user.id}
                    onClose={() => setJoinTarget(null)}
                    onJoined={() => {
                        setJoinTarget(null);
                        qc.invalidateQueries({ queryKey: ["hospital_members", "mine"] });
                        navigate("/referrals");
                    }}
                />
            )}

            {createOpen && user && (
                <CreateSheet
                    userId={user.id}
                    onClose={() => setCreateOpen(false)}
                    onCreated={() => {
                        setCreateOpen(false);
                        qc.invalidateQueries({ queryKey: ["hospitals"] });
                        qc.invalidateQueries({ queryKey: ["hospital_members", "mine"] });
                    }}
                />
            )}
        </div>
    );
}

// ---- row -------------------------------------------------------------------

function HospitalRow({
    hospital,
    membership,
    onJoin,
}: {
    hospital: Hospital;
    membership: Membership | null;
    onJoin: () => void;
}) {
    const location = [hospital.city, hospital.county].filter(Boolean).join(", ");
    const joined = !!membership;

    return (
        <div className="rounded-2xl bg-card p-3 flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-muted shrink-0 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-muted-foreground" />
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-foreground truncate">
                        {hospital.name}
                    </p>
                    <VerifiedBadge show={hospital.verified} className="w-4 h-4 shrink-0" />
                </div>

                {location ? (
                    <p className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-0.5 truncate">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{location}</span>
                    </p>
                ) : (
                    <p className="text-xs text-muted-foreground mt-0.5">
                        No location on file
                    </p>
                )}
            </div>

            {joined ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-bold text-success shrink-0">
                    <CheckCircle2 className="w-3 h-3" />
                    Joined
                </span>
            ) : (
                <button
                    type="button"
                    onClick={onJoin}
                    className="h-9 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold inline-flex items-center gap-1.5 active:opacity-90 transition-opacity shrink-0"
                >
                    Join
                    <ArrowRight className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
}

// ---- join bottom sheet -----------------------------------------------------

function JoinSheet({
    hospital,
    userId,
    onClose,
    onJoined,
}: {
    hospital: Hospital;
    userId: string;
    onClose: () => void;
    onJoined: () => void;
}) {
    const [role, setRole] = useState<HospitalRole>("staff");
    const [title, setTitle] = useState("");
    const [license, setLicense] = useState("");

    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    const mutation = useMutation({
        mutationFn: async () => {
            const { error } = await supabase
                .from("hospital_members")
                .upsert(
                    {
                        hospital_id: hospital.id,
                        user_id: userId,
                        role,
                        title: title.trim() || null,
                        license_number: license.trim() || null,
                        is_active: true,
                    },
                    { onConflict: "hospital_id,user_id" }
                );
            if (error) throw error;
        },
        onSuccess: onJoined,
    });

    const isClinician = role === "doctor" || role === "nurse";

    return (
        <Sheet onClose={onClose}>
            <div className="flex items-start gap-3 pb-4">
                <div className="h-11 w-11 rounded-full bg-muted shrink-0 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-foreground truncate">
                        {hospital.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Join as a member
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="h-9 w-9 rounded-full inline-flex items-center justify-center active:bg-muted transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Your role
                    </label>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {ROLE_ORDER.map((r) => (
                            <button
                                key={r}
                                type="button"
                                onClick={() => setRole(r)}
                                className={
                                    "h-9 px-3 rounded-full text-xs font-bold transition-colors " +
                                    (role === r
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-foreground active:bg-secondary")
                                }
                            >
                                {ROLE_LABEL[r]}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Job title (optional)
                    </label>
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Senior nurse, Ward 4B"
                        className="mt-2 h-11 rounded-2xl bg-muted border-0"
                    />
                </div>

                {isClinician && (
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            License number
                        </label>
                        <Input
                            value={license}
                            onChange={(e) => setLicense(e.target.value)}
                            placeholder="NCK / KMPDC registration"
                            className="mt-2 h-11 rounded-2xl bg-muted border-0"
                        />
                        <p className="text-[11px] text-muted-foreground mt-1.5 inline-flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            Used for verification. Visible to hospital admins only.
                        </p>
                    </div>
                )}

                {mutation.isError && (
                    <p className="text-xs text-destructive">
                        {(mutation.error as Error)?.message ?? "Could not join. Try again."}
                    </p>
                )}

                <button
                    type="button"
                    onClick={() => mutation.mutate()}
                    disabled={mutation.isPending}
                    className="w-full h-11 rounded-2xl bg-primary text-primary-foreground text-sm font-bold inline-flex items-center justify-center gap-2 active:opacity-90 transition-opacity disabled:opacity-50"
                >
                    {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Join {hospital.name}
                </button>
            </div>
        </Sheet>
    );
}

// ---- create bottom sheet ---------------------------------------------------

function CreateSheet({
    userId,
    onClose,
    onCreated,
}: {
    userId: string;
    onClose: () => void;
    onCreated: () => void;
}) {
    const [name, setName] = useState("");
    const [county, setCounty] = useState("");
    const [city, setCity] = useState("");
    const [address, setAddress] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [mfl, setMfl] = useState("");
    const [role, setRole] = useState<HospitalRole>("doctor");

    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    const canSubmit = name.trim().length >= 3;

    const mutation = useMutation({
        mutationFn: async () => {
            const { data, error } = await supabase.rpc(
                "create_hospital_with_membership",
                {
                    p_name: name.trim(),
                    p_county: county.trim() || null,
                    p_city: city.trim() || null,
                    p_address: address.trim() || null,
                    p_phone: phone.trim() || null,
                    p_email: email.trim() || null,
                    p_mfl_code: mfl.trim() || null,
                    p_role: role,
                }
            );

            if (!error) return data as string;

            const { data: h, error: hErr } = await supabase
                .from("hospitals")
                .insert({
                    name: name.trim(),
                    county: county.trim() || null,
                    city: city.trim() || null,
                    physical_address: address.trim() || null,
                    contact_phone: phone.trim() || null,
                    contact_email: email.trim() || null,
                    mfl_code: mfl.trim() || null,
                    created_by: userId,
                })
                .select("id")
                .single();
            if (hErr) throw hErr;

            const hospitalId = (h as { id: string }).id;

            const { error: mErr } = await supabase
                .from("hospital_members")
                .upsert(
                    {
                        hospital_id: hospitalId,
                        user_id: userId,
                        role,
                        is_active: true,
                    },
                    { onConflict: "hospital_id,user_id" }
                );
            if (mErr) throw mErr;

            return hospitalId;
        },
        onSuccess: () => onCreated(),
    });

    return (
        <Sheet onClose={onClose}>
            <div className="flex items-start gap-3 pb-4">
                <div className="h-11 w-11 rounded-full bg-muted shrink-0 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-foreground">New hospital</p>
                    <p className="text-xs text-muted-foreground">
                        It will be unverified until an admin reviews it.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="h-9 w-9 rounded-full inline-flex items-center justify-center active:bg-muted transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="space-y-3">
                <Field label="Hospital name *">
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Kenyatta National Hospital"
                        className="h-11 rounded-2xl bg-muted border-0"
                    />
                </Field>

                <Field label="County">
                    <select
                        value={county}
                        onChange={(e) => setCounty(e.target.value)}
                        className="w-full h-11 rounded-2xl bg-muted border-0 px-3 text-sm text-foreground"
                    >
                        <option value="">Select county</option>
                        {KENYA_COUNTIES.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>
                </Field>

                <div className="grid grid-cols-2 gap-3">
                    <Field label="City / town">
                        <Input
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="Nairobi"
                            className="h-11 rounded-2xl bg-muted border-0"
                        />
                    </Field>
                    <Field label="MFL code">
                        <Input
                            value={mfl}
                            onChange={(e) => setMfl(e.target.value)}
                            placeholder="Optional"
                            className="h-11 rounded-2xl bg-muted border-0"
                        />
                    </Field>
                </div>

                <Field label="Physical address">
                    <Input
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Street, building, floor"
                        className="h-11 rounded-2xl bg-muted border-0"
                    />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                    <Field label="Contact phone">
                        <Input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+254…"
                            inputMode="tel"
                            className="h-11 rounded-2xl bg-muted border-0"
                        />
                    </Field>
                    <Field label="Contact email">
                        <Input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@…"
                            inputMode="email"
                            className="h-11 rounded-2xl bg-muted border-0"
                        />
                    </Field>
                </div>

                <Field label="Your role at this hospital">
                    <div className="flex flex-wrap gap-1.5 mt-1">
                        {ROLE_ORDER.map((r) => (
                            <button
                                key={r}
                                type="button"
                                onClick={() => setRole(r)}
                                className={
                                    "h-9 px-3 rounded-full text-xs font-bold transition-colors " +
                                    (role === r
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-foreground active:bg-secondary")
                                }
                            >
                                {ROLE_LABEL[r]}
                            </button>
                        ))}
                    </div>
                </Field>

                {mutation.isError && (
                    <p className="text-xs text-destructive">
                        {(mutation.error as Error)?.message ??
                            "Could not create. Try again."}
                    </p>
                )}

                <button
                    type="button"
                    onClick={() => mutation.mutate()}
                    disabled={!canSubmit || mutation.isPending}
                    className="w-full h-11 rounded-2xl bg-primary text-primary-foreground text-sm font-bold inline-flex items-center justify-center gap-2 active:opacity-90 transition-opacity disabled:opacity-50"
                >
                    {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Create hospital
                </button>
            </div>
        </Sheet>
    );
}

// ---- shared sheet + field --------------------------------------------------

function Sheet({
    children,
    onClose,
}: {
    children: React.ReactNode;
    onClose: () => void;
}) {
    const [mounted, setMounted] = useState(false);
    const [dragY, setDragY] = useState(0);
    const startYRef = useState<number | null>(null);
    const getStart = () => startYRef[0];
    const setStart = (v: number | null) => (startYRef[1](v));

    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    return createPortal(
        <div
            className="
                fixed inset-0 z-[9999] bg-background/70 backdrop-blur-sm
                flex items-end sm:items-center justify-center
                animate-fade-in
            "
            onClick={onClose}
        >
            <div
                className="
                    relative w-full sm:max-w-3xl
                    bg-card border border-border
                    rounded-t-3xl sm:rounded-3xl
                    max-h-[90dvh] sm:max-h-[85dvh] overflow-y-auto
                    animate-slide-up sm:animate-none
                "
                style={{
                    transform: `translateY(${dragY}px)`,
                    paddingBottom:
                        "calc(env(safe-area-inset-bottom) + 72px)",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Drag handle — phone only */}
                <div
                    className="pt-3 pb-2 flex justify-center cursor-grab active:cursor-grabbing touch-none sm:hidden"
                    onPointerDown={(e) => {
                        setStart(e.clientY);
                        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                    }}
                    onPointerMove={(e) => {
                        const s = getStart();
                        if (s === null) return;
                        setDragY(Math.max(0, e.clientY - s));
                    }}
                    onPointerUp={() => {
                        if (dragY > 100) onClose();
                        else setDragY(0);
                        setStart(null);
                    }}
                    onPointerCancel={() => {
                        setDragY(0);
                        setStart(null);
                    }}
                >
                    <span className="w-10 h-1.5 rounded-full bg-muted-foreground/30" />
                </div>

                {/* Desktop-only top padding (no drag handle) */}
                <div className="px-2 sm:px-6 pt-4 sm:pt-6 pb-6">{children}</div>
            </div>
        </div>,
        document.body
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
            <div className="mt-2">{children}</div>
        </div>
    );
}

// ---- states ----------------------------------------------------------------

function ListSkeleton() {
    return (
        <ul className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="rounded-2xl bg-card p-3 flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full skeleton-shimmer shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 rounded skeleton-shimmer w-2/3" />
                        <div className="h-2.5 rounded skeleton-shimmer w-1/3" />
                    </div>
                    <div className="h-9 w-16 rounded-xl skeleton-shimmer" />
                </li>
            ))}
        </ul>
    );
}

function EmptyState({
    search,
    onCreate,
}: {
    search: string;
    onCreate: () => void;
}) {
    return (
        <div className="py-12 text-center animate-fade-in">
            <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
                {search
                    ? `No hospitals match "${search}".`
                    : "No hospitals are listed yet."}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
                You can create yours and invite colleagues later.
            </p>
            <button
                type="button"
                onClick={onCreate}
                className="mt-4 h-10 px-4 rounded-xl bg-muted text-foreground text-sm font-bold inline-flex items-center gap-1.5 active:bg-secondary transition-colors"
            >
                <Plus className="w-4 h-4" />
                Create hospital
            </button>
        </div>
    );
}
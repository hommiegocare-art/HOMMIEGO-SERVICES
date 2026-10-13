// src/pages/HospitalJoin.tsx
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import {
    Search,
    MapPin,
    Building2,
    ShieldCheck,
    Plus,
    X,
    Loader2,
    ArrowRight,
    Settings as SettingsIcon,
    LogOut,
    AlertCircle,
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
    contact_phone: string | null;
    contact_email: string | null;
    mfl_code: string | null;
    verified: boolean;
    created_by: string;
};

type Membership = {
    id: string;
    hospital_id: string;
    user_id: string;
    role: HospitalRole;
    title: string | null;
    license_number: string | null;
    is_active: boolean;
};

type MemberRow = {
    id: string;
    user_id: string;
    role: HospitalRole;
    is_active: boolean;
    display_name: string | null;
    avatar_url: string | null;
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
        .select(
            "id, name, county, city, physical_address, contact_phone, contact_email, mfl_code, verified, created_by"
        )
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
        .select(
            "id, hospital_id, user_id, role, title, license_number, is_active"
        )
        .eq("user_id", userId);
    if (error) throw error;
    return (data ?? []) as Membership[];
}

async function fetchHospitalMembers(hospitalId: string): Promise<MemberRow[]> {
    const { data, error } = await supabase
        .from("hospital_members")
        .select(
            `id, user_id, role, is_active,
             profile:profiles(id, display_name, avatar_url)`
        )
        .eq("hospital_id", hospitalId)
        .eq("is_active", true);
    if (error) throw error;

    return (data ?? []).map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        role: row.role as HospitalRole,
        is_active: row.is_active,
        display_name: row.profile?.display_name ?? null,
        avatar_url: row.profile?.avatar_url ?? null,
    }));
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
    const [manageTarget, setManageTarget] = useState<{
        hospital: Hospital;
        membership: Membership;
    } | null>(null);
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
                    Hospitals
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Find your facility, or manage the ones you're part of.
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
                                    onJoin={() => setJoinTarget(h)}
                                    onManage={() => {
                                        if (member) {
                                            setManageTarget({
                                                hospital: h,
                                                membership: member,
                                            });
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
                        qc.invalidateQueries({
                            queryKey: ["hospital_members", "mine"],
                        });
                        navigate("/referrals");
                    }}
                />
            )}

            {manageTarget && (
                <ManageSheet
                    hospital={manageTarget.hospital}
                    membership={manageTarget.membership}
                    userId={user?.id ?? ""}
                    onClose={() => setManageTarget(null)}
                    onChanged={() => {
                        qc.invalidateQueries({
                            queryKey: ["hospital_members", "mine"],
                        });
                        qc.invalidateQueries({
                            queryKey: ["hospital_members", "list"],
                        });
                        qc.invalidateQueries({
                            queryKey: ["hospitals", "search"],
                        });
                    }}
                    onLeft={() => {
                        setManageTarget(null);
                        qc.invalidateQueries({
                            queryKey: ["hospital_members", "mine"],
                        });
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
                        qc.invalidateQueries({
                            queryKey: ["hospital_members", "mine"],
                        });
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
    onManage,
}: {
    hospital: Hospital;
    membership: Membership | null;
    onJoin: () => void;
    onManage: () => void;
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
                    <VerifiedBadge
                        show={hospital.verified}
                        className="w-4 h-4 shrink-0"
                    />
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

                {joined && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 capitalize">
                        {ROLE_LABEL[membership!.role]}
                    </p>
                )}
            </div>

            {joined ? (
                <button
                    type="button"
                    onClick={onManage}
                    className="h-9 px-3 rounded-xl bg-muted text-foreground text-xs font-bold inline-flex items-center gap-1.5 active:bg-secondary transition-colors shrink-0"
                >
                    <SettingsIcon className="w-3.5 h-3.5" />
                    Manage
                </button>
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

    useSheetLifecycle(onClose);

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
            <SheetHeader
                icon={<Building2 className="w-5 h-5 text-muted-foreground" />}
                title={hospital.name}
                subtitle="Join as a member"
                onClose={onClose}
            />

            <div className="space-y-4">
                <RolePicker value={role} onChange={setRole} />

                <Field label="Job title (optional)">
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Senior nurse, Ward 4B"
                        className="h-11 rounded-2xl bg-muted border-0"
                    />
                </Field>

                {isClinician && (
                    <Field label="License number">
                        <Input
                            value={license}
                            onChange={(e) => setLicense(e.target.value)}
                            placeholder="NCK / KMPDC registration"
                            className="h-11 rounded-2xl bg-muted border-0"
                        />
                        <p className="text-[11px] text-muted-foreground mt-1.5 inline-flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            Used for verification. Visible to hospital admins only.
                        </p>
                    </Field>
                )}

                {mutation.isError && (
                    <ErrorText
                        message={
                            (mutation.error as Error)?.message ??
                            "Could not join. Try again."
                        }
                    />
                )}

                <button
                    type="button"
                    onClick={() => mutation.mutate()}
                    disabled={mutation.isPending}
                    className="w-full h-11 rounded-2xl bg-primary text-primary-foreground text-sm font-bold inline-flex items-center justify-center gap-2 active:opacity-90 transition-opacity disabled:opacity-50"
                >
                    {mutation.isPending && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    Join {hospital.name}
                </button>
            </div>
        </Sheet>
    );
}

// ---- manage bottom sheet ---------------------------------------------------

function ManageSheet({
    hospital,
    membership,
    userId,
    onClose,
    onChanged,
    onLeft,
}: {
    hospital: Hospital;
    membership: Membership;
    userId: string;
    onClose: () => void;
    onChanged: () => void;
    onLeft: () => void;
}) {
    const [role, setRole] = useState<HospitalRole>(membership.role);
    const [title, setTitle] = useState(membership.title ?? "");
    const [license, setLicense] = useState(membership.license_number ?? "");
    const [mode, setMode] = useState<"view" | "edit-hospital">("view");
    const [error, setError] = useState<string | null>(null);

    useSheetLifecycle(onClose);

    const isCreator = hospital.created_by === userId;
    const isAdmin = membership.role === "admin" || isCreator;

    const saveMutation = useMutation({
        mutationFn: async () => {
            const { error } = await supabase
                .from("hospital_members")
                .update({
                    role,
                    title: title.trim() || null,
                    license_number: license.trim() || null,
                })
                .eq("id", membership.id);
            if (error) throw error;
        },
        onSuccess: () => {
            onChanged();
            onClose();
        },
        onError: (e) => setError((e as Error).message),
    });

    const leaveMutation = useMutation({
        mutationFn: async () => {
            if (membership.role === "admin" || isCreator) {
                const { count } = await supabase
                    .from("hospital_members")
                    .select("id", { count: "exact", head: true })
                    .eq("hospital_id", hospital.id)
                    .eq("is_active", true)
                    .eq("role", "admin");

                if ((count ?? 0) <= 1) {
                    throw new Error(
                        "You're the last admin. Promote someone else or archive the hospital first."
                    );
                }
            }

            const { error } = await supabase
                .from("hospital_members")
                .update({ is_active: false })
                .eq("id", membership.id);
            if (error) throw error;
        },
        onSuccess: onLeft,
        onError: (e) => setError((e as Error).message),
    });

    const archiveMutation = useMutation({
        mutationFn: async () => {
            const { error } = await supabase
                .from("hospitals")
                .update({ deleted_at: new Date().toISOString() })
                .eq("id", hospital.id);
            if (error) throw error;
        },
        onSuccess: () => {
            onChanged();
            onClose();
        },
        onError: (e) => setError((e as Error).message),
    });

    if (mode === "edit-hospital") {
        return (
            <EditHospitalSheet
                hospital={hospital}
                onClose={onClose}
                onSaved={() => {
                    onChanged();
                    setMode("view");
                }}
            />
        );
    }

    return (
        <Sheet onClose={onClose}>
            <SheetHeader
                icon={<Building2 className="w-5 h-5 text-muted-foreground" />}
                title={hospital.name}
                subtitle="Manage your membership"
                onClose={onClose}
            />

            <div className="space-y-4">
                <RolePicker value={role} onChange={setRole} />

                <Field label="Job title (optional)">
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Senior nurse, Ward 4B"
                        className="h-11 rounded-2xl bg-muted border-0"
                    />
                </Field>

                {(role === "doctor" || role === "nurse") && (
                    <Field label="License number">
                        <Input
                            value={license}
                            onChange={(e) => setLicense(e.target.value)}
                            placeholder="NCK / KMPDC registration"
                            className="h-11 rounded-2xl bg-muted border-0"
                        />
                    </Field>
                )}

                {error && <ErrorText message={error} />}

                <button
                    type="button"
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending}
                    className="w-full h-11 rounded-2xl bg-primary text-primary-foreground text-sm font-bold inline-flex items-center justify-center gap-2 active:opacity-90 transition-opacity disabled:opacity-50"
                >
                    {saveMutation.isPending && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    Save changes
                </button>

                {isAdmin && (
                    <button
                        type="button"
                        onClick={() => setMode("edit-hospital")}
                        className="w-full h-11 rounded-2xl bg-muted text-foreground text-sm font-bold inline-flex items-center justify-center gap-2 active:bg-secondary transition-colors"
                    >
                        <SettingsIcon className="w-4 h-4" />
                        Edit hospital details
                    </button>
                )}

                {isAdmin && (
                    <div className="pt-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                            Members
                        </p>
                        <MembersList
                            hospitalId={hospital.id}
                            viewerUserId={userId}
                            onChanged={onChanged}
                        />
                    </div>
                )}

                <div className="pt-2 border-t border-border/40" />

                <button
                    type="button"
                    onClick={() => {
                        const ok = window.confirm(
                            `Leave ${hospital.name}? You can re-join anytime.`
                        );
                        if (!ok) return;
                        leaveMutation.mutate();
                    }}
                    disabled={leaveMutation.isPending}
                    className="w-full h-11 rounded-2xl bg-destructive/10 text-destructive text-sm font-bold inline-flex items-center justify-center gap-2 active:bg-destructive/20 transition-colors disabled:opacity-50"
                >
                    {leaveMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <LogOut className="w-4 h-4" />
                    )}
                    Leave hospital
                </button>

                {isCreator && (
                    <button
                        type="button"
                        onClick={() => {
                            const ok = window.confirm(
                                `Archive ${hospital.name}? Members, referrals and threads stay in the database but the hospital disappears from search.`
                            );
                            if (!ok) return;
                            archiveMutation.mutate();
                        }}
                        disabled={archiveMutation.isPending}
                        className="w-full h-11 rounded-2xl bg-muted text-destructive text-sm font-bold inline-flex items-center justify-center gap-2 active:bg-secondary transition-colors disabled:opacity-50"
                    >
                        {archiveMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <AlertCircle className="w-4 h-4" />
                        )}
                        Archive hospital
                    </button>
                )}
            </div>
        </Sheet>
    );
}

// ---- members list ----------------------------------------------------------

function MembersList({
    hospitalId,
    viewerUserId,
    onChanged,
}: {
    hospitalId: string;
    viewerUserId: string;
    onChanged: () => void;
}) {
    const membersQuery = useQuery({
        queryKey: ["hospital_members", "list", hospitalId],
        staleTime: 30_000,
        queryFn: () => fetchHospitalMembers(hospitalId),
    });

    const [error, setError] = useState<string | null>(null);

    const setRoleMutation = useMutation({
        mutationFn: async (args: { memberId: string; role: HospitalRole }) => {
            const { error } = await supabase
                .from("hospital_members")
                .update({ role: args.role })
                .eq("id", args.memberId);
            if (error) throw error;
        },
        onSuccess: () => {
            onChanged();
        },
        onError: (e) => setError((e as Error).message),
    });

    const members = membersQuery.data ?? [];

    if (membersQuery.isLoading) {
        return (
            <div className="space-y-2">
                {[0, 1].map((i) => (
                    <div
                        key={i}
                        className="rounded-2xl bg-muted p-3 h-14 skeleton-shimmer"
                    />
                ))}
            </div>
        );
    }

    if (members.length === 0) {
        return (
            <p className="text-xs text-muted-foreground">No other members yet.</p>
        );
    }

    return (
        <div className="space-y-2">
            {error && <ErrorText message={error} />}

            {members.map((m) => {
                const isViewer = m.user_id === viewerUserId;
                const isAdmin = m.role === "admin";

                return (
                    <div
                        key={m.id}
                        className="rounded-2xl bg-muted p-3 flex items-center gap-3"
                    >
                        <div className="h-9 w-9 rounded-full bg-background shrink-0 flex items-center justify-center overflow-hidden">
                            {m.avatar_url ? (
                                <img
                                    src={m.avatar_url}
                                    alt=""
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <span className="text-xs font-bold text-muted-foreground">
                                    {(m.display_name ?? "?")[0]?.toUpperCase()}
                                </span>
                            )}
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-foreground truncate">
                                {m.display_name ?? "Member"}
                                {isViewer && (
                                    <span className="text-muted-foreground font-normal">
                                        {" "}
                                        · you
                                    </span>
                                )}
                            </p>
                            <p className="text-[11px] text-muted-foreground capitalize">
                                {ROLE_LABEL[m.role]}
                            </p>
                        </div>

                        {!isViewer && (
                            <button
                                type="button"
                                onClick={() =>
                                    setRoleMutation.mutate({
                                        memberId: m.id,
                                        role: isAdmin ? "staff" : "admin",
                                    })
                                }
                                disabled={setRoleMutation.isPending}
                                className="h-8 px-2.5 rounded-lg bg-background text-foreground text-[11px] font-bold active:bg-secondary transition-colors disabled:opacity-50 shrink-0"
                            >
                                {isAdmin ? "Remove admin" : "Make admin"}
                            </button>
                        )}

                        {isViewer && isAdmin && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary shrink-0">
                                Admin
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ---- edit hospital details -------------------------------------------------

function EditHospitalSheet({
    hospital,
    onClose,
    onSaved,
}: {
    hospital: Hospital;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [name, setName] = useState(hospital.name);
    const [county, setCounty] = useState(hospital.county ?? "");
    const [city, setCity] = useState(hospital.city ?? "");
    const [address, setAddress] = useState(hospital.physical_address ?? "");
    const [phone, setPhone] = useState(hospital.contact_phone ?? "");
    const [email, setEmail] = useState(hospital.contact_email ?? "");
    const [mfl, setMfl] = useState(hospital.mfl_code ?? "");
    const [error, setError] = useState<string | null>(null);

    useSheetLifecycle(onClose);

    const canSubmit = name.trim().length >= 3;

    const mutation = useMutation({
        mutationFn: async () => {
            const { error } = await supabase
                .from("hospitals")
                .update({
                    name: name.trim(),
                    county: county.trim() || null,
                    city: city.trim() || null,
                    physical_address: address.trim() || null,
                    contact_phone: phone.trim() || null,
                    contact_email: email.trim() || null,
                    mfl_code: mfl.trim() || null,
                })
                .eq("id", hospital.id);
            if (error) throw error;
        },
        onSuccess: onSaved,
        onError: (e) => setError((e as Error).message),
    });

    return (
        <Sheet onClose={onClose}>
            <SheetHeader
                icon={<SettingsIcon className="w-5 h-5 text-muted-foreground" />}
                title="Edit hospital"
                subtitle={hospital.name}
                onClose={onClose}
            />

            <div className="space-y-3">
                <Field label="Hospital name *">
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
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
                            className="h-11 rounded-2xl bg-muted border-0"
                        />
                    </Field>
                    <Field label="MFL code">
                        <Input
                            value={mfl}
                            onChange={(e) => setMfl(e.target.value)}
                            className="h-11 rounded-2xl bg-muted border-0"
                        />
                    </Field>
                </div>

                <Field label="Physical address">
                    <Input
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="h-11 rounded-2xl bg-muted border-0"
                    />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                    <Field label="Contact phone">
                        <Input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            inputMode="tel"
                            className="h-11 rounded-2xl bg-muted border-0"
                        />
                    </Field>
                    <Field label="Contact email">
                        <Input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            inputMode="email"
                            className="h-11 rounded-2xl bg-muted border-0"
                        />
                    </Field>
                </div>

                {error && <ErrorText message={error} />}

                <button
                    type="button"
                    onClick={() => mutation.mutate()}
                    disabled={!canSubmit || mutation.isPending}
                    className="w-full h-11 rounded-2xl bg-primary text-primary-foreground text-sm font-bold inline-flex items-center justify-center gap-2 active:opacity-90 transition-opacity disabled:opacity-50"
                >
                    {mutation.isPending && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    Save hospital
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

    useSheetLifecycle(onClose);

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
            <SheetHeader
                icon={<Plus className="w-5 h-5 text-muted-foreground" />}
                title="New hospital"
                subtitle="Unverified until an admin reviews it"
                onClose={onClose}
            />

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
                            className="h-11 rounded-2xl bg-muted border-0"
                        />
                    </Field>
                    <Field label="MFL code">
                        <Input
                            value={mfl}
                            onChange={(e) => setMfl(e.target.value)}
                            className="h-11 rounded-2xl bg-muted border-0"
                        />
                    </Field>
                </div>

                <Field label="Physical address">
                    <Input
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="h-11 rounded-2xl bg-muted border-0"
                    />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                    <Field label="Contact phone">
                        <Input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            inputMode="tel"
                            className="h-11 rounded-2xl bg-muted border-0"
                        />
                    </Field>
                    <Field label="Contact email">
                        <Input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            inputMode="email"
                            className="h-11 rounded-2xl bg-muted border-0"
                        />
                    </Field>
                </div>

                <Field label="Your role at this hospital">
                    <div className="mt-1">
                        <RolePicker value={role} onChange={setRole} />
                    </div>
                </Field>

                {mutation.isError && (
                    <ErrorText
                        message={
                            (mutation.error as Error)?.message ??
                            "Could not create. Try again."
                        }
                    />
                )}

                <button
                    type="button"
                    onClick={() => mutation.mutate()}
                    disabled={!canSubmit || mutation.isPending}
                    className="w-full h-11 rounded-2xl bg-primary text-primary-foreground text-sm font-bold inline-flex items-center justify-center gap-2 active:opacity-90 transition-opacity disabled:opacity-50"
                >
                    {mutation.isPending && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    Create hospital
                </button>
            </div>
        </Sheet>
    );
}

// ---- shared pieces ---------------------------------------------------------

function useSheetLifecycle(onClose: () => void) {
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
}

function SheetHeader({
    icon,
    title,
    subtitle,
    onClose,
}: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    onClose: () => void;
}) {
    return (
        <div className="flex items-start gap-3 pb-4">
            <div className="h-11 w-11 rounded-full bg-muted shrink-0 flex items-center justify-center">
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground truncate">
                    {title}
                </p>
                <p className="text-xs text-muted-foreground">{subtitle}</p>
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
    );
}

function RolePicker({
    value,
    onChange,
}: {
    value: HospitalRole;
    onChange: (r: HospitalRole) => void;
}) {
    return (
        <>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Your role
            </label>
            <div className="mt-2 flex flex-wrap gap-1.5">
                {ROLE_ORDER.map((r) => (
                    <button
                        key={r}
                        type="button"
                        onClick={() => onChange(r)}
                        className={
                            "h-9 px-3 rounded-full text-xs font-bold transition-colors " +
                            (value === r
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-foreground active:bg-secondary")
                        }
                    >
                        {ROLE_LABEL[r]}
                    </button>
                ))}
            </div>
        </>
    );
}

function ErrorText({ message }: { message: string }) {
    return (
        <div className="rounded-2xl bg-destructive/10 px-3 py-2 flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-destructive">{message}</p>
        </div>
    );
}

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
    const setStart = (v: number | null) => startYRef[1](v);

    useEffect(() => setMounted(true), []);
    if (!mounted) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] bg-background/70 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in"
            onClick={onClose}
        >
            <div
                className="relative w-full sm:max-w-3xl bg-card border border-border rounded-t-3xl sm:rounded-3xl max-h-[90dvh] sm:max-h-[85dvh] overflow-y-auto animate-slide-up sm:animate-none"
                style={{
                    transform: `translateY(${dragY}px)`,
                    paddingBottom: "calc(env(safe-area-inset-bottom) + 72px)",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    className="pt-3 pb-2 flex justify-center cursor-grab active:cursor-grabbing touch-none sm:hidden"
                    onPointerDown={(e) => {
                        setStart(e.clientY);
                        (e.currentTarget as HTMLElement).setPointerCapture(
                            e.pointerId
                        );
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
                <li
                    key={i}
                    className="rounded-2xl bg-card p-3 flex items-center gap-3"
                >
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
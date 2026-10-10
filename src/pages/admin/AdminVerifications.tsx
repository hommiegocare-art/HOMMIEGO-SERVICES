import { Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { useAdmin } from "@/hooks/useAdmin";

type Filter = "pending" | "verified" | "rejected" | "all";

type Row = {
    user_id: string;
    professional_title: string | null;
    verification_status: string;
    updated_at: string;
    profile: {
        display_name: string | null;
        legal_name: string | null;
        phone_number: string | null;
        county: string | null;
        city: string | null;
        email: string | null;
    } | null;
};

async function fetchByFilter(filter: Filter): Promise<Row[]> {
    let query = supabase
        .from("caregiver_profiles")
        .select(
            "user_id, professional_title, verification_status, updated_at, profile:profiles!caregiver_profiles_user_id_fkey(display_name, legal_name, phone_number, county, city, email)"
        )
        .order("updated_at", { ascending: false })
        .limit(100);

    if (filter !== "all") {
        query = query.eq("verification_status", filter);
    }
    // for pending, oldest first (FIFO review)
    if (filter === "pending") {
        query = supabase
            .from("caregiver_profiles")
            .select(
                "user_id, professional_title, verification_status, updated_at, profile:profiles!caregiver_profiles_user_id_fkey(display_name, legal_name, phone_number, county, city, email)"
            )
            .eq("verification_status", "pending")
            .order("updated_at", { ascending: true })
            .limit(100);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data ?? []).map((r: any) => ({
        ...r,
        profile: Array.isArray(r.profile) ? r.profile[0] ?? null : r.profile,
    })) as Row[];
}

const FILTER_LABEL: Record<Filter, string> = {
    pending: "Pending",
    verified: "Verified",
    rejected: "Rejected",
    all: "All",
};

export default function AdminVerifications() {
    const { user, loading: sessionLoading } = useSession();
    const { isVerifier, loading: adminLoading } = useAdmin();
    const [filter, setFilter] = useState<Filter>("pending");

    const { data, isLoading, error } = useQuery({
        queryKey: ["admin", "verifications", filter],
        enabled: isVerifier,
        staleTime: 15_000,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
        queryFn: () => fetchByFilter(filter),
    });

    if (sessionLoading || adminLoading) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-3">
                <div className="h-12 rounded-2xl bg-muted" />
                <div className="h-20 rounded-2xl bg-muted" />
                <div className="h-20 rounded-2xl bg-muted" />
            </div>
        );
    }

    if (!user) return <Navigate to="/auth" replace />;
    if (!isVerifier) return <Navigate to="/" replace />;

    return (
        <div className="max-w-3xl mx-auto px-4 py-6">
            <header className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <h1 className="text-lg font-black tracking-tight text-foreground">
                    Verifications
                </h1>
            </header>

            <div className="flex gap-2 mb-5 overflow-x-auto">
                {(["pending", "verified", "rejected", "all"] as Filter[]).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`h-10 px-4 rounded-2xl text-sm font-semibold whitespace-nowrap transition-colors ${filter === f
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground active:bg-secondary"
                            }`}
                    >
                        {FILTER_LABEL[f]}
                    </button>
                ))}
            </div>

            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
            )}

            {error && (
                <div className="rounded-2xl bg-destructive/10 px-4 py-3 mb-4">
                    <p className="text-sm text-destructive">
                        Could not load queue: {(error as Error).message}
                    </p>
                </div>
            )}

            {!isLoading && !error && data && data.length === 0 && (
                <div className="rounded-2xl bg-muted px-4 py-8 text-center">
                    <p className="text-sm text-muted-foreground">
                        Nothing here.
                    </p>
                </div>
            )}

            {!isLoading && data && data.length > 0 && (
                <ul className="space-y-2">
                    {data.map((r) => {
                        const name =
                            r.profile?.display_name ||
                            r.profile?.legal_name ||
                            "Unnamed caregiver";
                        const loc = [r.profile?.city, r.profile?.county]
                            .filter(Boolean)
                            .join(", ");
                        const submitted = new Date(r.updated_at).toLocaleDateString(
                            undefined,
                            { day: "numeric", month: "short", year: "numeric" }
                        );

                        return (
                            <li key={r.user_id}>
                                <Link
                                    to={`/admin/verifications/${r.user_id}`}
                                    className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3 active:bg-muted transition-colors min-h-[44px]"
                                >
                                    <span className="w-10 h-10 rounded-full bg-primary/10 shrink-0 flex items-center justify-center">
                                        <span className="text-sm font-black text-primary">
                                            {name[0]?.toUpperCase() ?? "?"}
                                        </span>
                                    </span>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-foreground truncate">
                                            {name}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {r.professional_title || "Caregiver"}
                                            {loc ? ` · ${loc}` : ""}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                            {r.verification_status} ·{" "}
                                            {submitted}
                                        </p>
                                    </div>

                                    <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
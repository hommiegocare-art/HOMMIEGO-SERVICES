// src/pages/AdminVerifications.tsx
import { Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { useAdmin } from "@/hooks/useAdmin";
import { InitialsAvatar } from "@/components/brand/InitialsAvatar";

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
        avatar_url: string | null;
    } | null;
};

async function fetchByFilter(filter: Filter): Promise<Row[]> {
    let query = supabase
        .from("caregiver_profiles")
        .select(
            "user_id, professional_title, verification_status, updated_at, profile:profiles!caregiver_profiles_user_id_fkey(display_name, legal_name, phone_number, county, city, email, avatar_url)"
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
                "user_id, professional_title, verification_status, updated_at, profile:profiles!caregiver_profiles_user_id_fkey(display_name, legal_name, phone_number, county, city, email, avatar_url)"
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
        // Keep previous data while loading a new filter → no flicker on filter switch
        placeholderData: (prev) => prev,
    });

    if (!user && !sessionLoading) return <Navigate to="/auth" replace />;
    if (!isVerifier && !adminLoading) return <Navigate to="/" replace />;

    return (
        <div className="max-w-3xl mx-auto px-2  sm:px-2  py-4 sm:py-6">
            <header className="flex items-center gap-2 mb-3 sm:mb-4">
                <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                <h1 className="text-lg font-black tracking-tight text-foreground">
                    Verifications
                </h1>
            </header>

            {/* Filter chips — always rendered so no layout shift */}
            <div className="flex gap-1.5 sm:gap-2 mb-3 sm:mb-5 overflow-x-auto no-scrollbar -mx-2 px-2 sm:mx-0 sm:px-0">
                {(["pending", "verified", "rejected", "all"] as Filter[]).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`h-9 sm:h-10 px-3 sm:px-4 rounded-2xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${filter === f
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground active:bg-secondary"
                            }`}
                    >
                        {FILTER_LABEL[f]}
                    </button>
                ))}
            </div>

            {/* Content region — only this part swaps between loading / empty / data */}
            <Content
                sessionLoading={sessionLoading}
                adminLoading={adminLoading}
                isLoading={isLoading}
                error={error as Error | null}
                rows={data ?? null}
            />
        </div>
    );
}

/* ---------- content region ---------- */

function Content({
    sessionLoading,
    adminLoading,
    isLoading,
    error,
    rows,
}: {
    sessionLoading: boolean;
    adminLoading: boolean;
    isLoading: boolean;
    error: Error | null;
    rows: Row[] | null;
}) {
    // Before auth resolves, show nothing (page chrome above is already stable)
    if (sessionLoading || adminLoading) {
        return (
            <ul className="space-y-1.5 sm:space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                    <li
                        key={i}
                        className="rounded-2xl bg-card px-3 py-3 sm:px-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full skeleton-shimmer shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-1/2 rounded skeleton-shimmer" />
                                <div className="h-2.5 w-2/3 rounded skeleton-shimmer" />
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        );
    }

    if (error) {
        return (
            <div className="rounded-2xl bg-destructive/10 px-3 py-3 sm:px-4">
                <p className="text-sm text-destructive">
                    Could not load queue: {error.message}
                </p>
            </div>
        );
    }

    if (isLoading && rows === null) {
        // First load only
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!rows || rows.length === 0) {
        return (
            <div className="rounded-2xl bg-muted px-3 py-8 sm:px-4 text-center">
                <p className="text-sm text-muted-foreground">Nothing here.</p>
            </div>
        );
    }

    return (
        <ul className="space-y-1.5 sm:space-y-2">
            {rows.map((r) => {
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
                            className="flex items-center gap-2.5 sm:gap-3 rounded-2xl bg-card px-3 py-3 sm:px-4 active:bg-muted transition-colors min-h-[44px]"
                        >
                            <InitialsAvatar
                                url={r.profile?.avatar_url}
                                name={name}
                                className="h-10 w-10"
                                textClassName="text-sm"
                            />

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-foreground truncate">
                                    {name}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {r.professional_title || "Caregiver"}
                                    {loc ? ` · ${loc}` : ""}
                                </p>
                                <p className="text-[11px] text-muted-foreground mt-0.5 capitalize">
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
    );
}
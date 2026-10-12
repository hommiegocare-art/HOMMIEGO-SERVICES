// src/components/HospitalFab.tsx
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Building2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";

// Only show on the dashboard.
const SHOW_ON = ["/dashboard"];

export function DashboardActionFab() {
    const { pathname } = useLocation();
    const { user } = useSession();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    const isCaregiver = user?.role === "caregiver";
    const isClient = user?.role === "client";

    // For clients: do they have any care-team thread? (client_id = me)
    const { data: hasThread, isLoading: threadLoading } = useQuery({
        queryKey: ["care-team-thread-exists", user?.id],
        enabled: !!user && isClient,
        staleTime: 60_000,
        queryFn: async () => {
            const { count, error } = await supabase
                .from("care_team_threads")
                .select("id", { count: "exact", head: true })
                .eq("client_id", user!.id);
            if (error) return false;
            return (count ?? 0) > 0;
        },
    });

    const onDashboard = SHOW_ON.some(
        (p) => pathname === p || pathname.startsWith(p + "/")
    );

    if (!onDashboard) return null;
    if (!mounted || !user) return null;

    // ---------- CAREGIVER: green hospital FAB ----------
    if (isCaregiver) {
        return createPortal(
            <Link
                to="/hospital/join"
                aria-label="Add hospital"
                className={cn(
                    "fixed right-4 z-40",
                    "bottom-36 lg:bottom-24",
                    "flex h-14 w-14 items-center justify-center rounded-full",
                    "bg-success text-white",
                    "shadow-lg",
                    "transition-colors active:opacity-90",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
            >
                <Building2 className="h-6 w-6" />
            </Link>,
            document.body
        );
    }

    // ---------- CLIENT: care-team FAB, but only if they have a thread ----------
    if (isClient) {
        if (threadLoading) return null;
        if (!hasThread) return null;

        return createPortal(
            <Link
                to="/care-teams"
                aria-label="Care team"
                className={cn(
                    "fixed right-4 z-40",
                    "bottom-36 lg:bottom-24",
                    "flex h-14 w-14 items-center justify-center rounded-full",
                    "bg-primary text-primary-foreground",
                    "shadow-lg",
                    "transition-colors active:opacity-90",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
            >
                <Users className="h-6 w-6" />
            </Link>,
            document.body
        );
    }

    return null;
}
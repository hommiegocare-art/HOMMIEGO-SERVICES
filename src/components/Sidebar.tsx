// src/components/Sidebar.tsx
import { NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    Home,
    HeartPulse,
    Compass,
    Users,
    CalendarCheck,
    User,
    Bell,
    Briefcase,
    Wallet,
    Award,
    BriefcaseBusiness,
    Settings,
    ShieldCheck,
    GraduationCap,
    Stethoscope,
    Building2,
    MessageSquare,
} from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/brand/Logo";

async function hasAnyHospitalMembership(userId: string): Promise<boolean> {
    const { count, error } = await supabase
        .from("hospital_members")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_active", true);
    if (error) return false;
    return (count ?? 0) > 0;
}

async function unreadCareTeamCount(userId: string): Promise<number> {
    const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("type", "care_team_message")
        .eq("is_read", false);
    if (error) return 0;
    return count ?? 0;
}

export function Sidebar() {
    const { user } = useSession();
    const { isVerifier } = useAdmin();
    const isCaregiver = user?.role === "caregiver";

    const membershipQuery = useQuery({
        queryKey: ["hospital_members", "has_any", user?.id],
        enabled: !!user,
        staleTime: 5 * 60_000,
        queryFn: () => hasAnyHospitalMembership(user!.id),
    });

    const threadsQuery = useQuery({
        queryKey: ["care_team_threads", "has_any", user?.id],
        enabled: !!user,
        staleTime: 60_000,
        queryFn: async () => {
            const { count, error } = await supabase
                .from("care_team_threads")
                .select("id", { count: "exact", head: true });
            if (error) return false;
            return (count ?? 0) > 0;
        },
    });

    const unreadQuery = useQuery({
        queryKey: ["notifications", "unread_care_team", user?.id],
        enabled: !!user,
        staleTime: 30_000,
        queryFn: () => unreadCareTeamCount(user!.id),
    });

    const isStaff = membershipQuery.data === true;
    const hasThreads = threadsQuery.data === true;
    const showCareTeams = isStaff || hasThreads;
    const unreadCareTeams = unreadQuery.data ?? 0;

    const ITEMS: {
        to: string;
        label: string;
        icon: React.ComponentType<{ className?: string }>;
        badge?: number;
    }[] = [
            { to: "/dashboard", label: "Home", icon: Home },

            // My Health — clients only. Caregivers never see their own diary.
            ...(isCaregiver
                ? []
                : [{ to: "/health", label: "My Health", icon: HeartPulse }]),

            { to: "/explore", label: "Explore", icon: Compass },
            { to: "/connections", label: "Connections", icon: Users },

            ...(isCaregiver
                ? [
                    { to: "/jobs", label: "Jobs", icon: BriefcaseBusiness },
                    { to: "/services", label: "Services", icon: Briefcase },
                    { to: "/earnings", label: "Earnings", icon: Wallet },
                    { to: "/cpd", label: "CPD", icon: Award },
                    { to: "/certificates", label: "Certificates", icon: GraduationCap },
                ]
                : [{ to: "/bookings", label: "Bookings", icon: CalendarCheck }]),

            // Hospital referral layer — staff only (hospital members).
            ...(isStaff
                ? [
                    { to: "/referrals", label: "Referrals", icon: Stethoscope },
                    { to: "/hospital/join", label: "Hospitals", icon: Building2 },
                ]
                : []),

            ...(showCareTeams
                ? [
                    {
                        to: "/care-teams",
                        label: "Care teams",
                        icon: MessageSquare,
                        badge: unreadCareTeams,
                    },
                ]
                : []),

            { to: "/notifications", label: "Notifications", icon: Bell },
            { to: user ? `/profile/${user.id}` : "/auth", label: "Profile", icon: User },
            { to: "/settings", label: "Settings", icon: Settings },
        ];

    return (
        <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 z-40 group">
            <div className="w-16 group-hover:w-60 bg-background transition-[width] duration-150 flex flex-col py-3 overflow-hidden">
                <div className="flex h-14 shrink-0 items-center px-3.5">
                    <img
                        src="/pwa-192x192.png"
                        alt="HommieCare"
                        className="h-8 w-8 rounded-full shrink-0 group-hover:hidden"
                    />
                    <div className="hidden group-hover:inline-flex">
                        <Logo size="sm" />
                    </div>
                </div>

                <nav className="flex-1 flex flex-col gap-1 px-2 mt-2 overflow-y-auto">
                    {ITEMS.map(({ to, label, icon: Icon, badge }) => (
                        <NavLink
                            key={label}
                            to={to}
                            className={({ isActive }) =>
                                `relative flex items-center gap-3 h-11 px-3 rounded-2xl transition-colors whitespace-nowrap ${isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-foreground active:bg-muted"
                                }`
                            }
                        >
                            <span className="relative shrink-0">
                                <Icon className="w-5 h-5" />
                                {badge && badge > 0 ? (
                                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive group-hover:hidden" />
                                ) : null}
                            </span>
                            <span className="text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                {label}
                            </span>
                            {badge && badge > 0 ? (
                                <span className="ml-auto hidden group-hover:inline-flex items-center justify-center rounded-full bg-destructive/10 text-destructive text-[10px] font-bold px-2 py-0.5">
                                    {badge > 99 ? "99+" : badge}
                                </span>
                            ) : null}
                        </NavLink>
                    ))}

                    {/* Verifications — verifiers only */}
                    {isVerifier && (
                        <NavLink
                            to="/admin/verifications"
                            className={({ isActive }) =>
                                `flex items-center gap-3 h-11 px-3 rounded-2xl transition-colors whitespace-nowrap mt-1 ${isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-foreground active:bg-muted"
                                }`
                            }
                        >
                            <ShieldCheck className="w-5 h-5 shrink-0" />
                            <span className="text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                Verifications
                            </span>
                        </NavLink>
                    )}
                </nav>
            </div>
        </aside>
    );
}
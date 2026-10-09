// src/components/Sidebar.tsx
import { NavLink } from "react-router-dom";
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
} from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { Logo } from "@/components/brand/Logo";

export function Sidebar() {
    const { user } = useSession();
    const isCaregiver = user?.role === "caregiver";

    const ITEMS = [
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
            ]
            : [{ to: "/bookings", label: "Bookings", icon: CalendarCheck }]),

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
                    {ITEMS.map(({ to, label, icon: Icon }) => (
                        <NavLink
                            key={label}
                            to={to}
                            className={({ isActive }) =>
                                `flex items-center gap-3 h-11 px-3 rounded-2xl transition-colors whitespace-nowrap ${isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-foreground active:bg-muted"
                                }`
                            }
                        >
                            <Icon className="w-5 h-5 shrink-0" />
                            <span className="text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                {label}
                            </span>
                        </NavLink>
                    ))}
                </nav>
            </div>
        </aside>
    );
}
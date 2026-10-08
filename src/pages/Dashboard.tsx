// src/pages/Dashboard.tsx
import { useSession } from "@/hooks/useSession";
import { ClientDashboard } from "@/components/dashboard/ClientDashboard";
import { CaregiverDashboard } from "@/components/dashboard/CaregiverDashboard";

function greetingFor(date: Date) {
    const h = date.getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
}

export default function Dashboard() {
    const { user, loading, error } = useSession();
    console.log("[Dashboard] state", { user, loading, error });
    if (loading) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
                <div className="h-8 w-48 rounded-2xl skeleton-shimmer" />
                <div className="h-20 rounded-2xl skeleton-shimmer" />
                <div className="grid grid-cols-2 gap-3">
                    <div className="h-20 rounded-2xl skeleton-shimmer" />
                    <div className="h-20 rounded-2xl skeleton-shimmer" />
                </div>
                <div className="h-32 rounded-2xl skeleton-shimmer" />
            </div>
        );
    }

    if (!user) return null;

    const greeting = `${greetingFor(new Date())}, ${user.display_name || "friend"}`;

    return (
        <div className="max-w-3xl mx-auto px-4 py-6">
            <h1 className="text-2xl font-black tracking-tight text-foreground mb-5">
                {greeting}
            </h1>

            {user.role === "caregiver" ? (
                <CaregiverDashboard greeting={greeting} />
            ) : (
                <ClientDashboard greeting={greeting} />
            )}
        </div>
    );
}
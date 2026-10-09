// src/pages/MyHealth.tsx
import { HeartPulse } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { DailyDiaryCard } from "@/components/daily/DailyDiaryCard";

export default function MyHealth() {
    const { user, loading } = useSession();

    if (loading) return null;
    if (!user) return null;

    // Caregivers don't have their own diary page — send them home.
    if (user.role === "caregiver") {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-6 animate-fade-in">
            <header className="mb-5">
                <div className="flex items-center gap-2 mb-1">
                    <HeartPulse className="w-6 h-6 text-primary" />
                    <h1 className="text-2xl font-black tracking-tight text-foreground">
                        My Health
                    </h1>
                </div>

            </header>

            <DailyDiaryCard clientId={user.id} defaultRangeDays={30} />
        </div>
    );
}
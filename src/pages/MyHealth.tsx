// src/pages/MyHealth.tsx
import { HeartPulse, BarChart3, ChevronRight } from "lucide-react";
import { Navigate, Link } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { DailyDiaryCard } from "@/components/daily/DailyDiaryCard";

export default function MyHealth() {
    const { user, loading } = useSession();

    if (loading) return null;
    if (!user) return null;

    if (user.role === "caregiver") {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="max-w-3xl mx-auto px-2  py-6 animate-fade-in">
            <header className="mb-5">
                <div className="flex items-center gap-2 mb-1">
                    <HeartPulse className="w-6 h-6 text-primary" />
                    <h1 className="text-2xl font-black tracking-tight text-foreground">
                        My Health
                    </h1>
                </div>
            </header>

            <Link
                to="/health/insights"
                className="block rounded-2xl bg-primary text-primary-foreground px-4 py-4 mb-3 active:scale-[0.99] transition-transform"
            >
                <div className="flex items-center gap-3">
                    <span className="h-11 w-11 rounded-2xl bg-primary-foreground/15 inline-flex items-center justify-center shrink-0">
                        <BarChart3 className="w-5 h-5" />
                    </span>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold">See your health insights</p>
                        <p className="text-xs opacity-90 mt-0.5">
                            Charts, trends, and what your data is telling us
                        </p>
                    </div>
                    <ChevronRight className="w-5 h-5 shrink-0 opacity-90" />
                </div>
            </Link>

            <DailyDiaryCard clientId={user.id} defaultRangeDays={30} />
        </div>
    );
}
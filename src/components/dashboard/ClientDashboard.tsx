// src/components/dashboard/ClientDashboard.tsx
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    Users,
    CalendarCheck,
    Search,
    ArrowRight,
    HeartPulse,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { StatCard } from "./StatCard";
import type { Connection, Booking } from "@/types/db";

export function ClientDashboard({ greeting }: { greeting: string }) {
    const { user } = useSession();

    const { data: connections = [] } = useQuery({
        queryKey: ["dashboard", "client", "connections", user?.id],
        enabled: !!user,
        staleTime: 60_000,
        queryFn: async (): Promise<Connection[]> => {
            const { data, error } = await supabase
                .from("connections")
                .select("*")
                .eq("client_id", user!.id)
                .eq("status", "accepted")
                .is("deleted_at", null)
                .order("created_at", { ascending: false })
                .limit(5);
            if (error) return [];
            return (data ?? []) as Connection[];
        },
    });

    const { data: upcoming = [] } = useQuery({
        queryKey: ["dashboard", "client", "bookings", user?.id],
        enabled: !!user,
        staleTime: 30_000,
        queryFn: async (): Promise<Booking[]> => {
            const { data, error } = await supabase
                .from("bookings")
                .select("*")
                .eq("client_id", user!.id)
                .in("status", ["paid_escrow", "accepted", "en_route", "arrived", "in_progress"])
                .order("scheduled_at", { ascending: true })
                .limit(3);
            if (error) return [];
            return (data ?? []) as Booking[];
        },
    });

    return (
        <div className="space-y-5 animate-fade-in">
            {/* ---------- Health CTA ---------- */}
            <Link
                to="/health"
                className="block rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground px-4 py-4 active:opacity-90 transition-opacity"
            >
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="w-11 h-11 rounded-full bg-primary-foreground/15 flex items-center justify-center shrink-0">
                            <HeartPulse className="w-5 h-5" />
                        </span>
                        <div className="min-w-0">
                            <p className="text-sm font-bold">
                                How are you feeling today?
                            </p>
                            <p className="text-xs opacity-85 mt-0.5">
                                Log symptoms, medications, mood, and more.
                            </p>
                        </div>
                    </div>
                    <ArrowRight className="w-5 h-5 shrink-0 opacity-90" />
                </div>
            </Link>

            {/* ---------- Stat cards ---------- */}
            <div className="grid grid-cols-2 gap-3">
                <StatCard
                    label="Caregivers"
                    value={String(connections.length)}
                    icon={<Users className="w-4 h-4 text-primary" />}
                />
                <StatCard
                    label="Upcoming"
                    value={String(upcoming.length)}
                    icon={<CalendarCheck className="w-4 h-4 text-primary" />}
                />
            </div>

            {/* ---------- Explore CTA ---------- */}
            <Link
                to="/explore"
                className="flex items-center justify-between rounded-2xl bg-card px-4 py-4 active:bg-muted transition-colors"
            >
                <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Search className="w-5 h-5 text-primary" />
                    </span>
                    <div>
                        <p className="text-sm font-bold text-foreground">Find a caregiver</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Browse nurses, therapists and more.
                        </p>
                    </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>

            {/* ---------- Upcoming visits ---------- */}
            <section>
                <h2 className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">
                    Next visits
                </h2>
                {upcoming.length === 0 ? (
                    <div className="rounded-2xl bg-card px-4 py-6 text-center">
                        <p className="text-sm text-muted-foreground">
                            No upcoming visits booked.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {upcoming.map((b) => (
                            <Link
                                key={b.id}
                                to={`/bookings`}
                                className="flex items-center justify-between rounded-2xl bg-card px-4 py-3 active:bg-muted transition-colors"
                            >
                                <div>
                                    <p className="text-sm font-semibold text-foreground capitalize">
                                        {b.status.replace(/_/g, " ")}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {b.scheduled_at
                                            ? new Date(b.scheduled_at).toLocaleString()
                                            : "Not scheduled"}
                                    </p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
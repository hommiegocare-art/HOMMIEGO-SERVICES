// src/pages/Notifications.tsx
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Bell,
    CalendarCheck,
    CreditCard,
    Users,
    Star,
    Info,
    CheckCheck,
    Activity,
    Baby,
    HeartPulse,
    Stethoscope,
    Syringe,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import type { Notification } from "@/types/db";

function iconFor(type: string | null) {
    switch (type) {
        case "booking":
            return CalendarCheck;
        case "payment":
            return CreditCard;
        case "connection":
            return Users;
        case "review":
            return Star;

        case "health_symptom":
        case "health_mood":
            return Activity;

        case "pregnancy_start":
        case "pregnancy_kick":
        case "pregnancy_contraction":
            return Baby;

        case "child_added":
            return HeartPulse;

        case "medical_exam":
            return Stethoscope;

        case "vaccine_due":
        case "vaccine_due_soon":
        case "vaccine_overdue":
            return Syringe;

        default:
            return Info;
    }
}

function toneFor(type: string | null, isRead: boolean) {
    if (isRead) {
        return { bg: "bg-muted", fg: "text-muted-foreground" };
    }
    switch (type) {
        case "vaccine_overdue":
            return { bg: "bg-destructive/10", fg: "text-destructive" };
        case "medical_exam":
            return { bg: "bg-primary/10", fg: "text-primary" };
        case "pregnancy_kick":
        case "pregnancy_contraction":
        case "pregnancy_start":
            return { bg: "bg-pink-500/10", fg: "text-pink-600" };
        case "child_added":
            return { bg: "bg-sky-500/10", fg: "text-sky-600" };
        case "vaccine_due":
        case "vaccine_due_soon":
            return { bg: "bg-amber-500/10", fg: "text-amber-600" };
        case "health_symptom":
            return { bg: "bg-primary/10", fg: "text-primary" };
        case "health_mood":
            return { bg: "bg-emerald-500/10", fg: "text-emerald-600" };
        default:
            return { bg: "bg-primary/10", fg: "text-primary" };
    }
}

function groupByDay(items: Notification[]): Array<[string, Notification[]]> {
    const groups = new Map<string, Notification[]>();
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    for (const n of items) {
        const d = new Date(n.created_at);
        let label: string;
        if (d.toDateString() === today.toDateString()) label = "Today";
        else if (d.toDateString() === yesterday.toDateString()) label = "Yesterday";
        else label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });

        const arr = groups.get(label) ?? [];
        arr.push(n);
        groups.set(label, arr);
    }
    return Array.from(groups.entries());
}

export default function Notifications() {
    const { user } = useSession();
    const qc = useQueryClient();

    const { data: rows = [], isLoading } = useQuery({
        queryKey: ["notifications", "list", user?.id],
        enabled: !!user,
        staleTime: 15_000,
        queryFn: async (): Promise<Notification[]> => {
            const { data, error } = await supabase
                .from("notifications")
                .select("*")
                .eq("user_id", user!.id)
                .order("created_at", { ascending: false })
                .limit(50);
            if (error) throw error;
            return (data ?? []) as Notification[];
        },
    });

    const markOne = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("notifications")
                .update({ is_read: true })
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["notifications"] });
        },
    });

    const markAll = useMutation({
        mutationFn: async () => {
            const { error } = await supabase
                .from("notifications")
                .update({ is_read: true })
                .eq("user_id", user!.id)
                .eq("is_read", false);
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["notifications"] });
        },
    });

    const grouped = useMemo(() => groupByDay(rows), [rows]);
    const unreadCount = rows.filter((r) => !r.is_read).length;

    if (isLoading) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
                <div className="h-8 w-40 rounded-2xl skeleton-shimmer" />
                <div className="h-20 rounded-2xl skeleton-shimmer" />
                <div className="h-20 rounded-2xl skeleton-shimmer" />
                <div className="h-20 rounded-2xl skeleton-shimmer" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-6 animate-fade-in">
            <div className="flex items-center justify-between mb-5">
                <h1 className="text-2xl font-black tracking-tight text-foreground">
                    Notifications
                </h1>
                {unreadCount > 0 && (
                    <button
                        onClick={() => markAll.mutate()}
                        disabled={markAll.isPending}
                        className="h-11 px-3 rounded-2xl text-sm font-semibold text-primary active:bg-muted transition-colors disabled:opacity-60 inline-flex items-center gap-1.5"
                    >
                        <CheckCheck className="w-4 h-4" />
                        Mark all read
                    </button>
                )}
            </div>

            {rows.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="space-y-6">
                    {grouped.map(([label, items]) => (
                        <section key={label}>
                            <h2 className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">
                                {label}
                            </h2>
                            <div className="space-y-2">
                                {items.map((n) => (
                                    <NotificationRow
                                        key={n.id}
                                        n={n}
                                        onOpen={() => {
                                            if (!n.is_read) markOne.mutate(n.id);
                                        }}
                                    />
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}
        </div>
    );
}

function NotificationRow({
    n,
    onOpen,
}: {
    n: Notification;
    onOpen: () => void;
}) {
    const Icon = iconFor(n.type);
    const tone = toneFor(n.type, n.is_read);

    const content = (
        <div className="flex items-start gap-3">
            <span
                className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center ${tone.bg}`}
            >
                <Icon className={`w-5 h-5 ${tone.fg}`} />
            </span>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p
                        className={`text-sm truncate ${n.is_read ? "font-medium text-muted-foreground" : "font-bold text-foreground"
                            }`}
                    >
                        {n.title}
                    </p>
                    {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    )}
                </div>
                {n.body && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {n.body}
                    </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                    {new Date(n.created_at).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </p>
            </div>
        </div>
    );

    if (n.link) {
        return (
            <Link
                to={n.link}
                onClick={onOpen}
                className="block rounded-2xl bg-card px-4 py-3 active:bg-muted transition-colors"
            >
                {content}
            </Link>
        );
    }

    return (
        <button
            onClick={onOpen}
            className="w-full text-left rounded-2xl bg-card px-4 py-3 active:bg-muted transition-colors"
        >
            {content}
        </button>
    );
}

function EmptyState() {
    return (
        <div className="py-16 text-center animate-fade-in">
            <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
                You're all caught up.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
                New activity will show up here.
            </p>
        </div>
    );
}
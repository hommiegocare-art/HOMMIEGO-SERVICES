// src/components/notifications/NotificationToastHost.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Bell,
    CalendarCheck,
    CreditCard,
    Users,
    Star,
    Info,
    Activity,
    Baby,
    HeartPulse,
    Stethoscope,
    Syringe,
    X,
    MessageCircle,
} from "lucide-react";
import type { Notification } from "@/types/db";
import { VerifiedBadge } from "@/components/brand/VerifiedBadge";

/* ============================================================
 * Event bus
 * ============================================================ */
type Listener<T> = (n: T) => void;

export type ChatToast = {
    connectionId: string;
    senderDisplayName: string;
    senderAvatarUrl?: string | null;
    senderVerified?: boolean;
    senderRole?: "client" | "caregiver" | "admin";
    preview: string;
    link: string;
};

const notificationListeners = new Set<Listener<Notification>>();
const chatListeners = new Set<Listener<ChatToast>>();

export function pushNotificationToast(n: Notification) {
    notificationListeners.forEach((l) => l(n));
}

export function pushChatToast(t: ChatToast) {
    chatListeners.forEach((l) => l(t));
}

/* ============================================================
 * Icon / tone / label helpers
 * ============================================================ */
function iconFor(type: string | null) {
    switch (type) {
        case "booking": return CalendarCheck;
        case "payment": return CreditCard;
        case "connection": return Users;
        case "review": return Star;
        case "health_symptom":
        case "health_mood": return Activity;
        case "pregnancy_start":
        case "pregnancy_kick":
        case "pregnancy_contraction": return Baby;
        case "child_added": return HeartPulse;
        case "medical_exam": return Stethoscope;
        case "vaccine_due":
        case "vaccine_due_soon":
        case "vaccine_overdue": return Syringe;
        default: return Info;
    }
}

function toneFor(type: string | null) {
    switch (type) {
        case "vaccine_overdue":
            return { bg: "bg-destructive/15", fg: "text-destructive" };
        case "medical_exam":
            return { bg: "bg-primary/15", fg: "text-primary" };
        case "pregnancy_kick":
        case "pregnancy_contraction":
        case "pregnancy_start":
            return { bg: "bg-pink-500/15", fg: "text-pink-600" };
        case "child_added":
            return { bg: "bg-sky-500/15", fg: "text-sky-600" };
        case "vaccine_due":
        case "vaccine_due_soon":
            return { bg: "bg-amber-500/15", fg: "text-amber-600" };
        case "health_mood":
            return { bg: "bg-emerald-500/15", fg: "text-emerald-600" };
        default:
            return { bg: "bg-primary/15", fg: "text-primary" };
    }
}

function labelFor(type: string | null): string {
    switch (type) {
        case "booking": return "Booking";
        case "payment": return "Payment";
        case "connection": return "Connection";
        case "review": return "Review";
        case "health_symptom": return "Health";
        case "health_mood": return "Mood";
        case "pregnancy_start": return "Pregnancy";
        case "pregnancy_kick": return "Baby movement";
        case "pregnancy_contraction": return "Contraction";
        case "child_added": return "Child";
        case "medical_exam": return "Medical exam";
        case "vaccine_due": return "Vaccine due";
        case "vaccine_due_soon": return "Vaccine due soon";
        case "vaccine_overdue": return "Vaccine overdue";
        default: return "Update";
    }
}

/* ============================================================
 * Unified toast item
 * ============================================================ */
type Item =
    | { kind: "notification"; id: string; n: Notification }
    | { kind: "chat"; id: string; t: ChatToast };

type ToastItem = {
    key: string;
    item: Item;
    leaving?: boolean;
};

const AUTO_DISMISS_MS = 6000;
const MAX_VISIBLE = 3;

/* ============================================================
 * Card (used on both mobile and desktop — same look, different
 * positioning via the container)
 * ============================================================ */
function ToastCard({
    toast,
    onClose,
    onOpen,
}: {
    toast: ToastItem;
    onClose: () => void;
    onOpen: () => void;
}) {
    let Icon: React.ComponentType<{ className?: string }>;
    let tone: { bg: string; fg: string };
    let title: string;
    let subtitle: string | null = null;
    let body: string | null;
    let avatarUrl: string | null = null;
    let verified = false;

    if (toast.item.kind === "notification") {
        const n = toast.item.n;
        Icon = iconFor(n.type);
        tone = toneFor(n.type);
        title = n.title;
        subtitle = labelFor(n.type);
        body = n.body;
        avatarUrl = (n as any).avatar_url ?? null;
    } else {
        const t = toast.item.t;
        Icon = MessageCircle;
        tone = { bg: "bg-primary/15", fg: "text-primary" };
        title = t.senderDisplayName;
        subtitle =
            t.senderRole === "caregiver"
                ? "Caregiver"
                : t.senderRole === "client"
                    ? "Client"
                    : t.senderRole === "admin"
                        ? "Support"
                        : "New message";
        body = t.preview;
        avatarUrl = t.senderAvatarUrl ?? null;
        verified = !!t.senderVerified;
    }

    return (
        <div
            role="status"
            className={[
                "pointer-events-auto",
                // Mobile: full width edge-to-edge strip, no radius
                "w-full sm:w-[calc(100vw-1.5rem)] sm:max-w-sm sm:rounded-2xl",
                "bg-card/95 backdrop-blur-md",
                // Mobile: bottom hairline. Desktop: no border, just shadow.
                "border-b border-border/60 sm:border-b-0",
                "shadow-[0_8px_24px_rgba(0,0,0,0.08)]",
                "transition-all duration-300 ease-out will-change-transform",
                toast.leaving
                    ? // Mobile slides up out, desktop slides right out
                    "opacity-0 -translate-y-3 sm:translate-y-0 sm:translate-x-4"
                    : "opacity-100 translate-y-0 sm:translate-x-0",
            ].join(" ")}
        >
            <button
                onClick={onOpen}
                className="w-full text-left flex items-start gap-3 px-4 py-3.5 sm:rounded-2xl active:bg-muted/60 transition-colors"
            >
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt=""
                        className="w-10 h-10 rounded-full shrink-0 object-cover bg-muted"
                    />
                ) : (
                    <span
                        className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center ${tone.bg}`}
                    >
                        <Icon className={`w-5 h-5 ${tone.fg}`} />
                    </span>
                )}

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                            {title}
                        </p>
                        {verified && (
                            <VerifiedBadge show className="w-4 h-4 shrink-0" />
                        )}
                    </div>

                    {subtitle && (
                        <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
                            {subtitle}
                        </p>
                    )}

                    {body && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-snug">
                            {body}
                        </p>
                    )}
                </div>

                <span
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    className="shrink-0 w-8 h-8 -m-1 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                    aria-label="Dismiss"
                >
                    <X className="w-4 h-4" />
                </span>
            </button>
        </div>
    );
}

/* ============================================================
 * Host
 * ============================================================ */
export function NotificationToastHost() {
    const [items, setItems] = useState<ToastItem[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const onNotif: Listener<Notification> = (n) => {
            setItems((prev) =>
                [
                    {
                        key: `n-${n.id}`,
                        item: { kind: "notification", id: n.id, n },
                    },
                    ...prev,
                ].slice(0, MAX_VISIBLE),
            );
        };

        const onChat: Listener<ChatToast> = (t) => {
            setItems((prev) =>
                [
                    {
                        key: `c-${t.connectionId}-${Date.now()}`,
                        item: { kind: "chat", id: t.connectionId, t },
                    },
                    ...prev,
                ].slice(0, MAX_VISIBLE),
            );
        };

        notificationListeners.add(onNotif);
        chatListeners.add(onChat);
        return () => {
            notificationListeners.delete(onNotif);
            chatListeners.delete(onChat);
        };
    }, []);

    useEffect(() => {
        if (items.length === 0) return;
        const timers = items.map((t) =>
            setTimeout(() => dismiss(t.key), AUTO_DISMISS_MS),
        );
        return () => timers.forEach(clearTimeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items.map((i) => i.key).join(",")]);

    function dismiss(key: string) {
        setItems((prev) =>
            prev.map((i) => (i.key === key ? { ...i, leaving: true } : i)),
        );
        setTimeout(() => {
            setItems((prev) => prev.filter((i) => i.key !== key));
        }, 280);
    }

    function open(toast: ToastItem) {
        if (toast.item.kind === "notification") {
            if (toast.item.n.link) navigate(toast.item.n.link);
        } else {
            navigate(toast.item.t.link);
        }
        dismiss(toast.key);
    }

    if (items.length === 0) return null;

    return (
        <>
            {/* Container: mobile = top edge-to-edge drawer; desktop = bottom-right stack */}
            <div
                aria-live="polite"
                aria-atomic="false"
                className={[
                    "fixed z-[100] flex flex-col",
                    // Mobile: top, edge-to-edge, below safe area
                    "top-0 left-0 right-0 pt-[env(safe-area-inset-top)]",
                    // Desktop: bottom-right card stack
                    "sm:top-auto sm:left-auto sm:right-4 sm:bottom-4 sm:pt-0",
                    "sm:gap-2 sm:items-end",
                    // Mobile slide-down animation
                    "animate-[slideDown_280ms_cubic-bezier(0.22,1,0.36,1)]",
                    "sm:animate-[fadeInUp_280ms_cubic-bezier(0.22,1,0.36,1)]",
                ].join(" ")}
            >
                {items.map((toast) => (
                    <ToastCard
                        key={toast.key}
                        toast={toast}
                        onClose={() => dismiss(toast.key)}
                        onOpen={() => open(toast)}
                    />
                ))}
            </div>

            <style>{`
                @keyframes slideDown {
                    from { transform: translateY(-100%); opacity: 0; }
                    to   { transform: translateY(0);     opacity: 1; }
                }
                @keyframes fadeInUp {
                    from { transform: translateY(8px); opacity: 0; }
                    to   { transform: translateY(0);   opacity: 1; }
                }
            `}</style>
        </>
    );
}
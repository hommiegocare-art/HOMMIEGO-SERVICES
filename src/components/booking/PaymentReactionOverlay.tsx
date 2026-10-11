import { useEffect, useMemo, useState } from "react";
import {
    Heart,
    Sparkles,
    Star,
    HandHeart,
    Stethoscope,
    ShieldCheck,
} from "lucide-react";

type Reaction = {
    id: number;
    x: number;        // vw %
    size: number;     // px
    delay: number;    // ms
    duration: number; // ms
    drift: number;    // px horizontal drift
    rotate: number;   // deg
    kind: "heart" | "sparkle" | "star" | "hand" | "shield" | "care";
    hue: number;      // color index
};

const KINDS: Reaction["kind"][] = ["heart", "sparkle", "star", "hand", "shield", "care"];
const COLORS = ["#ef4444", "#f97316", "#ec4899", "#8b5cf6", "#06b6d4", "#22c55e", "#eab308"];

function buildReactions(count: number): Reaction[] {
    return Array.from({ length: count }, (_, i) => {
        const kind = KINDS[i % KINDS.length];
        return {
            id: i,
            x: Math.random() * 100,
            size: 22 + Math.random() * 30,
            delay: Math.random() * 900,
            duration: 2200 + Math.random() * 1600,
            drift: (Math.random() - 0.5) * 120,
            rotate: (Math.random() - 0.5) * 60,
            kind,
            hue: Math.floor(Math.random() * COLORS.length),
        };
    });
}

function ReactionIcon({ kind, className }: { kind: Reaction["kind"]; className?: string }) {
    switch (kind) {
        case "heart": return <Heart className={className} fill="currentColor" />;
        case "sparkle": return <Sparkles className={className} fill="currentColor" />;
        case "star": return <Star className={className} fill="currentColor" />;
        case "hand": return <HandHeart className={className} />;
        case "shield": return <ShieldCheck className={className} />;
        case "care": return <Stethoscope className={className} />;
    }
}

export function PaymentReactionOverlay({
    open,
    onDone,
    amountLabel,
}: {
    open: boolean;
    onDone: () => void;
    amountLabel?: string;
}) {
    const reactions = useMemo(() => buildReactions(28), [open]);
    const [phase, setPhase] = useState<"in" | "hold" | "out">("in");

    useEffect(() => {
        if (!open) return;
        setPhase("in");
        const t1 = setTimeout(() => setPhase("hold"), 350);
        const t2 = setTimeout(() => setPhase("out"), 3200);
        const t3 = setTimeout(() => onDone(), 3750);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
        };
    }, [open, onDone]);

    if (!open) return null;

    return (
        <div
            className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-500 ${phase === "out" ? "opacity-0" : "opacity-100"
                }`}
            aria-live="polite"
            role="status"
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />

            {/* Radial burst ring */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="reaction-ring absolute h-40 w-40 rounded-full border-2 border-primary/40" />
                <span className="reaction-ring absolute h-40 w-40 rounded-full border border-primary/30 [animation-delay:220ms]" />
                <span className="reaction-ring absolute h-40 w-40 rounded-full border border-primary/20 [animation-delay:440ms]" />
            </div>

            {/* Floating reactions */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                {reactions.map((r) => (
                    <span
                        key={r.id}
                        className="reaction-float absolute bottom-[-10%]"
                        style={{
                            left: `${r.x}%`,
                            color: COLORS[r.hue],
                            animationDelay: `${r.delay}ms`,
                            animationDuration: `${r.duration}ms`,
                            ["--drift" as any]: `${r.drift}px`,
                            ["--rot" as any]: `${r.rotate}deg`,
                        }}
                    >
                        <ReactionIcon kind={r.kind} className="h-7 w-7 drop-shadow-lg" />
                    </span>
                ))}
            </div>

            {/* Center card */}
            <div
                className={`relative flex flex-col items-center gap-5 px-8 text-center ${phase === "in" ? "reaction-pop" : "reaction-pop-settled"
                    }`}
            >
                {/* Custom smart spinner: rotating care badge */}
                <div className="relative h-28 w-28">
                    <span className="reaction-spin-slow absolute inset-0 rounded-full border-4 border-dashed border-primary/30" />
                    <span className="reaction-spin-reverse absolute inset-2 rounded-full border-4 border-primary/60 border-t-transparent" />
                    <span className="absolute inset-4 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                        <HandHeart className="h-10 w-10" />
                    </span>
                    <Sparkles className="reaction-twinkle absolute -right-1 -top-1 h-5 w-5 text-yellow-400" />
                    <Heart
                        className="reaction-twinkle absolute -left-1 bottom-0 h-5 w-5 text-pink-500 [animation-delay:300ms]"
                        fill="currentColor"
                    />
                </div>

                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight">Booking confirmed!</h2>
                    <p className="text-sm text-muted-foreground">
                        Payment received. Your caregiver has been notified.
                    </p>
                    {amountLabel && (
                        <p className="pt-1 text-lg font-semibold text-primary">{amountLabel}</p>
                    )}
                </div>

                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Funds held in escrow
                </div>
            </div>
        </div>
    );
}
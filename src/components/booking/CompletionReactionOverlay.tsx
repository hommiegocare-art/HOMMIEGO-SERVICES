import { useEffect, useMemo, useRef, useState } from "react";
import {
    CheckCircle2,
    Trophy,
    Sparkles,
    PartyPopper,
    ShieldCheck,
    Heart,
} from "lucide-react";

type ConfettiPiece = {
    id: number;
    x: number;         // vw %
    delay: number;     // ms
    duration: number;  // ms
    drift: number;     // px
    spin: number;      // deg
    size: number;      // px
    color: string;
    shape: "rect" | "circle" | "ribbon";
};

const CONFETTI_COLORS = [
    "#ef4444", // red
    "#f97316", // orange
    "#eab308", // yellow
    "#22c55e", // green
    "#06b6d4", // cyan
    "#8b5cf6", // violet
    "#ec4899", // pink
];

function buildConfetti(count: number): ConfettiPiece[] {
    return Array.from({ length: count }, (_, i) => {
        const shapeRoll = Math.random();
        const shape: ConfettiPiece["shape"] =
            shapeRoll < 0.5 ? "rect" : shapeRoll < 0.8 ? "circle" : "ribbon";
        return {
            id: i,
            x: Math.random() * 100,
            delay: Math.random() * 700,
            duration: 2600 + Math.random() * 2000,
            drift: (Math.random() - 0.5) * 200,
            spin: (Math.random() - 0.5) * 1440,
            size: 8 + Math.random() * 10,
            color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
            shape,
        };
    });
}

/** Try to vibrate, silently ignore failures (iOS Safari doesn't support it). */
function buzz(pattern: number | number[]) {
    try {
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
            // @ts-expect-error - vibrate exists on most mobile browsers
            navigator.vibrate(pattern);
        }
    } catch {
        /* noop */
    }
}

export function CompletionReactionOverlay({
    open,
    onDone,
    role,
}: {
    open: boolean;
    onDone: () => void;
    role: "client" | "caregiver";
}) {
    const confetti = useMemo(() => buildConfetti(80), [open]);
    const [phase, setPhase] = useState<"in" | "hold" | "out">("in");
    const firedRef = useRef(false);

    useEffect(() => {
        if (!open) {
            firedRef.current = false;
            return;
        }

        // 📳 Vibration pattern: short-short-long-short … feels like a cheer
        if (!firedRef.current) {
            firedRef.current = true;
            buzz([40, 60, 40, 60, 120, 80, 40]);
        }

        setPhase("in");
        const t1 = setTimeout(() => setPhase("hold"), 400);
        const t2 = setTimeout(() => setPhase("out"), 3600);
        const t3 = setTimeout(() => onDone(), 4150);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
        };
    }, [open, onDone]);

    if (!open) return null;

    const isClient = role === "client";

    return (
        <div
            className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-500 ${phase === "out" ? "opacity-0" : "opacity-100"
                }`}
            aria-live="polite"
            role="status"
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-background/85 backdrop-blur-md" />

            {/* Radial warm glow */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="completion-glow absolute h-72 w-72 rounded-full" />
            </div>

            {/* Confetti */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                {confetti.map((c) => (
                    <span
                        key={c.id}
                        className={`completion-confetti absolute top-[-10%] ${c.shape === "circle"
                            ? "rounded-full"
                            : c.shape === "ribbon"
                                ? "rounded-[2px]"
                                : "rounded-[2px]"
                            }`}
                        style={{
                            left: `${c.x}%`,
                            width: c.shape === "ribbon" ? `${c.size / 3}px` : `${c.size}px`,
                            height: c.shape === "ribbon" ? `${c.size * 1.8}px` : `${c.size}px`,
                            backgroundColor: c.color,
                            animationDelay: `${c.delay}ms`,
                            animationDuration: `${c.duration}ms`,
                            ["--drift" as any]: `${c.drift}px`,
                            ["--spin" as any]: `${c.spin}deg`,
                        }}
                    />
                ))}
            </div>

            {/* Center card */}
            <div
                className={`relative flex flex-col items-center gap-5 px-8 text-center ${phase === "in" ? "completion-pop" : "completion-pop-settled"
                    }`}
            >
                {/* Trophy badge with burst rays */}
                <div className="relative h-32 w-32">
                    <span className="completion-rays absolute inset-0" />
                    <span className="completion-ring absolute inset-0 rounded-full border-4 border-emerald-400/40" />
                    <span className="completion-ring absolute inset-0 rounded-full border-2 border-emerald-400/60 [animation-delay:260ms]" />
                    <span className="absolute inset-3 flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-2xl">
                        <Trophy className="h-12 w-12" />
                    </span>
                    <Sparkles className="completion-twinkle absolute -right-2 -top-2 h-6 w-6 text-yellow-400" />
                    <PartyPopper className="completion-twinkle absolute -left-2 top-3 h-6 w-6 text-pink-500 [animation-delay:200ms]" />
                    <Heart
                        className="completion-twinkle absolute -bottom-1 right-2 h-5 w-5 text-rose-500 [animation-delay:400ms]"
                        fill="currentColor"
                    />
                </div>

                <div className="space-y-2">
                    <h2 className="text-3xl font-black tracking-tight">
                        {isClient ? "Visit complete!" : "Job well done!"}
                    </h2>
                    <p className="max-w-xs text-sm text-muted-foreground">
                        {isClient
                            ? "Thanks for using the service. We hope the visit went well — please rate your caregiver."
                            : "You've completed this visit. Funds are being released to your wallet."}
                    </p>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {isClient
                        ? "Escrow released to caregiver"
                        : "Payout initiated to your account"}
                </div>

                <div className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3" />
                    Booking closed successfully
                </div>
            </div>
        </div>
    );
}
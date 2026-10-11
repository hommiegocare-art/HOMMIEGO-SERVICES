// src/components/booking/QRDisplay.tsx
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, Clock } from "lucide-react";

/**
 * Group a 6-digit token as "123 456" for readability when read aloud.
 * Anything else is returned as-is so a differently-shaped token
 * (hex, longer numeric, etc.) still displays correctly.
 */
function formatToken(t: string): string {
    if (t.length === 6) return `${t.slice(0, 3)} ${t.slice(3)}`;
    return t;
}

function humanizeRemaining(msRemaining: number): string {
    if (msRemaining <= 0) return "Expired";
    const h = Math.floor(msRemaining / 3_600_000);
    const m = Math.floor((msRemaining % 3_600_000) / 60_000);
    const s = Math.floor((msRemaining % 60_000) / 1000);
    if (h > 0) return `${h}h ${m}m left`;
    if (m > 0) return `${m}m ${s}s left`;
    return `${s}s left`;
}

export function QRDisplay({
    token,
    expiresAt,
}: {
    token: string;
    expiresAt: string;
}) {
    const [remaining, setRemaining] = useState<string>("");

    useEffect(() => {
        function tick() {
            const diff = new Date(expiresAt).getTime() - Date.now();
            setRemaining(humanizeRemaining(diff));
        }
        tick();
        // 1s cadence so the countdown actually ticks down; cheap operation.
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [expiresAt]);

    const expired = remaining === "Expired";

    return (
        <div className="rounded-2xl bg-card px-4 py-5 text-center animate-fade-in">
            <QrCode className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-sm font-bold text-foreground">
                Show this to your caregiver on arrival
            </p>
            <p className="text-xs text-muted-foreground mt-1">
                They'll scan it, or type the code below.
            </p>

            {/* QR code — dims if the token has expired so it's visually
                clear that it can no longer be used. */}
            <div
                className={`mt-4 inline-flex p-3 rounded-2xl bg-background transition-opacity ${expired ? "opacity-30" : "opacity-100"
                    }`}
            >
                <QRCodeSVG
                    value={token}
                    size={192}
                    level="M"
                    bgColor="transparent"
                    fgColor="currentColor"
                    className="text-foreground"
                />
            </div>

            <p className="mt-3 text-xs text-muted-foreground inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {remaining}
            </p>

            {/* Fallback code — for phones with a broken camera, desktop
                caregivers, or when the QR is too small to scan. */}
            <div className="mt-5 rounded-2xl bg-muted px-4 py-4">
                <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
                    {expired ? "Code expired" : "Can't scan? Read this out"}
                </p>
                <p
                    className={`mt-2 font-mono text-3xl font-black tracking-[0.2em] text-center ${expired ? "text-muted-foreground line-through" : "text-foreground"
                        }`}
                >
                    {formatToken(token)}
                </p>
                <p className="mt-2 text-[11px] text-muted-foreground text-center">
                    {expired
                        ? "Ask the client to refresh the page for a new code."
                        : "Your caregiver can type this on the next screen."}
                </p>
            </div>
        </div>
    );
}
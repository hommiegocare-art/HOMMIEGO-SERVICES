// src/components/booking/QRDisplay.tsx
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, Clock } from "lucide-react";

export function QRDisplay({ token, expiresAt }: { token: string; expiresAt: string }) {
    const [remaining, setRemaining] = useState<string>("");

    useEffect(() => {
        function tick() {
            const diff = new Date(expiresAt).getTime() - Date.now();
            if (diff <= 0) {
                setRemaining("Expired");
                return;
            }
            const h = Math.floor(diff / 3_600_000);
            const m = Math.floor((diff % 3_600_000) / 60_000);
            setRemaining(h > 0 ? `${h}h ${m}m left` : `${m}m left`);
        }
        tick();
        const t = setInterval(tick, 30_000);
        return () => clearInterval(t);
    }, [expiresAt]);

    return (
        <div className="rounded-2xl bg-card px-4 py-5 text-center animate-fade-in">
            <QrCode className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-sm font-bold text-foreground">
                Show this to your caregiver on arrival
            </p>
            <p className="text-xs text-muted-foreground mt-1">
                They'll scan it to confirm they've reached you.
            </p>

            <div className="mt-4 inline-flex p-3 rounded-2xl bg-background">
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

            <details className="mt-3">
                <summary className="text-xs text-muted-foreground cursor-pointer">
                    Can't scan? Show this code
                </summary>
                <p className="mt-2 font-mono text-xs break-all text-foreground bg-muted rounded-2xl px-3 py-2">
                    {token}
                </p>
            </details>
        </div>
    );
}
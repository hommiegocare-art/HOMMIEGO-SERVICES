// src/components/AppUpdateBanner.tsx
import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { subscribeUpdate, applyUpdate } from "@/lib/pwaUpdate";

export function AppUpdateBanner() {
    const [visible, setVisible] = useState(false);
    const [applying, setApplying] = useState(false);

    useEffect(() => {
        const unsubscribe = subscribeUpdate(() => setVisible(true));
        return unsubscribe;
    }, []);

    const onReload = () => {
        setApplying(true);
        // Let the browser apply and reload. Never returns.
        applyUpdate(true);
    };

    if (!visible) return null;

    return (
        <div
            role="status"
            aria-live="polite"
            className="fixed left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-1.5rem)] max-w-md bottom-20 lg:bottom-6"
        >
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-lg">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
                    <Download className="h-4 w-4" />
                </span>

                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">New version available</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        Reload to get the latest features and fixes.
                    </p>
                </div>

                <button
                    onClick={onReload}
                    disabled={applying}
                    className="h-9 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-semibold active:opacity-90 disabled:opacity-60"
                >
                    {applying ? "Reloading…" : "Reload"}
                </button>

                <button
                    onClick={() => setVisible(false)}
                    aria-label="Dismiss"
                    className="h-9 w-9 shrink-0 rounded-full inline-flex items-center justify-center text-muted-foreground hover:bg-muted"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
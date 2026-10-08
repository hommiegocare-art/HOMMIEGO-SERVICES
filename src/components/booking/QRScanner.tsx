// src/components/booking/QRScanner.tsx
import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Loader2, X, CheckCircle2, AlertTriangle, CameraOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type State =
    | { kind: "scanning" }
    | { kind: "verifying" }
    | { kind: "success" }
    | { kind: "error"; message: string };

export function QRScanner({
    onClose,
    onSuccess,
}: {
    onClose: () => void;
    onSuccess: () => void;
}) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const controlsRef = useRef<{ stop: () => void } | null>(null);
    const handledRef = useRef(false);
    const [state, setState] = useState<State>({ kind: "scanning" });

    useEffect(() => {
        const reader = new BrowserMultiFormatReader();
        let cancelled = false;

        async function start() {
            if (!videoRef.current) return;
            try {
                const controls = await reader.decodeFromVideoDevice(
                    undefined,
                    videoRef.current,
                    async (result) => {
                        if (!result || handledRef.current) return;
                        handledRef.current = true;
                        setState({ kind: "verifying" });

                        const token = result.getText().trim();
                        const { data, error } = await supabase.rpc("consume_qr_token", {
                            p_token: token,
                        });

                        if (error) {
                            setState({ kind: "error", message: error.message });
                            handledRef.current = false;
                            return;
                        }

                        const payload = data as { ok: boolean; error?: string } | null;
                        if (!payload?.ok) {
                            setState({
                                kind: "error",
                                message: (payload?.error ?? "verification_failed").replace(/_/g, " "),
                            });
                            handledRef.current = false;
                            return;
                        }

                        setState({ kind: "success" });
                        setTimeout(() => {
                            onSuccess();
                            onClose();
                        }, 1200);
                    }
                );

                if (cancelled) {
                    controls.stop();
                } else {
                    controlsRef.current = controls;
                }
            } catch (err: any) {
                const msg = String(err?.message ?? err);
                if (msg.toLowerCase().includes("permission")) {
                    setState({ kind: "error", message: "Camera permission denied." });
                } else if (msg.toLowerCase().includes("notfound")) {
                    setState({ kind: "error", message: "No camera found on this device." });
                } else {
                    setState({ kind: "error", message: "Could not start camera." });
                }
            }
        }

        start();
        return () => {
            cancelled = true;
            controlsRef.current?.stop();
        };
    }, [onClose, onSuccess]);

    return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
            <div className="h-14 flex items-center justify-between px-4">
                <button
                    onClick={onClose}
                    className="h-11 w-11 rounded-full active:bg-muted transition-colors flex items-center justify-center"
                    aria-label="Close scanner"
                >
                    <X className="w-5 h-5 text-foreground" />
                </button>
                <p className="text-sm font-bold text-foreground">Scan QR</p>
                <span className="w-11" />
            </div>

            <div className="flex-1 relative overflow-hidden">
                <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover"
                    muted
                    playsInline
                />

                {state.kind === "scanning" && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-64 h-64 rounded-2xl border-2 border-primary/70" />
                    </div>
                )}

                {state.kind === "verifying" && (
                    <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <p className="text-sm text-foreground font-semibold">Verifying…</p>
                    </div>
                )}

                {state.kind === "success" && (
                    <div className="absolute inset-0 bg-background flex flex-col items-center justify-center gap-3 animate-fade-in">
                        <CheckCircle2 className="w-14 h-14 text-success" />
                        <p className="text-base font-black text-foreground">Arrival confirmed</p>
                    </div>
                )}

                {state.kind === "error" && (
                    <div className="absolute inset-0 bg-background flex flex-col items-center justify-center gap-3 px-8 text-center animate-fade-in">
                        <AlertTriangle className="w-12 h-12 text-destructive" />
                        <p className="text-base font-black text-foreground">Scan failed</p>
                        <p className="text-sm text-muted-foreground capitalize">
                            {state.message}
                        </p>
                        <button
                            onClick={() => {
                                handledRef.current = false;
                                setState({ kind: "scanning" });
                            }}
                            className="mt-3 h-11 px-5 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold"
                        >
                            Try again
                        </button>
                    </div>
                )}
            </div>

            <div className="px-4 py-5 text-center">
                <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                    <CameraOff className="w-3 h-3" />
                    Point at the client's QR code
                </p>
            </div>
        </div>
    );
}
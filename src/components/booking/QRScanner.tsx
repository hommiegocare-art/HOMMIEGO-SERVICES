// src/components/booking/QRScanner.tsx
import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Loader2, X, CheckCircle2, AlertTriangle, CameraOff, Keyboard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type State =
    | { kind: "scanning" }
    | { kind: "manual" }
    | { kind: "verifying"; from: "scan" | "manual" }
    | { kind: "success" }
    | { kind: "error"; message: string; from: "scan" | "manual" };

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
    const [manualCode, setManualCode] = useState("");

    const lastModeRef = useRef<"scan" | "manual">("scan");

    const verify = async (token: string, from: "scan" | "manual") => {
        const trimmed = token.trim();
        if (!trimmed) return;

        setState({ kind: "verifying", from });

        const { data, error } = await supabase.rpc("consume_qr_token", {
            p_token: trimmed,
        });

        if (error) {
            setState({ kind: "error", message: error.message, from });
            return;
        }

        const payload = data as { ok: boolean; error?: string } | null;
        if (!payload?.ok) {
            setState({
                kind: "error",
                message: (payload?.error ?? "verification_failed").replace(/_/g, " "),
                from,
            });
            return;
        }

        setState({ kind: "success" });
        setTimeout(() => {
            onSuccess();
            onClose();
        }, 1200);
    };

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
                        lastModeRef.current = "scan";
                        await verify(result.getText(), "scan");
                        handledRef.current = false;
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
                    setState({ kind: "error", message: "Camera permission denied.", from: "scan" });
                } else if (msg.toLowerCase().includes("notfound")) {
                    setState({ kind: "error", message: "No camera found on this device.", from: "scan" });
                } else {
                    setState({ kind: "error", message: "Could not start camera.", from: "scan" });
                }
            }
        }

        start();
        return () => {
            cancelled = true;
            controlsRef.current?.stop();
        };
    }, []);

    const inManual = state.kind === "manual";
    const inVerifying = state.kind === "verifying";
    const inSuccess = state.kind === "success";
    const inError = state.kind === "error";

    return (
        <div className="fixed inset-x-0 top-0 z-50 h-[100dvh] bg-background flex flex-col">
            {/* Header */}
            <div className="h-14 flex items-center justify-between px-4 shrink-0">
                <button
                    onClick={onClose}
                    className="h-11 w-11 rounded-full active:bg-muted transition-colors flex items-center justify-center"
                    aria-label="Close scanner"
                >
                    <X className="w-5 h-5 text-foreground" />
                </button>
                <p className="text-sm font-bold text-foreground">
                    {inManual ? "Enter code" : "Scan QR"}
                </p>
                <span className="w-11" />
            </div>

            {/* Body */}
            <div className="flex-1 relative overflow-hidden min-h-0">
                <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover"
                    muted
                    playsInline
                />
                {state.kind === "scanning" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 pb-12 pointer-events-none">
                        <div className="w-64 h-64 rounded-2xl border-2 border-primary/70" />

                        <button
                            onClick={() => setState({ kind: "manual" })}
                            className="pointer-events-auto text-xs text-white/90 font-semibold inline-flex items-center gap-1.5 underline drop-shadow-md"
                        >
                            <Keyboard className="w-3 h-3" />
                            Enter code manually instead
                        </button>
                    </div>
                )}
                {inManual && (
                    <div className="absolute inset-0 bg-background flex flex-col items-center justify-center gap-6 px-8 animate-fade-in">
                        <p className="text-sm text-muted-foreground text-center max-w-xs">
                            Ask the client to read you the 6-digit code shown on their screen.
                        </p>
                        <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            autoComplete="one-time-code"
                            maxLength={6}
                            value={manualCode}
                            onChange={(e) => {
                                const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
                                setManualCode(digits);
                            }}
                            placeholder="000000"
                            autoFocus
                            className="w-64 text-center font-mono text-4xl font-black tracking-[0.3em] bg-muted rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button
                            onClick={() => {
                                lastModeRef.current = "manual";
                                void verify(manualCode, "manual");
                            }}
                            disabled={manualCode.length !== 6}
                            className="h-12 px-8 rounded-2xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50 active:opacity-90 transition-opacity"
                        >
                            Confirm arrival
                        </button>
                    </div>
                )}

                {inVerifying && (
                    <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <p className="text-sm text-foreground font-semibold">Verifying…</p>
                    </div>
                )}

                {inSuccess && (
                    <div className="absolute inset-0 bg-background flex flex-col items-center justify-center gap-3 animate-fade-in">
                        <CheckCircle2 className="w-14 h-14 text-success" />
                        <p className="text-base font-black text-foreground">Arrival confirmed</p>
                    </div>
                )}

                {inError && state.kind === "error" && (
                    <div className="absolute inset-0 bg-background flex flex-col items-center justify-center gap-3 px-8 text-center animate-fade-in">
                        <AlertTriangle className="w-12 h-12 text-destructive" />
                        <p className="text-base font-black text-foreground">
                            {state.from === "manual" ? "Code didn't work" : "Scan failed"}
                        </p>
                        <p className="text-sm text-muted-foreground capitalize">
                            {state.message}
                        </p>
                        <button
                            onClick={() => {
                                handledRef.current = false;
                                setManualCode("");
                                setState({ kind: state.from === "manual" ? "manual" : "scanning" });
                            }}
                            className="mt-3 h-11 px-5 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold"
                        >
                            Try again
                        </button>
                        {/* Escape hatch for camera failures — jumps straight to
                            manual entry, no need to hunt for the footer link. */}
                        {state.from === "scan" && (
                            <button
                                onClick={() => setState({ kind: "manual" })}
                                className="mt-1 h-11 px-5 rounded-2xl bg-muted text-foreground text-sm font-semibold"
                            >
                                Enter code manually
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Footer — shows the manual-entry link in scanning AND error
                states, so a broken camera never traps the user. */}
            <div
                className="px-4 pt-5 text-center shrink-0"
                style={{
                    paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))",
                }}
            >
                {state.kind === "manual" ? (
                    <button
                        onClick={() => {
                            setManualCode("");
                            setState({ kind: "scanning" });
                        }}
                        className="text-xs text-primary font-semibold inline-flex items-center gap-1.5"
                    >
                        <CameraOff className="w-3 h-3" />
                        Back to camera
                    </button>
                ) : state.kind === "scanning" || state.kind === "error" ? (
                    <div className="flex flex-col items-center gap-2">
                        {state.kind === "scanning" && (
                            <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                                <CameraOff className="w-3 h-3" />
                                Point at the client's QR code
                            </p>
                        )}
                        <button
                            onClick={() => setState({ kind: "manual" })}
                            className="text-xs text-primary font-semibold inline-flex items-center gap-1.5 underline"
                        >
                            <Keyboard className="w-3 h-3" />
                            Enter code manually instead
                        </button>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
// src/components/booking/PayButton.tsx
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Loader2,
    Smartphone,
    CheckCircle2,
    AlertCircle,
    X,
} from "lucide-react";

type Phase =
    | { kind: "idle" }
    | { kind: "form" }
    | { kind: "pushing" }
    | { kind: "waiting"; checkoutRequestId: string }
    | { kind: "paid" }
    | { kind: "error"; message: string };

export function PayButton({
    bookingId,
    defaultPhone,
    amount,
}: {
    bookingId: string;
    defaultPhone?: string | null;
    amount: number;
}) {
    const { user } = useSession();
    const qc = useQueryClient();
    const [phase, setPhase] = useState<Phase>({ kind: "idle" });
    const [phone, setPhone] = useState(defaultPhone ?? "");
    const pollRef = useRef<number | null>(null);

    // Clean up polling on unmount
    useEffect(() => {
        return () => {
            if (pollRef.current !== null) window.clearInterval(pollRef.current);
        };
    }, []);

    // Stop polling once we're paid or errored
    useEffect(() => {
        if (phase.kind !== "waiting") {
            if (pollRef.current !== null) {
                window.clearInterval(pollRef.current);
                pollRef.current = null;
            }
        }
    }, [phase.kind]);

    const startPolling = (checkoutRequestId: string) => {
        if (pollRef.current !== null) window.clearInterval(pollRef.current);

        pollRef.current = window.setInterval(async () => {
            const { data, error } = await supabase
                .from("bookings")
                .select("status, payment_status")
                .eq("id", bookingId)
                .maybeSingle();

            if (error || !data) return;

            if (data.status === "paid_escrow" || data.payment_status === "paid") {
                setPhase({ kind: "paid" });
                qc.invalidateQueries({ queryKey: ["booking", bookingId] });
                qc.invalidateQueries({ queryKey: ["bookings"] });
                return;
            }

            // Check whether the payment attempt was marked failed
            const { data: pay } = await supabase
                .from("mpesa_payments")
                .select("status")
                .eq("checkout_request_id", checkoutRequestId)
                .maybeSingle();

            if (pay?.status === "failed") {
                setPhase({
                    kind: "error",
                    message:
                        "The M-Pesa prompt was cancelled or failed. You can try again.",
                });
            }
        }, 3000);
    };

    const push = async () => {
        if (!user) return;
        setPhase({ kind: "pushing" });

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No active session");

            const { data, error } = await supabase.functions.invoke(
                "mpesa-stk-push",
                {
                    body: { booking_id: bookingId, phone: phone.trim() },
                    headers: { Authorization: `Bearer ${session.access_token}` },
                },
            );

            if (error) throw error;
            if (!data?.success) {
                throw new Error(data?.error ?? "STK push failed");
            }

            setPhase({
                kind: "waiting",
                checkoutRequestId: data.checkout_request_id,
            });
            startPolling(data.checkout_request_id);
        } catch (e: unknown) {
            setPhase({
                kind: "error",
                message: e instanceof Error ? e.message : "Payment failed",
            });
        }
    };

    // ---------- render ----------

    if (phase.kind === "paid") {
        return (
            <div className="w-full rounded-2xl bg-success/10 px-4 py-4 mb-4">
                <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                    <div>
                        <p className="text-sm font-semibold">Payment received</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Funds are held in escrow until the visit is complete.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (phase.kind === "error") {
        return (
            <div className="w-full rounded-2xl bg-destructive/10 px-4 py-4 mb-4">
                <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-destructive">
                            Payment failed
                        </p>
                        <p className="mt-0.5 text-xs text-destructive/80 break-words">
                            {phase.message}
                        </p>
                    </div>
                    <button
                        onClick={() => setPhase({ kind: "idle" })}
                        className="shrink-0 rounded-full p-1 hover:bg-destructive/10"
                        aria-label="Dismiss"
                    >
                        <X className="h-4 w-4 text-destructive" />
                    </button>
                </div>
            </div>
        );
    }

    if (phase.kind === "waiting") {
        return (
            <div className="w-full rounded-2xl bg-primary/10 px-4 py-4 mb-4">
                <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />
                    <div>
                        <p className="text-sm font-semibold">Check your phone</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Enter your M-Pesa PIN to approve KES{" "}
                            {Math.round(amount).toLocaleString()}.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (phase.kind === "form") {
        return (
            <div className="w-full rounded-2xl border border-border bg-card px-4 py-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                    <Smartphone className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium">Pay with M-Pesa</p>
                </div>
                <div className="space-y-3">
                    <div>
                        <Label htmlFor="pay-phone" className="text-xs">
                            M-Pesa phone number
                        </Label>
                        <Input
                            id="pay-phone"
                            type="tel"
                            inputMode="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="07XX XXX XXX"
                            className="mt-1 h-11 rounded-2xl"
                            autoFocus
                        />
                    </div>
                    <div className="flex items-center justify-between pt-1">
                        <p className="text-xs text-muted-foreground">
                            KES {Math.round(amount).toLocaleString()} will be held in escrow.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="flex-1 h-11 rounded-2xl"
                            onClick={() => setPhase({ kind: "idle" })}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="flex-1 h-11 rounded-2xl"
                            onClick={push}
                            disabled={phone.trim().length < 9}
                        >
                            Send prompt
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (phase.kind === "pushing") {
        return (
            <Button
                disabled
                className="w-full h-12 rounded-2xl mb-4"
            >
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending prompt…
            </Button>
        );
    }

    // idle
    return (
        <Button
            className="w-full h-12 rounded-2xl mb-4"
            onClick={() => setPhase({ kind: "form" })}
        >
            <Smartphone className="mr-2 h-4 w-4" />
            Pay KES {Math.round(amount).toLocaleString()} with M-Pesa
        </Button>
    );
}
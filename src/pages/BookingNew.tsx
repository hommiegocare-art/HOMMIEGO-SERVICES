import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, Lock, ShieldCheck } from "lucide-react";

type Service = {
    id: string;
    title: string;
    price: number;
    pricing_type: "hourly" | "flat" | "daily";
    duration_minutes: number | null;
    is_active: boolean;
};

type CaregiverLite = {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
};

type ClientProfile = {
    address: string | null;
};
export default function BookingNew() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const { user, loading: sessionLoading } = useSession();

    const caregiverId = params.get("caregiver");

    const [state, setState] = useState<
        | { kind: "loading" }
        | { kind: "no-connection" }
        | { kind: "self" }
        | { kind: "ok"; caregiver: CaregiverLite }
        | { kind: "error"; message: string }
    >({ kind: "loading" });

    const [services, setServices] = useState<Service[] | null>(null);
    const [client, setClient] = useState<ClientProfile | null>(null);

    // form
    const [serviceId, setServiceId] = useState<string>("");
    const [scheduledAt, setScheduledAt] = useState("");
    const [duration, setDuration] = useState("");
    const [notes, setNotes] = useState("");
    const [whatsapp, setWhatsapp] = useState("");
    const [address, setAddress] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load caregiver + connection gate
    useEffect(() => {
        if (!user || !caregiverId) return;
        let cancelled = false;

        // Can't book yourself
        if (caregiverId === user.id) {
            setState({ kind: "self" });
            return;
        }

        (async () => {
            // Connection gate: the current user must be the CLIENT on an
            // accepted connection with this caregiver.
            const { data: conn, error: connErr } = await supabase
                .from("connections")
                .select("id")
                .eq("client_id", user.id)
                .eq("caregiver_id", caregiverId)
                .eq("status", "accepted")
                .is("deleted_at", null)
                .limit(1)
                .maybeSingle();

            if (cancelled) return;
            if (connErr) {
                setState({ kind: "error", message: connErr.message });
                return;
            }
            if (!conn) {
                setState({ kind: "no-connection" });
                return;
            }

            const [cgRes, svcRes, cliRes] = await Promise.all([
                supabase
                    .from("profiles")
                    .select("id,display_name,avatar_url")
                    .eq("id", caregiverId)
                    .maybeSingle(),
                supabase
                    .from("services")
                    .select("id,title,price,pricing_type,duration_minutes,is_active")
                    .eq("caregiver_id", caregiverId)
                    .eq("is_active", true)
                    .is("deleted_at", null)
                    .order("created_at", { ascending: false })
                    .limit(50),
                supabase
                    .from("client_profiles")
                    .select("address")
                    .eq("user_id", user.id)
                    .maybeSingle(),
            ]);

            if (cancelled) return;
            if (!cgRes.data) {
                setState({ kind: "error", message: "Caregiver not found." });
                return;
            }
            setState({ kind: "ok", caregiver: cgRes.data as CaregiverLite });
            setServices((svcRes.data ?? []) as Service[]);
            setClient((cliRes.data ?? null) as ClientProfile | null);
            if (user.phone_number) setWhatsapp(user.phone_number);
            if (cliRes.data?.address) setAddress(cliRes.data.address);
            if (svcRes.data && svcRes.data.length > 0) {
                setServiceId(svcRes.data[0].id);
                if (svcRes.data[0].duration_minutes != null) {
                    setDuration(String(svcRes.data[0].duration_minutes));
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [user, caregiverId]);

    const selectedService = useMemo(
        () => services?.find((s) => s.id === serviceId) ?? null,
        [services, serviceId],
    );

    // When the user picks a different service, reset the duration to that
    // service's default. Tracked via a ref so manual edits aren't clobbered
    // on unrelated re-renders.
    const lastServiceIdRef = useRef<string>("");
    useEffect(() => {
        if (!selectedService) return;
        if (lastServiceIdRef.current === selectedService.id) return;
        lastServiceIdRef.current = selectedService.id;
        if (selectedService.duration_minutes != null) {
            setDuration(String(selectedService.duration_minutes));
        }
    }, [selectedService]);

    const totalAmount = useMemo(() => {
        if (!selectedService) return 0;
        const price = Number(selectedService.price ?? 0);
        const durMin = Number(duration || selectedService.duration_minutes || 0);
        if (selectedService.pricing_type === "hourly") {
            return price * Math.max(1, durMin / 60);
        }
        if (selectedService.pricing_type === "daily") {
            return price * Math.max(1, Math.ceil(durMin / (60 * 24)));
        }
        return price;
    }, [selectedService, duration]);

    const submit = async () => {
        if (!user || !caregiverId) return;
        if (state.kind !== "ok") return;
        if (!serviceId) {
            setError("Pick a service.");
            return;
        }
        if (!scheduledAt) {
            setError("Pick a date and time.");
            return;
        }
        setSubmitting(true);
        setError(null);

        const { data, error: e } = await supabase
            .from("bookings")
            .insert({
                client_id: user.id,
                caregiver_id: caregiverId,
                service_id: serviceId,
                scheduled_at: new Date(scheduledAt).toISOString(),
                duration_minutes: duration ? Number(duration) : null,
                notes: notes.trim() || null,
                whatsapp_number: whatsapp.trim() || null,
                address_snapshot: address.trim() || null,
                total_amount: Math.round(totalAmount),
                status: "pending_payment",
                payment_status: "unpaid",
            })
            .select("id")
            .single();

        setSubmitting(false);
        if (e) {
            setError(e.message);
            return;
        }
        if (!data?.id) {
            setError("Booking was created but no id was returned.");
            return;
        }
        navigate(`/bookings/${data.id}`);
    };

    if (sessionLoading || state.kind === "loading") return <PageSkeleton />;

    if (!user) {
        return (
            <main className="mx-auto max-w-2xl px-6 py-20 text-center">
                <h1 className="text-2xl font-semibold">Sign in required</h1>
                <Button asChild className="mt-4">
                    <Link to="/auth?mode=login">Sign in</Link>
                </Button>
            </main>
        );
    }

    if (!caregiverId) {
        return (
            <main className="mx-auto max-w-2xl px-6 py-20 text-center">
                <h1 className="text-2xl font-semibold">Missing caregiver</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    Open a caregiver's profile to book them.
                </p>
            </main>
        );
    }

    if (state.kind === "self") {
        return (
            <main className="mx-auto max-w-2xl px-6 py-20 text-center">
                <h1 className="text-2xl font-semibold">You can't book yourself</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    Open another caregiver's profile to book them.
                </p>
                <Button asChild variant="outline" className="mt-6">
                    <Link to="/explore">Find a caregiver</Link>
                </Button>
            </main>
        );
    }

    if (state.kind === "error") {
        return (
            <main className="mx-auto max-w-2xl px-6 py-20 text-center">
                <h1 className="text-2xl font-semibold">Something went wrong</h1>
                <p className="mt-2 text-sm text-muted-foreground">{state.message}</p>
            </main>
        );
    }

    if (state.kind === "no-connection") {
        return (
            <main className="mx-auto max-w-2xl px-6 py-20 text-center">
                <Lock className="mx-auto h-6 w-6 text-muted-foreground" />
                <h1 className="mt-3 text-2xl font-semibold">Request to connect first</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    You need an accepted connection with this caregiver before booking.
                </p>
                <Button asChild variant="outline" className="mt-6">
                    <Link to={`/profile/${caregiverId}`}>Back to profile</Link>
                </Button>
            </main>
        );
    }

    const cg = state.caregiver;
    const noServices = services !== null && services.length === 0;

    return (
        <main className="mx-auto max-w-2xl px-6 py-6 animate-fade-in">
            <button
                onClick={() => navigate(-1)}
                className="mb-4 -ml-2 inline-flex h-11 items-center gap-1 text-sm text-muted-foreground"
            >
                <ChevronLeft className="h-4 w-4" /> Back
            </button>

            <header className="mb-6 flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10">
                    {cg.avatar_url ? (
                        <img src={cg.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <span className="font-black text-primary">
                            {(cg.display_name ?? "?")[0]?.toUpperCase()}
                        </span>
                    )}
                </span>
                <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        Booking
                    </p>
                    <h1 className="truncate text-xl font-semibold">
                        {cg.display_name ?? "Caregiver"}
                    </h1>
                </div>
            </header>

            {noServices ? (
                <Card className="rounded-2xl border-dashed">
                    <CardContent className="py-12 text-center">
                        <p className="text-sm text-muted-foreground">
                            This caregiver has no active services right now.
                        </p>
                        <Button asChild variant="outline" className="mt-4">
                            <Link to={`/profile/${caregiverId}`}>Back to profile</Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <Card className="rounded-2xl">
                        <CardHeader>
                            <CardTitle className="text-base font-medium">Service</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Service</Label>
                                <Select value={serviceId} onValueChange={setServiceId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pick a service" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(services ?? []).map((s) => (
                                            <SelectItem key={s.id} value={s.id}>
                                                {s.title} — KES {Number(s.price).toLocaleString()}
                                                {s.pricing_type === "hourly"
                                                    ? "/hr"
                                                    : s.pricing_type === "daily"
                                                        ? "/day"
                                                        : "/visit"}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-2">
                                    <Label htmlFor="sa">Date & time</Label>
                                    <Input
                                        id="sa"
                                        type="datetime-local"
                                        value={scheduledAt}
                                        onChange={(e) => setScheduledAt(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="dur">Duration (minutes)</Label>
                                    <Input
                                        id="dur"
                                        type="number"
                                        min={1}
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                    placeholder="Anything the caregiver should know"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="mt-4 rounded-2xl">
                        <CardHeader>
                            <CardTitle className="text-base font-medium">Contact</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="wa">WhatsApp number</Label>
                                <Input
                                    id="wa"
                                    value={whatsapp}
                                    onChange={(e) => setWhatsapp(e.target.value)}
                                    placeholder="+254…"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="addr">Address</Label>
                                <Textarea
                                    id="addr"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    rows={2}
                                    placeholder="Where care is needed"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="mt-4 rounded-2xl">
                        <CardContent className="flex items-center justify-between py-5">
                            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                                <ShieldCheck className="h-4 w-4 text-primary" />
                                Total (escrowed at payment)
                            </div>
                            <p className="text-xl font-semibold">
                                KES {Math.round(totalAmount).toLocaleString()}
                            </p>
                        </CardContent>
                    </Card>

                    {error && (
                        <p className="mt-4 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {error}
                        </p>
                    )}

                    <div className="mt-6 flex gap-2">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => navigate(-1)}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button className="flex-1" onClick={submit} disabled={submitting}>
                            {submitting ? "Creating…" : "Request booking"}
                        </Button>
                    </div>
                </>
            )}
        </main>
    );
}

function PageSkeleton() {
    return (
        <main className="mx-auto max-w-2xl px-6 py-10">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="mt-6 h-64 rounded-2xl" />
            <Skeleton className="mt-4 h-40 rounded-2xl" />
        </main>
    );
}
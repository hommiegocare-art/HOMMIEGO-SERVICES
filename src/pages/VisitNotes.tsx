import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, FileText, Stethoscope } from "lucide-react";

type VisitType =
    | "routine"
    | "follow_up"
    | "urgent"
    | "assessment"
    | "post_op"
    | "other";

type Vitals = {
    bp?: string;
    hr?: string;
    temp?: string;
};

type VisitNote = {
    id: string;
    booking_id: string;
    caregiver_id: string;
    visit_type: VisitType | null;
    chief_complaint: string | null;
    assessment: string | null;
    plan: string | null;
    clinical_notes: string | null;
    vitals: Vitals | null;
    follow_up_required: boolean | null;
    follow_up_date: string | null;
    created_at: string;
};

type BookingLite = {
    id: string;
    caregiver_id: string;
    client_id: string;
    status: string;
};

export default function VisitNotes() {
    const { id: bookingId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, loading: sessionLoading } = useSession();

    const [booking, setBooking] = useState<BookingLite | null>(null);
    const [loadingBooking, setLoadingBooking] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // form state
    const [visitType, setVisitType] = useState<VisitType>("routine");
    const [chiefComplaint, setChiefComplaint] = useState("");
    const [assessment, setAssessment] = useState("");
    const [plan, setPlan] = useState("");
    const [clinicalNotes, setClinicalNotes] = useState("");
    const [bp, setBp] = useState("");
    const [hr, setHr] = useState("");
    const [temp, setTemp] = useState("");
    const [followUpRequired, setFollowUpRequired] = useState(false);
    const [followUpDate, setFollowUpDate] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!bookingId) return;
        let cancelled = false;
        (async () => {
            const { data, error: e } = await supabase
                .from("bookings")
                .select("id,caregiver_id,client_id,status")
                .eq("id", bookingId)
                .maybeSingle();
            if (cancelled) return;
            if (e) setError(e.message);
            setBooking((data ?? null) as BookingLite | null);
            setLoadingBooking(false);
        })();
        return () => {
            cancelled = true;
        };
    }, [bookingId]);

    const save = async () => {
        if (!user || !booking || !bookingId) return;
        if (user.id !== booking.caregiver_id) {
            setError("Only the assigned caregiver can add notes.");
            return;
        }
        if (!["in_progress", "completed"].includes(booking.status)) {
            setError("Notes can only be added while a visit is in progress or completed.");
            return;
        }
        if (!assessment.trim() && !clinicalNotes.trim()) {
            setError("Add at least an assessment or clinical notes.");
            return;
        }

        setSaving(true);
        setError(null);

        const vitals: Vitals = {};
        if (bp.trim()) vitals.bp = bp.trim();
        if (hr.trim()) vitals.hr = hr.trim();
        if (temp.trim()) vitals.temp = temp.trim();

        const { error: e } = await supabase.from("visit_notes").insert({
            booking_id: bookingId,
            caregiver_id: user.id,
            visit_type: visitType,
            chief_complaint: chiefComplaint.trim() || null,
            assessment: assessment.trim() || null,
            plan: plan.trim() || null,
            clinical_notes: clinicalNotes.trim() || null,
            vitals: Object.keys(vitals).length > 0 ? vitals : null,
            follow_up_required: followUpRequired,
            follow_up_date: followUpRequired && followUpDate ? followUpDate : null,
        });

        setSaving(false);
        if (e) {
            setError(e.message);
            return;
        }
        navigate(`/bookings/${bookingId}`);
    };

    if (sessionLoading || loadingBooking) return <PageSkeleton />;

    if (!user || !booking) {
        return (
            <main className="mx-auto max-w-2xl px-6 py-20 text-center">
                <h1 className="text-2xl font-semibold">Booking not found</h1>
                <Button asChild variant="outline" className="mt-4">
                    <Link to="/bookings">Back to bookings</Link>
                </Button>
            </main>
        );
    }

    const isAssigned = user.id === booking.caregiver_id;
    const statusOk = ["in_progress", "completed"].includes(booking.status);

    if (!isAssigned || !statusOk) {
        return (
            <main className="mx-auto max-w-2xl px-6 py-20 text-center">
                <h1 className="text-2xl font-semibold">Not available</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    {!isAssigned
                        ? "Only the assigned caregiver can add visit notes."
                        : "Visit notes can be added once the visit is in progress or completed."}
                </p>
                <Button asChild variant="outline" className="mt-4">
                    <Link to={`/bookings/${bookingId}`}>Back to booking</Link>
                </Button>
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-2xl px-6 py-6 animate-fade-in">
            <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground -ml-2 mb-4 h-11"
            >
                <ChevronLeft className="h-4 w-4" /> Back
            </button>

            <header className="mb-6">
                <h1 className="text-2xl font-semibold tracking-tight">Add visit note</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Document this visit for the client's record.
                </p>
            </header>

            <Card className="rounded-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base font-medium">
                        <Stethoscope className="h-4 w-4" /> Clinical summary
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label>Visit type</Label>
                        <Select value={visitType} onValueChange={(v) => setVisitType(v as VisitType)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="routine">Routine</SelectItem>
                                <SelectItem value="follow_up">Follow-up</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                                <SelectItem value="assessment">Assessment</SelectItem>
                                <SelectItem value="post_op">Post-op</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="cc">Chief complaint</Label>
                        <Input
                            id="cc"
                            value={chiefComplaint}
                            onChange={(e) => setChiefComplaint(e.target.value)}
                            placeholder="What the client reported"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="assess">Assessment</Label>
                        <Textarea
                            id="assess"
                            value={assessment}
                            onChange={(e) => setAssessment(e.target.value)}
                            rows={3}
                            placeholder="Observations and clinical impression"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="plan">Plan</Label>
                        <Textarea
                            id="plan"
                            value={plan}
                            onChange={(e) => setPlan(e.target.value)}
                            rows={3}
                            placeholder="Next steps, treatment, instructions"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="cn">Clinical notes</Label>
                        <Textarea
                            id="cn"
                            value={clinicalNotes}
                            onChange={(e) => setClinicalNotes(e.target.value)}
                            rows={3}
                            placeholder="Additional free-form notes"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="mt-4 rounded-2xl">
                <CardHeader>
                    <CardTitle className="text-base font-medium">Vitals</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-3">
                    <div className="grid gap-2">
                        <Label htmlFor="bp">BP</Label>
                        <Input
                            id="bp"
                            value={bp}
                            onChange={(e) => setBp(e.target.value)}
                            placeholder="120/80"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="hr">HR</Label>
                        <Input
                            id="hr"
                            value={hr}
                            onChange={(e) => setHr(e.target.value)}
                            placeholder="72"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="temp">Temp</Label>
                        <Input
                            id="temp"
                            value={temp}
                            onChange={(e) => setTemp(e.target.value)}
                            placeholder="36.6"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="mt-4 rounded-2xl">
                <CardHeader>
                    <CardTitle className="text-base font-medium">Follow-up</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="fu">Follow-up required</Label>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Schedule another visit.
                            </p>
                        </div>
                        <Switch
                            id="fu"
                            checked={followUpRequired}
                            onCheckedChange={setFollowUpRequired}
                        />
                    </div>
                    {followUpRequired && (
                        <div className="grid gap-2">
                            <Label htmlFor="fud">Follow-up date</Label>
                            <Input
                                id="fud"
                                type="date"
                                value={followUpDate}
                                onChange={(e) => setFollowUpDate(e.target.value)}
                            />
                        </div>
                    )}
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
                    onClick={() => navigate(-1)}
                    disabled={saving}
                    className="flex-1"
                >
                    Cancel
                </Button>
                <Button onClick={save} disabled={saving} className="flex-1">
                    <FileText className="mr-1.5 h-4 w-4" />
                    {saving ? "Saving…" : "Save note"}
                </Button>
            </div>
        </main>
    );
}

function PageSkeleton() {
    return (
        <main className="mx-auto max-w-2xl px-6 py-10">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="mt-6 h-64 rounded-2xl" />
            <Skeleton className="mt-4 h-24 rounded-2xl" />
        </main>
    );
}
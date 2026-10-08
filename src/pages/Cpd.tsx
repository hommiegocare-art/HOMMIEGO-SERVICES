import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Award,
    BookOpen,
    FileText,
    GraduationCap,
    Plus,
    Target,
} from "lucide-react";

type CpdSource =
    | "training"
    | "workshop"
    | "conference"
    | "online"
    | "self_study"
    | "other";

type CpdEvent = {
    id: string;
    caregiver_id: string;
    title: string;
    provider: string | null;
    source: CpdSource | null;
    hours: number | null;
    points: number | null;
    event_date: string | null;
    certificate_url: string | null;
    created_at: string;
};

type Milestone = {
    id: string;
    title: string;
    description: string | null;
    required_points: number | null;
    required_hours: number | null;
    badge_url: string | null;
};

type Totals = {
    total_hours: number | null;
    total_points: number | null;
    total_events: number | null;
};

type FormState = {
    title: string;
    provider: string;
    source: CpdSource;
    hours: string;
    points: string;
    event_date: string;
    certificate_url: string;
};

const EMPTY_FORM: FormState = {
    title: "",
    provider: "",
    source: "training",
    hours: "",
    points: "",
    event_date: "",
    certificate_url: "",
};

export default function Cpd() {
    const { user, loading: sessionLoading } = useSession();

    const [events, setEvents] = useState<CpdEvent[] | null>(null);
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [totals, setTotals] = useState<Totals | null>(null);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fileRef = useRef<HTMLInputElement | null>(null);

    const load = useCallback(async () => {
        if (!user) return;
        const [eRes, mRes, tRes] = await Promise.all([
            supabase
                .from("cpd_events")
                .select("*")
                .eq("caregiver_id", user.id)
                .order("event_date", { ascending: false, nullsFirst: false })
                .limit(100),
            supabase
                .from("service_milestones")
                .select("id,title,description,required_points,required_hours,badge_url")
                .order("required_points", { ascending: true, nullsFirst: true })
                .limit(50),
            supabase
                .from("caregiver_cpd_totals")
                .select("*")
                .eq("caregiver_id", user.id)
                .maybeSingle(),
        ]);

        if (eRes.error) setError(eRes.error.message);
        setEvents((eRes.data ?? []) as CpdEvent[]);
        setMilestones((mRes.data ?? []) as Milestone[]);
        setTotals((tRes.data ?? null) as Totals | null);
    }, [user]);

    useEffect(() => {
        load();
    }, [load]);

    const openCreate = () => {
        setForm(EMPTY_FORM);
        setError(null);
        setDialogOpen(true);
    };

    const onPickCertificate = async (file: File) => {
        if (!user) return;
        setUploading(true);
        setError(null);
        try {
            const ext = file.name.split(".").pop() || "pdf";
            const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
            const { error: upErr } = await supabase.storage
                .from("cpd-certificates")
                .upload(path, file, { upsert: false, contentType: file.type });
            if (upErr) throw upErr;
            const { data } = supabase.storage
                .from("cpd-certificates")
                .getPublicUrl(path);
            setForm((f) => ({ ...f, certificate_url: data.publicUrl }));
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const save = async () => {
        if (!user) return;
        setSaving(true);
        setError(null);
        try {
            if (!form.title.trim()) throw new Error("Title is required");
            const hours = form.hours ? Number(form.hours) : null;
            const points = form.points ? Number(form.points) : null;
            if (hours != null && (!Number.isFinite(hours) || hours < 0)) {
                throw new Error("Hours must be a non-negative number");
            }
            if (points != null && (!Number.isFinite(points) || points < 0)) {
                throw new Error("Points must be a non-negative number");
            }

            const { error: e } = await supabase.from("cpd_events").insert({
                caregiver_id: user.id,
                title: form.title.trim(),
                provider: form.provider.trim() || null,
                source: form.source,
                hours,
                points,
                event_date: form.event_date || null,
                certificate_url: form.certificate_url || null,
            });
            if (e) throw e;

            setDialogOpen(false);
            await load();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Save failed");
        } finally {
            setSaving(false);
        }
    };

    const deleteEvent = async (ev: CpdEvent) => {
        if (!confirm(`Delete "${ev.title}"?`)) return;
        const { error: e } = await supabase.from("cpd_events").delete().eq("id", ev.id);
        if (e) {
            setError(e.message);
            return;
        }
        setEvents((prev) => prev?.filter((x) => x.id !== ev.id) ?? prev);
        // refresh totals view
        if (user) {
            const { data } = await supabase
                .from("caregiver_cpd_totals")
                .select("*")
                .eq("caregiver_id", user.id)
                .maybeSingle();
            setTotals((data ?? null) as Totals | null);
        }
    };

    const totalHours = totals?.total_hours ?? 0;
    const totalPoints = totals?.total_points ?? 0;

    if (sessionLoading) return <PageSkeleton />;
    if (!user) {
        return (
            <main className="mx-auto max-w-3xl px-6 py-20 text-center">
                <h1 className="text-2xl font-semibold">Sign in required</h1>
                <p className="mt-2 text-muted-foreground">Please sign in to view your CPD.</p>
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-4xl px-6 py-10">
            <header className="mb-6 flex items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">CPD</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Track your continuing professional development.
                    </p>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="mr-1.5 h-4 w-4" /> Log event
                </Button>
            </header>

            {/* TOTALS */}
            <section className="mb-8 grid gap-4 sm:grid-cols-3">
                <TotalsCard
                    icon={<GraduationCap className="h-4 w-4" />}
                    label="Total hours"
                    value={events === null ? null : Number(totalHours).toLocaleString()}
                />
                <TotalsCard
                    icon={<Award className="h-4 w-4" />}
                    label="Total points"
                    value={events === null ? null : Number(totalPoints).toLocaleString()}
                />
                <TotalsCard
                    icon={<BookOpen className="h-4 w-4" />}
                    label="Events logged"
                    value={events === null ? null : (totals?.total_events ?? events.length)}
                />
            </section>

            {/* LOG */}
            <section className="mb-10">
                <div className="mb-4">
                    <h2 className="text-xl font-medium">Log</h2>
                    <p className="text-sm text-muted-foreground">
                        Your CPD events, most recent first.
                    </p>
                </div>

                {error && !dialogOpen && (
                    <p className="mb-4 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        {error}
                    </p>
                )}

                {events === null ? (
                    <div className="grid gap-3">
                        <Skeleton className="h-20 rounded-2xl" />
                        <Skeleton className="h-20 rounded-2xl" />
                    </div>
                ) : events.length === 0 ? (
                    <Card className="rounded-2xl border-dashed">
                        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                            <BookOpen className="h-5 w-5 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                                No CPD events yet. Log your first one.
                            </p>
                            <Button variant="outline" onClick={openCreate}>
                                <Plus className="mr-1.5 h-4 w-4" /> Log event
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <ul className="grid gap-3">
                        {events.map((ev) => (
                            <li key={ev.id}>
                                <Card className="rounded-2xl">
                                    <CardContent className="flex items-start gap-4 py-4">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="truncate text-base font-medium">{ev.title}</h3>
                                                {ev.source && (
                                                    <Badge variant="secondary" className="capitalize">
                                                        {ev.source.replace(/_/g, " ")}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                                {ev.provider && <span>{ev.provider}</span>}
                                                {ev.event_date && (
                                                    <span>
                                                        {new Date(ev.event_date).toLocaleDateString(undefined, {
                                                            dateStyle: "medium",
                                                        })}
                                                    </span>
                                                )}
                                                {ev.hours != null && <span>{ev.hours}h</span>}
                                                {ev.points != null && <span>{ev.points} pts</span>}
                                            </div>
                                            {ev.certificate_url && (
                                                <a
                                                    href={ev.certificate_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                                >
                                                    <FileText className="h-3 w-3" /> Certificate
                                                </a>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => deleteEvent(ev)}
                                            className="shrink-0"
                                        >
                                            Delete
                                        </Button>
                                    </CardContent>
                                </Card>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* MILESTONES */}
            <section>
                <div className="mb-4">
                    <h2 className="text-xl font-medium">Milestones</h2>
                    <p className="text-sm text-muted-foreground">
                        Progress against service milestones.
                    </p>
                </div>

                {milestones.length === 0 ? (
                    <Card className="rounded-2xl border-dashed">
                        <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
                            <Target className="h-5 w-5 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                                No milestones defined yet.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <ul className="grid gap-3 sm:grid-cols-2">
                        {milestones.map((m) => {
                            const reqPts = m.required_points ?? 0;
                            const reqHrs = m.required_hours ?? 0;
                            const ptsOk = totalPoints >= reqPts;
                            const hrsOk = totalHours >= reqHrs;
                            const achieved = ptsOk && hrsOk;
                            return (
                                <li key={m.id}>
                                    <Card className={`rounded-2xl ${achieved ? "border-primary/40" : ""}`}>
                                        <CardHeader className="pb-2">
                                            <div className="flex items-start justify-between gap-3">
                                                <CardTitle className="text-base font-medium">{m.title}</CardTitle>
                                                {achieved ? (
                                                    <Badge>Achieved</Badge>
                                                ) : (
                                                    <Badge variant="outline">In progress</Badge>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-0 text-sm text-muted-foreground">
                                            {m.description && <p className="mb-2">{m.description}</p>}
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                                                {reqHrs > 0 && (
                                                    <span className={hrsOk ? "text-primary" : ""}>
                                                        {Math.min(totalHours, reqHrs)} / {reqHrs} hrs
                                                    </span>
                                                )}
                                                {reqPts > 0 && (
                                                    <span className={ptsOk ? "text-primary" : ""}>
                                                        {Math.min(totalPoints, reqPts)} / {reqPts} pts
                                                    </span>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>

            {/* DIALOG */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Log CPD event</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4 py-2">
                        <div className="grid gap-2">
                            <Label htmlFor="t">Title</Label>
                            <Input
                                id="t"
                                value={form.title}
                                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                                placeholder="e.g. Advanced wound care"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="p">Provider</Label>
                            <Input
                                id="p"
                                value={form.provider}
                                onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
                                placeholder="e.g. Kenya Red Cross"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Source</Label>
                            <Select
                                value={form.source}
                                onValueChange={(v) => setForm((f) => ({ ...f, source: v as CpdSource }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="training">Training</SelectItem>
                                    <SelectItem value="workshop">Workshop</SelectItem>
                                    <SelectItem value="conference">Conference</SelectItem>
                                    <SelectItem value="online">Online</SelectItem>
                                    <SelectItem value="self_study">Self study</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2">
                                <Label htmlFor="h">Hours</Label>
                                <Input
                                    id="h"
                                    type="number"
                                    min={0}
                                    step="0.5"
                                    value={form.hours}
                                    onChange={(e) => setForm((f) => ({ ...f, hours: e.target.value }))}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="pts">Points</Label>
                                <Input
                                    id="pts"
                                    type="number"
                                    min={0}
                                    value={form.points}
                                    onChange={(e) => setForm((f) => ({ ...f, points: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="d">Event date</Label>
                            <Input
                                id="d"
                                type="date"
                                value={form.event_date}
                                onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Certificate</Label>
                            <div className="flex flex-col gap-2">
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept="image/*,application/pdf"
                                    className="hidden"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) onPickCertificate(f);
                                    }}
                                />
                                <div className="flex flex-wrap items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={uploading}
                                        onClick={() => fileRef.current?.click()}
                                    >
                                        {uploading
                                            ? "Uploading…"
                                            : form.certificate_url
                                                ? "Replace file"
                                                : "Upload file"}
                                    </Button>
                                    {form.certificate_url && (
                                        <>
                                            <a
                                                href={form.certificate_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-xs text-primary hover:underline"
                                            >
                                                View
                                            </a>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setForm((f) => ({ ...f, certificate_url: "" }))}
                                            >
                                                Remove
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {error && (
                            <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                {error}
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                            Cancel
                        </Button>
                        <Button onClick={save} disabled={saving || uploading}>
                            {saving ? "Saving…" : "Log event"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    );
}

function TotalsCard({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: number | string | null;
}) {
    return (
        <Card className="rounded-2xl">
            <CardContent className="py-5">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                    {icon}
                    {label}
                </div>
                <div className="mt-2 text-2xl font-semibold">
                    {value === null ? <Skeleton className="h-7 w-16" /> : value}
                </div>
            </CardContent>
        </Card>
    );
}

function PageSkeleton() {
    return (
        <main className="mx-auto max-w-4xl px-6 py-10">
            <Skeleton className="h-9 w-32" />
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-24 rounded-2xl" />
            </div>
            <Skeleton className="mt-8 h-20 rounded-2xl" />
        </main>
    );
}
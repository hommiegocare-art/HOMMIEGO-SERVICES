import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarClock, FileText, HeartPulse } from "lucide-react";

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

export function VisitNotesList({ bookingId }: { bookingId: string }) {
    const [notes, setNotes] = useState<VisitNote[] | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const { data } = await supabase
                .from("visit_notes")
                .select(
                    "id,visit_type,chief_complaint,assessment,plan,clinical_notes,vitals,follow_up_required,follow_up_date,created_at",
                )
                .eq("booking_id", bookingId)
                .order("created_at", { ascending: false })
                .limit(20);
            if (!cancelled) setNotes((data ?? []) as VisitNote[]);
        })();
        return () => {
            cancelled = true;
        };
    }, [bookingId]);

    if (notes === null) {
        return <Skeleton className="h-32 rounded-2xl" />;
    }
    if (notes.length === 0) return null;

    return (
        <section>
            <div className="mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-medium">Visit notes</h2>
            </div>
            <ul className="grid gap-3">
                {notes.map((n) => (
                    <li key={n.id}>
                        <Card className="rounded-2xl">
                            <CardHeader className="pb-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <CardTitle className="text-sm font-medium">
                                        {new Date(n.created_at).toLocaleString(undefined, {
                                            dateStyle: "medium",
                                            timeStyle: "short",
                                        })}
                                    </CardTitle>
                                    {n.visit_type && (
                                        <Badge variant="secondary" className="capitalize">
                                            {n.visit_type.replace(/_/g, " ")}
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-0 text-sm">
                                {n.chief_complaint && (
                                    <Field label="Chief complaint" value={n.chief_complaint} />
                                )}
                                {n.assessment && <Field label="Assessment" value={n.assessment} />}
                                {n.plan && <Field label="Plan" value={n.plan} />}
                                {n.clinical_notes && (
                                    <Field label="Clinical notes" value={n.clinical_notes} />
                                )}
                                {n.vitals && (n.vitals.bp || n.vitals.hr || n.vitals.temp) && (
                                    <div>
                                        <p className="mb-1 inline-flex items-center gap-1 text-xs uppercase tracking-wide text-muted-foreground">
                                            <HeartPulse className="h-3 w-3" /> Vitals
                                        </p>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                                            {n.vitals.bp && <span>BP {n.vitals.bp}</span>}
                                            {n.vitals.hr && <span>HR {n.vitals.hr}</span>}
                                            {n.vitals.temp && <span>Temp {n.vitals.temp}</span>}
                                        </div>
                                    </div>
                                )}
                                {n.follow_up_required && (
                                    <div className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                                        <CalendarClock className="h-3 w-3" />
                                        Follow-up
                                        {n.follow_up_date
                                            ? ` · ${new Date(n.follow_up_date).toLocaleDateString()}`
                                            : ""}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </li>
                ))}
            </ul>
        </section>
    );
}

function Field({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {label}
            </p>
            <p className="mt-0.5 whitespace-pre-wrap text-foreground">{value}</p>
        </div>
    );
}
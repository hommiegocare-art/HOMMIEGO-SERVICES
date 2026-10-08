import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";

type Props = {
    bookingId: string;
    serviceId: string | null;
    caregiverId: string;
};

export default function RatingPanel({ bookingId, serviceId, caregiverId }: Props) {
    const { user } = useSession();
    const [existing, setExisting] = useState<boolean | null>(null);
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const { data, error: e } = await supabase
                .from("reviews")
                .select("id")
                .eq("booking_id", bookingId)
                .maybeSingle();
            if (cancelled) return;
            if (e) {
                setError(e.message);
                setExisting(false);
                return;
            }
            setExisting(!!data);
        })();
        return () => {
            cancelled = true;
        };
    }, [bookingId]);

    if (existing === null) return null; // silently wait
    if (existing || done) return null; // no double rating
    if (!user || user.role !== "client") return null;

    const submit = async () => {
        if (rating < 1) {
            setError("Pick a rating from 1 to 5 stars.");
            return;
        }
        setSubmitting(true);
        setError(null);
        const { error: e } = await supabase.from("reviews").insert({
            booking_id: bookingId,
            service_id: serviceId,
            client_id: user.id,
            caregiver_id: caregiverId,
            rating,
            comment: comment.trim() || null,
        });
        setSubmitting(false);
        if (e) {
            setError(e.message);
            return;
        }
        setDone(true);
    };

    return (
        <Card className="rounded-2xl">
            <CardHeader>
                <CardTitle className="text-base font-medium">Rate this visit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div
                    className="flex items-center gap-1"
                    onMouseLeave={() => setHover(0)}
                    role="radiogroup"
                    aria-label="Rating"
                >
                    {[1, 2, 3, 4, 5].map((n) => {
                        const active = (hover || rating) >= n;
                        return (
                            <button
                                key={n}
                                type="button"
                                role="radio"
                                aria-checked={rating === n}
                                aria-label={`${n} star${n === 1 ? "" : "s"}`}
                                onMouseEnter={() => setHover(n)}
                                onFocus={() => setHover(n)}
                                onClick={() => setRating(n)}
                                className="rounded-md p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <Star
                                    className={
                                        active
                                            ? "h-7 w-7 fill-primary text-primary"
                                            : "h-7 w-7 text-muted-foreground"
                                    }
                                />
                            </button>
                        );
                    })}
                </div>

                <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Optional — anything you want to share about the visit."
                    rows={3}
                />

                {error && (
                    <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        {error}
                    </p>
                )}

                <div className="flex justify-end">
                    <Button onClick={submit} disabled={submitting || rating < 1}>
                        {submitting ? "Submitting…" : "Submit rating"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
// src/components/daily/ContractionTimer.tsx
import { useState } from "react";
import { Clock, Loader2, Save, RotateCcw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePregnancyEvents } from "@/hooks/usePregnancy";

type Contraction = {
    startedAt: number;
    endedAt: number | null;
    intensity: "mild" | "moderate" | "strong";
};

export function ContractionTimer({ clientId }: { clientId: string }) {
    const events = usePregnancyEvents(clientId, {
        from: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 10),
        to: new Date().toISOString().slice(0, 10),
    });

    const [contractions, setContractions] = useState<Contraction[]>([]);
    const [active, setActive] = useState<Contraction | null>(null);
    const [intensity, setIntensity] = useState<"mild" | "moderate" | "strong">("moderate");

    const start = () => {
        setActive({ startedAt: Date.now(), endedAt: null, intensity });
    };

    const stop = () => {
        if (!active) return;
        setContractions((c) => [...c, { ...active, endedAt: Date.now() }]);
        setActive(null);
    };

    const reset = () => {
        setContractions([]);
        setActive(null);
    };

    const save = async () => {
        if (contractions.length === 0) return;
        // Save each contraction as a separate event so the timeline is accurate.
        for (let i = 0; i < contractions.length; i++) {
            const c = contractions[i];
            const duration = Math.round(((c.endedAt ?? Date.now()) - c.startedAt) / 1000);
            const prev = i > 0 ? contractions[i - 1] : null;
            const intervalMin = prev
                ? Math.round((c.startedAt - (prev.endedAt ?? prev.startedAt)) / 60000)
                : null;
            await events.addEvent.mutateAsync({
                event_type: "contraction",
                contraction_duration_seconds: duration,
                contraction_interval_minutes: intervalMin,
                contraction_intensity: c.intensity,
            });
        }
        reset();
    };

    // Compute 5-1-1 rule: contractions <5 min apart, >1 min long, for 1 hour
    const fiveOneOne = (() => {
        const recent = contractions.slice(-6);
        if (recent.length < 6) return false;
        const allStrongEnough = recent.every(
            (c) => (c.endedAt ?? 0) - c.startedAt >= 60_000,
        );
        const intervalsOk = recent.slice(1).every((c, i) => {
            const prev = recent[i];
            return (
                (c.startedAt - (prev.endedAt ?? prev.startedAt)) / 60000 <= 5
            );
        });
        const span =
            (recent[recent.length - 1].startedAt - recent[0].startedAt) / 60000;
        return allStrongEnough && intervalsOk && span >= 60;
    })();

    return (
        <div className="rounded-2xl bg-card px-4 py-4">
            <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-primary" />
                <p className="text-sm font-bold text-foreground">Contraction timer</p>
            </div>

            <p className="text-xs text-muted-foreground mb-3">
                Time each contraction. Go to hospital if you follow the 5-1-1 rule:
                every 5 min, lasting 1 min, for 1 hour.
            </p>

            {fiveOneOne && (
                <div className="rounded-2xl bg-destructive/10 border border-destructive/30 px-3 py-2 mb-3 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-xs text-destructive font-semibold">
                        5-1-1 pattern reached. Consider going to your hospital now.
                    </p>
                </div>
            )}

            {/* Intensity selector */}
            <div className="flex gap-1.5 mb-3">
                {(["mild", "moderate", "strong"] as const).map((i) => (
                    <button
                        key={i}
                        onClick={() => setIntensity(i)}
                        className={`flex-1 h-9 rounded-2xl text-xs font-semibold capitalize transition-colors ${intensity === i
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                            }`}
                    >
                        {i}
                    </button>
                ))}
            </div>

            {/* Timer button */}
            <button
                onClick={active ? stop : start}
                className={`w-full h-24 rounded-2xl flex flex-col items-center justify-center transition-all ${active
                    ? "bg-destructive text-destructive-foreground active:scale-[0.98]"
                    : "bg-primary text-primary-foreground active:scale-[0.98]"
                    }`}
            >
                <span className="text-lg font-bold">
                    {active ? "STOP" : "START CONTRACTION"}
                </span>
                {active && (
                    <span className="text-xs mt-1 opacity-90">
                        Started at{" "}
                        {new Date(active.startedAt).toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                        })}
                    </span>
                )}
            </button>

            {/* Session list */}
            {contractions.length > 0 && (
                <div className="mt-4 space-y-1">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">
                        This session ({contractions.length})
                    </p>
                    {contractions
                        .slice()
                        .reverse()
                        .map((c, idx) => {
                            const dur = Math.round(
                                ((c.endedAt ?? Date.now()) - c.startedAt) / 1000,
                            );
                            const prev =
                                idx < contractions.length - 1
                                    ? contractions[contractions.length - idx - 2]
                                    : null;
                            const interval = prev
                                ? Math.round(
                                    (c.startedAt -
                                        (prev.endedAt ?? prev.startedAt)) /
                                    60000,
                                )
                                : null;
                            return (
                                <div
                                    key={c.startedAt}
                                    className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-muted/60"
                                >
                                    <span className="text-muted-foreground">
                                        {new Date(c.startedAt).toLocaleTimeString(
                                            undefined,
                                            { hour: "2-digit", minute: "2-digit" },
                                        )}
                                    </span>
                                    <span className="font-semibold text-foreground">
                                        {dur}s
                                        {interval != null ? ` · ${interval}m apart` : ""}
                                    </span>
                                    <span className="text-muted-foreground capitalize text-[10px]">
                                        {c.intensity}
                                    </span>
                                </div>
                            );
                        })}
                </div>
            )}

            {contractions.length > 0 && (
                <div className="flex gap-2 mt-3">
                    <Button
                        onClick={reset}
                        variant="secondary"
                        className="flex-1 h-11 rounded-2xl"
                    >
                        <RotateCcw className="w-4 h-4 mr-1.5" /> Reset
                    </Button>
                    <Button
                        onClick={save}
                        disabled={events.addEvent.isPending}
                        className="flex-1 h-11 rounded-2xl"
                    >
                        {events.addEvent.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-1.5" /> Save
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
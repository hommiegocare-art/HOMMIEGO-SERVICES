// src/components/daily/KickCounter.tsx
import { useEffect, useRef, useState } from "react";
import { Baby, Play, Square, RotateCcw, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePregnancyEvents } from "@/hooks/usePregnancy";

export function KickCounter({ clientId }: { clientId: string }) {
    const events = usePregnancyEvents(clientId, {
        from: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 10),
        to: new Date().toISOString().slice(0, 10),
    });

    const [active, setActive] = useState(false);
    const [count, setCount] = useState(0);
    const [startedAt, setStartedAt] = useState<number | null>(null);
    const [elapsedSec, setElapsedSec] = useState(0);
    const tickRef = useRef<number | null>(null);

    // Tick every second while the session is running
    useEffect(() => {
        if (!active || !startedAt) {
            if (tickRef.current) {
                window.clearInterval(tickRef.current);
                tickRef.current = null;
            }
            return;
        }
        tickRef.current = window.setInterval(() => {
            setElapsedSec(Math.floor((Date.now() - startedAt) / 1000));
        }, 1000);
        return () => {
            if (tickRef.current) {
                window.clearInterval(tickRef.current);
                tickRef.current = null;
            }
        };
    }, [active, startedAt]);

    const start = () => {
        setActive(true);
        setCount(0);
        setElapsedSec(0);
        setStartedAt(Date.now());
    };

    const tap = () => {
        if (active) setCount((c) => c + 1);
    };

    const stop = () => {
        setActive(false);
    };

    const reset = () => {
        setActive(false);
        setCount(0);
        setStartedAt(null);
        setElapsedSec(0);
    };

    const save = async () => {
        if (count === 0) return;
        const minutes = Math.max(1, Math.round(elapsedSec / 60));
        await events.addEvent.mutateAsync({
            event_type: "kick_session",
            kick_count: count,
            kick_duration_minutes: minutes,
            notes:
                count >= 10 && minutes <= 120
                    ? "Baby is active — normal pattern"
                    : count < 10 && minutes > 120
                        ? "Fewer than 10 kicks in 2 hours — consider contacting your clinic"
                        : null,
        });
        reset();
    };

    const minutes = Math.floor(elapsedSec / 60);
    const seconds = elapsedSec % 60;

    return (
        <div className="rounded-2xl bg-card px-4 py-4">
            <div className="flex items-center gap-2 mb-3">
                <Baby className="w-4 h-4 text-primary" />
                <p className="text-sm font-bold text-foreground">Kick counter</p>
            </div>

            <p className="text-xs text-muted-foreground mb-3">
                Tap the button every time you feel baby move. Aim for 10 kicks in 2
                hours.
            </p>

            {/* Big tap button */}
            <button
                onClick={tap}
                disabled={!active}
                className={`w-full aspect-square max-w-xs mx-auto rounded-full flex flex-col items-center justify-center transition-all ${active
                    ? "bg-primary text-primary-foreground active:scale-95 shadow-lg"
                    : "bg-muted text-muted-foreground"
                    }`}
            >
                <span className="text-5xl font-black">{count}</span>
                <span className="text-xs mt-1 font-medium">
                    {active ? "Tap for each kick" : "Press Start"}
                </span>
                {active && (
                    <span className="text-[10px] mt-0.5 opacity-80">
                        {minutes}:{String(seconds).padStart(2, "0")}
                    </span>
                )}
            </button>

            <div className="flex gap-2 mt-4">
                {!active && count === 0 && (
                    <Button onClick={start} className="flex-1 h-12 rounded-2xl">
                        <Play className="w-4 h-4 mr-1.5" /> Start session
                    </Button>
                )}

                {active && (
                    <Button
                        onClick={stop}
                        variant="secondary"
                        className="flex-1 h-12 rounded-2xl"
                    >
                        <Square className="w-4 h-4 mr-1.5" /> Stop
                    </Button>
                )}

                {!active && count > 0 && (
                    <>
                        <Button
                            onClick={reset}
                            variant="secondary"
                            className="flex-1 h-12 rounded-2xl"
                        >
                            <RotateCcw className="w-4 h-4 mr-1.5" /> Reset
                        </Button>
                        <Button
                            onClick={save}
                            disabled={events.addEvent.isPending}
                            className="flex-1 h-12 rounded-2xl"
                        >
                            {events.addEvent.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-1.5" /> Save
                                </>
                            )}
                        </Button>
                    </>
                )}
            </div>

            {/* Last 7 days */}
            {(events.byType.get("kick_session") ?? []).length > 0 && (
                <div className="mt-5 pt-4 border-t border-border">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2">
                        Recent sessions
                    </p>
                    <div className="space-y-1">
                        {(events.byType.get("kick_session") ?? [])
                            .slice(0, 5)
                            .map((e) => (
                                <div
                                    key={e.id}
                                    className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-muted/60"
                                >
                                    <span className="text-muted-foreground">
                                        {new Date(e.entry_date).toLocaleDateString(
                                            undefined,
                                            { day: "numeric", month: "short" },
                                        )}
                                    </span>
                                    <span className="font-semibold text-foreground">
                                        {e.kick_count} kicks · {e.kick_duration_minutes}m
                                    </span>
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}
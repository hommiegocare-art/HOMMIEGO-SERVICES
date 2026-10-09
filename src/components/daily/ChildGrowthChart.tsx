// src/components/daily/ChildGrowthChart.tsx
import { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import type { DailyChildEvent } from "@/types/daily";

type Point = { date: string; value: number };

export function ChildGrowthChart({
    events,
    metric,
}: {
    events: DailyChildEvent[];
    metric: "weight" | "height";
}) {
    const points = useMemo<Point[]>(() => {
        const key = metric === "weight" ? "weight_kg" : "height_cm";
        return events
            .filter((e) => e[key] != null)
            .map((e) => ({
                date: e.entry_date,
                value: Number(e[key]),
            }))
            .sort((a, b) => (a.date < b.date ? -1 : 1));
    }, [events, metric]);

    if (points.length < 2) {
        return (
            <div className="rounded-2xl bg-muted/60 border border-border px-4 py-6 text-center">
                <TrendingUp className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">
                    Log {metric === "weight" ? "at least 2 weights" : "at least 2 heights"}{" "}
                    to see the trend.
                </p>
            </div>
        );
    }

    const W = 320;
    const H = 120;
    const PAD = 24;
    const values = points.map((p) => p.value);
    const minV = Math.min(...values);
    const maxV = Math.max(...values);
    const range = maxV - minV || 1;

    const xFor = (i: number) =>
        PAD + (i / (points.length - 1)) * (W - 2 * PAD);
    const yFor = (v: number) =>
        H - PAD - ((v - minV) / range) * (H - 2 * PAD);

    const path = points
        .map((p, i) => {
            const x = xFor(i);
            const y = yFor(p.value);
            return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
        })
        .join(" ");

    const latest = points[points.length - 1].value;
    const first = points[0].value;
    const delta = latest - first;
    const unit = metric === "weight" ? "kg" : "cm";

    return (
        <div className="rounded-2xl bg-muted/60 px-3 py-3">
            <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-foreground capitalize">
                    {metric} trend
                </p>
                <p className="text-[10px] text-muted-foreground">
                    Latest: {latest} {unit}
                    {delta !== 0 && (
                        <span
                            className={
                                delta > 0 ? "text-primary ml-1" : "text-destructive ml-1"
                            }
                        >
                            ({delta > 0 ? "+" : ""}
                            {delta.toFixed(1)})
                        </span>
                    )}
                </p>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
                {/* grid */}
                <line
                    x1={PAD}
                    y1={H - PAD}
                    x2={W - PAD}
                    y2={H - PAD}
                    stroke="hsl(var(--border))"
                    strokeWidth={1}
                />
                <line
                    x1={PAD}
                    y1={PAD}
                    x2={PAD}
                    y2={H - PAD}
                    stroke="hsl(var(--border))"
                    strokeWidth={1}
                />
                {/* line */}
                <path
                    d={path}
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                {/* dots */}
                {points.map((p, i) => (
                    <circle
                        key={i}
                        cx={xFor(i)}
                        cy={yFor(p.value)}
                        r={3}
                        fill="hsl(var(--primary))"
                    />
                ))}
            </svg>
        </div>
    );
}
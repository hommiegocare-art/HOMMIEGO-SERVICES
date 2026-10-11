// src/components/daily/charts/LineChart.tsx
import type { TrendPoint } from "@/lib/healthAnalytics";

export function LineChart({
    points,
    height = 140,
    color = "hsl(var(--primary))",
    unit = "",
    fill = true,
}: {
    points: TrendPoint[];
    height?: number;
    color?: string;
    unit?: string;
    fill?: boolean;
}) {
    const nonZero = points.filter((p) => p.value > 0);

    if (points.length === 0 || nonZero.length === 0) {
        return (
            <div className="rounded-2xl bg-muted/60 px-4 py-8 text-center">
                <p className="text-xs text-muted-foreground">
                    No data yet — log an entry to start the chart.
                </p>
            </div>
        );
    }

    const W = 340;
    const H = height;
    const PAD = 22;
    const values = points.map((p) => p.value);
    const min = Math.min(...values, 0);
    const max = Math.max(...values, 1);
    const range = max - min || 1;
    const count = points.length;

    const x = (i: number) =>
        count === 1 ? W / 2 : PAD + (i / (count - 1)) * (W - PAD * 2);
    const y = (v: number) => H - PAD - ((v - min) / range) * (H - PAD * 2);

    const line = points
        .map((p, i) => `${i ? "L" : "M"} ${x(i)} ${y(p.value)}`)
        .join(" ");
    const area =
        count >= 2
            ? `${line} L ${x(count - 1)} ${H - PAD} L ${x(0)} ${H - PAD} Z`
            : "";

    const last = points[points.length - 1];

    return (
        <div className="rounded-2xl bg-muted/60 px-3 py-3">
            <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                    {count}-day trend
                </p>
                <p className="text-[10px] text-muted-foreground">
                    Latest:{" "}
                    <span className="font-semibold text-foreground">
                        {last.value.toFixed(1)}
                        {unit}
                    </span>
                </p>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
                <line
                    x1={PAD}
                    y1={H - PAD}
                    x2={W - PAD}
                    y2={H - PAD}
                    stroke="hsl(var(--border))"
                />
                <line
                    x1={PAD}
                    y1={PAD}
                    x2={PAD}
                    y2={H - PAD}
                    stroke="hsl(var(--border))"
                />
                {fill && count >= 2 && <path d={area} fill={color} opacity={0.15} />}
                {count >= 2 && (
                    <path
                        d={line}
                        fill="none"
                        stroke={color}
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                )}
                {points.map((p, i) => (
                    <circle
                        key={i}
                        cx={x(i)}
                        cy={y(p.value)}
                        r={count === 1 ? 5 : 2.5}
                        fill={color}
                    />
                ))}
            </svg>
            {count === 1 && (
                <p className="text-[10px] text-muted-foreground text-center mt-1">
                    One data point so far — log more to see the trend.
                </p>
            )}
        </div>
    );
}
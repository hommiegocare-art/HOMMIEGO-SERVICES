// src/components/daily/charts/DualLineChart.tsx
import type { TrendPoint } from "@/lib/healthAnalytics";

export function DualLineChart({
    seriesA,
    seriesB,
    colorA = "hsl(var(--primary))",
    colorB = "hsl(var(--destructive))",
    labelA = "A",
    labelB = "B",
    unit = "",
    height = 140,
}: {
    seriesA: TrendPoint[];
    seriesB: TrendPoint[];
    colorA?: string;
    colorB?: string;
    labelA?: string;
    labelB?: string;
    unit?: string;
    height?: number;
}) {
    const hasA = seriesA.some((p) => p.value > 0);
    const hasB = seriesB.some((p) => p.value > 0);

    if (!hasA && !hasB) {
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
    const all = [...seriesA, ...seriesB].map((p) => p.value);
    const min = Math.min(...all, 0);
    const max = Math.max(...all, 1);
    const range = max - min || 1;
    const count = Math.max(seriesA.length, seriesB.length);

    const x = (i: number) =>
        count === 1 ? W / 2 : PAD + (i / (count - 1)) * (W - PAD * 2);
    const y = (v: number) => H - PAD - ((v - min) / range) * (H - PAD * 2);

    const lineFor = (s: TrendPoint[]) =>
        s.map((p, i) => `${i ? "L" : "M"} ${x(i)} ${y(p.value)}`).join(" ");

    const lastA = seriesA[seriesA.length - 1];
    const lastB = seriesB[seriesB.length - 1];

    return (
        <div className="rounded-2xl bg-muted/60 px-3 py-3">
            <div className="flex items-center gap-3 mb-2 text-[10px]">
                <span className="inline-flex items-center gap-1">
                    <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: colorA }}
                    />
                    <span className="text-muted-foreground">
                        {labelA} {lastA ? `· ${lastA.value.toFixed(0)}${unit}` : ""}
                    </span>
                </span>
                <span className="inline-flex items-center gap-1">
                    <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: colorB }}
                    />
                    <span className="text-muted-foreground">
                        {labelB} {lastB ? `· ${lastB.value.toFixed(0)}${unit}` : ""}
                    </span>
                </span>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
                <line
                    x1={PAD}
                    y1={H - PAD}
                    x2={W - PAD}
                    y2={H - PAD}
                    stroke="hsl(var(--muted))"
                />
                <line
                    x1={PAD}
                    y1={PAD}
                    x2={PAD}
                    y2={H - PAD}
                    stroke="hsl(var(--muted))"
                />
                {seriesA.length >= 2 && (
                    <path
                        d={lineFor(seriesA)}
                        fill="none"
                        stroke={colorA}
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                )}
                {seriesB.length >= 2 && (
                    <path
                        d={lineFor(seriesB)}
                        fill="none"
                        stroke={colorB}
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                )}
                {seriesA.map((p, i) => (
                    <circle
                        key={`a${i}`}
                        cx={x(i)}
                        cy={y(p.value)}
                        r={seriesA.length === 1 ? 5 : 2.5}
                        fill={colorA}
                    />
                ))}
                {seriesB.map((p, i) => (
                    <circle
                        key={`b${i}`}
                        cx={x(i)}
                        cy={y(p.value)}
                        r={seriesB.length === 1 ? 5 : 2.5}
                        fill={colorB}
                    />
                ))}
            </svg>
        </div>
    );
}
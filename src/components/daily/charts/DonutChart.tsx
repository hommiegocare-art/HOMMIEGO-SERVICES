// src/components/daily/charts/DonutChart.tsx
import type { Slice } from "@/lib/healthAnalytics";

export function DonutChart({
    slices,
    size = 140,
}: {
    slices: Slice[];
    size?: number;
}) {
    const total = slices.reduce((a, s) => a + s.count, 0);

    if (slices.length === 0 || total === 0) {
        return (
            <div className="rounded-2xl bg-muted/60 px-4 py-8 text-center">
                <p className="text-xs text-muted-foreground">Nothing logged yet.</p>
            </div>
        );
    }

    const R = size / 2;
    const stroke = 22;
    const r = R - stroke / 2;
    const C = 2 * Math.PI * r;
    let offset = 0;

    return (
        <div className="flex items-center gap-4">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <g transform={`rotate(-90 ${R} ${R})`}>
                    {slices.map((s) => {
                        const len = (s.count / total) * C;
                        const el = (
                            <circle
                                key={s.key}
                                cx={R}
                                cy={R}
                                r={r}
                                fill="none"
                                stroke={s.color}
                                strokeWidth={stroke}
                                strokeDasharray={`${len} ${C - len}`}
                                strokeDashoffset={-offset}
                            />
                        );
                        offset += len;
                        return el;
                    })}
                </g>
                <text
                    x={R}
                    y={R - 4}
                    textAnchor="middle"
                    className="fill-foreground"
                    fontSize="20"
                    fontWeight="800"
                >
                    {total}
                </text>
                <text
                    x={R}
                    y={R + 14}
                    textAnchor="middle"
                    className="fill-muted-foreground"
                    fontSize="9"
                >
                    {total === 1 ? "entry" : "entries"}
                </text>
            </svg>
            <div className="flex-1 space-y-1.5">
                {slices.map((s) => (
                    <div key={s.key} className="flex items-center gap-2 text-xs">
                        <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ background: s.color }}
                        />
                        <span className="text-foreground font-medium flex-1 truncate">
                            {s.label}
                        </span>
                        <span className="text-muted-foreground">
                            {Math.round((s.count / total) * 100)}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
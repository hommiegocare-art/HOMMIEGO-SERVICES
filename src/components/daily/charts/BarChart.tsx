// src/components/daily/charts/BarChart.tsx
import type { Slice } from "@/lib/healthAnalytics";

export function BarChart({ bars }: { bars: Slice[] }) {
    if (bars.length === 0) {
        return (
            <div className="rounded-2xl bg-muted/60 px-4 py-8 text-center">
                <p className="text-xs text-muted-foreground">
                    No symptoms logged in this period.
                </p>
            </div>
        );
    }

    const max = Math.max(...bars.map((b) => b.count), 1);

    return (
        <div className="space-y-2">
            {bars.map((b) => (
                <div key={b.key} className="flex items-center gap-2 text-xs">
                    <span className="w-24 truncate text-muted-foreground capitalize">
                        {b.label}
                    </span>
                    <div className="flex-1 h-5 rounded-full bg-muted overflow-hidden">
                        <div
                            className="h-full rounded-full"
                            style={{
                                width: `${(b.count / max) * 100}%`,
                                background: b.color,
                            }}
                        />
                    </div>
                    <span className="w-6 text-right font-semibold text-foreground">
                        {b.count}
                    </span>
                </div>
            ))}
        </div>
    );
}
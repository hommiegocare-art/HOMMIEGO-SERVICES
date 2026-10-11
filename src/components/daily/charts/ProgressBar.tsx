// src/components/daily/charts/ProgressBar.tsx
export function ProgressBar({
    value,
    max,
    label,
    sublabel,
    color = "hsl(var(--primary))",
}: {
    value: number;
    max: number;
    label?: string;
    sublabel?: string;
    color?: string;
}) {
    const pct = Math.min(100, Math.max(0, (value / Math.max(1, max)) * 100));

    return (
        <div className="space-y-1.5">
            {(label || sublabel) && (
                <div className="flex items-center justify-between text-xs">
                    {label && <span className="font-semibold text-foreground">{label}</span>}
                    {sublabel && (
                        <span className="text-muted-foreground">{sublabel}</span>
                    )}
                </div>
            )}
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: color }}
                />
            </div>
        </div>
    );
}
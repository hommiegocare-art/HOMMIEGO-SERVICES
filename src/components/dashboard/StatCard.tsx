// src/components/dashboard/StatCard.tsx
import type { ReactNode } from "react";

export function StatCard({
    label,
    value,
    icon,
}: {
    label: string;
    value: string;
    icon?: ReactNode;
}) {
    return (
        <div className="rounded-2xl bg-card px-4 py-3">
            <p className="text-xl font-black text-foreground inline-flex items-center gap-1.5">
                {icon}
                {value}
            </p>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mt-1">
                {label}
            </p>
        </div>
    );
}
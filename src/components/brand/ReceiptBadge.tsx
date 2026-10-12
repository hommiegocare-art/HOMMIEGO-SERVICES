// src/components/brand/ReceiptBadge.tsx
import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ReceiptBadge — same visual language as VerifiedBadge (lucide BadgeCheck).
 * - "read"       → filled red, white tick (matches VerifiedBadge exactly)
 * - "delivered"  → greyed outline, slightly more opaque
 * - "sent"       → greyed outline, more muted
 *
 * Usage:
 *   <ReceiptBadge state={m.readAt ? "read" : m.deliveredAt ? "delivered" : "sent"} />
 */
export function ReceiptBadge({
    state,
    className = "w-3.5 h-3.5",
}: {
    state: "sent" | "delivered" | "read";
    className?: string;
}) {
    if (state === "read") {
        return (
            <span
                role="img"
                aria-label="Read"
                title="Read"
                className={cn("inline-flex items-center justify-center shrink-0", className)}
            >
                <BadgeCheck
                    className="w-full h-full text-white fill-[#E41E3F]"
                    strokeWidth={2.2}
                    aria-hidden="true"
                />
            </span>
        );
    }

    return (
        <span
            role="img"
            aria-label={state === "delivered" ? "Delivered" : "Sent"}
            title={state === "delivered" ? "Delivered" : "Sent"}
            className={cn("inline-flex items-center justify-center shrink-0", className)}
        >
            <BadgeCheck
                className={cn(
                    // Light, on-brand on a blue primary bubble.
                    // Uses currentColor so it inherits the parent's text colour,
                    // which is already text-primary-foreground/80 on your bubbles.
                    "w-full h-full text-current",
                    state === "delivered" ? "opacity-90" : "opacity-60",
                )}
                strokeWidth={2}
                aria-hidden="true"
            />
        </span>
    );
}
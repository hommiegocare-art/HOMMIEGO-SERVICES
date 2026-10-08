// src/components/brand/Logo.tsx
import { cn } from "@/lib/utils";

type Props = {
    size?: "sm" | "md" | "lg" | "xl";
    showIcon?: boolean;
    className?: string;
};

const SIZE: Record<NonNullable<Props["size"]>, string> = {
    sm: "text-xl",
    md: "text-3xl",
    lg: "text-5xl",
    xl: "text-6xl sm:text-7xl md:text-8xl",
};

const ICON_SIZE: Record<NonNullable<Props["size"]>, string> = {
    sm: "h-6 w-6",
    md: "h-9 w-9",
    lg: "h-14 w-14",
    xl: "h-20 w-20 sm:h-24 sm:w-24",
};

/**
 * HommieCare wordmark.
 * - Uses the Pacifico script font for the flowing signature look.
 * - HOMMIE renders in text-foreground → black in light, white in dark.
 * - CARE renders in text-brand-red → consistent red across themes.
 */
export function Logo({ size = "md", showIcon = false, className }: Props) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-2 leading-none select-none",
                className,
            )}
            aria-label="HommieCare"
        >
            {showIcon && (
                <img
                    src="/pwa-192x192.png"
                    alt=""
                    className={cn("rounded-full shrink-0", ICON_SIZE[size])}
                />
            )}

            <span
                className={cn(
                    "font-script tracking-tight whitespace-nowrap",
                    SIZE[size],
                )}
                style={{ paddingBottom: "0.15em" }}
            >
                <span className="text-foreground">Hommie</span>
                <span className="text-brand-red">Care</span>
            </span>
        </span>
    );
}
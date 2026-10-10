import { BadgeCheck } from "lucide-react";

/**
 * VerifiedBadge — lucide BadgeCheck, filled red, white tick.
 * Rendered only when `show` is true.
 *
 * Usage:
 *   <VerifiedBadge show={caregiver?.verification_status === "verified"} />
 *   <VerifiedBadge show={profile.is_verified} className="w-6 h-6" />
 */
export function VerifiedBadge({
    show,
    className = "w-7 h-7",
    title = "Verified by HommieCare",
}: {
    show?: boolean;
    className?: string;
    title?: string;
}) {
    if (!show) return null;
    return (
        <span
            role="img"
            aria-label={title}
            title={title}
            className={`inline-flex items-center justify-center shrink-0 ${className}`}
        >
            <BadgeCheck
                className="w-full h-full text-white fill-[#E41E3F]"
                strokeWidth={2.2}
                aria-hidden="true"
            />
        </span>
    );
}
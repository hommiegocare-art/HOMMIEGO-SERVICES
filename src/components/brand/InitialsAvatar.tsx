import { useEffect, useState } from "react";

/* deterministic color from a name (same name → same color, like WhatsApp) */
function stringToColor(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 55%, 45%)`;
}

function getInitials(name: string) {
    const clean = (name || "").trim();
    if (!clean) return "?";
    const parts = clean.split(/\s+/);
    if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
    return (
        (parts[0][0] ?? "") + (parts[parts.length - 1][0] ?? "")
    ).toUpperCase();
}

type Props = {
    url?: string | null;
    name: string;
    /** extra classes for the outer wrapper (size/rounding) */
    className?: string;
    /** text size for the initial fallback */
    textClassName?: string;
    /** optional online dot */
    online?: boolean;
};

export function InitialsAvatar({
    url,
    name,
    className = "h-20 w-20",
    textClassName = "text-2xl",
    online,
}: Props) {
    const [failed, setFailed] = useState(false);

    // reset failure state when URL changes (important for infinite scroll re-use)
    useEffect(() => {
        setFailed(false);
    }, [url]);

    const showFallback = !url || failed;
    const initials = getInitials(name);
    const bg = stringToColor(name || "user");

    return (
        <div className="relative shrink-0">
            <div
                className={`${className} rounded-full overflow-hidden flex items-center justify-center font-black text-white select-none`}
                style={{ background: showFallback ? bg : undefined }}
            >
                {showFallback ? (
                    <span className={textClassName}>{initials}</span>
                ) : (
                    <img
                        src={url!}
                        alt={name}
                        loading="lazy"
                        decoding="async"
                        onError={() => setFailed(true)}
                        className="h-full w-full object-cover"
                    />
                )}
            </div>

            {online && (
                <span
                    className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-success ring-2 ring-card"
                    aria-label="Online"
                />
            )}
        </div>
    );
}
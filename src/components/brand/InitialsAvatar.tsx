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

/** Preset sizes — px is the outer box; text is the initials fallback. */
const SIZE_PRESET = {
    xs: { box: "h-6 w-6", text: "text-[10px]", dot: "h-2.5 w-2.5" },
    sm: { box: "h-8 w-8", text: "text-xs", dot: "h-3 w-3" },
    md: { box: "h-11 w-11", text: "text-sm", dot: "h-3.5 w-3.5" },
    lg: { box: "h-16 w-16", text: "text-lg", dot: "h-4 w-4" },
    xl: { box: "h-20 w-20", text: "text-2xl", dot: "h-4 w-4" },
} as const;

type Size = keyof typeof SIZE_PRESET;

type Props = {
    url?: string | null;
    name: string;
    /**
     * Preset size — preferred over className when you just want a standard size.
     * Default: "xl" to match the previous h-20 w-20 default.
     */
    size?: Size;
    /** extra classes for the outer wrapper (overrides `size` if both are set) */
    className?: string;
    /** text size for the initial fallback (overrides `size` if both are set) */
    textClassName?: string;
    /** optional online dot */
    online?: boolean;
};

export function InitialsAvatar({
    url,
    name,
    size = "xl",
    className,
    textClassName,
    online,
}: Props) {
    const [failed, setFailed] = useState(false);

    // reset failure state when URL changes (important for infinite scroll re-use)
    useEffect(() => {
        setFailed(false);
    }, [url]);

    const preset = SIZE_PRESET[size];

    // className / textClassName win if explicitly passed — keeps backward compat
    const boxClass = className ?? preset.box;
    const initialsClass = textClassName ?? preset.text;
    const dotClass = preset.dot;

    const showFallback = !url || failed;
    const initials = getInitials(name);
    const bg = stringToColor(name || "user");

    return (
        <div className="relative shrink-0">
            <div
                className={`${boxClass} rounded-full overflow-hidden flex items-center justify-center font-black text-white select-none`}
                style={{ background: showFallback ? bg : undefined }}
            >
                {showFallback ? (
                    <span className={initialsClass}>{initials}</span>
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
                    className={`absolute bottom-0 right-0 ${dotClass} rounded-full bg-success ring-2 ring-card`}
                    aria-label="Online"
                />
            )}
        </div>
    );
}
export type WallpaperKind = "none" | "default" | "solid" | "gradient" | "custom";

export type ChatWallpaper =
    | { kind: "none" }
    | { kind: "default" }                        // app-shipped image from /public
    | { kind: "solid"; value: string }
    | { kind: "gradient"; value: string }        // full CSS gradient string
    | { kind: "custom"; dim: number };           // dim = 0..80 (%); bytes come from IndexedDB via connectionId

/** Served from /public. Change the filename here if you rename it. */
export const DEFAULT_WALLPAPER_URL = "/wallpaper.png";

/** Default dim applied to the shipped image so bubbles stay readable. */
const DEFAULT_WALLPAPER_DIM = 0.20;

export const SOLID_PRESETS: { id: string; color: string; label: string }[] = [
    { id: "s1", color: "#0b1220", label: "Midnight" },
    { id: "s2", color: "#0f172a", label: "Slate" },
    { id: "s3", color: "#111827", label: "Charcoal" },
    { id: "s4", color: "#1f2937", label: "Graphite" },
    { id: "s5", color: "#f1f5f9", label: "Fog" },
    { id: "s6", color: "#fef3c7", label: "Cream" },
    { id: "s7", color: "#e0f2fe", label: "Sky" },
    { id: "s8", color: "#dcfce7", label: "Mint" },
];

export const GRADIENT_PRESETS: { id: string; css: string; label: string }[] = [
    { id: "g1", label: "Aurora", css: "linear-gradient(135deg,#0f2027,#203a43,#2c5364)" },
    { id: "g2", label: "Sunset", css: "linear-gradient(135deg,#ff9a9e,#fad0c4,#fbc2eb)" },
    { id: "g3", label: "Grape", css: "linear-gradient(135deg,#4e54c8,#8f94fb)" },
    { id: "g4", label: "Peach", css: "linear-gradient(135deg,#ffecd2,#fcb69f)" },
    { id: "g5", label: "Ocean", css: "linear-gradient(135deg,#2193b0,#6dd5ed)" },
    { id: "g6", label: "Forest", css: "linear-gradient(135deg,#134e5e,#71b280)" },
    { id: "g7", label: "Rose", css: "linear-gradient(135deg,#ee9ca7,#ffdde1)" },
    { id: "g8", label: "Night", css: "linear-gradient(135deg,#232526,#414345)" },
    { id: "g9", label: "Candy", css: "linear-gradient(135deg,#a1c4fd,#c2e9fb)" },
    { id: "g10", label: "Ember", css: "linear-gradient(135deg,#f12711,#f5af19)" },
];

const STORAGE_PREFIX = "chat.wallpaper.";

/**
 * Load the wallpaper descriptor for a connection.
 *
 * - First-time users get the shipped default image.
 * - Old cloud-based records (`{ kind: "custom", url, dim }`) are reset
 *   to the default because the URL may have expired.
 */
export function loadWallpaper(connectionId: string): ChatWallpaper {
    try {
        const raw = localStorage.getItem(STORAGE_PREFIX + connectionId);
        if (!raw) return { kind: "default" };
        const parsed = JSON.parse(raw) as any;

        // Migration: drop stale cloud-based custom wallpapers.
        if (parsed?.kind === "custom" && typeof parsed.url === "string") {
            return { kind: "default" };
        }

        if (parsed && typeof parsed === "object" && "kind" in parsed) {
            return parsed as ChatWallpaper;
        }
    } catch {
        /* ignore */
    }
    return { kind: "default" };
}

export function saveWallpaper(connectionId: string, wp: ChatWallpaper) {
    try {
        localStorage.setItem(STORAGE_PREFIX + connectionId, JSON.stringify(wp));
    } catch {
        /* quota / private mode */
    }
}

/**
 * Convert a wallpaper descriptor to inline styles.
 * For `custom`, pass the resolved blob URL (from IndexedDB) as `customUrl`.
 */
export function wallpaperToStyle(
    wp: ChatWallpaper,
    customUrl?: string | null,
): React.CSSProperties {
    switch (wp.kind) {
        case "none":
            return {};
        case "default":
            return {
                backgroundImage: `url(${DEFAULT_WALLPAPER_URL})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
            };
        case "solid":
            return { backgroundColor: wp.value };
        case "gradient":
            return { backgroundImage: wp.value };
        case "custom":
            if (!customUrl) {
                // Transparent while the blob URL resolves — avoids a dark flash.
                return {};
            }
            return {
                backgroundImage: `url(${customUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
            };
    }
}

/**
 * Returns the dim overlay opacity (0..1).
 * - `default`: a small fixed dim so the shipped image doesn't wash out bubbles.
 * - `custom`: user-controlled dim.
 * - everything else: no dim.
 */
export function wallpaperDimOpacity(wp: ChatWallpaper): number {
    if (wp.kind === "default") return DEFAULT_WALLPAPER_DIM;
    if (wp.kind === "custom") return Math.min(Math.max(wp.dim, 0), 80) / 100;
    return 0;
}

/**
 * Heuristic: is this wallpaper light enough that foreground neutrals
 * (bubbles, dividers) should be adjusted for readability?
 */
export function wallpaperIsLight(wp: ChatWallpaper): boolean {
    if (wp.kind === "default") return false; // assume your shipped image is mid/dark
    if (wp.kind === "solid") {
        const hex = wp.value.replace("#", "");
        if (hex.length === 6) {
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
        }
    }
    // Peaches / creams / mints etc. are light — heuristic by hex content
    if (wp.kind === "gradient") {
        return /#f|#e|#d/i.test(wp.value);
    }
    return false;
}

/**
 * True when the wallpaper relies on an IndexedDB blob that we should
 * clean up when the user switches away from it.
 */
export function usesLocalBlob(wp: ChatWallpaper): boolean {
    return wp.kind === "custom";
}
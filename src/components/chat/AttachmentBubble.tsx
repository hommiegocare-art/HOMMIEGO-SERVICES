// src/components/chat/AttachmentBubble.tsx
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatAttachment } from "@/hooks/useChatWindow";

const MAX_VISIBLE_TILES = 4;

function withTransform(
    url: string,
    transform: string,
    resourceType: "image" | "video",
): string {
    const marker = `/${resourceType}/upload/`;
    const idx = url.indexOf(marker);
    if (idx === -1) return url;
    const head = url.slice(0, idx + marker.length);
    const tail = url.slice(idx + marker.length);
    return `${head}${transform}/${tail}`;
}

function thumbUrl(a: ChatAttachment, size: number): string {
    if (a.kind === "image") {
        return withTransform(
            a.url,
            `c_fill,w_${size},h_${size},q_auto,f_auto`,
            "image",
        );
    }
    // Video poster frame.
    return withTransform(
        a.url,
        `so_1,w_${size},h_${size},c_fill,q_auto`,
        "video",
    ).replace(/\.(mp4|mov|webm|m4v)$/i, ".jpg");
}

function fmtDuration(seconds: number | null): string {
    if (!seconds || seconds <= 0) return "";
    const s = Math.round(seconds);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m > 0 ? `${m}:${String(r).padStart(2, "0")}` : `0:${String(r).padStart(2, "0")}`;
}

function Tile({
    a,
    size,
    className,
    onOpen,
    overlayCount,
}: {
    a: ChatAttachment;
    size: number;
    className?: string;
    onOpen: () => void;
    overlayCount?: number;
}) {
    const dur = a.kind === "video" ? fmtDuration(a.durationSeconds) : "";
    return (
        <button
            type="button"
            onClick={onOpen}
            className={cn(
                "relative block overflow-hidden rounded-2xl bg-muted",
                className,
            )}
            aria-label={a.kind === "image" ? "Open photo" : "Open video"}
        >
            <img
                src={thumbUrl(a, size)}
                alt=""
                loading="lazy"
                draggable={false}
                className="block h-full w-full object-cover"
            />
            {a.kind === "video" ? (
                <span className="absolute inset-0 flex items-center justify-center bg-foreground/20">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-card/90">
                        <Play
                            className="ml-0.5 h-4 w-4 text-foreground"
                            fill="currentColor"
                        />
                    </span>
                </span>
            ) : null}
            {dur ? (
                <span className="absolute bottom-1.5 right-1.5 rounded-full bg-foreground/70 px-2 py-0.5 text-[10px] font-bold text-background">
                    {dur}
                </span>
            ) : null}
            {typeof overlayCount === "number" && overlayCount > 0 ? (
                <span className="absolute inset-0 flex items-center justify-center bg-foreground/50">
                    <span className="text-lg font-black text-background">
                        +{overlayCount}
                    </span>
                </span>
            ) : null}
        </button>
    );
}

/**
 * Adaptive grid:
 *   1 → single full-width (4:5 aspect)
 *   2 → two halves side-by-side
 *   3 → one large (2/3 width) + two stacked small on the right
 *   4 → 2x2
 *   5+ → 2x2 with +N overlay on the last tile
 */
export function AttachmentBubble({
    attachments,
    onOpenIndex,
}: {
    attachments: ChatAttachment[];
    onOpenIndex: (index: number) => void;
}) {
    if (attachments.length === 0) return null;

    const a0 = attachments[0];
    const rest = attachments.slice(1);

    // 1 attachment: full-width, tall.
    if (attachments.length === 1) {
        return (
            <div className="w-full max-w-[260px]">
                <Tile
                    a={a0}
                    size={520}
                    className="aspect-[4/5] w-full"
                    onOpen={() => onOpenIndex(0)}
                />
            </div>
        );
    }

    // 2 attachments: two halves side-by-side, square.
    if (attachments.length === 2) {
        return (
            <div className="grid w-full max-w-[260px] grid-cols-2 gap-1">
                {attachments.map((a, i) => (
                    <Tile
                        key={a.id}
                        a={a}
                        size={260}
                        className="aspect-square w-full"
                        onOpen={() => onOpenIndex(i)}
                    />
                ))}
            </div>
        );
    }

    // 3 attachments: one large left + two stacked right.
    if (attachments.length === 3) {
        return (
            <div
                className="grid w-full max-w-[260px] grid-cols-2 grid-rows-2 gap-1"
                style={{ aspectRatio: "1 / 1" }}
            >
                <Tile
                    a={a0}
                    size={520}
                    className="row-span-2 h-full w-full"
                    onOpen={() => onOpenIndex(0)}
                />
                {rest.map((a, i) => (
                    <Tile
                        key={a.id}
                        a={a}
                        size={260}
                        className="h-full w-full"
                        onOpen={() => onOpenIndex(i + 1)}
                    />
                ))}
            </div>
        );
    }

    // 4+ attachments: 2x2 grid, cap at 4 tiles, last shows +N.
    const visible = attachments.slice(0, MAX_VISIBLE_TILES);
    const hiddenCount = attachments.length - MAX_VISIBLE_TILES;
    return (
        <div className="grid w-full max-w-[260px] grid-cols-2 gap-1">
            {visible.map((a, i) => (
                <Tile
                    key={a.id}
                    a={a}
                    size={260}
                    className="aspect-square w-full"
                    onOpen={() => onOpenIndex(i)}
                    overlayCount={
                        i === MAX_VISIBLE_TILES - 1 && hiddenCount > 0
                            ? hiddenCount
                            : undefined
                    }
                />
            ))}
        </div>
    );
}
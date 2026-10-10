// src/components/chat/AttachmentViewer.tsx
import { useEffect, useRef, useState } from "react";
import { Download, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatAttachment } from "@/hooks/useChatWindow";

const SWIPE_THRESHOLD_PX = 60;

export function AttachmentViewer({
    attachments,
    index,
    onClose,
    onIndexChange,
}: {
    attachments: ChatAttachment[];
    index: number;
    onClose: () => void;
    onIndexChange: (i: number) => void;
}) {
    const [zoomed, setZoomed] = useState(false);
    const lastTapRef = useRef<number>(0);
    const touchStartXRef = useRef<number | null>(null);
    const touchStartYRef = useRef<number | null>(null);

    const open = attachments.length > 0;
    const safeIndex = open ? Math.min(Math.max(index, 0), attachments.length - 1) : 0;
    const current = open ? attachments[safeIndex] : null;

    // Reset zoom when the visible attachment changes.
    useEffect(() => {
        setZoomed(false);
    }, [current?.id]);

    // Escape closes. Arrow keys navigate. Body scroll lock while open.
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
                return;
            }
            if (e.key === "ArrowRight") {
                if (safeIndex < attachments.length - 1) onIndexChange(safeIndex + 1);
            }
            if (e.key === "ArrowLeft") {
                if (safeIndex > 0) onIndexChange(safeIndex - 1);
            }
        };
        document.addEventListener("keydown", onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [open, safeIndex, attachments.length, onClose, onIndexChange]);

    if (!open || !current) return null;

    const onImageTap = () => {
        const now = Date.now();
        if (now - lastTapRef.current < 300) {
            setZoomed((z) => !z);
            lastTapRef.current = 0;
        } else {
            lastTapRef.current = now;
        }
    };

    const onTouchStart = (e: React.TouchEvent) => {
        const t = e.touches[0];
        touchStartXRef.current = t.clientX;
        touchStartYRef.current = t.clientY;
    };

    const onTouchEnd = (e: React.TouchEvent) => {
        const sx = touchStartXRef.current;
        const sy = touchStartYRef.current;
        touchStartXRef.current = null;
        touchStartYRef.current = null;
        if (sx === null || sy === null) return;
        // Don't intercept taps inside a video (native controls).
        if (current.kind === "video") return;

        const t = e.changedTouches[0];
        const dx = t.clientX - sx;
        const dy = t.clientY - sy;
        if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
        if (Math.abs(dy) > Math.abs(dx)) return; // vertical scroll, ignore

        if (dx < 0 && safeIndex < attachments.length - 1) {
            onIndexChange(safeIndex + 1);
        } else if (dx > 0 && safeIndex > 0) {
            onIndexChange(safeIndex - 1);
        }
    };

    const hasMany = attachments.length > 1;

    return (
        <div
            className="fixed inset-0 z-50 flex flex-col bg-foreground/80 animate-fade-in"
            onClick={onClose}
        >
            {/* Top bar */}
            <div
                className="flex items-center justify-between gap-2 px-4 py-3"
                onClick={(e) => e.stopPropagation()}
            >
                <span className="text-[11px] font-bold text-background/80">
                    {hasMany ? `${safeIndex + 1} / ${attachments.length}` : ""}
                </span>
                <div className="flex items-center gap-2">
                    <a
                        href={current.url}
                        download
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Download"
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-card/90 text-foreground transition-colors active:opacity-90"
                    >
                        <Download className="h-5 w-5" />
                    </a>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-card/90 text-foreground transition-colors active:opacity-90"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div
                className="flex flex-1 items-center justify-center overflow-hidden px-4 pb-4"
                onClick={(e) => e.stopPropagation()}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
            >
                {current.kind === "image" ? (
                    <img
                        src={current.url}
                        alt=""
                        onClick={onImageTap}
                        draggable={false}
                        className={cn(
                            "max-h-full max-w-full select-none transition-transform duration-200",
                            zoomed ? "scale-[2] cursor-zoom-out" : "cursor-zoom-in",
                        )}
                    />
                ) : (
                    <video
                        key={current.id}
                        src={current.url}
                        controls
                        playsInline
                        preload="metadata"
                        className="max-h-full max-w-full rounded-2xl bg-foreground"
                    />
                )}
            </div>

            {/* Dots */}
            {hasMany ? (
                <div
                    className="flex items-center justify-center gap-1.5 pb-6"
                    onClick={(e) => e.stopPropagation()}
                >
                    {attachments.map((a, i) => (
                        <button
                            key={a.id}
                            type="button"
                            onClick={() => onIndexChange(i)}
                            aria-label={`Attachment ${i + 1}`}
                            className={cn(
                                "h-1.5 rounded-full transition-colors",
                                i === safeIndex
                                    ? "w-5 bg-background"
                                    : "w-1.5 bg-background/50",
                            )}
                        />
                    ))}
                </div>
            ) : null}
        </div>
    );
}
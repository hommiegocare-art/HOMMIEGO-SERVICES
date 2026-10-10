// src/components/chat/ComposeAttachments.tsx
import { useRef, useState } from "react";
import { Camera, Film, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AttachmentKind } from "@/hooks/useChatWindow";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_BYTES = 25 * 1024 * 1024; // 25 MB
const MAX_VIDEO_SECONDS = 60;

export interface PendingAttachment {
    id: string;
    file: File;
    kind: AttachmentKind;
    previewUrl: string;
}

interface Props {
    disabled?: boolean;
    items: PendingAttachment[];
    onAdd: (item: Omit<PendingAttachment, "id" | "previewUrl">) => void;
    onRemove: (id: string) => void;
    onError?: (message: string) => void;
    max?: number;
    /** Parent controls the sheet from outside (e.g. a paperclip inside the input). */
    externalSheetOpen: boolean;
    onExternalSheetClose: () => void;
}

function readVideoDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const v = document.createElement("video");
        v.preload = "metadata";
        v.onloadedmetadata = () => {
            const dur = v.duration;
            URL.revokeObjectURL(url);
            if (!Number.isFinite(dur)) reject(new Error("Cannot read video duration"));
            else resolve(dur);
        };
        v.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Cannot read video file"));
        };
        v.src = url;
    });
}

export function ComposeAttachments({
    disabled,
    items,
    onAdd,
    onRemove,
    onError,
    max = 10,
    externalSheetOpen,
    onExternalSheetClose,
}: Props) {
    const [busy, setBusy] = useState(false);
    const imageRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLInputElement>(null);

    const atCap = items.length >= max;

    const handleImage = async (file: File) => {
        if (file.size > MAX_IMAGE_BYTES) {
            onError?.(`Photo must be under ${MAX_IMAGE_BYTES / (1024 * 1024)} MB.`);
            return;
        }
        if (!file.type.startsWith("image/")) {
            onError?.("That file is not an image.");
            return;
        }
        if (atCap) {
            onError?.(`Up to ${max} attachments per message.`);
            return;
        }
        onAdd({ file, kind: "image" });
    };

    const handleVideo = async (file: File) => {
        setBusy(true);
        try {
            if (file.size > MAX_VIDEO_BYTES) {
                onError?.(`Video must be under ${MAX_VIDEO_BYTES / (1024 * 1024)} MB.`);
                return;
            }
            if (!file.type.startsWith("video/")) {
                onError?.("That file is not a video.");
                return;
            }
            if (atCap) {
                onError?.(`Up to ${max} attachments per message.`);
                return;
            }
            const dur = await readVideoDuration(file);
            if (dur > MAX_VIDEO_SECONDS + 0.5) {
                onError?.(`Video must be ${MAX_VIDEO_SECONDS}s or shorter.`);
                return;
            }
            onAdd({ file, kind: "video" });
        } catch (e) {
            onError?.(e instanceof Error ? e.message : "Could not read video.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            {/* Strip — only rendered when there are pending items */}
            {items.length > 0 ? (
                <div className="mb-2 flex items-center gap-2 overflow-x-auto pb-1">
                    {items.map((it) => (
                        <div
                            key={it.id}
                            className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-muted"
                        >
                            {it.kind === "image" ? (
                                <img
                                    src={it.previewUrl}
                                    alt=""
                                    draggable={false}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <video
                                    src={it.previewUrl}
                                    muted
                                    playsInline
                                    preload="metadata"
                                    className="h-full w-full object-cover"
                                />
                            )}
                            <button
                                type="button"
                                onClick={() => onRemove(it.id)}
                                aria-label="Remove attachment"
                                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-foreground/70 text-background transition-opacity active:opacity-80"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            ) : null}

            {/* Hidden inputs */}
            <input
                ref={imageRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    e.currentTarget.value = "";
                    for (const f of files) void handleImage(f);
                }}
            />
            <input
                ref={videoRef}
                type="file"
                accept="video/*"
                multiple
                className="hidden"
                onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    e.currentTarget.value = "";
                    for (const f of files) void handleVideo(f);
                }}
            />

            {/* Busy overlay — only while the video metadata is being read */}
            {busy ? (
                <div className="mb-2 flex items-center gap-2 rounded-2xl bg-muted px-3 py-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    <p className="text-[11px] text-muted-foreground">
                        Reading video…
                    </p>
                </div>
            ) : null}

            {/* Picker — bottom sheet on mobile, centered dialog on desktop.
                Scrim uses background (not foreground) so dark mode stays dark. */}
            {externalSheetOpen ? (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 backdrop-blur-sm animate-fade-in sm:items-center"
                    onClick={onExternalSheetClose}
                >
                    <div
                        role="dialog"
                        aria-label="Attach to message"
                        className={cn(
                            "w-full bg-card text-card-foreground shadow-2xl",
                            // Mobile: bottom sheet
                            "rounded-t-3xl border-t border-border/60 px-4 pb-6 pt-4 animate-slide-up",
                            // Desktop: centered, rounded on all sides, max width
                            "sm:max-w-sm sm:rounded-3xl sm:border sm:border-border/60 sm:pb-5 sm:pt-5",
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Drag handle — mobile only */}
                        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted sm:hidden" />

                        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Attach to message
                        </p>
                        <ul className="space-y-1">
                            <li>
                                <button
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => {
                                        onExternalSheetClose();
                                        imageRef.current?.click();
                                    }}
                                    className="flex h-12 w-full items-center gap-3 rounded-2xl px-4 text-left text-sm text-foreground transition-colors hover:bg-muted active:bg-muted disabled:opacity-40"
                                >
                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                                        <Camera className="h-4 w-4" />
                                    </span>
                                    Photo
                                </button>
                            </li>
                            <li>
                                <button
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => {
                                        onExternalSheetClose();
                                        videoRef.current?.click();
                                    }}
                                    className="flex h-12 w-full items-center gap-3 rounded-2xl px-4 text-left text-sm text-foreground transition-colors hover:bg-muted active:bg-muted disabled:opacity-40"
                                >
                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                                        <Film className="h-4 w-4" />
                                    </span>
                                    Video
                                </button>
                            </li>
                        </ul>
                        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                            Photo up to 10 MB. Video up to 25 MB, 60 seconds. Up to{" "}
                            {max} per message.
                        </p>
                    </div>
                </div>
            ) : null}
        </>
    );
}

export function makePendingAttachment(
    file: File,
    kind: AttachmentKind,
): PendingAttachment {
    return {
        id: crypto.randomUUID(),
        file,
        kind,
        previewUrl: URL.createObjectURL(file),
    };
}
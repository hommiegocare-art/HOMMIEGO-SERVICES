// src/components/chat/CareTeamComposeAttachments.tsx
//
// Attachment picker + preview strip for the care team composer.
// Named `CareTeam*` to avoid colliding with the existing 1:1
// ComposeAttachments used by ChatWindow.tsx.

import { useRef } from "react";
import { ImagePlus, Loader2, Video, X } from "lucide-react";

export type AttachmentKind = "image" | "video" | "file";

export type PendingAttachment = {
    id: string;
    file: File;
    kind: AttachmentKind;
    previewUrl: string;
};

export const MAX_ATTACHMENTS_PER_MESSAGE = 4;

export function makePendingAttachment(
    file: File,
    kind: AttachmentKind
): PendingAttachment {
    return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        kind,
        previewUrl: URL.createObjectURL(file),
    };
}

export function CareTeamComposeAttachments({
    items,
    disabled,
    max = MAX_ATTACHMENTS_PER_MESSAGE,
    onAdd,
    onRemove,
    onError,
}: {
    items: PendingAttachment[];
    disabled?: boolean;
    max?: number;
    onAdd: (item: { file: File; kind: AttachmentKind }) => void;
    onRemove: (id: string) => void;
    onError?: (msg: string) => void;
}) {
    const imageRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLInputElement>(null);

    const trigger = (kind: AttachmentKind) => {
        if (disabled) return;
        if (items.length >= max) {
            onError?.(`You can attach up to ${max} files per message.`);
            return;
        }
        if (kind === "image") imageRef.current?.click();
        if (kind === "video") videoRef.current?.click();
    };

    const onPick = (
        e: React.ChangeEvent<HTMLInputElement>,
        kind: AttachmentKind
    ) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        if (file.size > 15 * 1024 * 1024) {
            onError?.("That file is larger than 15 MB.");
            return;
        }
        onAdd({ file, kind });
    };

    return (
        <>
            <input
                ref={imageRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPick(e, "image")}
            />
            <input
                ref={videoRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => onPick(e, "video")}
            />

            {items.length > 0 && (
                <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
                    {items.map((p) => (
                        <div
                            key={p.id}
                            className="relative h-20 w-20 shrink-0 rounded-2xl overflow-hidden bg-muted"
                        >
                            {p.kind === "image" ? (
                                <img
                                    src={p.previewUrl}
                                    alt=""
                                    className="h-full w-full object-cover"
                                />
                            ) : p.kind === "video" ? (
                                <video
                                    src={p.previewUrl}
                                    className="h-full w-full object-cover"
                                    muted
                                    playsInline
                                />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                                    FILE
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => onRemove(p.id)}
                                aria-label="Remove attachment"
                                className="absolute right-1 top-1 h-6 w-6 rounded-full bg-foreground/70 inline-flex items-center justify-center active:opacity-80"
                            >
                                <X className="h-3.5 w-3.5 text-background" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="mb-1.5 flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => trigger("image")}
                    disabled={disabled}
                    aria-label="Attach image"
                    className="h-9 w-9 rounded-2xl bg-muted inline-flex items-center justify-center active:bg-secondary transition-colors disabled:opacity-40"
                >
                    <ImagePlus className="h-4 w-4 text-foreground" />
                </button>
                <button
                    type="button"
                    onClick={() => trigger("video")}
                    disabled={disabled}
                    aria-label="Attach video"
                    className="h-9 w-9 rounded-2xl bg-muted inline-flex items-center justify-center active:bg-secondary transition-colors disabled:opacity-40"
                >
                    <Video className="h-4 w-4 text-foreground" />
                </button>
                {items.length > 0 && (
                    <span className="text-[11px] text-muted-foreground ml-1">
                        {items.length} / {max} attached
                    </span>
                )}
            </div>
        </>
    );
}

export function CareTeamUploadingPill() {
    return (
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-[11px] font-bold text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Uploading…
        </div>
    );
}
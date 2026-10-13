// src/components/chat/CareTeamAttachmentViewer.tsx
//
// Full-screen viewer for a single care team attachment.
// Renders images inline, videos with controls, and files as a download link.
// Portals to document.body so it sits above the chat card.

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Download, X } from "lucide-react";

export type ViewerAttachment = {
    kind: "image" | "video" | "file";
    url: string;
};

export function CareTeamAttachmentViewer({
    attachment,
    onClose,
}: {
    attachment: ViewerAttachment | null;
    onClose: () => void;
}) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    useEffect(() => {
        if (!attachment) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = prev;
            window.removeEventListener("keydown", onKey);
        };
    }, [attachment, onClose]);

    if (!mounted || !attachment) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[10000] bg-black/95 flex items-center justify-center animate-fade-in"
            onClick={onClose}
        >
            <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute right-3 top-3 z-10 h-11 w-11 rounded-full bg-white/10 text-white inline-flex items-center justify-center active:bg-white/20"
                style={{ top: "calc(env(safe-area-inset-top) + 12px)" }}
            >
                <X className="h-5 w-5" />
            </button>

            <div
                className="max-h-[92dvh] max-w-[94vw] flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
            >
                {attachment.kind === "image" ? (
                    <img
                        src={attachment.url}
                        alt=""
                        className="max-h-[92dvh] max-w-[94vw] object-contain rounded-lg"
                    />
                ) : attachment.kind === "video" ? (
                    <video
                        src={attachment.url}
                        controls
                        autoPlay
                        playsInline
                        className="max-h-[92dvh] max-w-[94vw] rounded-lg"
                    />
                ) : (
                    <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-white active:bg-white/20"
                    >
                        <Download className="h-4 w-4" />
                        Open file
                    </a>
                )}
            </div>
        </div>,
        document.body
    );
}
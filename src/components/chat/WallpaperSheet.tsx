import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ImagePlus, Loader2, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    DEFAULT_WALLPAPER_URL,
    GRADIENT_PRESETS,
    SOLID_PRESETS,
    type ChatWallpaper,
} from "@/lib/chatWallpapers";
import {
    putWallpaperImage,
    deleteWallpaperImage,
    getWallpaperObjectUrl,
} from "@/lib/wallpaperStore";

type Props = {
    open: boolean;
    onClose: () => void;
    connectionId: string;
    current: ChatWallpaper;
    onPick: (wp: ChatWallpaper) => void;
};

const MAX_UPLOAD_BYTES = 6 * 1024 * 1024; // 6 MB

export function WallpaperSheet({
    open,
    onClose,
    connectionId,
    current,
    onPick,
}: Props) {
    const [mounted, setMounted] = useState(false);
    const [tab, setTab] = useState<"solid" | "gradient" | "custom">("solid");
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [customDim, setCustomDim] = useState(
        current.kind === "custom" ? current.dim : 20,
    );
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => setMounted(true), []);

    // Load existing custom image preview (for the thumb + dim slider)
    useEffect(() => {
        if (!open) return;
        if (current.kind !== "custom") {
            setPreviewUrl(null);
            return;
        }
        let url: string | null = null;
        let cancelled = false;
        (async () => {
            url = await getWallpaperObjectUrl(connectionId);
            if (cancelled) {
                if (url) URL.revokeObjectURL(url);
                return;
            }
            setPreviewUrl(url);
        })();
        return () => {
            cancelled = true;
            if (url) URL.revokeObjectURL(url);
        };
    }, [open, connectionId, current.kind, current.kind === "custom" ? current.dim : null]);

    useEffect(() => {
        if (current.kind === "custom") setCustomDim(current.dim);
    }, [current]);

    if (!open || !mounted) return null;

    const isSelected = (wp: ChatWallpaper) => {
        if (wp.kind !== current.kind) return false;
        if (wp.kind === "solid" && current.kind === "solid")
            return wp.value === current.value;
        if (wp.kind === "gradient" && current.kind === "gradient")
            return wp.value === current.value;
        return wp.kind === "custom" && current.kind === "custom";
    };

    const uploadCustom = async (file: File) => {
        if (file.size > MAX_UPLOAD_BYTES) {
            setError("Image too large (max 6 MB).");
            return;
        }
        if (!file.type.startsWith("image/")) {
            setError("Please pick an image file.");
            return;
        }
        setError(null);
        setUploading(true);
        try {
            const stored = await maybeDownscale(file, 1920, 0.85);
            await putWallpaperImage(connectionId, stored);
            onPick({ kind: "custom", dim: customDim });
        } catch (e: any) {
            setError(e?.message ?? "Could not save image.");
        } finally {
            setUploading(false);
        }
    };

    const removeCustom = async () => {
        try {
            await deleteWallpaperImage(connectionId);
        } catch {
            /* ignore */
        }
        onPick({ kind: "none" });
    };

    return createPortal(
        <div
            className="
                fixed inset-0 z-[9999] bg-background/70 backdrop-blur-sm
                flex items-end sm:items-center justify-center
                animate-fade-in
            "
            onClick={onClose}
        >
            <div
                className="
                    w-full sm:max-w-lg bg-card
                    rounded-t-3xl sm:rounded-3xl
                    border border-border
                    max-h-[90dvh] sm:max-h-[85dvh]
                    overflow-y-auto px-4 pb-6 pt-4
                    sm:px-6 sm:pt-5
                    animate-slide-up sm:animate-none
                    pb-[calc(env(safe-area-inset-bottom)+72px)] sm:pb-6
                "
                onClick={(e) => e.stopPropagation()}
            >
                {/* Drag handle — phone only */}
                <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted sm:hidden" />

                <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-bold text-foreground sm:text-base">
                        Chat wallpaper
                    </p>
                    <button
                        type="button"
                        aria-label="Close"
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-2xl active:bg-muted"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="mb-4 flex gap-1 rounded-2xl bg-muted p-1">
                    {(["solid", "gradient", "custom"] as const).map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setTab(t)}
                            className={cn(
                                "flex-1 h-9 rounded-xl text-xs font-bold capitalize transition-colors",
                                tab === t ? "bg-card text-foreground" : "text-muted-foreground",
                            )}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {/* None option */}
                {/* Default (shipped image) */}
                <button
                    type="button"
                    onClick={() => {
                        onPick({ kind: "default" });
                        onClose();
                    }}
                    className={cn(
                        "mb-2 flex w-full items-center gap-3 rounded-2xl border p-2 text-left transition-colors active:bg-muted",
                        current.kind === "default" ? "border-primary" : "border-border",
                    )}
                >
                    <img
                        src={DEFAULT_WALLPAPER_URL}
                        alt=""
                        className="h-12 w-12 rounded-xl object-cover"
                    />
                    <div className="flex-1">
                        <p className="text-xs font-bold text-foreground">Default</p>
                        <p className="text-[11px] text-muted-foreground">
                            Caregiver + patient theme
                        </p>
                    </div>
                    {current.kind === "default" && (
                        <Check className="h-4 w-4 text-primary" />
                    )}
                </button>

                {/* Plain (no wallpaper) */}
                <button
                    type="button"
                    onClick={() => {
                        onPick({ kind: "none" });
                        onClose();
                    }}
                    className={cn(
                        "mb-4 flex w-full items-center gap-2 rounded-2xl border px-3 py-2 text-left text-xs transition-colors active:bg-muted",
                        current.kind === "none" ? "border-primary" : "border-border",
                    )}
                >
                    <span className="h-8 w-8 rounded-lg bg-muted" />
                    <span className="flex-1 font-semibold text-foreground">
                        Plain (no wallpaper)
                    </span>
                    {current.kind === "none" && <Check className="h-4 w-4 text-primary" />}
                </button>

                {tab === "solid" && (
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                        {SOLID_PRESETS.map((p) => {
                            const wp: ChatWallpaper = { kind: "solid", value: p.color };
                            const active = isSelected(wp);
                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    aria-label={p.label}
                                    onClick={() => {
                                        onPick(wp);
                                        onClose();
                                    }}
                                    className={cn(
                                        "relative aspect-square rounded-2xl border-2 transition-transform active:scale-95",
                                        active ? "border-primary" : "border-transparent",
                                    )}
                                    style={{ backgroundColor: p.color }}
                                >
                                    {active && (
                                        <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                                            <Check className="h-3 w-3 text-primary-foreground" />
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}

                {tab === "gradient" && (
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        {GRADIENT_PRESETS.map((g) => {
                            const wp: ChatWallpaper = { kind: "gradient", value: g.css };
                            const active = isSelected(wp);
                            return (
                                <button
                                    key={g.id}
                                    type="button"
                                    aria-label={g.label}
                                    onClick={() => {
                                        onPick(wp);
                                        onClose();
                                    }}
                                    className={cn(
                                        "relative aspect-[4/5] overflow-hidden rounded-2xl border-2 transition-transform active:scale-95",
                                        active ? "border-primary" : "border-transparent",
                                    )}
                                    style={{ backgroundImage: g.css }}
                                >
                                    <span className="absolute bottom-1 left-1 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-bold text-white">
                                        {g.label}
                                    </span>
                                    {active && (
                                        <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                                            <Check className="h-3 w-3 text-primary-foreground" />
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}

                {tab === "custom" && (
                    <div className="space-y-3">
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) void uploadCustom(f);
                                e.currentTarget.value = "";
                            }}
                        />

                        {/* Current custom preview */}
                        {current.kind === "custom" && previewUrl ? (
                            <div className="relative overflow-hidden rounded-2xl border border-border">
                                <img
                                    src={previewUrl}
                                    alt="Wallpaper preview"
                                    className="h-40 w-full object-cover sm:h-56"
                                />
                                <button
                                    type="button"
                                    onClick={removeCustom}
                                    className="absolute right-2 top-2 flex h-8 items-center gap-1 rounded-full bg-black/60 px-3 text-[11px] font-bold text-white"
                                >
                                    <Trash2 className="h-3.5 w-3.5" /> Remove
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                disabled={uploading}
                                onClick={() => fileRef.current?.click()}
                                className={cn(
                                    "flex w-full items-center justify-center gap-2 rounded-2xl bg-muted px-4 py-4 text-sm font-semibold text-foreground",
                                    "active:bg-secondary disabled:opacity-60",
                                )}
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                                    </>
                                ) : (
                                    <>
                                        <ImagePlus className="h-4 w-4" /> Choose image from device
                                    </>
                                )}
                            </button>
                        )}

                        {current.kind === "custom" && (
                            <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                disabled={uploading}
                                className="w-full rounded-2xl bg-muted px-4 py-3 text-xs font-semibold text-foreground active:bg-secondary disabled:opacity-60"
                            >
                                {uploading ? "Saving…" : "Replace image"}
                            </button>
                        )}

                        {/* Dim slider */}
                        <div className="rounded-2xl bg-muted px-3 py-3">
                            <div className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                <span>Dim</span>
                                <span>{customDim}%</span>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={80}
                                step={5}
                                value={customDim}
                                onChange={(e) => {
                                    const v = Number(e.target.value);
                                    setCustomDim(v);
                                    if (current.kind === "custom") {
                                        onPick({ kind: "custom", dim: v });
                                    }
                                }}
                                className="w-full accent-primary"
                            />
                        </div>

                        {error && (
                            <p className="rounded-2xl bg-destructive/10 px-3 py-2 text-[11px] font-bold text-destructive">
                                {error}
                            </p>
                        )}
                    </div>
                )}

                <p className="mt-4 text-center text-[11px] text-muted-foreground">
                    Wallpapers are stored on this device only.
                </p>
            </div>
        </div>,
        document.body,
    );
}

/* ---------- helpers ---------- */

async function maybeDownscale(
    file: File,
    maxDim: number,
    quality: number,
): Promise<Blob> {
    if (file.type === "image/svg+xml" || file.type === "image/gif") return file;

    try {
        const bitmap = await createImageBitmap(file);
        const { width, height } = bitmap;
        const scale = Math.min(1, maxDim / Math.max(width, height));
        if (scale >= 1 && file.size < 800 * 1024) {
            bitmap.close?.();
            return file;
        }
        const w = Math.max(1, Math.round(width * scale));
        const h = Math.max(1, Math.round(height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return file;
        ctx.drawImage(bitmap, 0, 0, w, h);
        bitmap.close?.();
        const blob: Blob | null = await new Promise((resolve) =>
            canvas.toBlob((b) => resolve(b), "image/jpeg", quality),
        );
        return blob ?? file;
    } catch {
        return file;
    }
}
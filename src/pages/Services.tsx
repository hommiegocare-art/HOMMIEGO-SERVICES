// src/pages/Services.tsx
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Plus,
    Pencil,
    Trash2,
    Pause,
    Play,
    Image as ImageIcon,
    X,
    Loader2,
    Briefcase,
    Eye,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import type { Service } from "@/types/db";

type FormState = {
    title: string;
    short_description: string;
    description: string;
    price: string;
    pricing_type: "hourly" | "flat" | "daily";
    duration_minutes: string;
    category_id: string;
    cover_image: string;
    is_free_consultation: boolean;
};

const EMPTY: FormState = {
    title: "",
    short_description: "",
    description: "",
    price: "",
    pricing_type: "flat",
    duration_minutes: "",
    category_id: "",
    cover_image: "",
    is_free_consultation: false,
};

export default function Services() {
    const { user } = useSession();
    const qc = useQueryClient();

    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<FormState | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [detailService, setDetailService] = useState<Service | null>(null);

    const fileRef = useRef<HTMLInputElement | null>(null);

    const servicesQ = useQuery({
        queryKey: ["services", "own", user?.id],
        enabled: !!user,
        staleTime: 60_000,
        queryFn: async (): Promise<Service[]> => {
            const { data, error } = await supabase
                .from("services")
                .select("*")
                .eq("caregiver_id", user!.id)
                .is("deleted_at", null)
                .order("created_at", { ascending: false })
                .limit(100);
            if (error) throw error;
            return (data ?? []) as Service[];
        },
    });

    const categoriesQ = useQuery({
        queryKey: ["categories", "caregiver"],
        enabled: !!user,
        staleTime: 10 * 60_000,
        queryFn: async () => {
            const { data, error } = await supabase
                .from("categories")
                .select("id, name")
                .eq("applies_to", "caregiver")
                .order("priority", { ascending: false })
                .limit(50);
            if (error) return [];
            return (data ?? []) as { id: string; name: string }[];
        },
    });

    const save = useMutation({
        mutationFn: async () => {
            if (!user || !form) return;
            const priceNum = Number(form.price);
            if (!form.title.trim()) throw new Error("Title is required");
            if (!Number.isFinite(priceNum) || priceNum < 0)
                throw new Error("Price must be a non-negative number");

            const payload = {
                caregiver_id: user.id,
                title: form.title.trim(),
                short_description: form.short_description.trim() || null,
                description: form.description.trim() || null,
                price: form.is_free_consultation ? 0 : priceNum,
                pricing_type: form.pricing_type,
                duration_minutes: form.duration_minutes
                    ? Number(form.duration_minutes)
                    : null,
                category_id: form.category_id || null,
                cover_image: form.cover_image || null,
                is_free_consultation: form.is_free_consultation,
            };

            if (editingId) {
                const { error } = await supabase
                    .from("services")
                    .update(payload)
                    .eq("id", editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("services")
                    .insert({ ...payload, is_active: true });
                if (error) throw error;
            }
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["services"] });
            setForm(null);
            setEditingId(null);
            setError(null);
        },
        onError: (e: unknown) =>
            setError(e instanceof Error ? e.message : "Save failed"),
    });

    const toggleActive = useMutation({
        mutationFn: async ({ id, next }: { id: string; next: boolean }) => {
            const { error } = await supabase
                .from("services")
                .update({ is_active: next })
                .eq("id", id);
            if (error) throw error;
        },
        onMutate: async ({ id, next }) => {
            await qc.cancelQueries({ queryKey: ["services", "own", user?.id] });
            const prev = qc.getQueryData<Service[]>(["services", "own", user?.id]);
            if (prev) {
                qc.setQueryData<Service[]>(
                    ["services", "own", user?.id],
                    prev.map((s) => (s.id === id ? { ...s, is_active: next } : s))
                );
            }
            return { prev };
        },
        onError: (_e, _v, ctx) => {
            if (ctx?.prev) qc.setQueryData(["services", "own", user?.id], ctx.prev);
        },
        onSettled: () => {
            qc.invalidateQueries({ queryKey: ["services"] });
        },
    });

    const softDelete = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("services")
                .update({ deleted_at: new Date().toISOString() })
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["services"] });
        },
    });

    async function onPickImage(file: File) {
        if (!user) return;
        setUploading(true);
        setError(null);
        try {
            const ext = file.name.split(".").pop() || "jpg";
            const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
            const { error } = await supabase.storage
                .from("service-images")
                .upload(path, file, { upsert: false, contentType: file.type });
            if (error) throw error;
            const { data } = supabase.storage
                .from("service-images")
                .getPublicUrl(path);
            setForm((f) => (f ? { ...f, cover_image: data.publicUrl } : f));
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Upload failed");
        } finally {
            setUploading(false);
        }
    }
    function ServiceCardSkeleton() {
        return (
            <div className="w-full rounded-2xl bg-card overflow-hidden">
                {/* Cover banner — matches aspect-[16/7] */}
                <div className="w-full aspect-[16/7] bg-muted skeleton-shimmer" />

                <div className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-2">
                            <div className="h-4 w-3/4 rounded-md skeleton-shimmer" />
                            <div className="h-3 w-full rounded-md skeleton-shimmer" />
                            <div className="h-3 w-5/6 rounded-md skeleton-shimmer" />
                        </div>
                        <div className="shrink-0 space-y-1.5">
                            <div className="h-4 w-16 rounded-md skeleton-shimmer ml-auto" />
                            <div className="h-3 w-10 rounded-md skeleton-shimmer ml-auto" />
                        </div>
                    </div>

                    {/* Action row — matches the real one */}
                    <div className="mt-3 flex items-center gap-2">
                        <div className="h-10 w-10 shrink-0 rounded-2xl skeleton-shimmer" />
                        <div className="flex-1 h-10 rounded-2xl skeleton-shimmer" />
                        <div className="flex-1 h-10 rounded-2xl skeleton-shimmer" />
                        <div className="h-10 w-10 shrink-0 rounded-2xl skeleton-shimmer" />
                    </div>
                </div>
            </div>
        );
    }
    function openCreate() {
        setEditingId(null);
        setForm({ ...EMPTY });
        setError(null);
    }

    function openEdit(s: Service) {
        setEditingId(s.id);
        setForm({
            title: s.title,
            short_description: s.short_description ?? "",
            description: s.description ?? "",
            price: s.price != null ? String(s.price) : "",
            pricing_type: (s.pricing_type as FormState["pricing_type"]) ?? "flat",
            duration_minutes:
                s.duration_minutes != null ? String(s.duration_minutes) : "",
            category_id: s.category_id ?? "",
            cover_image: s.cover_image ?? "",
            is_free_consultation: !!s.is_free_consultation,
        });
        setError(null);
    }

    if (!user) return null;

    const services = servicesQ.data ?? [];
    const categories = categoriesQ.data ?? [];

    return (
        <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in">
            <div className="flex items-end justify-between gap-4 mb-5">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-foreground">
                        Services
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        What clients can book from you.
                    </p>
                </div>
                <Button onClick={openCreate} className="h-11 rounded-2xl">
                    <Plus className="w-4 h-4 mr-1.5" />
                    New service
                </Button>
            </div>

            {error && !form && (
                <div className="rounded-2xl bg-destructive/10 px-4 py-3 mb-4">
                    <p className="text-sm text-destructive">{error}</p>
                </div>
            )}

            {servicesQ.isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <ServiceCardSkeleton key={i} />
                    ))}
                </div>
            ) : services.length === 0 ? (
                <div className="rounded-2xl bg-card px-4 py-14 text-center">
                    <Briefcase className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                        No services yet. Create one to start receiving bookings.
                    </p>
                    <Button
                        onClick={openCreate}
                        variant="secondary"
                        className="mt-4 h-11 rounded-2xl"
                    >
                        <Plus className="w-4 h-4 mr-1.5" />
                        Create first service
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {services.map((s) => (
                        <ServiceCard
                            key={s.id}
                            s={s}
                            categoryName={
                                categories.find((c) => c.id === s.category_id)?.name ?? null
                            }
                            onPreview={() => setDetailService(s)}
                            onEdit={() => openEdit(s)}
                            onToggle={() =>
                                toggleActive.mutate({ id: s.id, next: !s.is_active })
                            }
                            onDelete={() => {
                                if (
                                    confirm(
                                        `Delete "${s.title}"? This hides it from clients.`
                                    )
                                )
                                    softDelete.mutate(s.id);
                            }}
                        />
                    ))}
                </div>
            )}

            {form && (
                <ServiceSheet
                    form={form}
                    setForm={setForm}
                    editing={!!editingId}
                    categories={categories}
                    saving={save.isPending}
                    uploading={uploading}
                    error={error}
                    onPickImage={() => fileRef.current?.click()}
                    fileRef={fileRef}
                    onFile={(f) => onPickImage(f)}
                    onSave={() => save.mutate()}
                    onClose={() => {
                        setForm(null);
                        setEditingId(null);
                        setError(null);
                    }}
                />
            )}

            {/* PREVIEW OVERLAY — what clients see */}
            {detailService && (
                <ServiceDetail
                    service={detailService}
                    categoryName={
                        categories.find((c) => c.id === detailService.category_id)?.name ??
                        null
                    }
                    onEdit={() => {
                        const s = detailService;
                        setDetailService(null);
                        if (s) openEdit(s);
                    }}
                    onClose={() => setDetailService(null)}
                />
            )}
        </div>
    );
}

/* ---------- service card (matches public profile) ---------- */

function ServiceCard({
    s,
    categoryName,
    onPreview,
    onEdit,
    onToggle,
    onDelete,
}: {
    s: Service;
    categoryName: string | null;
    onPreview: () => void;
    onEdit: () => void;
    onToggle: () => void;
    onDelete: () => void;
}) {
    const priceSuffix =
        s.pricing_type === "hourly"
            ? "hr"
            : s.pricing_type === "daily"
                ? "day"
                : "visit";

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onPreview}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onPreview();
                }
            }}
            className="w-full text-left rounded-2xl bg-card overflow-hidden active:bg-muted/60 transition-colors cursor-pointer"
        >
            {/* Cover — full width banner */}
            <div className="w-full aspect-[16/7] bg-muted overflow-hidden flex items-center justify-center relative">
                {s.cover_image ? (
                    <img
                        src={s.cover_image}
                        alt=""
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                )}

                {/* Status chips overlay */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    {!s.is_active && (
                        <span className="px-2 py-0.5 rounded-full bg-background/90 backdrop-blur text-[10px] font-bold text-muted-foreground">
                            Paused
                        </span>
                    )}
                    {s.is_free_consultation && (
                        <span className="px-2 py-0.5 rounded-full bg-success/90 backdrop-blur text-[10px] font-bold text-white">
                            Free
                        </span>
                    )}
                </div>
            </div>

            <div className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-foreground line-clamp-2">
                                {s.title}
                            </h3>
                            {categoryName && (
                                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-[10px] font-bold text-primary shrink-0">
                                    {categoryName}
                                </span>
                            )}
                        </div>
                        {s.short_description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                                {s.short_description}
                            </p>
                        )}
                    </div>

                    <div className="shrink-0 text-right">
                        <p className="text-sm font-bold text-foreground">
                            {s.is_free_consultation
                                ? "Free"
                                : `KES ${Number(s.price).toLocaleString()}`}
                        </p>
                        {!s.is_free_consultation && (
                            <p className="text-[10px] text-muted-foreground">
                                / {priceSuffix}
                            </p>
                        )}
                        {s.duration_minutes != null && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                {s.duration_minutes} min
                            </p>
                        )}
                    </div>
                </div>

                {/* Action row */}
                <div className="mt-3 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onPreview();
                        }}
                        className="h-10 w-10 shrink-0 rounded-2xl bg-muted text-foreground active:bg-secondary transition-colors inline-flex items-center justify-center"
                        aria-label="Preview"
                        title="Preview as clients see it"
                    >
                        <Eye className="w-4 h-4" />
                    </button>

                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit();
                        }}
                        className="flex-1 h-10 rounded-2xl bg-muted text-foreground text-xs font-semibold active:bg-secondary transition-colors inline-flex items-center justify-center gap-1.5"
                    >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                    </button>

                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggle();
                        }}
                        className="flex-1 h-10 rounded-2xl bg-muted text-foreground text-xs font-semibold active:bg-secondary transition-colors inline-flex items-center justify-center gap-1.5"
                    >
                        {s.is_active ? (
                            <>
                                <Pause className="w-3.5 h-3.5" />
                                Pause
                            </>
                        ) : (
                            <>
                                <Play className="w-3.5 h-3.5" />
                                Activate
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="h-10 w-10 shrink-0 rounded-2xl text-destructive active:bg-destructive/10 transition-colors inline-flex items-center justify-center"
                        aria-label="Delete"
                        title="Delete"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ---------- preview overlay — what clients see ---------- */

function ServiceDetail({
    service,
    categoryName,
    onEdit,
    onClose,
}: {
    service: Service;
    categoryName: string | null;
    onEdit: () => void;
    onClose: () => void;
}) {
    const priceSuffix =
        service.pricing_type === "hourly"
            ? "hour"
            : service.pricing_type === "daily"
                ? "day"
                : "visit";

    const isFree = service.is_free_consultation;

    return (
        <div className="fixed inset-0 z-[9999] bg-background/70 backdrop-blur-sm flex items-end sm:items-center justify-center">
            <div
                className="
                    w-full sm:max-w-lg bg-card rounded-t-3xl sm:rounded-3xl
                    max-h-[90dvh] overflow-y-auto border border-border
                    pb-[calc(env(safe-area-inset-bottom)+72px)] sm:pb-0
                "
            >
                {/* Sticky header */}
                <div className="sticky top-0 z-10 bg-card h-14 flex items-center justify-between px-4">
                    <button
                        onClick={onClose}
                        className="h-11 w-11 rounded-full flex items-center justify-center active:bg-muted"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <p className="text-sm font-bold truncate">Preview</p>
                    <span className="w-11" />
                </div>

                {/* Cover */}
                <div className="w-full aspect-[16/7] bg-muted overflow-hidden flex items-center justify-center">
                    {service.cover_image ? (
                        <img
                            src={service.cover_image}
                            alt=""
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <Briefcase className="w-8 h-8 text-muted-foreground" />
                    )}
                </div>

                <div className="px-4 pt-4 pb-6 space-y-4">
                    {/* Title + price */}
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-base font-black text-foreground">
                                    {service.title}
                                </h2>
                                {isFree && (
                                    <span className="px-2 py-0.5 rounded-full bg-success/10 text-[10px] font-bold text-success">
                                        Free
                                    </span>
                                )}
                                {!service.is_active && (
                                    <span className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                                        Paused
                                    </span>
                                )}
                            </div>
                            {categoryName && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {categoryName}
                                </p>
                            )}
                        </div>

                        <div className="shrink-0 text-right">
                            <p className="text-lg font-black text-foreground">
                                {isFree
                                    ? "Free"
                                    : `KES ${Number(service.price).toLocaleString()}`}
                            </p>
                            {!isFree && (
                                <p className="text-[10px] text-muted-foreground">
                                    per {priceSuffix}
                                </p>
                            )}
                            {service.duration_minutes != null && (
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                    {service.duration_minutes} min
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    {service.description && (
                        <div>
                            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">
                                About this service
                            </p>
                            <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                                {service.description}
                            </p>
                        </div>
                    )}

                    {service.short_description && !service.description && (
                        <p className="text-sm text-foreground leading-relaxed">
                            {service.short_description}
                        </p>
                    )}

                    {/* Owner actions */}
                    <div className="pt-2 flex gap-2">
                        <button
                            onClick={onClose}
                            className="flex-1 h-12 rounded-2xl bg-muted text-foreground text-sm font-semibold active:bg-secondary transition-colors"
                        >
                            Close
                        </button>
                        <button
                            onClick={onEdit}
                            className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground text-sm font-bold active:opacity-90 transition-opacity inline-flex items-center justify-center gap-2"
                        >
                            <Pencil className="w-4 h-4" />
                            Edit service
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ---------- editor sheet (unchanged) ---------- */

function ServiceSheet({
    form,
    setForm,
    editing,
    categories,
    saving,
    uploading,
    error,
    onPickImage,
    fileRef,
    onFile,
    onSave,
    onClose,
}: {
    form: FormState;
    setForm: (updater: (f: FormState | null) => FormState | null) => void;
    editing: boolean;
    categories: { id: string; name: string }[];
    saving: boolean;
    uploading: boolean;
    error: string | null;
    onPickImage: () => void;
    fileRef: React.RefObject<HTMLInputElement>;
    onFile: (f: File) => void;
    onSave: () => void;
    onClose: () => void;
}) {
    return (
        <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
            {/* Header — sticky so Close/title stay visible while scrolling */}
            <div className="sticky top-0 z-10 bg-background h-14 flex items-center justify-between px-4">
                <button
                    onClick={onClose}
                    className="h-11 w-11 rounded-full flex items-center justify-center active:bg-muted transition-colors"
                    aria-label="Close"
                >
                    <X className="w-5 h-5 text-foreground" />
                </button>
                <p className="text-sm font-bold text-foreground">
                    {editing ? "Edit service" : "New service"}
                </p>
                <span className="w-11" />
            </div>

            {/* Form content */}
            <div className="px-4 pb-32">
                <div className="max-w-lg mx-auto space-y-4">
                    <Field label="Title">
                        <Input
                            value={form.title}
                            onChange={(e) =>
                                setForm((f) => (f ? { ...f, title: e.target.value } : f))
                            }
                            placeholder="e.g. Post-surgery home care"
                            className="h-11 rounded-2xl bg-muted border-0"
                        />
                    </Field>

                    <Field label="Short description">
                        <Input
                            value={form.short_description}
                            onChange={(e) =>
                                setForm((f) =>
                                    f ? { ...f, short_description: e.target.value } : f
                                )
                            }
                            placeholder="One line shown in lists"
                            className="h-11 rounded-2xl bg-muted border-0"
                        />
                    </Field>

                    <Field label="Full description">
                        <Textarea
                            value={form.description}
                            onChange={(e) =>
                                setForm((f) => (f ? { ...f, description: e.target.value } : f))
                            }
                            rows={4}
                            className="rounded-2xl bg-muted border-0"
                        />
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Price (KES)">
                            <Input
                                type="number"
                                min={0}
                                value={form.price}
                                onChange={(e) =>
                                    setForm((f) => (f ? { ...f, price: e.target.value } : f))
                                }
                                disabled={form.is_free_consultation}
                                className="h-11 rounded-2xl bg-muted border-0 disabled:opacity-60"
                            />
                        </Field>
                        <Field label="Duration (minutes)">
                            <Input
                                type="number"
                                min={0}
                                value={form.duration_minutes}
                                onChange={(e) =>
                                    setForm((f) =>
                                        f ? { ...f, duration_minutes: e.target.value } : f
                                    )
                                }
                                className="h-11 rounded-2xl bg-muted border-0"
                            />
                        </Field>
                    </div>

                    <Field label="Pricing type">
                        <div className="flex gap-2">
                            {(["flat", "hourly", "daily"] as const).map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() =>
                                        setForm((f) => (f ? { ...f, pricing_type: t } : f))
                                    }
                                    className={`h-11 px-4 rounded-full text-sm font-medium transition-colors ${form.pricing_type === t
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-foreground"
                                        }`}
                                >
                                    {t === "flat"
                                        ? "Per visit"
                                        : t === "hourly"
                                            ? "Hourly"
                                            : "Daily"}
                                </button>
                            ))}
                        </div>
                    </Field>

                    <Field label="Free consultation">
                        <button
                            type="button"
                            onClick={() =>
                                setForm((f) =>
                                    f
                                        ? {
                                            ...f,
                                            is_free_consultation: !f.is_free_consultation,
                                            price: !f.is_free_consultation ? "0" : f.price,
                                        }
                                        : f,
                                )
                            }
                            className={`h-11 w-full rounded-2xl px-4 text-sm font-semibold transition-colors inline-flex items-center justify-between ${form.is_free_consultation
                                ? "bg-success/10 text-success"
                                : "bg-muted text-foreground"
                                }`}
                        >
                            <span>Offer as a free chat consultation</span>
                            <span className="text-xs text-muted-foreground">
                                {form.is_free_consultation ? "On" : "Off"}
                            </span>
                        </button>
                        <p className="mt-1.5 text-[11px] text-muted-foreground">
                            Clients with an accepted connection tap this and go straight to
                            chat.
                        </p>
                    </Field>

                    <Field label="Category">
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setForm((f) => (f ? { ...f, category_id: "" } : f))
                                }
                                className={`h-9 px-3 rounded-full text-xs font-medium transition-colors ${!form.category_id
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-foreground"
                                    }`}
                            >
                                Uncategorized
                            </button>
                            {categories.map((c) => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() =>
                                        setForm((f) => (f ? { ...f, category_id: c.id } : f))
                                    }
                                    className={`h-9 px-3 rounded-full text-xs font-medium transition-colors ${form.category_id === c.id
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-foreground"
                                        }`}
                                >
                                    {c.name}
                                </button>
                            ))}
                        </div>
                    </Field>

                    <Field label="Cover image">
                        <div className="flex items-center gap-3">
                            <div className="w-20 h-20 rounded-2xl bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                                {form.cover_image ? (
                                    <img
                                        src={form.cover_image}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <ImageIcon className="w-5 h-5 text-muted-foreground" />
                                )}
                            </div>
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) onFile(f);
                                }}
                            />
                            <button
                                type="button"
                                onClick={onPickImage}
                                disabled={uploading}
                                className="h-11 px-4 rounded-2xl bg-muted text-foreground text-sm font-semibold active:bg-secondary transition-colors disabled:opacity-60 inline-flex items-center gap-2"
                            >
                                {uploading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : form.cover_image ? (
                                    "Replace"
                                ) : (
                                    "Upload"
                                )}
                            </button>
                            {form.cover_image && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setForm((f) => (f ? { ...f, cover_image: "" } : f))
                                    }
                                    className="h-11 px-3 rounded-2xl text-destructive text-sm font-semibold active:bg-destructive/10 transition-colors"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    </Field>

                    {error && (
                        <div className="rounded-2xl bg-destructive/10 px-4 py-3">
                            <p className="text-sm text-destructive">{error}</p>
                        </div>
                    )}

                    {/* Buttons — end of the form, scroll with the page */}
                    <div
                        className="flex gap-3 pt-2"
                        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)" }}
                    >
                        <button
                            onClick={onClose}
                            disabled={saving}
                            className="flex-1 h-12 rounded-2xl bg-muted text-foreground text-sm font-semibold active:bg-secondary transition-colors disabled:opacity-60"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onSave}
                            disabled={saving || uploading || !form.title.trim()}
                            className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground text-sm font-bold active:opacity-90 transition-opacity disabled:opacity-60 inline-flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : editing ? (
                                "Save changes"
                            ) : (
                                "Create service"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <Label className="text-xs font-semibold text-muted-foreground">
                {label}
            </Label>
            <div className="mt-1">{children}</div>
        </div>
    );
}
// src/components/profile/ProfileMediaUploader.tsx
import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, Trash2, FileText, Image as ImageIcon } from "lucide-react";

export type MediaKind =
    | "gallery"
    | "hospital"
    | "passport"
    | "id_front"
    | "id_back"
    | "licence"
    | "certificate"
    | "other";

export function ProfileMediaUploader({
    kind,
    title,
    hint,
    accept = "image/*",
}: {
    kind: MediaKind;
    title: string;
    hint?: string;
    accept?: string;
}) {
    const { user } = useSession();
    const qc = useQueryClient();
    const fileRef = useRef<HTMLInputElement | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isDoc = kind !== "gallery" && kind !== "hospital";

    const onPick = async (file: File) => {
        if (!user) return;
        setBusy(true);
        setError(null);
        try {
            const resourceType = file.type === "application/pdf" ? "raw" : "image";
            const uploaded = await uploadToCloudinary(file, {
                folder: `hommiecare/${user.id}/${kind}`,
                resourceType,
            });

            const { error: insErr } = await supabase.from("profile_media").insert({
                user_id: user.id,
                kind,
                url: uploaded.url,
                public_id: uploaded.public_id,
            });
            if (insErr) throw insErr;
            await qc.refetchQueries({ queryKey: ["profile-media", user.id, kind] });
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Upload failed");
        } finally {
            setBusy(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    };

    const remove = async (id: string) => {
        if (!confirm("Remove this file?")) return;
        const { error: e } = await supabase
            .from("profile_media")
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", id);
        if (e) {
            setError(e.message);
            return;
        }
        if (user) {
            await qc.invalidateQueries({ queryKey: ["profile-media", user.id, kind] });
        }
    };

    const { data: files, isLoading } = useQuery({
        queryKey: ["profile-media", user?.id, kind],
        enabled: !!user,
        staleTime: 30_000,
        queryFn: async () => {
            const { data, error } = await supabase
                .from("profile_media")
                .select("id,url,public_id")
                .eq("user_id", user!.id)
                .eq("kind", kind)
                .is("deleted_at", null)
                .order("created_at", { ascending: false })
                .limit(50);
            if (error) throw error;
            return data as { id: string; url: string; public_id: string }[];
        },
    });

    return (
        <Card className="rounded-2xl">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-medium">
                    {isDoc ? <FileText className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {hint && <p className="text-xs text-muted-foreground">{hint}</p>}

                <input
                    ref={fileRef}
                    type="file"
                    accept={accept}
                    className="hidden"
                    onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) onPick(f);
                    }}
                />

                <Button
                    variant="outline"
                    onClick={() => fileRef.current?.click()}
                    disabled={busy}
                >
                    {busy ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Upload className="mr-2 h-4 w-4" />
                    )}
                    {busy ? "Uploading…" : "Choose file"}
                </Button>

                {error && (
                    <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        {error}
                    </p>
                )}

                {isLoading && <p className="text-xs text-muted-foreground">Loading…</p>}

                {files && files.length > 0 && (
                    <ul className="grid grid-cols-3 gap-2 pt-1">
                        {files.map((m) => (
                            <li key={m.id} className="relative group">
                                <div className="aspect-square overflow-hidden rounded-xl bg-muted">
                                    {m.url.endsWith(".pdf") ? (
                                        <a
                                            href={m.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex h-full w-full items-center justify-center text-xs text-primary underline"
                                        >
                                            PDF
                                        </a>
                                    ) : (
                                        <img src={m.url} alt="" className="h-full w-full object-cover" />
                                    )}
                                </div>
                                <button
                                    onClick={() => remove(m.id)}
                                    className="absolute right-1 top-1 rounded-full bg-background/90 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                                    aria-label="Remove"
                                >
                                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
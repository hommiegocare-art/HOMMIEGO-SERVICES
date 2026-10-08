// src/pages/PrivacySettings.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import type { ClientPrivacySettings } from "@/types/db";

type Flag =
    | "show_display_name"
    | "show_legal_name"
    | "show_avatar"
    | "show_county_city"
    | "show_exact_address"
    | "show_medical_history"
    | "show_medications"
    | "show_conditions"
    | "show_allergies"
    | "show_emergency_contacts"
    | "show_insurance"
    | "show_contact_phone";

const ROWS: { key: Flag; label: string; hint: string }[] = [
    { key: "show_display_name", label: "Show my display name", hint: "Unconnected caregivers see 'Anonymous' if off." },
    { key: "show_avatar", label: "Show my photo", hint: "Hides your avatar across Explore and profile." },
    { key: "show_county_city", label: "Show county & city", hint: "Broad location only. Never your exact address." },
    { key: "show_exact_address", label: "Show exact address", hint: "Only connected caregivers see this even when on." },
    { key: "show_contact_phone", label: "Show phone number", hint: "Connected caregivers can call or WhatsApp." },
    { key: "show_legal_name", label: "Show legal name", hint: "Your real name. Off by default." },
    { key: "show_medical_history", label: "Medical history", hint: "Free-text medical background." },
    { key: "show_conditions", label: "Chronic conditions", hint: "e.g. diabetes, hypertension." },
    { key: "show_medications", label: "Current medications", hint: "Shown only to connected caregivers." },
    { key: "show_allergies", label: "Allergies", hint: "Critical for safe care." },
    { key: "show_emergency_contacts", label: "Emergency contacts", hint: "Who to call in an emergency." },
    { key: "show_insurance", label: "Insurance details", hint: "Provider, policy number, expiry." },
];

async function fetchSettings(userId: string): Promise<ClientPrivacySettings | null> {
    const { data } = await supabase
        .from("client_privacy_settings")
        .select("*")
        .eq("client_id", userId)
        .maybeSingle();
    return (data as ClientPrivacySettings) ?? null;
}

export default function PrivacySettings() {
    const { user } = useSession();
    const navigate = useNavigate();
    const qc = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ["privacy", user?.id],
        enabled: !!user,
        staleTime: 60_000,
        queryFn: () => fetchSettings(user!.id),
    });

    const [local, setLocal] = useState<ClientPrivacySettings | null>(null);
    useEffect(() => {
        if (data) setLocal(data);
    }, [data]);

    const save = useMutation({
        mutationFn: async ({ key, value }: { key: Flag; value: boolean }) => {
            if (!user) return;
            const { error } = await supabase
                .from("client_privacy_settings")
                .update({ [key]: value })
                .eq("client_id", user.id);
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["privacy", user?.id] });
        },
    });

    function toggle(key: Flag) {
        if (!local) return;
        const next = !local[key];
        setLocal({ ...local, [key]: next });
        save.mutate({ key, value: next });
    }

    if (!user || user.role !== "client") {
        return (
            <div className="max-w-3xl mx-auto px-4 py-12 text-center">
                <p className="text-sm text-muted-foreground">
                    Privacy settings are for client accounts.
                </p>
            </div>
        );
    }

    if (isLoading || !local) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-3">
                <div className="h-8 w-40 rounded-2xl skeleton-shimmer" />
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-16 rounded-2xl skeleton-shimmer" />
                ))}
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-6 animate-fade-in">
            <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground -ml-2 mb-4 h-11"
            >
                <ChevronLeft className="w-4 h-4" /> Back
            </button>

            <div className="flex items-center gap-2 mb-1">
                <Shield className="w-5 h-5 text-primary" />
                <h1 className="text-2xl font-black tracking-tight text-foreground">
                    Privacy
                </h1>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
                Control what unconnected caregivers see about you. Connected caregivers
                may see more, depending on what you allow here.
            </p>

            <div className="space-y-2">
                {ROWS.map((r) => (
                    <ToggleRow
                        key={r.key}
                        label={r.label}
                        hint={r.hint}
                        on={local[r.key]}
                        onChange={() => toggle(r.key)}
                    />
                ))}
            </div>
        </div>
    );
}

function ToggleRow({
    label,
    hint,
    on,
    onChange,
}: {
    label: string;
    hint: string;
    on: boolean;
    onChange: () => void;
}) {
    return (
        <div className="rounded-2xl bg-card px-4 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
            </div>
            <button
                type="button"
                aria-label={label}
                onClick={onChange}
                className={`relative w-14 h-8 rounded-full transition-colors duration-150 shrink-0 ${on ? "bg-primary" : "bg-muted"
                    }`}
            >
                <span
                    className={`absolute top-1 w-6 h-6 rounded-full bg-background transition-transform duration-150 ${on ? "translate-x-7" : "translate-x-1"
                        }`}
                />
            </button>
        </div>
    );
}
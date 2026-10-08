// src/components/profile/MedicalProfileCard.tsx
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Save, X, Loader2, HeartPulse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import type { ClientMedicalProfile } from "@/types/db";

async function fetchMedical(userId: string): Promise<ClientMedicalProfile | null> {
    const { data } = await supabase
        .from("client_medical_profile")
        .select("*")
        .eq("client_id", userId)
        .maybeSingle();
    return (data as ClientMedicalProfile) ?? null;
}

export function MedicalProfileCard() {
    const { user } = useSession();
    const qc = useQueryClient();
    const [editing, setEditing] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ["medical", user?.id],
        enabled: !!user,
        staleTime: 60_000,
        queryFn: () => fetchMedical(user!.id),
    });

    const [bloodType, setBloodType] = useState("");
    const [allergies, setAllergies] = useState("");
    const [conditions, setConditions] = useState("");
    const [medications, setMedications] = useState("");
    const [surgeries, setSurgeries] = useState("");
    const [familyHistory, setFamilyHistory] = useState("");
    const [notes, setNotes] = useState("");

    function startEdit() {
        setBloodType(data?.blood_type ?? "");
        setAllergies((data?.allergies ?? []).join(", "));
        setConditions((data?.chronic_conditions ?? []).join(", "));
        setMedications((data?.current_medications ?? []).join(", "));
        setSurgeries((data?.past_surgeries ?? []).join(", "));
        setFamilyHistory(data?.family_history ?? "");
        setNotes(data?.notes ?? "");
        setEditing(true);
    }

    const save = useMutation({
        mutationFn: async () => {
            if (!user) return;
            const toArr = (s: string) =>
                s
                    .split(",")
                    .map((x) => x.trim())
                    .filter(Boolean);

            const { error } = await supabase
                .from("client_medical_profile")
                .upsert(
                    {
                        client_id: user.id,
                        blood_type: bloodType.trim() || null,
                        allergies: toArr(allergies),
                        chronic_conditions: toArr(conditions),
                        current_medications: toArr(medications),
                        past_surgeries: toArr(surgeries),
                        family_history: familyHistory.trim() || null,
                        notes: notes.trim() || null,
                    },
                    { onConflict: "client_id" }
                );
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["medical", user?.id] });
            setEditing(false);
        },
    });

    if (isLoading) {
        return <div className="h-32 rounded-2xl skeleton-shimmer" />;
    }

    return (
        <div className="rounded-2xl bg-card px-4 py-4 mb-3">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-primary" />
                    <p className="text-sm font-bold text-foreground">Medical profile</p>
                </div>
                {!editing && (
                    <button
                        onClick={startEdit}
                        className="h-11 px-3 rounded-2xl text-xs font-semibold text-primary active:bg-muted transition-colors inline-flex items-center gap-1"
                    >
                        <Pencil className="w-3 h-3" /> Edit
                    </button>
                )}
            </div>

            {!editing ? (
                <div className="space-y-2 text-sm">
                    <Row label="Blood type" value={data?.blood_type} />
                    <Row label="Allergies" value={joinArr(data?.allergies)} />
                    <Row label="Conditions" value={joinArr(data?.chronic_conditions)} />
                    <Row label="Medications" value={joinArr(data?.current_medications)} />
                    <Row label="Past surgeries" value={joinArr(data?.past_surgeries)} />
                    {data?.family_history && (
                        <Row label="Family history" value={data.family_history} />
                    )}
                    {data?.notes && <Row label="Notes" value={data.notes} />}
                    {!data && (
                        <p className="text-xs text-muted-foreground">
                            No medical details yet. Add them so connected caregivers know how
                            to help.
                        </p>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    <Field label="Blood type">
                        <Input
                            value={bloodType}
                            onChange={(e) => setBloodType(e.target.value)}
                            placeholder="O+"
                            className="h-11 rounded-2xl bg-muted border-0"
                        />
                    </Field>
                    <Field label="Allergies (comma separated)">
                        <Input
                            value={allergies}
                            onChange={(e) => setAllergies(e.target.value)}
                            placeholder="penicillin, peanuts"
                            className="h-11 rounded-2xl bg-muted border-0"
                        />
                    </Field>
                    <Field label="Chronic conditions (comma separated)">
                        <Input
                            value={conditions}
                            onChange={(e) => setConditions(e.target.value)}
                            placeholder="diabetes, hypertension"
                            className="h-11 rounded-2xl bg-muted border-0"
                        />
                    </Field>
                    <Field label="Current medications (comma separated)">
                        <Input
                            value={medications}
                            onChange={(e) => setMedications(e.target.value)}
                            placeholder="metformin 500mg"
                            className="h-11 rounded-2xl bg-muted border-0"
                        />
                    </Field>
                    <Field label="Past surgeries (comma separated)">
                        <Input
                            value={surgeries}
                            onChange={(e) => setSurgeries(e.target.value)}
                            className="h-11 rounded-2xl bg-muted border-0"
                        />
                    </Field>
                    <Field label="Family history">
                        <Textarea
                            value={familyHistory}
                            onChange={(e) => setFamilyHistory(e.target.value)}
                            rows={2}
                            className="rounded-2xl bg-muted border-0"
                        />
                    </Field>
                    <Field label="Notes">
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="rounded-2xl bg-muted border-0"
                        />
                    </Field>

                    <div className="flex gap-3 pt-1">
                        <Button
                            variant="secondary"
                            onClick={() => setEditing(false)}
                            className="flex-1 h-11 rounded-2xl"
                        >
                            <X className="w-4 h-4 mr-2" /> Cancel
                        </Button>
                        <Button
                            onClick={() => save.mutate()}
                            disabled={save.isPending}
                            className="flex-1 h-11 rounded-2xl"
                        >
                            {save.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" /> Save
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

function Row({ label, value }: { label: string; value?: string | null }) {
    if (!value) return null;
    return (
        <div>
            <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
                {label}
            </p>
            <p className="text-sm text-foreground mt-0.5">{value}</p>
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

function joinArr(a?: string[] | null) {
    if (!a || a.length === 0) return undefined;
    return a.join(", ");
}
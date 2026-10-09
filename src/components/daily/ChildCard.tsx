// src/components/daily/ChildCard.tsx
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Baby,
    ChevronDown,
    Plus,
    Loader2,
    Save,
    X,
    Calendar,
    Ruler,
    Weight,
    Syringe,
    Activity,
    Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useChildren, useChildEvents } from "@/hooks/usePregnancy";
import { ageLabel } from "@/lib/dailyOptions";
import { VaccineTimeline } from "@/components/daily/VaccineTimeline";
import { ChildGrowthChart } from "@/components/daily/ChildGrowthChart";
import type { DailyChildProfile } from "@/types/daily";

export function ChildCard({ motherId }: { motherId: string }) {
    const children = useChildren(motherId);

    // Female + mother guard: only show if female AND has at least one child
    const patientSex = useQuery({
        queryKey: ["patient-sex", motherId],
        enabled: !!motherId,
        staleTime: 5 * 60_000,
        queryFn: async () => {
            const { data } = await supabase
                .from("profiles")
                .select("gender")
                .eq("id", motherId)
                .maybeSingle();
            return (data?.gender as string | null) ?? null;
        },
    });

    const isFemale = useMemo(() => {
        const g = (patientSex.data ?? "").toLowerCase().trim();
        return g === "female" || g === "f";
    }, [patientSex.data]);

    const [addOpen, setAddOpen] = useState(false);

    if (!isFemale) return null;
    if (patientSex.isLoading) return null;
    if (children.isLoading) {
        return <div className="h-40 rounded-2xl skeleton-shimmer mb-3" />;
    }

    // No children and not adding → owner sees a subtle "Add a child" prompt
    if (children.children.length === 0 && !addOpen) {
        if (!children.isOwner) return null;
        return (
            <div className="rounded-2xl bg-card px-4 py-4 mb-3">
                <div className="flex items-center gap-2 mb-3">
                    <Baby className="w-4 h-4 text-primary" />
                    <p className="text-sm font-bold text-foreground">
                        My children
                    </p>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                    Track your baby's growth, vaccines, and clinic visits from birth
                    to 5 years.
                </p>
                <Button
                    onClick={() => setAddOpen(true)}
                    className="w-full h-11 rounded-2xl"
                >
                    <Plus className="w-4 h-4 mr-1.5" /> Add a child
                </Button>
            </div>
        );
    }

    return (
        <div className="rounded-2xl bg-card px-4 py-4 mb-3">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                    <Baby className="w-4 h-4 text-primary shrink-0" />
                    <p className="text-sm font-bold text-foreground truncate">
                        My children
                    </p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold shrink-0">
                        {children.children.length}
                    </span>
                </div>
                {children.isOwner && !addOpen && (
                    <Button
                        onClick={() => setAddOpen(true)}
                        size="sm"
                        className="h-9 rounded-2xl"
                    >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add
                    </Button>
                )}
            </div>

            {addOpen && (
                <AddChildForm
                    motherId={motherId}
                    onDone={() => setAddOpen(false)}
                    isPending={children.addChild.isPending}
                    onSubmit={async (row) => {
                        await children.addChild.mutateAsync(row);
                        setAddOpen(false);
                    }}
                />
            )}

            <div className="space-y-3">
                {children.children.map((c) => (
                    <ChildRow key={c.id} child={c} motherId={motherId} />
                ))}
            </div>
        </div>
    );
}

// ============================================================
// One child — collapsible with tabs
// ============================================================
function ChildRow({
    child,
    motherId,
}: {
    child: DailyChildProfile;
    motherId: string;
}) {
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState<"vaccines" | "growth" | "events">("vaccines");

    const events = useChildEvents(child.id, motherId);

    return (
        <div className="rounded-2xl bg-muted/60 overflow-hidden">
            <button
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center gap-3 px-3 py-3 text-left active:bg-muted"
            >
                <span className="h-10 w-10 rounded-2xl bg-primary/10 text-primary inline-flex items-center justify-center shrink-0">
                    <Baby className="w-5 h-5" />
                </span>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                        {child.nickname || child.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                        {ageLabel(child.date_of_birth)}
                        {child.sex !== "unknown"
                            ? ` · ${child.sex === "male" ? "Boy" : child.sex === "female" ? "Girl" : ""}`
                            : ""}
                    </p>
                </div>
                <ChevronDown
                    className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ${open ? "rotate-180" : ""
                        }`}
                />
            </button>

            {open && (
                <div className="px-3 pb-3 pt-2 space-y-3 text-sm">
                    {/* Sub-tabs */}
                    <div className="flex gap-1 -mx-3 px-3 overflow-x-auto">
                        <div className="flex gap-1 min-w-max">
                            {(
                                [
                                    { key: "vaccines", label: "Vaccines", icon: Syringe },
                                    { key: "growth", label: "Growth", icon: Ruler },
                                    { key: "events", label: "Events", icon: Activity },
                                ] as const
                            ).map((t) => (
                                <button
                                    key={t.key}
                                    onClick={() => setTab(t.key)}
                                    className={`h-8 px-2.5 rounded-2xl text-xs font-semibold inline-flex items-center gap-1 ${tab === t.key
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-background text-muted-foreground"
                                        }`}
                                >
                                    <t.icon className="w-3 h-3" />
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {tab === "vaccines" && (
                        <VaccineTimeline child={child} events={events.events} />
                    )}

                    {tab === "growth" && (
                        <div className="space-y-2">
                            <ChildGrowthChart events={events.events} metric="weight" />
                            <ChildGrowthChart events={events.events} metric="height" />
                        </div>
                    )}

                    {tab === "events" && (
                        <div className="space-y-2">
                            {events.events.length === 0 ? (
                                <div className="rounded-2xl bg-background px-4 py-6 text-center">
                                    <Calendar className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-xs text-muted-foreground">
                                        No events logged yet.
                                    </p>
                                </div>
                            ) : (
                                events.events.slice(0, 20).map((e) => (
                                    <div
                                        key={e.id}
                                        className="rounded-xl bg-background px-3 py-2 text-xs"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-semibold text-foreground capitalize">
                                                {e.event_type.replace(/_/g, " ")}
                                            </span>
                                            <span className="text-muted-foreground">
                                                {new Date(e.entry_date).toLocaleDateString(
                                                    undefined,
                                                    { day: "numeric", month: "short" },
                                                )}
                                            </span>
                                        </div>
                                        {e.notes && (
                                            <p className="text-muted-foreground mt-0.5">
                                                {e.notes}
                                            </p>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {!events.isOwner && (
                        <p className="text-[10px] text-muted-foreground text-center pt-2">
                            Read-only — connected caregiver view.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

// ============================================================
// Add child form
// ============================================================
function AddChildForm({
    motherId: _motherId,
    onDone,
    onSubmit,
    isPending,
}: {
    motherId: string;
    onDone: () => void;
    onSubmit: (row: Partial<DailyChildProfile>) => Promise<void>;
    isPending: boolean;
}) {
    const [name, setName] = useState("");
    const [nickname, setNickname] = useState("");
    const [sex, setSex] = useState<"male" | "female" | "unknown">("unknown");
    const [dob, setDob] = useState("");
    const [weight, setWeight] = useState("");
    const [facility, setFacility] = useState("");
    const [facilityPhone, setFacilityPhone] = useState("");

    const submit = async () => {
        if (!name.trim() || !dob) return;
        await onSubmit({
            full_name: name.trim(),
            nickname: nickname.trim() || null,
            sex,
            date_of_birth: dob,
            birth_weight_kg: weight ? Number(weight) : null,
            primary_facility: facility.trim() || null,
            primary_facility_phone: facilityPhone.trim() || null,
        });
    };

    return (
        <div className="rounded-2xl bg-muted/60 px-3 py-3 space-y-2 mb-3">
            <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-foreground">Add a child</p>
                <button
                    onClick={onDone}
                    className="h-8 w-8 rounded-xl inline-flex items-center justify-center text-muted-foreground active:bg-background"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>

            <div>
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Full name *
                </Label>
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Baby's name"
                    className="mt-1 h-10 rounded-2xl bg-background border-0"
                />
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div>
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Nickname
                    </Label>
                    <Input
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="Optional"
                        className="mt-1 h-10 rounded-2xl bg-background border-0"
                    />
                </div>
                <div>
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Sex
                    </Label>
                    <select
                        value={sex}
                        onChange={(e) =>
                            setSex(e.target.value as "male" | "female" | "unknown")
                        }
                        className="mt-1 w-full h-10 rounded-2xl bg-background border-0 px-3 text-sm"
                    >
                        <option value="unknown">—</option>
                        <option value="male">Boy</option>
                        <option value="female">Girl</option>
                    </select>
                </div>
            </div>

            <div>
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Date of birth *
                </Label>
                <Input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="mt-1 h-10 rounded-2xl bg-background border-0"
                />
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div>
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Birth weight (kg)
                    </Label>
                    <Input
                        type="number"
                        inputMode="decimal"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="3.2"
                        className="mt-1 h-10 rounded-2xl bg-background border-0"
                    />
                </div>
                <div>
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Clinic
                    </Label>
                    <Input
                        value={facility}
                        onChange={(e) => setFacility(e.target.value)}
                        placeholder="Health facility"
                        className="mt-1 h-10 rounded-2xl bg-background border-0"
                    />
                </div>
            </div>

            <div>
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Clinic phone
                </Label>
                <Input
                    type="tel"
                    inputMode="tel"
                    value={facilityPhone}
                    onChange={(e) => setFacilityPhone(e.target.value)}
                    placeholder="0712 345 678"
                    className="mt-1 h-10 rounded-2xl bg-background border-0"
                />
            </div>

            <div className="flex gap-2 pt-1">
                <Button
                    variant="secondary"
                    onClick={onDone}
                    className="flex-1 h-10 rounded-2xl"
                >
                    Cancel
                </Button>
                <Button
                    onClick={submit}
                    disabled={!name.trim() || !dob || isPending}
                    className="flex-1 h-10 rounded-2xl"
                >
                    {isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <>
                            <Save className="w-3.5 h-3.5 mr-1.5" /> Save
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
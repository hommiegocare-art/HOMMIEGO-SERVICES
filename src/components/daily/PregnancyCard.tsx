// src/components/daily/PregnancyCard.tsx
import { useState } from "react";
import {
    HeartPulse,
    Calendar,
    Loader2,
    Save,
    Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePregnancy } from "@/hooks/usePregnancy";
import { KickCounter } from "@/components/daily/KickCounter";
import { ContractionTimer } from "@/components/daily/ContractionTimer";

type Tab = "kicks" | "contractions" | "visits";

export function PregnancyCard({ clientId }: { clientId: string }) {
    const pregnancy = usePregnancy(clientId);
    const [tab, setTab] = useState<Tab>("kicks");
    const [showSetup, setShowSetup] = useState(false);
    const [lmpDraft, setLmpDraft] = useState("");
    const [providerDraft, setProviderDraft] = useState("");

    if (pregnancy.isLoading) {
        return <div className="h-40 rounded-2xl skeleton-shimmer mb-3" />;
    }

    // No pregnancy yet → offer to start one (owner only)
    if (!pregnancy.pregnancy) {
        if (!pregnancy.isOwner) return null;
        return (
            <div className="rounded-2xl bg-card px-4 py-4 mb-3">
                <div className="flex items-center gap-2 mb-3">
                    <HeartPulse className="w-4 h-4 text-primary" />
                    <p className="text-sm font-bold text-foreground">
                        Pregnancy tracking
                    </p>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                    Track kick counts, contractions, and clinic visits through your
                    pregnancy.
                </p>
                <Button
                    onClick={() => setShowSetup(true)}
                    className="w-full h-11 rounded-2xl"
                >
                    <Plus className="w-4 h-4 mr-1.5" /> Start pregnancy tracking
                </Button>

                {showSetup && (
                    <div className="mt-4 space-y-3 border-t border-border pt-4">
                        <div>
                            <Label className="text-xs font-semibold text-muted-foreground">
                                First day of last menstrual period
                            </Label>
                            <Input
                                type="date"
                                value={lmpDraft}
                                onChange={(e) => setLmpDraft(e.target.value)}
                                className="mt-1 h-11 rounded-2xl bg-muted border-0"
                            />
                        </div>
                        <div>
                            <Label className="text-xs font-semibold text-muted-foreground">
                                Care provider / clinic (optional)
                            </Label>
                            <Input
                                value={providerDraft}
                                onChange={(e) => setProviderDraft(e.target.value)}
                                placeholder="e.g. Kenyatta National Hospital"
                                className="mt-1 h-11 rounded-2xl bg-muted border-0"
                            />
                        </div>
                        <Button
                            onClick={async () => {
                                if (!lmpDraft) return;
                                await pregnancy.startPregnancy.mutateAsync({
                                    lmp: lmpDraft,
                                    care_provider: providerDraft.trim() || null,
                                });
                                setShowSetup(false);
                            }}
                            disabled={!lmpDraft || pregnancy.startPregnancy.isPending}
                            className="w-full h-11 rounded-2xl"
                        >
                            {pregnancy.startPregnancy.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-1.5" /> Start
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </div>
        );
    }

    const p = pregnancy.pregnancy;
    const week = pregnancy.currentWeek;
    const trimester = pregnancy.trimester;
    const daysToDue = pregnancy.daysToDue;

    return (
        <div className="rounded-2xl bg-card px-4 py-4 mb-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                    <HeartPulse className="w-4 h-4 text-primary shrink-0" />
                    <p className="text-sm font-bold text-foreground truncate">
                        Pregnancy
                    </p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold shrink-0">
                        {week > 0 ? `Week ${week}` : "Tracking"}
                    </span>
                    {trimester > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold shrink-0">
                            T{trimester}
                        </span>
                    )}
                </div>
                {daysToDue != null && daysToDue >= 0 && (
                    <span className="text-xs font-semibold text-muted-foreground shrink-0">
                        {daysToDue}d to go
                    </span>
                )}
            </div>

            {/* Progress line */}
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mb-4">
                <div
                    className="h-full bg-primary transition-all"
                    style={{
                        width: `${Math.min(100, (week / 40) * 100)}%`,
                    }}
                />
            </div>

            {/* Info block */}
            <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                {p.lmp && (
                    <InfoBlock
                        label="LMP"
                        value={new Date(p.lmp).toLocaleDateString(undefined, {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                        })}
                    />
                )}
                {p.edd && (
                    <InfoBlock
                        label="Due date"
                        value={new Date(p.edd).toLocaleDateString(undefined, {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                        })}
                    />
                )}
                {p.care_provider && (
                    <InfoBlock label="Clinic" value={p.care_provider} />
                )}
                {p.gravida != null && p.para != null && (
                    <InfoBlock
                        label="G/P"
                        value={`G${p.gravida}P${p.para}`}
                    />
                )}
            </div>

            {/* Tabs */}
            <div className="-mx-4 px-4 mb-4 overflow-x-auto">
                <div className="flex gap-1 min-w-max">
                    {(
                        [
                            { key: "kicks", label: "Kicks" },
                            { key: "contractions", label: "Contractions" },
                            { key: "visits", label: "Visits" },
                        ] as { key: Tab; label: string }[]
                    ).map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`h-9 px-3 rounded-2xl text-xs font-semibold whitespace-nowrap transition-colors ${tab === t.key
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground active:bg-secondary"
                                }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bodies */}
            {tab === "kicks" && pregnancy.isOwner && (
                <KickCounter clientId={clientId} />
            )}
            {tab === "contractions" && pregnancy.isOwner && (
                <ContractionTimer clientId={clientId} />
            )}
            {tab === "visits" && (
                <div className="rounded-2xl bg-muted/60 border border-border px-4 py-6 text-center">
                    <Calendar className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">
                        Visit log coming soon.
                    </p>
                </div>
            )}

            {!pregnancy.isOwner && (
                <p className="text-xs text-muted-foreground mt-3">
                    You can view the mother's pregnancy summary but not add entries.
                </p>
            )}

            {/* End pregnancy — owner only */}
            {pregnancy.isOwner && (
                <div className="mt-4 pt-3 border-t border-border">
                    <button
                        onClick={() => {
                            if (
                                confirm(
                                    "Mark this pregnancy as delivered / ended? You can start a new one later.",
                                )
                            ) {
                                pregnancy.endPregnancy.mutate();
                            }
                        }}
                        className="text-xs text-muted-foreground underline"
                    >
                        Mark pregnancy as delivered / ended
                    </button>
                </div>
            )}
        </div>
    );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                {label}
            </p>
            <p className="text-sm text-foreground mt-0.5 truncate">{value}</p>
        </div>
    );
}
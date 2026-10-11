// src/pages/HealthInsights.tsx
import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    ArrowLeft,
    Activity,
    TrendingUp,
    PieChart as PieIcon,
    BarChart3,
    AlertTriangle,
    CheckCircle2,
    Info,
    HeartPulse,
    Baby,
    Ruler,
} from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { useHealthInsights } from "@/hooks/useHealthInsights";
import { supabase } from "@/integrations/supabase/client";
import {
    dailyCountSeries,
    categorySlices,
    topSymptomSeries,
    severitySeries,
    buildInsights,
    kickSeries,
    contractionDurationSeries,
    pregnancyWeightSeries,
    bpSystolicSeries,
    bpDiastolicSeries,
    pregnancyProgress,
    childWeightSeries,
    childHeightSeries,
    vaccineCount,
    illnessSlices,
    type Insight,
} from "@/lib/healthAnalytics";
import { LineChart } from "@/components/daily/charts/LineChart";
import { DonutChart } from "@/components/daily/charts/DonutChart";
import { BarChart } from "@/components/daily/charts/BarChart";
import { DualLineChart } from "@/components/daily/charts/DualLineChart";
import { ProgressBar } from "@/components/daily/charts/ProgressBar";

type TopTab = "diary" | "pregnancy" | "children";

export default function HealthInsights() {
    const { user, loading } = useSession();

    // Gender check — same source DailyDiaryCard uses
    const { data: patientSex } = useQuery({
        queryKey: ["patient-sex", user?.id],
        enabled: !!user?.id,
        staleTime: 5 * 60_000,
        queryFn: async () => {
            const { data } = await supabase
                .from("profiles")
                .select("gender")
                .eq("id", user!.id)
                .maybeSingle();
            return (data?.gender as string | null) ?? null;
        },
    });

    const isFemale = useMemo(() => {
        const g = (patientSex ?? "").toLowerCase().trim();
        return g === "female" || g === "f";
    }, [patientSex]);

    const { data, isLoading } = useHealthInsights(user?.id, 90, {
        includeMaternal: isFemale,
    });

    const entries = data?.entries ?? [];
    const pregnancy = data?.pregnancy ?? null;
    const pregnancyEvents = data?.pregnancyEvents ?? [];
    const children = data?.children ?? [];
    const childEvents = data?.childEvents ?? [];

    const [tab, setTab] = useState<TopTab>("diary");

    const diaryStats = useMemo(
        () => ({
            count30: dailyCountSeries(entries, 30),
            severity30: severitySeries(entries, 30),
            categories: categorySlices(entries),
            topSymptoms: topSymptomSeries(entries, 6),
            insights: buildInsights(entries),
        }),
        [entries],
    );

    const pregnancyStats = useMemo(() => {
        if (!pregnancy) return null;
        return {
            progress: pregnancyProgress(pregnancy),
            kicks: kickSeries(pregnancyEvents, 30),
            contractions: contractionDurationSeries(pregnancyEvents, 30),
            weight: pregnancyWeightSeries(pregnancyEvents, 90),
            sys: bpSystolicSeries(pregnancyEvents, 90),
            dia: bpDiastolicSeries(pregnancyEvents, 90),
            eventCount: pregnancyEvents.length,
        };
    }, [pregnancy, pregnancyEvents]);

    const childStats = useMemo(() => {
        return children.map((child) => {
            const events = childEvents.filter((e) => e.child_id === child.id);
            return {
                child,
                events,
                weight: childWeightSeries(events),
                height: childHeightSeries(events),
                vaccines: vaccineCount(events),
                illnesses: illnessSlices(events),
            };
        });
    }, [children, childEvents]);

    // Guards
    if (loading) return null;
    if (!user) return null;
    if (user.role === "caregiver")
        return <Navigate to="/dashboard" replace />;

    const showPregnancyTab = isFemale && !!pregnancy;
    const showChildrenTab = isFemale && children.length > 0;

    return (
        <div className="max-w-3xl mx-auto px-1 py-6 animate-fade-in">
            <header className="mb-5">
                <div className="flex items-center gap-2 mb-1">
                    <Link
                        to="/health"
                        className="h-9 w-9 rounded-2xl bg-muted inline-flex items-center justify-center text-muted-foreground active:bg-secondary shrink-0"
                        aria-label="Back to My Health"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <HeartPulse className="w-6 h-6 text-primary" />
                    <h1 className="text-2xl font-black tracking-tight text-foreground">
                        Health insights
                    </h1>
                </div>
                <p className="text-xs text-muted-foreground pl-11">
                    Last 90 days · {entries.length}{" "}
                    {entries.length === 1 ? "entry" : "entries"} recorded
                </p>
            </header>

            <div className="flex gap-1.5 mb-4 flex-wrap">
                <TabBtn
                    active={tab === "diary"}
                    onClick={() => setTab("diary")}
                    icon={Activity}
                    label="My diary"
                />
                {showPregnancyTab && (
                    <TabBtn
                        active={tab === "pregnancy"}
                        onClick={() => setTab("pregnancy")}
                        icon={HeartPulse}
                        label="Pregnancy"
                    />
                )}
                {showChildrenTab && (
                    <TabBtn
                        active={tab === "children"}
                        onClick={() => setTab("children")}
                        icon={Baby}
                        label="Children"
                    />
                )}
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-40 rounded-2xl skeleton-shimmer" />
                    ))}
                </div>
            ) : (
                <>
                    {tab === "diary" && (
                        <div className="space-y-3">
                            <Card>
                                <CardHeader icon={Info} title="What we noticed" />
                                {diaryStats.insights.length > 0 ? (
                                    <div className="space-y-2">
                                        {diaryStats.insights.map((ins, i) => (
                                            <InsightRow key={i} insight={ins} />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Log your first entry to see insights here.
                                    </p>
                                )}
                            </Card>

                            <Card>
                                <CardHeader
                                    icon={TrendingUp}
                                    title="Logging activity (30 days)"
                                />
                                <LineChart points={diaryStats.count30} unit=" entries" />
                            </Card>

                            <Card>
                                <CardHeader
                                    icon={Activity}
                                    title="Average symptom severity"
                                />
                                <LineChart
                                    points={diaryStats.severity30}
                                    color="hsl(var(--destructive))"
                                    unit="/10"
                                />
                            </Card>

                            <Card>
                                <CardHeader icon={PieIcon} title="What you log most" />
                                <DonutChart slices={diaryStats.categories} />
                            </Card>

                            <Card>
                                <CardHeader
                                    icon={BarChart3}
                                    title="Most frequent symptoms"
                                />
                                <BarChart bars={diaryStats.topSymptoms} />
                            </Card>
                        </div>
                    )}

                    {tab === "pregnancy" && isFemale && pregnancy && pregnancyStats && (
                        <div className="space-y-3">
                            <Card>
                                <CardHeader icon={HeartPulse} title="Pregnancy progress" />
                                <div className="grid grid-cols-3 gap-3 text-center">
                                    <Stat
                                        label="Week"
                                        value={
                                            pregnancyStats.progress.week > 0
                                                ? String(pregnancyStats.progress.week)
                                                : "—"
                                        }
                                    />
                                    <Stat
                                        label="Trimester"
                                        value={
                                            pregnancyStats.progress.trimester > 0
                                                ? `T${pregnancyStats.progress.trimester}`
                                                : "—"
                                        }
                                    />
                                    <Stat
                                        label="Days to due"
                                        value={
                                            pregnancyStats.progress.daysToDue != null &&
                                                pregnancyStats.progress.daysToDue >= 0
                                                ? String(pregnancyStats.progress.daysToDue)
                                                : "—"
                                        }
                                    />
                                </div>
                                {pregnancy.care_provider && (
                                    <p className="text-xs text-muted-foreground mt-2 text-center">
                                        Clinic: {pregnancy.care_provider}
                                    </p>
                                )}
                            </Card>

                            <Card>
                                <CardHeader icon={Baby} title="Kick sessions (30 days)" />
                                <LineChart points={pregnancyStats.kicks} unit=" kicks" />
                            </Card>

                            {pregnancyStats.contractions.some((p) => p.value > 0) && (
                                <Card>
                                    <CardHeader
                                        icon={Activity}
                                        title="Contraction duration (avg sec)"
                                    />
                                    <LineChart
                                        points={pregnancyStats.contractions}
                                        color="hsl(var(--destructive))"
                                        unit="s"
                                    />
                                </Card>
                            )}

                            {pregnancyStats.weight.some((p) => p.value > 0) && (
                                <Card>
                                    <CardHeader icon={Ruler} title="Weight" />
                                    <LineChart points={pregnancyStats.weight} unit=" kg" />
                                </Card>
                            )}

                            {(pregnancyStats.sys.some((p) => p.value > 0) ||
                                pregnancyStats.dia.some((p) => p.value > 0)) && (
                                    <Card>
                                        <CardHeader icon={HeartPulse} title="Blood pressure" />
                                        <DualLineChart
                                            seriesA={pregnancyStats.sys}
                                            seriesB={pregnancyStats.dia}
                                            labelA="Systolic"
                                            labelB="Diastolic"
                                        />
                                    </Card>
                                )}

                            {pregnancyStats.eventCount === 0 && (
                                <Card>
                                    <CardHeader icon={Info} title="No pregnancy events yet" />
                                    <p className="text-sm text-muted-foreground">
                                        Log kick sessions, contractions, weight, or BP from the
                                        Pregnancy card on your Health page.
                                    </p>
                                </Card>
                            )}
                        </div>
                    )}

                    {tab === "children" && isFemale && (
                        <div className="space-y-3">
                            {childStats.map((s) => (
                                <Card key={s.child.id}>
                                    <div className="flex items-center gap-2">
                                        <Baby className="w-4 h-4 text-primary shrink-0" />
                                        <p className="text-sm font-bold text-foreground truncate">
                                            {s.child.nickname || s.child.full_name}
                                        </p>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold shrink-0">
                                            {s.events.length} events
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        <Stat label="Vaccines" value={String(s.vaccines)} />
                                        <Stat
                                            label="Weight"
                                            value={
                                                s.weight.length
                                                    ? `${s.weight[s.weight.length - 1].value.toFixed(1)}kg`
                                                    : "—"
                                            }
                                        />
                                        <Stat
                                            label="Height"
                                            value={
                                                s.height.length
                                                    ? `${s.height[s.height.length - 1].value.toFixed(0)}cm`
                                                    : "—"
                                            }
                                        />
                                    </div>

                                    <div className="pt-1">
                                        <ProgressBar
                                            value={s.vaccines}
                                            max={12}
                                            label="Vaccine coverage"
                                            sublabel={`${s.vaccines}/12`}
                                        />
                                    </div>

                                    {s.weight.some((p) => p.value > 0) && (
                                        <div className="pt-2">
                                            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">
                                                Weight trend
                                            </p>
                                            <LineChart points={s.weight} unit=" kg" />
                                        </div>
                                    )}

                                    {s.height.some((p) => p.value > 0) && (
                                        <div className="pt-2">
                                            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">
                                                Height trend
                                            </p>
                                            <LineChart points={s.height} unit=" cm" />
                                        </div>
                                    )}

                                    {s.illnesses.length > 0 && (
                                        <div className="pt-2">
                                            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2">
                                                Illnesses / injuries
                                            </p>
                                            <BarChart bars={s.illnesses} />
                                        </div>
                                    )}

                                    {s.events.length === 0 && (
                                        <p className="text-xs text-muted-foreground pt-1">
                                            No events logged yet for this child.
                                        </p>
                                    )}
                                </Card>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

/* ---------- Layout primitives ---------- */

function Card({ children }: { children: React.ReactNode }) {
    return (
        <div className="rounded-2xl bg-card py-4 mb-3 overflow-hidden">
            <div className="px-1 space-y-3">{children}</div>
        </div>
    );
}

function CardHeader({
    icon: Icon,
    title,
}: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
}) {
    return (
        <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-primary shrink-0" />
            <p className="text-sm font-bold text-foreground truncate">{title}</p>
        </div>
    );
}

function TabBtn({
    active,
    onClick,
    icon: Icon,
    label,
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
}) {
    return (
        <button
            onClick={onClick}
            className={`h-9 px-3 rounded-2xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${active
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground active:bg-secondary"
                }`}
        >
            <Icon className="w-3.5 h-3.5" />
            {label}
        </button>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl bg-muted px-2 py-2 text-center">
            <p className="text-base font-black text-foreground">{value}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                {label}
            </p>
        </div>
    );
}

function InsightRow({ insight }: { insight: Insight }) {
    const map = {
        good: {
            bg: "bg-primary/10",
            bar: "bg-primary",
            text: "text-primary",
            Icon: CheckCircle2,
        },
        warn: {
            bg: "bg-amber-500/10",
            bar: "bg-amber-500",
            text: "text-amber-700",
            Icon: AlertTriangle,
        },
        alert: {
            bg: "bg-destructive/10",
            bar: "bg-destructive",
            text: "text-destructive",
            Icon: AlertTriangle,
        },
    } as const;

    const c = map[insight.tone];

    return (
        <div className={`rounded-2xl ${c.bg} overflow-hidden flex`}>
            <span className={`w-1 shrink-0 ${c.bar}`} />
            <div className="flex items-start gap-2 px-3 py-3 flex-1 min-w-0">
                <c.Icon className={`w-4 h-4 shrink-0 mt-0.5 ${c.text}`} />
                <div className="min-w-0">
                    <p className={`text-sm font-bold ${c.text}`}>{insight.title}</p>
                    <p className="text-xs text-foreground/80 mt-0.5">{insight.body}</p>
                </div>
            </div>
        </div>
    );
}
// src/components/landing/Hero.tsx
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import { ArrowRight, HeartPulse, Stethoscope, ShieldCheck } from "lucide-react";
import {
    KENYA_COUNTIES,
    KENYA_LANGUAGES,
    CAREGIVER_SPECIALTIES,
    PROFESSIONAL_TITLES,
} from "@/lib/kenya";

const SIGNUP_CLIENT = "/auth?mode=signup&role=client";
const SIGNUP_CAREGIVER = "/auth?mode=signup&role=caregiver";

const STATS = [
    { value: `${KENYA_COUNTIES.length}`, label: "Counties covered" },
    { value: `${CAREGIVER_SPECIALTIES.length}+`, label: "Services offered" },
    { value: `${PROFESSIONAL_TITLES.length}+`, label: "Professional roles" },
];

export function Hero() {
    return (
        <section className="relative overflow-hidden">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-brand-red/[0.04] via-background to-background"
            />
            <div className="mx-auto flex max-w-6xl flex-col items-center px-6 pt-20 pb-24 text-center sm:pt-28 sm:pb-32">
                <Logo size="xl" className="mb-8" />

                <p className="mb-6 text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    Care. Connect. Comfort.
                </p>

                <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
                    Trusted care at your doorstep.
                </h1>

                <p className="mt-6 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
                    From home nursing and elderly care to post-surgery recovery and daily
                    living support — book vetted caregivers across Kenya, pay securely,
                    and confirm every visit with a QR check-in.
                </p>

                <div className="mt-10 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
                    <Button asChild size="lg" className="w-full sm:w-auto">
                        <Link to={SIGNUP_CLIENT}>
                            <HeartPulse className="mr-2 h-4 w-4" />
                            I need care
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                        <Link to={SIGNUP_CAREGIVER}>
                            <Stethoscope className="mr-2 h-4 w-4" />
                            I provide care
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>

                <p className="mt-4 text-xs text-muted-foreground">
                    Free to join. No obligation.
                </p>

                {/* Real numbers, pulled from kenya.ts — never out of sync with the app */}
                <dl className="mt-14 grid w-full max-w-2xl grid-cols-3 gap-4">
                    {STATS.map((s) => (
                        <div
                            key={s.label}
                            className="rounded-2xl border border-border/60 bg-card/50 px-4 py-4"
                        >
                            <dt className="sr-only">{s.label}</dt>
                            <dd className="text-2xl font-black text-foreground sm:text-3xl">
                                {s.value}
                            </dd>
                            <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground sm:text-xs">
                                {s.label}
                            </p>
                        </div>
                    ))}
                </dl>

                <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-brand-red" />
                        Identity-verified caregivers
                    </span>
                    <span className="hidden sm:inline">·</span>
                    <span className="inline-flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-brand-red" />
                        Escrowed M-Pesa payments
                    </span>
                    <span className="hidden sm:inline">·</span>
                    <span className="inline-flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-brand-red" />
                        QR arrival check-in
                    </span>
                </div>
            </div>
        </section>
    );
}
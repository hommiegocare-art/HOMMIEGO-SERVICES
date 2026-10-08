// src/components/landing/ForCaregivers.tsx
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Briefcase, Wallet, CalendarCheck, Award } from "lucide-react";

const BENEFITS = [
    {
        icon: Briefcase,
        title: "List your services",
        body: "Post what you offer with your own prices, durations, and availability. You decide what you take on.",
    },
    {
        icon: CalendarCheck,
        title: "Work on your terms",
        body: "Accept only the bookings that fit your schedule. Pause your profile whenever you need a break.",
    },
    {
        icon: Wallet,
        title: "Get paid on time",
        body: "Client payments sit in escrow when a booking is made, then release to you after the visit completes.",
    },
    {
        icon: Award,
        title: "Build your reputation",
        body: "Every completed visit earns a review. Log CPD events and certifications to stand out.",
    },
];

export function ForCaregivers() {
    return (
        <section className="border-t border-border/60 bg-foreground dark:bg-muted/40">
            <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
                <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
                    <div>
                        <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-red">
                            For caregivers
                        </p>
                        <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl text-background dark:text-foreground">
                            Turn your skill into steady work.
                        </h2>
                        <p className="mt-4 max-w-xl text-base text-background/80 dark:text-muted-foreground">
                            Join a network of nurses, aides, and therapists delivering care
                            across Kenya. Set your own services, choose your hours, and get
                            paid through secure escrow.
                        </p>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Button
                                asChild
                                size="lg"
                                className="bg-brand-red text-white hover:bg-brand-red/90"
                            >
                                <Link to="/auth?mode=signup&role=caregiver">
                                    Join as a caregiver
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                            <Button
                                asChild
                                size="lg"
                                variant="outline"
                                className="border-background/20 bg-transparent text-background hover:bg-background/10 dark:border-border dark:text-foreground dark:hover:bg-muted"
                            >
                                <Link to="/auth?mode=login">Sign in</Link>
                            </Button>
                        </div>
                    </div>

                    <ul className="grid gap-4 sm:grid-cols-2">
                        {BENEFITS.map((b) => {
                            const Icon = b.icon;
                            return (
                                <li
                                    key={b.title}
                                    className="rounded-2xl border border-background/15 bg-background/[0.04] p-5 dark:border-border dark:bg-card"
                                >
                                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-brand-red/15">
                                        <Icon className="h-4 w-4 text-brand-red" />
                                    </div>
                                    <h3 className="text-base font-medium text-background dark:text-foreground">
                                        {b.title}
                                    </h3>
                                    <p className="mt-1.5 text-sm text-background/70 dark:text-muted-foreground">
                                        {b.body}
                                    </p>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </section>
    );
}
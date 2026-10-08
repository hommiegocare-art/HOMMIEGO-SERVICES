// src/components/landing/HowItWorks.tsx
import {
    Search,
    CreditCard,
    QrCode,
    Star,
    FileText,
} from "lucide-react";
import { KENYA_COUNTIES } from "@/lib/kenya";

const STEPS = [
    {
        icon: Search,
        title: "Find a caregiver",
        body: `Browse verified profiles by specialty, county, or language. Filter across ${KENYA_COUNTIES.length} Kenyan counties and request a connection when you're ready.`,
    },
    {
        icon: CreditCard,
        title: "Book & pay into escrow",
        body: "Pick a service and time from the caregiver's own list. Your M-Pesa payment is held securely in escrow until the visit is complete.",
    },
    {
        icon: QrCode,
        title: "Verify arrival by QR",
        body: "The caregiver scans in at your door. You know exactly when care begins — with a timestamped record of every visit.",
    },
];

const AFTER_VISIT = [
    {
        icon: FileText,
        title: "Read the visit notes",
        body: "The caregiver documents vitals, assessment, and plan for your own records.",
    },
    {
        icon: Star,
        title: "Rate the visit",
        body: "Your review updates the caregiver's public rating and helps the next client choose.",
    },
];

export function HowItWorks() {
    return (
        <section id="how" className="border-t border-border/60 bg-muted/20">
            <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
                <div className="mb-12 text-center">
                    <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                        How it works
                    </h2>
                    <p className="mt-3 text-muted-foreground">
                        Three steps from need to care.
                    </p>
                </div>

                <ol className="grid gap-6 md:grid-cols-3">
                    {STEPS.map((step, i) => {
                        const Icon = step.icon;
                        return (
                            <li
                                key={step.title}
                                className="rounded-2xl border border-border bg-card p-6 shadow-sm"
                            >
                                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
                                    <span className="text-sm font-semibold">{i + 1}</span>
                                </div>
                                <Icon className="mb-3 h-5 w-5 text-brand-red" />
                                <h3 className="text-lg font-medium">{step.title}</h3>
                                <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
                            </li>
                        );
                    })}
                </ol>

                <div className="mt-10 rounded-2xl border border-border bg-card p-6 sm:p-8">
                    <p className="text-sm font-medium uppercase tracking-[0.15em] text-muted-foreground">
                        And after the visit
                    </p>
                    <div className="mt-4 grid gap-5 sm:grid-cols-2">
                        {AFTER_VISIT.map((a) => {
                            const Icon = a.icon;
                            return (
                                <div key={a.title} className="flex items-start gap-3">
                                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
                                        <Icon className="h-4 w-4" />
                                    </span>
                                    <div>
                                        <p className="text-sm font-medium">{a.title}</p>
                                        <p className="mt-0.5 text-sm text-muted-foreground">
                                            {a.body}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
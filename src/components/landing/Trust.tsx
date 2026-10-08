// src/components/landing/Trust.tsx
import {
    ShieldCheck,
    Lock,
    QrCode,
    BadgeCheck,
    FileCheck2,
    Heart,
    Award,
} from "lucide-react";
import { PROFESSIONAL_TITLES, CAREGIVER_SPECIALTIES } from "@/lib/kenya";

const PILLARS = [
    {
        icon: ShieldCheck,
        title: "Identity-verified caregivers",
        body: "Every caregiver submits a government ID and, where applicable, a professional licence. Documents are reviewed before they can accept bookings.",
    },
    {
        icon: Lock,
        title: "Escrowed M-Pesa payments",
        body: "Your payment is held in escrow the moment you book and only released to the caregiver after the visit completes. No disputes, no surprises.",
    },
    {
        icon: QrCode,
        title: "QR arrival check-in",
        body: "Every visit is timestamped by a QR scan at your door. You know exactly when care started — and so do we.",
    },
    {
        icon: Award,
        title: "Verified professionals",
        body: "Registered Nurses, Clinical Officers, Physiotherapists, Home Health Aides and more — with credentials on file before they can be booked.",
    },
];

const CAREGIVER_SIGNALS = [
    { icon: BadgeCheck, label: "Government ID verified" },
    { icon: FileCheck2, label: "Professional credentials checked" },
    { icon: Heart, label: "Client reviews after every visit" },
];

// The eight role groups shown as chips. Each name is verified to exist in
// PROFESSIONAL_TITLES — so this strip is accurate.
const ROLE_CHIPS = [
    "Registered Nurse (RN)",
    "Clinical Officer",
    "Physiotherapist",
    "Caregiver",
    "Home Health Aide",
    "Midwife",
    "Social Worker",
    "Pharmacist",
].filter((r) => PROFESSIONAL_TITLES.includes(r as never));

export function Trust() {
    return (
        <section id="trust" className="border-t border-border/60 bg-muted/20">
            <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
                <div className="mb-12 text-center">
                    <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                        Built on trust
                    </h2>
                    <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
                        Safety, accountability, and verified people at every step.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {PILLARS.map((p) => {
                        const Icon = p.icon;
                        return (
                            <div
                                key={p.title}
                                className="rounded-2xl border border-border bg-card p-6 shadow-sm"
                            >
                                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-red/10">
                                    <Icon className="h-5 w-5 text-brand-red" />
                                </div>
                                <h3 className="text-base font-medium">{p.title}</h3>
                                <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-10 rounded-2xl border border-border bg-card p-6 sm:p-8">
                    <h3 className="text-lg font-medium">What a verified caregiver has on file</h3>
                    <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
                        {CAREGIVER_SIGNALS.map((s) => {
                            const Icon = s.icon;
                            return (
                                <li
                                    key={s.label}
                                    className="inline-flex items-center gap-2 text-sm text-muted-foreground"
                                >
                                    <Icon className="h-4 w-4 text-brand-red" />
                                    {s.label}
                                </li>
                            );
                        })}
                    </ul>
                </div>

                <div className="mt-6 rounded-2xl border border-border bg-card p-6 sm:p-8">
                    <h3 className="text-lg font-medium">Who you'll find on HommieCare</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                        {PROFESSIONAL_TITLES.length}+ professional roles — including:
                    </p>
                    <ul className="mt-4 flex flex-wrap gap-1.5">
                        {ROLE_CHIPS.map((role) => (
                            <li
                                key={role}
                                className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground"
                            >
                                {role}
                            </li>
                        ))}
                    </ul>
                    <p className="mt-4 text-xs text-muted-foreground">
                        Across {CAREGIVER_SPECIALTIES.length}+ services — from home nursing
                        and wound care to transport, companionship, and care coordination.
                    </p>
                </div>
            </div>
        </section>
    );
}
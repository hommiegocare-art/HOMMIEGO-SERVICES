// src/pages/legal/Contact.tsx
import { LegalLayout } from "@/components/legal/LegalLayout";
import { Mail, Phone, MapPin, ShieldAlert } from "lucide-react";

const CHANNELS = [
    {
        icon: Mail,
        label: "General enquiries",
        value: "hello@hommiecare.co.ke",
        href: "mailto:hello@hommiecare.co.ke",
    },
    {
        icon: Mail,
        label: "Privacy and data requests",
        value: "privacy@hommiecare.co.ke",
        href: "mailto:privacy@hommiecare.co.ke",
    },
    {
        icon: Phone,
        label: "Phone",
        value: "+254 700 000 000",
        href: "tel:+254700000000",
    },
    {
        icon: ShieldAlert,
        label: "Report a safety concern",
        value: "safety@hommiecare.co.ke",
        href: "mailto:safety@hommiecare.co.ke",
    },
];

export default function Contact() {
    return (
        <LegalLayout
            title="Contact us"
            updated=""
            intro="We respond to most messages within one business day. Safety reports are reviewed within 24 hours."
        >
            <ul className="grid gap-4 sm:grid-cols-2">
                {CHANNELS.map((c) => {
                    const Icon = c.icon;
                    return (
                        <li
                            key={c.label}
                            className="rounded-2xl border border-border bg-card p-5"
                        >
                            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
                                <Icon className="h-4 w-4" />
                            </div>
                            <p className="text-xs uppercase tracking-wider text-muted-foreground">
                                {c.label}
                            </p>
                            <a
                                href={c.href}
                                className="mt-1 block text-sm font-medium hover:text-brand-red"
                            >
                                {c.value}
                            </a>
                        </li>
                    );
                })}
            </ul>

            <div className="mt-8 flex items-start gap-3 rounded-2xl border border-border bg-muted/40 p-5 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-red" />
                <p>
                    HommieCare · Nairobi, Kenya
                    <br />
                    Office visits by appointment only.
                </p>
            </div>
        </LegalLayout>
    );
}
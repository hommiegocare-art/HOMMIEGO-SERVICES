// src/components/landing/Footer.tsx
import { Link } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";
import { Mail, Phone, MapPin } from "lucide-react";

const SITEMAP = [
    {
        heading: "Product",
        links: [
            { to: "#how", label: "How it works", anchor: true },
            { to: "#services", label: "Services", anchor: true },
            { to: "#trust", label: "Trust", anchor: true },
            { to: "#faq", label: "FAQ", anchor: true },
        ],
    },
    {
        heading: "For caregivers",
        links: [
            { to: "/auth?mode=signup&role=caregiver", label: "Join as a caregiver" },
            { to: "/auth?mode=login", label: "Sign in" },
        ],
    },
    {
        heading: "Legal",
        links: [
            { to: "/legal/privacy", label: "Privacy policy" },
            { to: "/legal/terms", label: "Terms of service" },
            { to: "/legal/safety", label: "Safety & trust" },
        ],
    },
    {
        heading: "Company",
        links: [
            { to: "/legal/about", label: "About" },
            { to: "/legal/contact", label: "Contact" },
        ],
    },
];

export function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="border-t border-border/60 bg-background">
            <div className="mx-auto max-w-6xl px-6 py-14">
                <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-6">
                    <div className="lg:col-span-2">
                        <Logo size="md" />
                        <p className="mt-4 max-w-xs text-sm text-muted-foreground">
                            Trusted home healthcare across Kenya. Verified caregivers,
                            escrowed payments, and QR arrival check-in.
                        </p>

                        <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-center gap-2">
                                <Mail className="h-3.5 w-3.5 text-brand-red" />
                                <a
                                    href="mailto:hello@hommiecare.co.ke"
                                    className="hover:text-foreground"
                                >
                                    hello@hommiecare.co.ke
                                </a>
                            </li>
                            <li className="flex items-center gap-2">
                                <Phone className="h-3.5 w-3.5 text-brand-red" />
                                <a href="tel:+254700000000" className="hover:text-foreground">
                                    +254 700 000 000
                                </a>
                            </li>
                            <li className="flex items-center gap-2">
                                <MapPin className="h-3.5 w-3.5 text-brand-red" />
                                Nairobi, Kenya
                            </li>
                        </ul>
                    </div>

                    {SITEMAP.map((col) => (
                        <div key={col.heading}>
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                                {col.heading}
                            </h4>
                            <ul className="mt-3 space-y-2">
                                {col.links.map((l) =>
                                    "anchor" in l && l.anchor ? (
                                        <li key={l.to}>
                                            <a
                                                href={l.to}
                                                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                                            >
                                                {l.label}
                                            </a>
                                        </li>
                                    ) : (
                                        <li key={l.to}>
                                            <Link
                                                to={l.to}
                                                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                                            >
                                                {l.label}
                                            </Link>
                                        </li>
                                    ),
                                )}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row">
                    <p>© {year} HommieCare. All rights reserved.</p>
                    <p>Made in Kenya.</p>
                </div>
            </div>
        </footer>
    );
}
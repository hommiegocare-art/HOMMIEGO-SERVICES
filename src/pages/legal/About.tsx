// src/pages/legal/About.tsx
import { LegalLayout } from "@/components/legal/LegalLayout";
import { HeartHandshake, ShieldCheck, Users } from "lucide-react";

export default function About() {
    return (
        <LegalLayout
            title="About HommieCare"
            updated=""
            intro="HommieCare connects people who need care with verified caregivers across Kenya — with escrowed payments and a QR check-in that keeps both sides honest."
        >
            <section className="space-y-4">
                <p className="text-sm leading-relaxed text-muted-foreground">
                    Finding reliable home healthcare in Kenya is hard. Families juggle
                    referrals, phone calls, and unverified providers. Caregivers struggle
                    to find steady work and get paid on time.
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    HommieCare was built to fix both sides of that equation. Clients see
                    verified professionals with transparent prices. Caregivers list their
                    services, choose their hours, and get paid through escrow the moment a
                    visit completes.
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    We are a Kenyan product. Built for Kenyan families, Kenyan nurses, and
                    Kenyan standards of care.
                </p>
            </section>

            <ul className="mt-8 grid gap-4 sm:grid-cols-3">
                <Value
                    icon={<ShieldCheck className="h-5 w-5" />}
                    title="Trust first"
                    body="Verification is not an afterthought. It is the product."
                />
                <Value
                    icon={<HeartHandshake className="h-5 w-5" />}
                    title="Dignity for all"
                    body="Both the person receiving care and the person giving it deserve respect."
                />
                <Value
                    icon={<Users className="h-5 w-5" />}
                    title="Built in Kenya"
                    body="Local payments, local languages, local standards."
                />
            </ul>
        </LegalLayout>
    );
}

function Value({
    icon,
    title,
    body,
}: {
    icon: React.ReactNode;
    title: string;
    body: string;
}) {
    return (
        <li className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
                {icon}
            </div>
            <h3 className="text-base font-medium">{title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
        </li>
    );
}
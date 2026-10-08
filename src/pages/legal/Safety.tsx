// src/pages/legal/Safety.tsx
import { LegalLayout } from "@/components/legal/LegalLayout";
import { ShieldCheck, Lock, QrCode, AlertTriangle, MessageSquare } from "lucide-react";

export default function Safety() {
    return (
        <LegalLayout
            title="Safety & trust"
            updated="Last updated: 8 October 2026"
            intro="How HommieCare keeps both sides safe — and what to do if something goes wrong."
        >
            <ul className="grid gap-4 sm:grid-cols-2">
                <Card
                    icon={<ShieldCheck className="h-5 w-5" />}
                    title="Identity verification"
                    body="Every caregiver submits a government ID and, where relevant, a professional licence. Documents are reviewed before the account can accept bookings."
                />
                <Card
                    icon={<Lock className="h-5 w-5" />}
                    title="Escrowed payments"
                    body="Client money is held in escrow until a visit completes. Caregivers are protected from no-shows and clients are protected from incomplete work."
                />
                <Card
                    icon={<QrCode className="h-5 w-5" />}
                    title="QR arrival check-in"
                    body="Every visit is timestamped by a QR scan at the client's door. No fake check-ins, no disputed start times."
                />
                <Card
                    icon={<MessageSquare className="h-5 w-5" />}
                    title="In-app record"
                    body="Messages, visit notes, and reviews are stored on the platform. In a dispute, this record is the source of truth."
                />
            </ul>

            <div className="mt-10 rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                    <div>
                        <h2 className="text-base font-semibold">Report a concern</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            If you experience abuse, harassment, unsafe care, or anything
                            that makes you feel at risk, contact us immediately. Reports are
                            reviewed within 24 hours.
                        </p>
                        <p className="mt-3 text-sm text-muted-foreground">
                            Email{" "}
                            <a href="mailto:safety@hommiecare.co.ke" className="underline">
                                safety@hommiecare.co.ke
                            </a>{" "}
                            or use the "Raise issue" button inside a booking.
                        </p>
                    </div>
                </div>
            </div>
        </LegalLayout>
    );
}

function Card({
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
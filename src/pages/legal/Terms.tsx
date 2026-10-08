// src/pages/legal/Terms.tsx
import { LegalLayout } from "@/components/legal/LegalLayout";

export default function Terms() {
    return (
        <LegalLayout
            title="Terms of service"
            updated="Last updated: 8 October 2026"
            intro="These terms govern your use of HommieCare. By creating an account or booking a caregiver, you agree to them."
        >
            <Section title="1. Who we are">
                <p>
                    HommieCare is a marketplace that connects clients seeking home
                    healthcare with independent caregivers. We are not a medical provider.
                    Caregivers on the platform are independent professionals, not
                    employees or agents of HommieCare.
                </p>
            </Section>

            <Section title="2. Your account">
                <p>
                    You must provide accurate information and keep your login secure. One
                    account per person. You are responsible for everything done from your
                    account.
                </p>
            </Section>

            <Section title="3. Bookings and payments">
                <p>
                    When a client books a caregiver, the client pays the agreed amount
                    into escrow. The funds are released to the caregiver only after the
                    visit is marked complete. HommieCare charges a service fee on each
                    completed booking; the fee is shown before payment is confirmed.
                </p>
            </Section>

            <Section title="4. Cancellations and refunds">
                <ul className="list-disc space-y-1.5 pl-5">
                    <li>Clients can cancel free of charge any time before the visit starts.</li>
                    <li>If a caregiver never arrives, the client is refunded in full.</li>
                    <li>
                        If a visit starts but is disputed, HommieCare reviews the evidence
                        (visit notes, QR check-in time, messages) and decides on release or
                        refund.
                    </li>
                </ul>
            </Section>

            <Section title="5. Caregiver responsibilities">
                <ul className="list-disc space-y-1.5 pl-5">
                    <li>Provide services you are qualified to provide.</li>
                    <li>Keep your licence and certifications current.</li>
                    <li>Arrive on time and check in via the QR flow.</li>
                    <li>Write honest visit notes.</li>
                    <li>Never share client information outside the platform.</li>
                </ul>
            </Section>

            <Section title="6. Client responsibilities">
                <ul className="list-disc space-y-1.5 pl-5">
                    <li>Give accurate medical and address information.</li>
                    <li>Treat the caregiver with respect.</li>
                    <li>Pay promptly through the platform. Off-platform payments void your protections.</li>
                </ul>
            </Section>

            <Section title="7. Prohibited use">
                <p>
                    Do not use HommieCare to offer unlicensed medical care, to harass
                    another user, to evade fees, or to break Kenyan law. Accounts found
                    doing so may be suspended or terminated.
                </p>
            </Section>

            <Section title="8. Limitation of liability">
                <p>
                    HommieCare provides the platform "as is." We do our best to verify
                    caregivers but we do not guarantee outcomes of any care visit. Our
                    total liability in any matter is limited to the fees we received on
                    the booking in question.
                </p>
            </Section>

            <Section title="9. Changes to these terms">
                <p>
                    We may update these terms. If we do, we will notify you in-app before
                    the change takes effect.
                </p>
            </Section>

            <Section title="10. Contact">
                <p>
                    Questions about these terms:{" "}
                    <a href="mailto:legal@hommiecare.co.ke" className="underline">
                        legal@hommiecare.co.ke
                    </a>
                </p>
            </Section>
        </LegalLayout>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                {children}
            </div>
        </section>
    );
}
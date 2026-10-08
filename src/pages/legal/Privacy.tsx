// src/pages/legal/Privacy.tsx
import { LegalLayout } from "@/components/legal/LegalLayout";

export default function Privacy() {
    return (
        <LegalLayout
            title="Privacy policy"
            updated="Last updated: 8 October 2026"
            intro="This policy explains what personal data HommieCare collects, why, how we store it, and the rights you have over it. It applies to both clients and caregivers."
        >
            <Section title="1. What we collect">
                <p>
                    When you create an account we collect your name, phone number, email,
                    county, and role (client or caregiver). For caregivers, we also collect
                    your professional title, bio, years of experience, services, and the
                    documents you upload for verification.
                </p>
                <p>
                    When you use the platform we also collect bookings, messages, visit
                    notes, payment records, and any media you upload to your profile.
                </p>
            </Section>

            <Section title="2. Why we collect it">
                <ul className="list-disc space-y-1.5 pl-5">
                    <li>To verify caregiver identity and qualifications.</li>
                    <li>To match clients with caregivers and process bookings.</li>
                    <li>To process payments through M-Pesa escrow.</li>
                    <li>To keep both sides safe and resolve disputes.</li>
                    <li>To comply with Kenyan law, including the Data Protection Act 2019.</li>
                </ul>
            </Section>

            <Section title="3. Sensitive data">
                <p>
                    Identity documents, professional licences, medical information, and
                    visit notes are treated as sensitive. They are only accessible to you,
                    to reviewers who verify your account, and to the counterparty on a
                    booking when the law or a safety concern requires it.
                </p>
            </Section>

            <Section title="4. Where your data lives">
                <p>
                    Application data is stored in Supabase (hosted in the EU). Profile
                    media and documents are stored in Cloudinary. Payment records are
                    handled through Safaricom Daraja (M-Pesa). We use these providers
                    because they meet the security and reliability standards this service
                    requires.
                </p>
            </Section>

            <Section title="5. How long we keep it">
                <p>
                    Active account data is kept while your account exists. After you
                    delete your account, we remove your personal data except where we are
                    required by law to retain records — for example, payment records for
                    tax and anti-fraud purposes.
                </p>
            </Section>

            <Section title="6. Your rights">
                <p>
                    Under the Data Protection Act 2019, you have the right to access,
                    correct, delete, or restrict the processing of your personal data. You
                    can also object to processing and request a portable copy. To exercise
                    any of these rights, contact us at{" "}
                    <a href="mailto:privacy@hommiecare.co.ke" className="underline">
                        privacy@hommiecare.co.ke
                    </a>
                    .
                </p>
            </Section>

            <Section title="7. Security">
                <p>
                    We use encryption in transit (HTTPS), role-based access controls,
                    audit logging on sensitive operations, and escrow-based payments that
                    keep card and M-Pesa details out of our systems.
                </p>
            </Section>

            <Section title="8. Contact">
                <p>
                    HommieCare is the data controller for your personal data. Reach us at{" "}
                    <a href="mailto:privacy@hommiecare.co.ke" className="underline">
                        privacy@hommiecare.co.ke
                    </a>{" "}
                    or write to us at Nairobi, Kenya. If you are not satisfied with our
                    response, you may lodge a complaint with the Office of the Data
                    Protection Commissioner (ODPC) of Kenya.
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
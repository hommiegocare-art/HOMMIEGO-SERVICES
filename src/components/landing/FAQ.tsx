// src/components/landing/FAQ.tsx
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

const QA = [
    {
        q: "How do I know the caregiver is qualified?",
        a: "Every caregiver submits a government ID and, when relevant, a professional licence or certification. Their documents are reviewed before they can accept bookings, and their profile shows a verified badge once approved.",
    },
    {
        q: "How does the payment work?",
        a: "You pay through M-Pesa when you book. The money is held in escrow — not released to the caregiver until the visit is completed. If something goes wrong before the visit starts, you can cancel and the payment is returned.",
    },
    {
        q: "What if the caregiver doesn't show up?",
        a: "The visit only starts when the caregiver scans your QR code on arrival. If they never arrive, the booking stays in an unstarted state and the escrow is refunded to you.",
    },
    {
        q: "Can I book a caregiver without connecting first?",
        a: "No. You request a connection from their profile, and once they accept, you can book any of their listed services. This protects both sides from spam bookings.",
    },
    {
        q: "Can I cancel a booking?",
        a: "Yes, from the booking detail page, as long as the visit hasn't started yet. Cancellations after the visit begins are handled as disputes.",
    },
    {
        q: "Is HommieCare available outside Nairobi?",
        a: "Yes. Caregivers list the counties they serve. Filter by your county when browsing to see who is available near you.",
    },
];

export function FAQ() {
    return (
        <section id="faq" className="border-t border-border/60">
            <div className="mx-auto max-w-3xl px-6 py-20 sm:py-24">
                <div className="mb-10 text-center">
                    <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                        Frequently asked
                    </h2>
                    <p className="mt-3 text-muted-foreground">
                        Quick answers before you get started.
                    </p>
                </div>

                <Accordion type="single" collapsible className="w-full">
                    {QA.map((item, i) => (
                        <AccordionItem key={item.q} value={`faq-${i}`}>
                            <AccordionTrigger className="text-left text-base font-medium">
                                {item.q}
                            </AccordionTrigger>
                            <AccordionContent className="text-sm text-muted-foreground">
                                {item.a}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    );
}
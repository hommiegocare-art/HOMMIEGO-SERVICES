// src/components/landing/Services.tsx
import { useState } from "react";
import {
    Stethoscope,
    HeartPulse,
    Bandage,
    Baby,
    Home as HomeIcon,
    Car,
    ChevronDown,
} from "lucide-react";
import { CAREGIVER_SPECIALTIES } from "@/lib/kenya";
import { cn } from "@/lib/utils";

type Category = {
    id: string;
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    body: string;
    /** The exact strings from CAREGIVER_SPECIALTIES that belong to this category. */
    services: string[];
};

const CATEGORIES: Category[] = [
    {
        id: "clinical",
        icon: Stethoscope,
        title: "Home nursing & clinical",
        body: "Skilled nursing care at home — wound care, medication, IV, catheter, and monitoring.",
        services: [
            "Home nursing",
            "Wound care & dressing",
            "Medication management",
            "Medication reminders",
            "IV infusion / drip administration",
            "Injections (insulin, IM, SC)",
            "Catheter care",
            "Colostomy / stoma care",
            "Nasogastric (NG) tube feeding",
            "PEG tube feeding",
            "Vital signs monitoring",
            "Blood pressure monitoring",
            "Blood sugar monitoring",
            "Diabetes care",
            "Oxygen therapy support",
            "Tracheostomy care",
            "Wound vacuum (VAC) care",
            "Pressure sore / bedsore care",
        ],
    },
    {
        id: "elderly",
        icon: HeartPulse,
        title: "Elderly & chronic care",
        body: "Compassionate support for seniors and people living with long-term conditions.",
        services: [
            "Elderly care",
            "Dementia / Alzheimer's care",
            "Parkinson's care",
            "Arthritis care",
            "Mobility assistance",
            "Fall prevention",
            "Bedridden patient care",
            "Stroke rehabilitation support",
            "Palliative care",
            "Hospice / end-of-life care",
            "Pain management support",
            "Cancer care support",
            "Post-chemotherapy care",
        ],
    },
    {
        id: "recovery",
        icon: Bandage,
        title: "Post-surgery & recovery",
        body: "Support after surgery, childbirth, or hospital stays — clinical and practical.",
        services: [
            "Post-surgery care",
            "Postnatal care",
            "Antenatal care",
            "Maternity support",
            "Physiotherapy support",
            "Occupational therapy support",
            "Speech therapy support",
            "Rehabilitation Assistant",
        ].filter((s) => CAREGIVER_SPECIALTIES.includes(s as never)),
    },
    {
        id: "pediatric",
        icon: Baby,
        title: "Child & special needs care",
        body: "Newborn, pediatric, and disability support delivered in the home.",
        services: [
            "Pediatric / child care",
            "Newborn care",
            "Special needs care",
            "Autism support",
            "Cerebral palsy care",
            "Down syndrome care",
            "Pediatric Caregiver",
            "Maternity / Postnatal Caregiver",
            "Nanny / Childcare Provider",
            "Babysitter",
        ].filter((s) => CAREGIVER_SPECIALTIES.includes(s as never) || s.includes("Caregiver") || s.includes("Nanny") || s.includes("Babysitter")),
    },
    {
        id: "daily",
        icon: HomeIcon,
        title: "Daily living & household",
        body: "Personal care, meals, light housekeeping, and companionship.",
        services: [
            "Personal hygiene assistance",
            "Bathing & grooming",
            "Dressing assistance",
            "Feeding assistance",
            "Toileting assistance",
            "Incontinence care",
            "Bed-making & positioning",
            "Transfer & lifting assistance",
            "Meal preparation",
            "Special diet cooking (diabetic, renal, etc.)",
            "Light housekeeping",
            "Laundry & ironing",
            "Grocery shopping",
            "Companionship & emotional support",
            "Mental health support",
        ],
    },
    {
        id: "transport",
        icon: Car,
        title: "Transport & care coordination",
        body: "Getting to appointments, picking up prescriptions, and coordinating care.",
        services: [
            "Hospital accompaniment",
            "Doctor visit escort",
            "Medical appointment transport",
            "Prescription pickup",
            "Medication delivery (pharmacy to doorstep)",
            "Medical equipment delivery",
            "Sample / specimen delivery to lab",
            "Ambulance / patient transport",
            "Wheelchair transport",
            "Stretcher transport",
            "Airport / travel assistance for patients",
            "Care plan development",
            "Family caregiver training",
            "Care coordination with hospitals",
        ],
    },
];

export function Services() {
    const [openId, setOpenId] = useState<string | null>(null);

    return (
        <section id="services" className="border-t border-border/60">
            <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
                <div className="mb-12 text-center">
                    <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                        Care for every need
                    </h2>
                    <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
                        Caregivers on HommieCare list the services they offer — from clinical
                        nursing to daily-living support. Tap any category to see what's
                        available.
                    </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {CATEGORIES.map((c) => {
                        const Icon = c.icon;
                        const open = openId === c.id;
                        return (
                            <div
                                key={c.id}
                                className={cn(
                                    "rounded-2xl border bg-card p-6 shadow-sm transition-colors",
                                    open
                                        ? "border-brand-red/40"
                                        : "border-border hover:border-brand-red/30",
                                )}
                            >
                                <button
                                    onClick={() => setOpenId(open ? null : c.id)}
                                    className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
                                    aria-expanded={open}
                                >
                                    <div className="mb-4 flex items-start justify-between gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-red/10">
                                            <Icon className="h-5 w-5 text-brand-red" />
                                        </div>
                                        <ChevronDown
                                            className={cn(
                                                "mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                                                open && "rotate-180",
                                            )}
                                        />
                                    </div>
                                    <h3 className="text-base font-medium">{c.title}</h3>
                                    <p className="mt-2 text-sm text-muted-foreground">{c.body}</p>
                                </button>

                                {open && c.services.length > 0 && (
                                    <ul className="mt-4 flex flex-wrap gap-1.5 border-t border-border/60 pt-4">
                                        {c.services.map((s) => (
                                            <li
                                                key={s}
                                                className="rounded-full bg-muted px-2.5 py-1 text-xs text-foreground"
                                            >
                                                {s}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        );
                    })}
                </div>

                <p className="mt-8 text-center text-sm text-muted-foreground">
                    Can't find what you need?{" "}
                    <span className="text-foreground">
                        Request a custom service from any caregiver you connect with.
                    </span>
                </p>
            </div>
        </section>
    );
}
"use client";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
    Shield,
    Lock,
    Eye,
    Scale,
    Globe,
    Mail,
    ArrowLeft,
    UserCheck,
    FileText,
    AlertTriangle,
    Database,
    Trash2,
    Phone,
    MapPin,
    Heart,
    Calendar,
    ShieldCheck,
    Stethoscope,
    Pill,
    ClipboardCheck,
    Syringe
} from "lucide-react";

export default function PrivacyPolicy() {
    const navigate = useNavigate();
    return (
        <div
            className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed relative transition-colors duration-300"
            style={{ backgroundImage: "url('/background11.png')" }}
        >
            {/* Dark overlay for better readability */}
            <div className="absolute inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-[1px]" />

            <Navbar />

            <div className="max-w-4xl mx-auto px-4 pt-32 pb-20 relative z-10">
                <div className="bg-white dark:bg-gray-950 rounded-xl shadow-xl shadow-slate-200/60 dark:shadow-slate-800/60 overflow-hidden border border-slate-100 dark:border-slate-800 transition-colors">
                    <div className="p-4 md:p-6">
                        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 gap-2 dark:text-slate-300 dark:hover:bg-slate-800">
                            <ArrowLeft className="w-4 h-4" /> Back
                        </Button>
                    </div>

                    {/* Header Banner - Updated for Medical Focus */}
                    <div className="bg-white dark:bg-gray-950 p-4 md:p-16 text-black dark:text-white border-b dark:border-slate-800">
                        <div className="flex items-center gap-3 mb-6 text-primary">
                            <Shield className="w-8 h-8" />
                            <span className="font-bold tracking-widest uppercase text-sm">Medical Data Protection & Compliance</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black mb-4 tracking-tight text-slate-900 dark:text-white">
                            Privacy Policy
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl leading-relaxed">
                            In compliance with the <strong>Data Protection Act, 2019 (Republic of Kenya)</strong>, the <strong>Kenya Health Act</strong>, and the <strong>Health Information Privacy Guidelines</strong>. We are committed to protecting your medical and personal data with the highest standards of privacy and security.
                        </p>
                        <p className="text-slate-400 dark:text-slate-500 text-sm mt-4">
                            Last updated: July 17, 2026
                        </p>
                    </div>

                    <div className="p-4 md:p-16 space-y-12 text-slate-600 dark:text-slate-300 leading-relaxed text-base md:text-lg">

                        {/* Section 1: Introduction */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <Scale className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">1. Introduction & Legal Framework</h2>
                            </div>
                            <p className="mb-4">
                                HommieCare Medical ("we," "us," or "our") operates as a <strong>Data Controller</strong> and <strong>Data Processor</strong> under the laws of the Republic of Kenya. We are registered with the <strong>Office of the Data Protection Commissioner (ODPC)</strong> and comply with healthcare data protection standards. This Privacy Policy outlines our practices regarding the collection, use, storage, and disclosure of your personal and medical information.
                            </p>
                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 transition-colors">
                                <p className="text-sm">
                                    <strong className="text-slate-900 dark:text-white">Governing Legislation:</strong> This policy is governed by the Data Protection Act, 2019 (Act No. 24 of 2019), the Kenya Health Act, the Health Information Privacy Guidelines, the Nursing Council of Kenya Act, the Medical Practitioners and Dentists Act (Cap 253), and the Constitution of Kenya, 2010 (Article 31 - Right to Privacy).
                                </p>
                            </div>
                        </section>

                        {/* Section 2: Data We Collect - Medical Focus */}
                        <section className="bg-slate-50 dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700 transition-colors">
                            <div className="flex items-center gap-3 mb-6">
                                <Eye className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">2. Medical & Personal Data We Collect</h2>
                            </div>
                            <p className="mb-6">We collect and process the following categories of personal and medical data as defined under the Data Protection Act and Kenya Health Act:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    {
                                        title: "Patient Identity Data",
                                        items: "Full name, National ID/Passport number, Date of birth, Gender, Emergency contact details.",
                                        icon: UserCheck
                                    },
                                    {
                                        title: "Medical Information",
                                        items: "Medical history, Current medications, Allergies, Chronic conditions, Treatment plans, Vital signs records.",
                                        icon: Stethoscope
                                    },
                                    {
                                        title: "Contact Data",
                                        items: "Email address, Phone number (including M-Pesa registered numbers), Physical address, City, County.",
                                        icon: Phone
                                    },
                                    {
                                        title: "Financial Data",
                                        items: "M-Pesa transaction IDs, payment amounts, billing history, insurance information (if applicable).",
                                        icon: Database
                                    },
                                    {
                                        title: "Clinical Notes",
                                        items: "Nursing assessment notes, Care plans, Medication administration records, Treatment progress notes.",
                                        icon: ClipboardCheck
                                    },
                                    {
                                        title: "Technical Data",
                                        items: "IP address, browser type and version, device type, operating system, PWA cache data, app usage logs.",
                                        icon: Globe
                                    },
                                    {
                                        title: "Healthcare Provider Data",
                                        items: "Professional licenses, Nursing Council of Kenya registration numbers, Insurance certificates, Specializations, Years of experience.",
                                        icon: ShieldCheck
                                    },
                                    {
                                        title: "Sensitive Medical Data",
                                        items: "We may collect health information strictly for treatment purposes with explicit patient consent and in compliance with the Kenya Health Act.",
                                        icon: AlertTriangle
                                    }
                                ].map((item, idx) => (
                                    <div key={idx} className="bg-white dark:bg-gray-950 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
                                        <div className="flex items-center gap-2 mb-2">
                                            <item.icon className="w-4 h-4 text-primary flex-shrink-0" />
                                            <span className="font-bold text-slate-900 dark:text-white text-sm">{item.title}</span>
                                        </div>
                                        <span className="text-sm text-slate-500 dark:text-slate-400">{item.items}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Section 3: Purpose & Lawful Basis - Medical Focus */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <Lock className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">3. Purpose & Lawful Basis for Medical Data Processing</h2>
                            </div>
                            <p className="mb-4">Under Sections 28-32 of the Data Protection Act, 2019, and the Kenya Health Act, we process your medical data based on the following lawful bases:</p>
                            <div className="space-y-4">
                                {[
                                    {
                                        basis: "Medical Treatment (Section 28(1)(a))",
                                        description: "To provide healthcare services, including nursing care, medication administration, wound care, and treatment planning.",
                                    },
                                    {
                                        basis: "Legal Obligation (Section 28(1)(b))",
                                        description: "To comply with the Kenya Health Act, nursing regulations, and mandatory reporting requirements for certain medical conditions.",
                                    },
                                    {
                                        basis: "Consent (Section 28(1)(d))",
                                        description: "When you explicitly consent to the collection and processing of your medical data for treatment purposes.",
                                    },
                                    {
                                        basis: "Vital Interests (Section 28(1)(f))",
                                        description: "In emergency medical situations where processing is necessary to protect your life or health, or that of another person.",
                                    },
                                    {
                                        basis: "Public Health (Section 28(1)(g))",
                                        description: "For public health purposes, such as disease surveillance or in response to a public health emergency.",
                                    },
                                    {
                                        basis: "Legitimate Interest (Section 28(1)(e))",
                                        description: "To ensure quality of care, prevent medical errors, improve healthcare delivery, and conduct medical research (anonymized).",
                                    }
                                ].map((item, idx) => (
                                    <div key={idx} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 transition-colors">
                                        <h3 className="font-bold text-slate-900 dark:text-white mb-1">{item.basis}</h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">{item.description}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Section 4: Data Sharing & Disclosure - Medical Focus */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <Globe className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">4. Medical Data Sharing & Disclosure</h2>
                            </div>
                            <p className="mb-4">We may share your medical data with the following categories of recipients under strict confidentiality agreements:</p>
                            <ul className="list-disc pl-6 space-y-3 mb-4">
                                <li><strong>Healthcare Providers:</strong> Your medical information is shared with nurses and healthcare professionals directly involved in your care, as necessary for treatment.</li>
                                <li><strong>Payment Processors:</strong> M-Pesa (Safaricom PLC) receives your phone number and transaction amount for medical service payment processing.</li>
                                <li><strong>Cloud Infrastructure:</strong> Supabase (our database provider) stores your medical data on secure cloud servers with encryption at rest and in transit.</li>
                                <li><strong>Regulatory Authorities:</strong> We may disclose medical data to the ODPC, Ministry of Health, Nursing Council of Kenya, or law enforcement when legally required.</li>
                                <li><strong>Medical Referrals:</strong> With your consent, we may share medical information with hospitals, specialists, or other healthcare facilities for continuity of care.</li>
                            </ul>
                            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 transition-colors">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                    <h3 className="font-bold text-amber-800 dark:text-amber-300">Medical Data Confidentiality</h3>
                                </div>
                                <p className="text-sm text-amber-700 dark:text-amber-400">
                                    All medical data is treated with the highest level of confidentiality in accordance with the Kenya Health Act and Health Information Privacy Guidelines. Your medical information is never shared for marketing purposes. Cross-border data transfers are governed by appropriate safeguards including standard data protection clauses as required by the ODPC under Sections 48-49 of the Data Protection Act, 2019.
                                </p>
                            </div>
                        </section>

                        {/* Section 5: Data Subject Rights - Medical Focus */}
                        <section className="border-l-4 border-primary pl-6 py-2 bg-slate-50 dark:bg-slate-800 transition-colors">
                            <div className="flex items-center gap-3 mb-4">
                                <UserCheck className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">5. Your Rights Under Kenyan & Medical Law</h2>
                            </div>
                            <p className="mb-4">Under the Data Protection Act, 2019, and the Kenya Health Act, you have the following rights regarding your personal and medical data:</p>
                            <div className="space-y-3">
                                {[
                                    { right: "Right to be Informed (Section 26)", desc: "You have the right to know what medical data is collected, used, and for what treatment purposes." },
                                    { right: "Right to Access Medical Records (Section 27)", desc: "You may request a copy of all medical records we hold about you, free of charge." },
                                    { right: "Right to Rectification (Section 37)", desc: "You can request correction of inaccurate or incomplete medical information." },
                                    { right: "Right to Erasure (Section 40)", desc: "You may request deletion of your medical data, subject to legal retention requirements (minimum 7 years under Kenya Health Act)." },
                                    { right: "Right to Object (Section 35)", desc: "You can object to processing of your medical data for purposes other than your direct treatment." },
                                    { right: "Right to Data Portability (Section 38)", desc: "You may request your medical data in a structured, machine-readable format for transfer to another healthcare provider." },
                                    { right: "Right to Restrict Processing (Section 36)", desc: "You may request limitation of medical data processing under certain circumstances." },
                                    { right: "Right to Lodge a Complaint", desc: "You have the right to complain to the Office of the Data Protection Commissioner (ODPC) at info@odpc.go.ke." }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-3 bg-white dark:bg-gray-950 p-3 rounded-xl border border-slate-100 dark:border-slate-700 transition-colors">
                                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                                        <div>
                                            <span className="font-bold text-slate-900 dark:text-white text-sm">{item.right}</span>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Section 6: Data Retention - Medical Focus */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <Calendar className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">6. Medical Data Retention & Deletion</h2>
                            </div>
                            <p className="mb-4">We retain your medical data only for as long as necessary to fulfill treatment purposes and comply with legal requirements:</p>
                            <div className="space-y-3">
                                {[
                                    { data: "Medical Records", period: "Retained for a minimum of 7 years as required by the Kenya Health Act and Nursing Council of Kenya regulations." },
                                    { data: "Patient Identity & Contact Data", period: "Retained while your patient account is active and for 2 years after deletion for legal purposes." },
                                    { data: "Financial Records (M-Pesa logs)", period: "Retained for up to 7 years in compliance with the Income Tax Act (Cap 470) and financial regulations." },
                                    { data: "Clinical Notes & Treatment Plans", period: "Retained for 7 years from the date of the last treatment as per medical record retention requirements." },
                                    { data: "Medication Administration Records", period: "Retained for 7 years for medical liability and continuity of care purposes." },
                                    { data: "Vital Signs & Monitoring Data", period: "Retained for 5 years after the last monitoring session, then anonymized for research purposes." }
                                ].map((item, idx) => (
                                    <div key={idx} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex justify-between items-center transition-colors">
                                        <span className="text-sm text-slate-700 dark:text-slate-300">{item.data}</span>
                                        <span className="text-xs font-bold text-primary bg-primary/10 dark:bg-primary/20 px-3 py-1 rounded-full text-right ml-4">{item.period}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Section 7: Data Security - Medical Focus */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <ShieldCheck className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">7. Medical Data Security Measures</h2>
                            </div>
                            <p className="mb-4">
                                We implement appropriate technical and organizational measures to protect your medical data in accordance with Section 41 of the Data Protection Act and the Kenya Health Act:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    "End-to-end encryption for all medical data in transit (TLS 1.3)",
                                    "Encryption at rest for stored medical records (AES-256)",
                                    "Row-Level Security (RLS) for healthcare provider access control",
                                    "Regular security audits and vulnerability assessments",
                                    "Multi-factor authentication for medical record access",
                                    "Automated threat detection and DDoS protection",
                                    "Strict access controls and role-based permissions for healthcare staff",
                                    "Incident response plan with ODPC notification within 72 hours of a breach",
                                    "Secure medical data backup and disaster recovery protocols"
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 transition-colors">
                                        <Lock className="w-3 h-3 text-primary mt-1 flex-shrink-0" />
                                        <span className="text-sm">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Section 8: Minors - Medical Focus */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <Shield className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">8. Children's Medical Privacy</h2>
                            </div>
                            <p>
                                HommieCare Medical provides healthcare services for patients of all ages. For patients under the age of <strong>18 years</strong>, we require parental or guardian consent before collecting or processing any medical information. In accordance with the Children Act, 2022 (Kenya), we maintain strict protocols for handling pediatric medical data with the highest level of confidentiality and care.
                            </p>
                        </section>

                        {/* Section 9: Changes to Policy */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <FileText className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">9. Changes to This Privacy Policy</h2>
                            </div>
                            <p>
                                We may update this Privacy Policy periodically to reflect changes in healthcare regulations, technology, or our operations. We will notify patients of material changes via email, SMS, or platform notification. Continued use of HommieCare Medical after such changes constitutes acceptance of the updated policy.
                            </p>
                        </section>

                        {/* Section 10: Contact - Medical Focus */}
                        <section className="bg-white dark:bg-gray-950 rounded-[2rem] p-6 md:p-10 text-center border dark:border-slate-800 shadow-lg transition-colors">
                            <Stethoscope className="w-12 h-12 mx-auto mb-6 text-primary" />
                            <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 text-slate-900 dark:text-white">10. Contact Our Medical Data Protection Officer</h2>
                            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
                                If you wish to exercise your rights, have questions about your medical data, or wish to file a complaint regarding your privacy, please contact our designated Data Protection Officer:
                            </p>
                            <div className="inline-block bg-slate-50 dark:bg-slate-800 px-8 py-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-2 justify-center mb-2">
                                    <Mail className="w-4 h-4 text-primary" />
                                    <p className="font-bold text-slate-900 dark:text-white text-lg">hommiegocare@gmail.com</p>
                                </div>
                                <div className="flex items-center gap-2 justify-center mb-2">
                                    <Phone className="w-4 h-4 text-primary" />
                                    <p className="text-sm text-slate-600 dark:text-slate-400">+254 704 473 503</p>
                                </div>
                                <div className="flex items-center gap-2 justify-center">
                                    <MapPin className="w-4 h-4 text-primary" />
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Nairobi, Republic of Kenya</p>
                                </div>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-3 uppercase tracking-widest">Medical Data Protection Officer</p>
                            </div>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-6">
                                You may also lodge a complaint with the Office of the Data Protection Commissioner at:<br />
                                <strong>info@odpc.go.ke</strong> | <strong>www.odpc.go.ke</strong>
                            </p>
                        </section>

                        {/* Footer */}
                        <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500 text-sm">
                            <div className="flex items-center justify-center gap-2 mb-3">
                                <Heart className="w-4 h-4 text-rose-400" />
                                <p>© {new Date().getFullYear()} HommieCare Medical. Registered in the Republic of Kenya. All Rights Reserved.</p>
                            </div>
                            <p className="font-medium text-slate-500 dark:text-slate-400">Regulated by the Data Protection Act, 2019, and the Kenya Health Act (Republic of Kenya).</p>
                            <p className="text-xs mt-2 text-slate-400 dark:text-slate-500">
                                ODPC Registration No: [Pending Registration] | Nursing Council of Kenya Compliance: [Active]
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
"use client";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Shield, Lock, Eye, Scale, Globe, Mail, ArrowLeft, UserCheck, FileText, AlertTriangle, Database, Trash2, Phone, MapPin, Heart, Calendar, ShieldCheck } from "lucide-react";

export default function PrivacyPolicy() {
    const navigate = useNavigate();
    return (
        <div
            className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed relative transition-colors duration-300"
            style={{ backgroundImage: "url('/background1.png')" }}
        >
            {/* Dark overlay for better readability */}
            <div className="absolute inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-[1px]" />

            <Navbar />

            <div className="max-w-4xl mx-auto px-4 pt-32 pb-20 relative z-10">
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl shadow-slate-200/60 dark:shadow-slate-800/60 overflow-hidden border border-slate-100 dark:border-slate-800 transition-colors">
                    <div className="p-4 md:p-6">
                        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 gap-2 dark:text-slate-300 dark:hover:bg-slate-800">
                            <ArrowLeft className="w-4 h-4" /> Back
                        </Button>
                    </div>

                    {/* Header Banner */}
                    <div className="bg-white dark:bg-slate-900 p-4 md:p-16 text-black dark:text-white border-b dark:border-slate-800">
                        <div className="flex items-center gap-3 mb-6 text-primary">
                            <Shield className="w-8 h-8" />
                            <span className="font-bold tracking-widest uppercase text-sm">Legal Protection & Compliance</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black mb-4 tracking-tight text-slate-900 dark:text-white">
                            Privacy Policy
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl leading-relaxed">
                            In compliance with the <strong>Data Protection Act, 2019 (Republic of Kenya)</strong> and the <strong>Data Protection (General) Regulations, 2021</strong>. We are committed to protecting your personal data and respecting your privacy rights.
                        </p>
                        <p className="text-slate-400 dark:text-slate-500 text-sm mt-4">
                            Last updated: May 22, 2026
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
                                HommieGo ("we," "us," or "our") operates as a <strong>Data Controller</strong> and <strong>Data Processor</strong> under the laws of the Republic of Kenya. We are registered with the <strong>Office of the Data Protection Commissioner (ODPC)</strong>. This Privacy Policy outlines our practices regarding the collection, use, storage, and disclosure of your personal information.
                            </p>
                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 transition-colors">
                                <p className="text-sm">
                                    <strong className="text-slate-900 dark:text-white">Governing Legislation:</strong> This policy is governed by the Data Protection Act, 2019 (Act No. 24 of 2019), the Data Protection (General) Regulations, 2021, the Data Protection (Registration of Data Controllers and Data Processors) Regulations, 2021, and the Constitution of Kenya, 2010 (Article 31 - Right to Privacy).
                                </p>
                            </div>
                        </section>

                        {/* Section 2: Data We Collect */}
                        <section className="bg-slate-50 dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700 transition-colors">
                            <div className="flex items-center gap-3 mb-6">
                                <Eye className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">2. Personal Data We Collect</h2>
                            </div>
                            <p className="mb-6">We collect and process the following categories of personal data as defined under the Data Protection Act:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    {
                                        title: "Identity Data",
                                        items: "Full name, National ID/Passport number (for verified providers), Username, Profile photo.",
                                        icon: UserCheck
                                    },
                                    {
                                        title: "Contact Data",
                                        items: "Email address, Phone number (including M-Pesa registered numbers), Physical address, City, Country.",
                                        icon: Phone
                                    },
                                    {
                                        title: "Financial Data",
                                        items: "M-Pesa transaction IDs, payment amounts, billing history, partial payment method details.",
                                        icon: Database
                                    },
                                    {
                                        title: "Technical Data",
                                        items: "IP address, browser type and version, device type, operating system, PWA cache data, app usage logs.",
                                        icon: Globe
                                    },
                                    {
                                        title: "Usage Data",
                                        items: "Service booking history, reviews and ratings submitted, chat messages with providers, saved favorites.",
                                        icon: FileText
                                    },
                                    {
                                        title: "Location Data",
                                        items: "GPS coordinates (with consent), city-level location from IP, service area preferences for mapping.",
                                        icon: MapPin
                                    },
                                    {
                                        title: "Professional Data (Providers)",
                                        items: "Business licenses, certifications, work permits, years of experience, service portfolios.",
                                        icon: ShieldCheck
                                    },
                                    {
                                        title: "Sensitive Personal Data",
                                        items: "We do NOT collect sensitive data such as health information, biometric data, religious beliefs, or political opinions.",
                                        icon: AlertTriangle
                                    }
                                ].map((item, idx) => (
                                    <div key={idx} className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
                                        <div className="flex items-center gap-2 mb-2">
                                            <item.icon className="w-4 h-4 text-primary flex-shrink-0" />
                                            <span className="font-bold text-slate-900 dark:text-white text-sm">{item.title}</span>
                                        </div>
                                        <span className="text-sm text-slate-500 dark:text-slate-400">{item.items}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Section 3: Purpose & Lawful Basis */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <Lock className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">3. Purpose & Lawful Basis for Processing</h2>
                            </div>
                            <p className="mb-4">Under Sections 28-32 of the Data Protection Act, 2019, we process your personal data based on the following lawful bases:</p>
                            <div className="space-y-4">
                                {[
                                    {
                                        basis: "Performance of Contract (Section 28(1)(a))",
                                        description: "To connect customers with service providers, facilitate bookings, process payments, and fulfill service agreements.",
                                    },
                                    {
                                        basis: "Legal Obligation (Section 28(1)(b))",
                                        description: "To comply with Kenyan tax laws (ITA Cap 470), anti-money laundering (AML) regulations under POCAMLA, and regulatory reporting requirements.",
                                    },
                                    {
                                        basis: "Consent (Section 28(1)(d))",
                                        description: "When you explicitly opt-in to receive marketing communications, location-based services, or push notifications.",
                                    },
                                    {
                                        basis: "Legitimate Interest (Section 28(1)(e))",
                                        description: "To prevent fraud, ensure platform security, improve our services, and conduct business analytics without overriding your privacy rights.",
                                    },
                                    {
                                        basis: "Protection of Vital Interests (Section 28(1)(f))",
                                        description: "In emergency situations where processing is necessary to protect your life or health, or that of another person.",
                                    }
                                ].map((item, idx) => (
                                    <div key={idx} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 transition-colors">
                                        <h3 className="font-bold text-slate-900 dark:text-white mb-1">{item.basis}</h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">{item.description}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Section 4: Data Sharing & Disclosure */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <Globe className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">4. Data Sharing, Storage & Transfers</h2>
                            </div>
                            <p className="mb-4">We may share your data with the following categories of recipients:</p>
                            <ul className="list-disc pl-6 space-y-3 mb-4">
                                <li><strong>Service Providers:</strong> Your name and contact details are shared with Providers when you make a booking, as necessary for service delivery.</li>
                                <li><strong>Payment Processors:</strong> M-Pesa (Safaricom PLC) receives your phone number and transaction amount for payment processing.</li>
                                <li><strong>Cloud Infrastructure:</strong> Supabase (our database provider) stores your data on secure cloud servers with encryption at rest and in transit.</li>
                                <li><strong>Regulatory Authorities:</strong> We may disclose data to the ODPC, KRA (Kenya Revenue Authority), or law enforcement when legally required.</li>
                                <li><strong>Service Partners:</strong> Cloudinary for image hosting and optimization.</li>
                            </ul>
                            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 transition-colors">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                    <h3 className="font-bold text-amber-800 dark:text-amber-300">Cross-Border Data Transfers</h3>
                                </div>
                                <p className="text-sm text-amber-700 dark:text-amber-400">
                                    While our primary operations are in Kenya, your data may be processed on servers located outside Kenya (e.g., Supabase cloud infrastructure). We ensure that such transfers are governed by appropriate safeguards including standard data protection clauses and adequacy decisions as required by the ODPC under Sections 48-49 of the Data Protection Act, 2019.
                                </p>
                            </div>
                        </section>

                        {/* Section 5: Data Subject Rights */}
                        <section className="border-l-4 border-primary pl-6 py-2 bg-slate-50 dark:bg-slate-800 transition-colors">
                            <div className="flex items-center gap-3 mb-4">
                                <UserCheck className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">5. Your Rights Under Kenyan Law</h2>
                            </div>
                            <p className="mb-4">Under the Data Protection Act, 2019, you have the following rights regarding your personal data:</p>
                            <div className="space-y-3">
                                {[
                                    { right: "Right to be Informed (Section 26)", desc: "You have the right to know what personal data is collected, used, and for what purposes." },
                                    { right: "Right to Access (Section 27)", desc: "You may request a copy of all personal data we hold about you, free of charge." },
                                    { right: "Right to Rectification (Section 37)", desc: "You can request correction of inaccurate or incomplete personal data." },
                                    { right: "Right to Erasure (Section 40)", desc: "You may request deletion of your personal data ('right to be forgotten'), subject to legal retention requirements." },
                                    { right: "Right to Object (Section 35)", desc: "You can object to processing of your personal data for direct marketing or based on legitimate interests." },
                                    { right: "Right to Data Portability (Section 38)", desc: "You may request your data in a structured, machine-readable format for transfer to another service." },
                                    { right: "Right to Restrict Processing (Section 36)", desc: "You may request limitation of processing under certain circumstances." },
                                    { right: "Right to Lodge a Complaint", desc: "You have the right to complain to the Office of the Data Protection Commissioner (ODPC) at info@odpc.go.ke." }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-700 transition-colors">
                                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                                        <div>
                                            <span className="font-bold text-slate-900 dark:text-white text-sm">{item.right}</span>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Section 6: Data Retention */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <Calendar className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">6. Data Retention & Deletion</h2>
                            </div>
                            <p className="mb-4">We retain your personal data only for as long as necessary to fulfill the purposes for which it was collected:</p>
                            <div className="space-y-3">
                                {[
                                    { data: "Account Information", period: "Retained while your account is active and for 2 years after deletion for legal purposes." },
                                    { data: "Financial Records (M-Pesa logs)", period: "Retained for up to 7 years in compliance with the Income Tax Act (Cap 470) and financial regulations." },
                                    { data: "Service Booking History", period: "Retained for 5 years after the last booking for dispute resolution and quality assurance." },
                                    { data: "Chat Messages", period: "Retained for 1 year after the booking is completed, then anonymized or deleted." },
                                    { data: "Location & Usage Data", period: "Retained for 12 months, then aggregated or anonymized for analytics." },
                                    { data: "Cookies & PWA Storage", period: "Session cookies expire when you close the app. Persistent cookies last 30-90 days." }
                                ].map((item, idx) => (
                                    <div key={idx} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex justify-between items-center transition-colors">
                                        <span className="text-sm text-slate-700 dark:text-slate-300">{item.data}</span>
                                        <span className="text-xs font-bold text-primary bg-primary/10 dark:bg-primary/20 px-3 py-1 rounded-full text-right ml-4">{item.period}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Section 7: Data Security */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <ShieldCheck className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">7. Data Security Measures</h2>
                            </div>
                            <p className="mb-4">
                                We implement appropriate technical and organizational measures to protect your personal data in accordance with Section 41 of the Data Protection Act:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    "End-to-end encryption for all data in transit (TLS 1.3)",
                                    "Encryption at rest for stored data (AES-256)",
                                    "Row-Level Security (RLS) in our Supabase database",
                                    "Regular security audits and vulnerability assessments",
                                    "Multi-factor authentication for administrative access",
                                    "Automated threat detection and DDoS protection",
                                    "Strict access controls and role-based permissions",
                                    "Incident response plan with ODPC notification within 72 hours of a breach"
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 transition-colors">
                                        <Lock className="w-3 h-3 text-primary mt-1 flex-shrink-0" />
                                        <span className="text-sm">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Section 8: Minors */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <Shield className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">8. Children's Privacy</h2>
                            </div>
                            <p>
                                HommieGo is not intended for use by individuals under the age of <strong>18 years</strong>. We do not knowingly collect personal data from minors. If we become aware that a minor has provided us with personal data, we will take immediate steps to delete such information and terminate the account in accordance with the Children Act, 2022 (Kenya).
                            </p>
                        </section>

                        {/* Section 9: Changes to Policy */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <FileText className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">9. Changes to This Privacy Policy</h2>
                            </div>
                            <p>
                                We may update this Privacy Policy periodically to reflect changes in law, technology, or our operations. We will notify you of material changes via email, platform notification, or prominent notice on our website. Continued use of HommieGo after such changes constitutes acceptance of the updated policy.
                            </p>
                        </section>

                        {/* Section 10: Contact */}
                        <section className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-10 text-center border dark:border-slate-800 shadow-lg transition-colors">
                            <Mail className="w-12 h-12 mx-auto mb-6 text-primary" />
                            <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 text-slate-900 dark:text-white">10. Contact Our Data Protection Officer</h2>
                            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
                                If you wish to exercise your rights, have questions about this policy, or wish to file a complaint regarding your privacy, please contact our designated Data Protection Officer:
                            </p>
                            <div className="inline-block bg-slate-50 dark:bg-slate-800 px-8 py-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-2 justify-center mb-2">
                                    <Mail className="w-4 h-4 text-primary" />
                                    <p className="font-bold text-slate-900 dark:text-white text-lg">hommiegocare@gmail.com</p>
                                </div>
                                <div className="flex items-center gap-2 justify-center mb-2">
                                    <Phone className="w-4 h-4 text-primary" />
                                    <p className="text-sm text-slate-600 dark:text-slate-400">+254 700 000 000</p>
                                </div>
                                <div className="flex items-center gap-2 justify-center">
                                    <MapPin className="w-4 h-4 text-primary" />
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Nairobi, Republic of Kenya</p>
                                </div>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-3 uppercase tracking-widest">Data Protection Officer</p>
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
                                <p>© {new Date().getFullYear()} HommieGo Inc. Registered in the Republic of Kenya. All Rights Reserved.</p>
                            </div>
                            <p className="font-medium text-slate-500 dark:text-slate-400">Regulated by the Data Protection Act, 2019 (Republic of Kenya).</p>
                            <p className="text-xs mt-2 text-slate-400 dark:text-slate-500">
                                ODPC Registration No: [Pending Registration]
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
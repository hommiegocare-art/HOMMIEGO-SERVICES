"use client";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
    Gavel,
    AlertTriangle,
    CreditCard,
    UserCheck,
    ShieldAlert,
    Mail,
    ArrowLeft,
    Scale,
    FileText,
    Shield,
    Ban,
    Phone,
    MapPin,
    Globe,
    Lock,
    Users,
    Calendar,
    Clock,
    Heart,
    Stethoscope,
    Pill,
    Ambulance,
    ClipboardCheck,
    Syringe,
    Brain
} from "lucide-react";

export default function TermsOfService() {
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
                            <Gavel className="w-8 h-8" />
                            <span className="font-bold tracking-widest uppercase text-sm">Medical Service Agreement</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black mb-4 tracking-tight text-slate-900 dark:text-white">
                            Terms of Service
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl leading-relaxed">
                            Please read these terms carefully before using the HommieCare Medical platform. By accessing or using our medical service platform, you agree to be bound by these legally binding terms and conditions.
                        </p>
                        <p className="text-slate-400 dark:text-slate-500 text-sm mt-6">
                            Last updated: July 17, 2026
                        </p>
                    </div>

                    <div className="p-4 md:p-16 space-y-12 text-slate-600 dark:text-slate-300 leading-relaxed text-base md:text-lg">

                        {/* Section 1: Nature of HommieCare Medical */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <Stethoscope className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">1. Nature of HommieCare Medical</h2>
                            </div>
                            <p className="mb-4">
                                HommieCare Medical provides a digital healthcare marketplace that connects independent licensed nurses and healthcare professionals ("Healthcare Providers") with patients and families seeking medical services ("Patients"). You acknowledge and agree that:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 mb-4">
                                <li><strong>HommieCare Medical is not a healthcare provider</strong> and does not employ, supervise, or direct the medical professionals listed on the platform.</li>
                                <li>We act solely as an <strong>intermediary technology platform</strong> facilitating connections between Patients and Healthcare Providers.</li>
                                <li>HommieCare Medical does not guarantee the quality, safety, or medical outcomes of services provided.</li>
                                <li>All medical service contracts are formed directly between the Patient and the Healthcare Provider.</li>
                                <li><strong>Medical Disclaimer:</strong> The services provided are not a substitute for emergency medical care. In case of emergency, please call 911 or visit your nearest hospital.</li>
                            </ul>
                        </section>

                        {/* Section 2: Healthcare Provider Requirements */}
                        <section className="bg-slate-50 dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700 transition-colors">
                            <div className="flex items-center gap-3 mb-4">
                                <ClipboardCheck className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">2. Healthcare Provider Requirements</h2>
                            </div>
                            <div className="space-y-4">
                                <p>All healthcare providers on the HommieCare Medical platform must meet the following requirements:</p>
                                <ul className="list-disc pl-6 space-y-3 font-medium text-slate-700 dark:text-slate-300">
                                    <li><strong>Licensing:</strong> Possess a valid practicing license from the Kenya Medical Practitioners and Dentists Council, Nursing Council of Kenya, or relevant regulatory body.</li>
                                    <li><strong>Insurance:</strong> Maintain valid professional indemnity insurance as required by the Medical Practitioners and Dentists Act (Cap 253) or relevant healthcare regulations.</li>
                                    <li><strong>Certification:</strong> Provide proof of current CPR, First Aid, and any specialized certifications (e.g., Advanced Cardiac Life Support, Pediatric Advanced Life Support).</li>
                                    <li><strong>Background Check:</strong> Pass a criminal background check as per the Criminal Records (Clean Slate) Act.</li>
                                    <li><strong>Continuing Education:</strong> Maintain continuing education credits as required by their respective regulatory bodies.</li>
                                    <li><strong>Compliance:</strong> Adhere to the Kenya Health Act and all applicable healthcare regulations.</li>
                                </ul>
                            </div>
                        </section>

                        {/* Section 3: Medical Services Overview */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <Pill className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">3. Medical Services Overview</h2>
                            </div>
                            <p className="mb-4 text-slate-700 dark:text-slate-300 font-medium">The following medical services are available on the HommieCare Medical platform:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { icon: Heart, text: "Home Nursing - Professional nursing care in the comfort of your home" },
                                    { icon: Pill, text: "Medication Administration - Safe management of prescribed medications" },
                                    { icon: Syringe, text: "Injection Services - Professional administration of injections" },
                                    { icon: Users, text: "Elderly Care - Compassionate care for elderly patients" },
                                    { icon: Ambulance, text: "Post-Hospital Care - Recovery support after hospitalization" },
                                    { icon: Brain, text: "Palliative Care - Comfort and support for chronic illnesses" },
                                    { icon: Stethoscope, text: "Wound Care - Professional wound management and care" },
                                    { icon: ClipboardCheck, text: "Health Monitoring - Regular vital signs monitoring" }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-2 items-start bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
                                        <item.icon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                        <span className="text-sm">{item.text}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Section 4: Payments & M-Pesa */}
                        <section className="bg-slate-50 dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700 transition-colors">
                            <div className="flex items-center gap-3 mb-4">
                                <CreditCard className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">4. Payments & M-Pesa Integration</h2>
                            </div>
                            <div className="space-y-4">
                                <p>All medical service payments made via M-Pesa, Airtel Money, or other integrated payment gateways are subject to the following terms:</p>
                                <ul className="list-disc pl-6 space-y-3 font-medium text-slate-700 dark:text-slate-300">
                                    <li><strong>Transaction Fees:</strong> Users may be liable for carrier-specific transaction fees as determined by Safaricom PLC, Airtel Networks Kenya Limited, or other payment processors.</li>
                                    <li><strong>Escrow/Holding:</strong> HommieCare may hold medical service funds in escrow until service completion is confirmed by the patient. Funds are held in compliance with the National Payment System Act, 2011 (Kenya).</li>
                                    <li><strong>Refunds:</strong> Refund requests must be logged within 24 hours of the scheduled medical service time and are subject to verification. Approved refunds will be processed within 7-14 business days to the original payment method.</li>
                                    <li><strong>Chargebacks:</strong> Any M-Pesa reversal or chargeback requests must follow Safaricom's dispute resolution procedures.</li>
                                    <li><strong>Medical Booking Fee:</strong> A non-refundable platform booking fee may apply to secure medical services. This fee covers platform operational costs including provider verification and administrative support.</li>
                                </ul>
                            </div>
                        </section>

                        {/* Section 5: Patient Obligations */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <Users className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">5. Patient Obligations</h2>
                            </div>
                            <ul className="list-disc pl-6 space-y-3">
                                <li><strong>Accurate Information:</strong> Patients must provide accurate medical history and current health information to healthcare providers.</li>
                                <li><strong>Informed Consent:</strong> Patients must provide informed consent for all medical procedures and treatments.</li>
                                <li><strong>Payment Obligation:</strong> Patients agree to pay the agreed-upon amount for medical services rendered.</li>
                                <li><strong>Respectful Behavior:</strong> Patients must not misuse the platform to harass, defraud, or exploit Healthcare Providers.</li>
                                <li><strong>Cancellation Policy:</strong> Cancellation must be made at least 12 hours before the scheduled service time to qualify for a full refund.</li>
                                <li><strong>Emergency Situations:</strong> Patients understand that this platform is not for emergency medical situations and agree to seek immediate care at a hospital for emergencies.</li>
                            </ul>
                        </section>

                        {/* Section 6: Medical Information & Privacy */}
                        <section className="bg-slate-50 dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700 transition-colors">
                            <div className="flex items-center gap-3 mb-4">
                                <Lock className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">6. Medical Information & Privacy</h2>
                            </div>
                            <div className="space-y-4">
                                <p>HommieCare Medical is committed to protecting your medical information in accordance with:</p>
                                <ul className="list-disc pl-6 space-y-3 font-medium text-slate-700 dark:text-slate-300">
                                    <li><strong>Data Protection Act, 2019 (Kenya)</strong> - All personal and medical data is processed in compliance with this act.</li>
                                    <li><strong>Health Information Privacy:</strong> Your medical information will be kept confidential and only shared with healthcare providers directly involved in your care.</li>
                                    <li><strong>Consent:</strong> You consent to the collection and processing of your medical data for the purpose of providing healthcare services.</li>
                                    <li><strong>Data Security:</strong> HommieCare implements industry-standard security measures to protect your medical information from unauthorized access.</li>
                                    <li><strong>Data Retention:</strong> Medical records will be retained for a minimum of 7 years as required by the Kenya Health Act.</li>
                                </ul>
                            </div>
                        </section>

                        {/* Section 7: Limitation of Liability */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <AlertTriangle className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">7. Limitation of Liability</h2>
                            </div>
                            <div className="bg-red-50 dark:bg-red-950/50 text-red-900 dark:text-red-300 p-6 rounded-2xl border border-red-100 dark:border-red-900/50 text-sm md:text-base transition-colors">
                                <p className="font-bold mb-2">Important Medical Disclaimer:</p>
                                <p>
                                    To the maximum extent permitted by the Laws of Kenya, HommieCare Medical shall not be liable for any direct, indirect, incidental, special, or consequential damages including but not limited to: adverse medical outcomes, complications, injuries, death, or any other loss resulting from medical services booked on the platform. The medical contract is strictly between the <strong>Patient</strong> and the <strong>Healthcare Provider</strong>. HommieCare Medical's total liability, if any, shall not exceed the platform booking fee paid for the specific transaction in question.
                                </p>
                                <p className="mt-3 text-red-800 dark:text-red-400 font-bold">
                                    ⚠️ This platform is not a substitute for emergency medical care. In case of emergency, please call 911 or visit your nearest hospital immediately.
                                </p>
                            </div>
                        </section>

                        {/* Section 8: Provider Obligations & Medical Standards */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <ShieldAlert className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">8. Provider Medical Obligations</h2>
                            </div>
                            <p className="mb-4 text-slate-700 dark:text-slate-300 font-medium">By listing medical services on HommieCare, Healthcare Providers represent and warrant that they:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    "Possess valid practicing licenses from the Nursing Council of Kenya or relevant regulatory body.",
                                    "Maintain professional indemnity insurance as required by Kenyan healthcare regulations.",
                                    "Provide accurate pricing inclusive of all applicable taxes (VAT at 16% where applicable).",
                                    "Follow the Kenya Health Act and all applicable healthcare standards and protocols.",
                                    "Maintain patient confidentiality as per the Health Information Privacy guidelines.",
                                    "Document all medical procedures and maintain accurate patient records."
                                ].map((text, i) => (
                                    <div key={i} className="flex gap-2 items-start bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                                        <span className="text-sm">{text}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Section 9: Dispute Resolution */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <Scale className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">9. Medical Dispute Resolution</h2>
                            </div>
                            <ol className="list-decimal pl-6 space-y-3">
                                <li><strong>Internal Resolution:</strong> Patients must first attempt to resolve disputes through HommieCare's internal dispute resolution system.</li>
                                <li><strong>Medical Ethics Committee:</strong> Medical disputes may be referred to the relevant medical ethics committee or professional body.</li>
                                <li><strong>Mediation:</strong> If unresolved, disputes shall be referred to mediation under the Nairobi Centre for International Arbitration (NCIA) rules.</li>
                                <li><strong>Arbitration:</strong> Any dispute not resolved through mediation shall be settled by binding arbitration in accordance with the Arbitration Act, 1995 (Kenya).</li>
                                <li><strong>Jurisdiction:</strong> For disputes not subject to arbitration, the courts of Nairobi, Kenya shall have exclusive jurisdiction.</li>
                            </ol>
                        </section>

                        {/* Section 10: Governing Law */}
                        <section className="border-l-4 border-slate-900 dark:border-white pl-6 py-2 bg-slate-50 dark:bg-slate-800 transition-colors">
                            <div className="flex items-center gap-3 mb-4">
                                <MapPin className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">10. Governing Law & Healthcare Regulations</h2>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300">
                                These Terms of Service are governed by and construed in accordance with the <strong>Laws of the Republic of Kenya</strong> including but not limited to:
                                The Constitution of Kenya, 2010; The Kenya Health Act; The Medical Practitioners and Dentists Act (Cap 253); The Nursing Council of Kenya Act; The Data Protection Act, 2019; The Consumer Protection Act, 2012; The Computer Misuse and Cybercrimes Act, 2018; and all applicable subsidiary legislation. Any disputes arising from or in connection with these terms shall be subject to the exclusive jurisdiction of the courts in Nairobi, Kenya.
                            </p>
                        </section>

                        {/* Section 11: Contact & Legal Inquiries - Updated for Medical Focus */}
                        <section className="bg-white dark:bg-gray-950 text-white rounded-[2rem] p-6 md:p-10 text-center border dark:border-slate-800 shadow-lg transition-colors">
                            <Stethoscope className="w-12 h-12 mx-auto mb-6 text-primary" />
                            <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 text-slate-900 dark:text-white">11. Medical Legal Inquiries</h2>
                            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
                                For formal legal notices, medical data protection inquiries, or questions regarding these terms, please contact:
                            </p>
                            <div className="inline-block bg-slate-50 dark:bg-slate-800 backdrop-blur-md px-8 py-6 rounded-2xl border border-slate-100 dark:border-slate-700">
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
                                    <p className="text-xs text-slate-500 dark:text-slate-500">Nairobi, Kenya</p>
                                </div>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-3 uppercase tracking-widest">HommieCare Medical Legal Department</p>
                            </div>
                        </section>

                        {/* Section 12: Amendments */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <Clock className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">12. Amendments to Terms</h2>
                            </div>
                            <p>
                                HommieCare Medical reserves the right to modify these terms at any time. Healthcare regulatory changes may require immediate updates. Users will be notified of material changes via email or platform notification. Continued use of the platform after changes constitutes acceptance of the modified terms.
                            </p>
                        </section>

                        {/* Footer */}
                        <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500 text-sm">
                            <div className="flex items-center justify-center gap-2 mb-3">
                                <Heart className="w-4 h-4 text-rose-400" />
                                <p>© {new Date().getFullYear()} HommieCare Medical. Registered in the Republic of Kenya.</p>
                            </div>
                            <p className="font-medium italic text-slate-500 dark:text-slate-400">"Professional Home Nursing & Healthcare Services at Your Doorstep."</p>
                            <p className="text-xs mt-3 text-slate-400 dark:text-slate-500">
                                Registration No: PVT-XXXXXXX | Tax PIN: PXXXXXXXXX
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
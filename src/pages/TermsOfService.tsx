"use client";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Gavel, AlertTriangle, CreditCard, UserCheck, ShieldAlert, Mail, ArrowLeft, Scale, FileText, Shield, Ban, Phone, MapPin, Globe, Lock, Users, Calendar, Clock, Heart } from "lucide-react";

export default function TermsOfService() {
    const navigate = useNavigate();
    return (
        <div
            className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed relative transition-colors duration-300"
            style={{ backgroundImage: "url('/background2.png')" }}
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
                            <Gavel className="w-8 h-8" />
                            <span className="font-bold tracking-widest uppercase text-sm">Binding Agreement</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black mb-4 tracking-tight text-slate-900 dark:text-white">
                            Terms of Service
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl leading-relaxed">
                            Please read these terms carefully before using the HommieGo platform. By accessing or using our service, you agree to be bound by these legally binding terms and conditions.
                        </p>
                        <p className="text-slate-400 dark:text-slate-500 text-sm mt-6">
                            Last updated: May 22, 2026
                        </p>
                    </div>

                    <div className="p-4 md:p-16 space-y-12 text-slate-600 dark:text-slate-300 leading-relaxed text-base md:text-lg">

                        {/* Section 1: Nature of HommieGo */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <UserCheck className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">1. Nature of HommieGo</h2>
                            </div>
                            <p className="mb-4">
                                HommieGo provides a digital marketplace that connects independent service providers ("Providers") with customers seeking services ("Customers"). You acknowledge and agree that:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 mb-4">
                                <li><strong>HommieGo is not a service provider</strong> and does not employ, supervise, or direct the individuals or businesses listed on the platform.</li>
                                <li>We act solely as an <strong>intermediary technology platform</strong> facilitating connections between Customers and Providers.</li>
                                <li>HommieGo does not guarantee the quality, safety, or legality of services provided.</li>
                                <li>All service contracts are formed directly between the Customer and the Provider.</li>
                            </ul>
                        </section>

                        {/* Section 2: Payments & M-Pesa */}
                        <section className="bg-slate-50 dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700 transition-colors">
                            <div className="flex items-center gap-3 mb-4">
                                <CreditCard className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">2. Payments & M-Pesa Integration</h2>
                            </div>
                            <div className="space-y-4">
                                <p>All payments made via M-Pesa, Airtel Money, or other integrated payment gateways are subject to the following terms:</p>
                                <ul className="list-disc pl-6 space-y-3 font-medium text-slate-700 dark:text-slate-300">
                                    <li><strong>Transaction Fees:</strong> Users may be liable for carrier-specific transaction fees as determined by Safaricom PLC, Airtel Networks Kenya Limited, or other payment processors.</li>
                                    <li><strong>Escrow/Holding:</strong> HommieGo may hold funds in escrow until service completion is confirmed by the customer. Funds are held in compliance with the National Payment System Act, 2011 (Kenya).</li>
                                    <li><strong>Refunds:</strong> Refund requests must be logged within 24 hours of the scheduled service time and are subject to verification. Approved refunds will be processed within 7-14 business days to the original payment method.</li>
                                    <li><strong>Chargebacks:</strong> Any M-Pesa reversal or chargeback requests must follow Safaricom's dispute resolution procedures.</li>
                                    <li><strong>Booking Fee:</strong> A non-refundable platform booking fee may apply to secure services. This fee covers platform operational costs.</li>
                                </ul>
                            </div>
                        </section>

                        {/* Section 3: Provider Obligations */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <ShieldAlert className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">3. Provider Obligations & Warranties</h2>
                            </div>
                            <p className="mb-4 text-slate-700 dark:text-slate-300 font-medium">By listing services on HommieGo, Providers represent and warrant that they:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    "Possess valid Kenyan work permits, business licenses, or professional certifications as required by Kenyan law.",
                                    "Will provide accurate pricing inclusive of all applicable taxes (VAT at 16% where applicable under the VAT Act, 2013).",
                                    "Will honor all bookings accepted through the platform or face penalties including account suspension.",
                                    "Are responsible for their own personal accident insurance, tools, and equipment.",
                                    "Have no criminal record relevant to the services they offer (as per the Criminal Records (Clean Slate) Act).",
                                    "Will comply with all Data Protection Act, 2019 requirements when handling customer information."
                                ].map((text, i) => (
                                    <div key={i} className="flex gap-2 items-start bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                                        <span className="text-sm">{text}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Section 4: Customer Obligations */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <Users className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">4. Customer Obligations</h2>
                            </div>
                            <ul className="list-disc pl-6 space-y-3">
                                <li>Customers must provide accurate information including contact details and service location.</li>
                                <li>Customers agree to pay the agreed-upon amount for services rendered.</li>
                                <li>Customers must not misuse the platform to harass, defraud, or exploit Providers.</li>
                                <li>Cancellation must be made at least 12 hours before the scheduled service time to qualify for a full refund.</li>
                            </ul>
                        </section>

                        {/* Section 5: Limitation of Liability */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <AlertTriangle className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">5. Limitation of Liability</h2>
                            </div>
                            <div className="bg-red-50 dark:bg-red-950/50 text-red-900 dark:text-red-300 p-6 rounded-2xl border border-red-100 dark:border-red-900/50 text-sm md:text-base transition-colors">
                                <p className="font-bold mb-2">Important Legal Notice:</p>
                                <p>
                                    To the maximum extent permitted by the Laws of Kenya, HommieGo shall not be liable for any direct, indirect, incidental, special, or consequential damages including but not limited to: theft, injury, death, property damage, sub-standard workmanship, breach of contract, or any other loss resulting from services booked on the platform. The contract for service is strictly between the <strong>Customer</strong> and the <strong>Provider</strong>. HommieGo's total liability, if any, shall not exceed the platform booking fee paid for the specific transaction in question.
                                </p>
                            </div>
                        </section>

                        {/* Section 6: User Conduct & Safety */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <Shield className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">6. User Conduct & Platform Safety</h2>
                            </div>
                            <ul className="list-disc pl-6 space-y-3">
                                <li>Users must not circumvent the platform to avoid service fees (off-platform dealing is strictly prohibited).</li>
                                <li>Abusive, discriminatory, or harassing behavior toward Providers or HommieGo staff will result in an immediate permanent ban without refund.</li>
                                <li>Users are strongly encouraged to meet Providers in safe, public, or well-lit areas for initial consultations.</li>
                                <li>Any form of fraud, including false payment claims or fake reviews, will be reported to relevant Kenyan authorities.</li>
                                <li>Users must be at least 18 years of age to use the platform independently.</li>
                            </ul>
                        </section>

                        {/* Section 7: Intellectual Property */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <FileText className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">7. Intellectual Property</h2>
                            </div>
                            <p>
                                All content, trademarks, logos, and intellectual property on the HommieGo platform are owned by or licensed to HommieGo. Users may not reproduce, distribute, or create derivative works without express written permission. Unauthorized use may result in legal action under the Copyright Act (Cap 130) and the Trade Marks Act (Cap 506) of Kenya.
                            </p>
                        </section>

                        {/* Section 8: Privacy & Data Protection */}
                        <section className="bg-slate-50 dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700 transition-colors">
                            <div className="flex items-center gap-3 mb-4">
                                <Lock className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">8. Privacy & Data Protection</h2>
                            </div>
                            <p className="mb-4">
                                HommieGo collects and processes personal data in accordance with the <strong>Data Protection Act, 2019 (Kenya)</strong>. By using the platform:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>You consent to the collection and processing of your personal data as described in our Privacy Policy.</li>
                                <li>You have the right to access, rectify, or delete your personal data by contacting our Data Protection Officer.</li>
                                <li>Your data will not be shared with third parties without your consent except as required by law.</li>
                                <li>HommieGo implements reasonable security measures to protect your data from unauthorized access.</li>
                            </ul>
                        </section>

                        {/* Section 9: Dispute Resolution */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <Scale className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">9. Dispute Resolution</h2>
                            </div>
                            <ol className="list-decimal pl-6 space-y-3">
                                <li><strong>Internal Resolution:</strong> Users must first attempt to resolve disputes through HommieGo's internal dispute resolution system.</li>
                                <li><strong>Mediation:</strong> If unresolved, disputes shall be referred to mediation under the Nairobi Centre for International Arbitration (NCIA) rules.</li>
                                <li><strong>Arbitration:</strong> Any dispute not resolved through mediation shall be settled by binding arbitration in accordance with the Arbitration Act, 1995 (Kenya).</li>
                                <li><strong>Jurisdiction:</strong> For disputes not subject to arbitration, the courts of Nairobi, Kenya shall have exclusive jurisdiction.</li>
                            </ol>
                        </section>

                        {/* Section 10: Termination */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <Ban className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">10. Account Termination</h2>
                            </div>
                            <p>
                                HommieGo reserves the right to suspend or terminate any user account at its sole discretion for violation of these terms, fraudulent activity, or any conduct deemed harmful to the platform or its users. Upon termination, all pending bookings may be cancelled, and any funds held may be forfeited.
                            </p>
                        </section>

                        {/* Section 11: Governing Law */}
                        <section className="border-l-4 border-slate-900 dark:border-white pl-6 py-2 bg-slate-50 dark:bg-slate-800 transition-colors">
                            <div className="flex items-center gap-3 mb-4">
                                <MapPin className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">11. Governing Law</h2>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300">
                                These Terms of Service are governed by and construed in accordance with the <strong>Laws of the Republic of Kenya</strong> including but not limited to: The Constitution of Kenya, 2010; The Law of Contract Act (Cap 23); The Consumer Protection Act, 2012; The Computer Misuse and Cybercrimes Act, 2018; and all applicable subsidiary legislation. Any disputes arising from or in connection with these terms shall be subject to the exclusive jurisdiction of the courts in Nairobi, Kenya.
                            </p>
                        </section>

                        {/* Section 12: Contact & Legal Inquiries */}
                        <section className="bg-white dark:bg-slate-900 text-white rounded-[2rem] p-6 md:p-10 text-center border dark:border-slate-800 shadow-lg transition-colors">
                            <Mail className="w-12 h-12 mx-auto mb-6 text-primary" />
                            <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 text-slate-900 dark:text-white">12. Legal Inquiries & Contact</h2>
                            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
                                For formal legal notices, data protection inquiries, or questions regarding these terms, please contact:
                            </p>
                            <div className="inline-block bg-slate-50 dark:bg-slate-800 backdrop-blur-md px-8 py-6 rounded-2xl border border-slate-100 dark:border-slate-700">
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
                                    <p className="text-xs text-slate-500 dark:text-slate-500">Nairobi, Kenya</p>
                                </div>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-3 uppercase tracking-widest">HommieGo Legal Department</p>
                            </div>
                        </section>

                        {/* Section 13: Amendments */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <Clock className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">13. Amendments to Terms</h2>
                            </div>
                            <p>
                                HommieGo reserves the right to modify these terms at any time. Users will be notified of material changes via email or platform notification. Continued use of the platform after changes constitutes acceptance of the modified terms.
                            </p>
                        </section>

                        {/* Footer */}
                        <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500 text-sm">
                            <div className="flex items-center justify-center gap-2 mb-3">
                                <Heart className="w-4 h-4 text-rose-400" />
                                <p>© {new Date().getFullYear()} HommieGo Inc. Registered in the Republic of Kenya.</p>
                            </div>
                            <p className="font-medium italic text-slate-500 dark:text-slate-400">"Connecting Kenyans to Quality Services."</p>
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
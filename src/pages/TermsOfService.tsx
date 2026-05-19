import { Navbar } from "@/components/Navbar";
import { Gavel, AlertTriangle, CreditCard, UserCheck, ShieldAlert, Mail } from "lucide-react";

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Navbar />

            <div className="max-w-4xl mx-auto px-4 pt-32 pb-20">
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/60 overflow-hidden border border-slate-100">

                    {/* Header Banner */}
                    <div className="bg-white p-10 md:p-16 text-black">
                        <div className="flex items-center gap-3 mb-6 text-primary">
                            <Gavel className="w-8 h-8" />
                            <span className="font-bold tracking-widest uppercase text-sm">Binding Agreement</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
                            Terms of Service
                        </h1>
                        <p className="text-slate-400 font-medium max-w-2xl">
                            Please read these terms carefully before using the HommieGo platform. By using our service, you agree to these legally binding terms.
                        </p>
                        <p className="text-slate-500 text-sm mt-6">
                            Last updated: May 18, 2026
                        </p>
                    </div>

                    <div className="p-8 md:p-16 space-y-12 text-slate-600 leading-relaxed text-lg">

                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <UserCheck className="text-primary w-6 h-6" />
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">1. Nature of HommieGo</h2>
                            </div>
                            <p>
                                HommieGo provides a digital marketplace that connects independent service providers ("Providers") with customers. You acknowledge that <strong>HommieGo is not a service provider</strong> and does not employ the individuals listed on the platform. We act solely as an intermediary technology platform.
                            </p>
                        </section>

                        <section className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
                            <div className="flex items-center gap-3 mb-4">
                                <CreditCard className="text-primary w-6 h-6" />
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">2. Payments & M-Pesa</h2>
                            </div>
                            <div className="space-y-4">
                                <p>All payments made via M-Pesa or other integrated gateways are subject to the following:</p>
                                <ul className="list-disc pl-6 space-y-2 font-medium text-slate-700">
                                    <li><strong>Transaction Fees:</strong> Users may be liable for carrier-specific transaction fees.</li>
                                    <li><strong>Escrow/Holding:</strong> HommieGo may hold funds until service completion is confirmed by the customer.</li>
                                    <li><strong>Refunds:</strong> Refund requests must be logged within 24 hours of the scheduled service time and are subject to verification.</li>
                                </ul>
                            </div>
                        </section>

                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <ShieldAlert className="text-primary w-6 h-6" />
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">3. Provider Obligations</h2>
                            </div>
                            <p className="mb-4 text-slate-700 font-medium">Providers represent and warrant that they:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    "Possess valid Kenyan work permits/licenses.",
                                    "Will provide accurate pricing (inclusive of VAT where applicable).",
                                    "Will honor bookings accepted through the platform.",
                                    "Are responsible for their own personal insurance."
                                ].map((text, i) => (
                                    <div key={i} className="flex gap-2 items-start bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2" />
                                        <span className="text-sm">{text}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <AlertTriangle className="text-primary w-6 h-6" />
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">4. Limitation of Liability</h2>
                            </div>
                            <p className="bg-red-50 text-red-900 p-6 rounded-2xl border border-red-100 text-sm md:text-base">
                                To the maximum extent permitted by Kenyan law, HommieGo shall not be liable for any damages, theft, injury, or sub-standard workmanship resulting from services booked on the platform. The contract for service is strictly between the <strong>Customer</strong> and the <strong>Provider</strong>.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-4">5. User Conduct & Safety</h2>
                            <ul className="list-disc pl-6 space-y-3">
                                <li>Users must not circumvent the platform to avoid service fees.</li>
                                <li>Abusive, discriminatory, or harassing behavior toward providers or staff will result in an immediate permanent ban.</li>
                                <li>Users are encouraged to meet providers in safe, public, or well-lit areas for initial consultations.</li>
                            </ul>
                        </section>

                        <section className="border-l-4 border-slate-900 pl-6 py-2 bg-slate-50">
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-4">6. Governing Law</h2>
                            <p>
                                These Terms are governed by and construed in accordance with the <strong>Laws of the Republic of Kenya</strong>. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts in Nairobi, Kenya.
                            </p>
                        </section>

                        <section className="bg-white text-white rounded-[2rem] p-10 text-center">
                            <Mail className="w-12 h-12 mx-auto mb-6 text-primary" />
                            <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 text-black">7. Legal Inquiries</h2>
                            <p className="text-slate-400 mb-8 max-w-md mx-auto">
                                For formal legal notices or inquiries regarding these terms, please contact our legal team.
                            </p>
                            <div className="inline-block bg-white/10 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/10">
                                <p className="font-bold text-lg">hommiegocare@gmail.com</p>
                                <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">HommieGo Legal Dept.</p>
                            </div>
                        </section>

                    </div>
                </div>

                <div className="mt-12 text-center text-slate-400 text-sm">
                    <p>© {new Date().getFullYear()} HommieGo Inc. Registered in Kenya.</p>
                    <p className="mt-2 font-medium italic">"Connecting Kenyans to Quality."</p>
                </div>
            </div>
        </div>
    );
}
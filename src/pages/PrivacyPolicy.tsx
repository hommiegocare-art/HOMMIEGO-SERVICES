import { Navbar } from "@/components/Navbar";
import { Shield, Lock, Eye, Scale, Globe, Mail } from "lucide-react";

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Navbar />

            <div className="max-w-4xl mx-auto px-4 pt-32 pb-20">
                <div className="bg-white rounded-xl shadow-xl shadow-slate-200/60 overflow-hidden border border-slate-100">

                    {/* Header Banner */}
                    <div className="bg-white p-10 md:p-16 text-black">
                        <div className="flex items-center gap-3 mb-6 text-primary">
                            <Shield className="w-8 h-8" />
                            <span className="font-bold tracking-widest uppercase text-sm">Legal Protection</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
                            Privacy Policy
                        </h1>
                        <p className="text-slate-400 font-medium italic">
                            In compliance with the Kenya Data Protection Act, 2019.
                        </p>
                        <p className="text-slate-500 text-sm mt-4">
                            Last updated: May 18, 2026
                        </p>
                    </div>

                    <div className="p-8 md:p-16 space-y-12 text-slate-600 leading-relaxed text-lg">

                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <Scale className="text-primary w-6 h-6" />
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">1. Introduction</h2>
                            </div>
                            <p>
                                HommieGo ("we," "us," or "our") operates as a <strong>Data Controller</strong> under the laws of Kenya. We are committed to maintaining the trust of our users by protecting their personal data in accordance with the <strong>Data Protection Act, 2019</strong>. This policy outlines our practices regarding the collection, use, and disclosure of your information.
                            </p>
                        </section>

                        <section className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
                            <div className="flex items-center gap-3 mb-4">
                                <Eye className="text-primary w-6 h-6" />
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">2. Data We Collect</h2>
                            </div>
                            <p className="mb-6">We collect and process the following categories of personal data:</p>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { title: "Identity Data", items: "Full name, National ID (for providers), Username." },
                                    { title: "Contact Data", items: "Email address, Phone number, Physical address." },
                                    { title: "Financial Data", items: "M-Pesa transaction IDs, billing details." },
                                    { title: "Technical Data", items: "IP address, browser type, PWA cache data." },
                                    { title: "Usage Data", items: "Service history, reviews, and chat logs." },
                                    { title: "Location Data", items: "GPS coordinates for service mapping." }
                                ].map((item, idx) => (
                                    <li key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                                        <span className="block font-bold text-slate-900">{item.title}</span>
                                        <span className="text-sm text-slate-500">{item.items}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <Lock className="text-primary w-6 h-6" />
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">3. Purpose of Processing</h2>
                            </div>
                            <p className="mb-4">Under Section 28 of the Data Protection Act, we process your data based on:</p>
                            <ul className="list-disc pl-6 space-y-3 font-medium">
                                <li><strong>Performance of Contract:</strong> To connect customers with providers and facilitate bookings.</li>
                                <li><strong>Legal Obligation:</strong> To comply with Kenyan tax laws and anti-money laundering (AML) regulations.</li>
                                <li><strong>Consent:</strong> When you opt-in to marketing or use location-based services.</li>
                                <li><strong>Legitimate Interest:</strong> To prevent fraud and ensure platform security.</li>
                            </ul>
                        </section>

                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <Globe className="text-primary w-6 h-6" />
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">4. Data Storage & Transfers</h2>
                            </div>
                            <p>
                                Your data is stored securely using <strong>Supabase (Cloud Infrastructure)</strong>. While our primary operations are in Kenya, your data may be processed on servers located outside of Kenya. We ensure that such transfers are governed by standard data protection clauses as required by the <strong>Office of the Data Protection Commissioner (ODPC)</strong>.
                            </p>
                        </section>

                        <section className="border-l-4 border-primary pl-6 py-2">
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-4">5. Your Rights as a Kenyan Citizen</h2>
                            <p className="mb-4">You have the following rights regarding your personal data:</p>
                            <div className="space-y-3 text-sm font-bold uppercase tracking-wide">
                                <p className="flex items-center gap-2"><span className="w-2 h-2 bg-primary rounded-full" /> Right to be informed of data collection</p>
                                <p className="flex items-center gap-2"><span className="w-2 h-2 bg-primary rounded-full" /> Right to access your personal data</p>
                                <p className="flex items-center gap-2"><span className="w-2 h-2 bg-primary rounded-full" /> Right to object to processing</p>
                                <p className="flex items-center gap-2"><span className="w-2 h-2 bg-primary rounded-full" /> Right to correction or deletion (Erasure)</p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-4">6. Data Retention</h2>
                            <p>
                                We retain your personal data only for as long as necessary to provide our services and fulfill legal requirements. Financial records (e.g., M-Pesa logs) are retained for a period of up to 7 years in compliance with Kenyan financial regulations.
                            </p>
                        </section>

                        <section className="bg-white text-black rounded-xl p-10 text-center">
                            <Mail className="w-12 h-12 mx-auto mb-6 text-primary" />
                            <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 text-black">7. Contact Our Data Office</h2>
                            <p className="text-slate-400 mb-8 max-w-md mx-auto">
                                If you wish to exercise your rights or file a complaint regarding your privacy, please contact our designated Data Protection Officer.
                            </p>
                            <div className="inline-block bg-white/10 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/10">
                                <p className="font-bold text-lg">hommiegocare@gmail.com</p>
                                <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">Nairobi, Kenya</p>
                            </div>
                        </section>

                    </div>
                </div>

                <div className="mt-12 text-center text-slate-400 text-sm">
                    <p>© {new Date().getFullYear()} HommieGo Inc. All Rights Reserved.</p>
                    <p className="mt-2 font-medium">Regulated by the Data Protection Act of 2019 (Republic of Kenya).</p>
                </div>
            </div>
        </div>
    );
}
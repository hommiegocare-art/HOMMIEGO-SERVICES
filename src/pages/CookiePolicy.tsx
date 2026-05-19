"use client";
import { useNavigate } from "react-router-dom"; // Import the router
import { Navbar } from "@/components/Navbar";
import { Cookie, ShieldCheck, Activity, ArrowLeft, Settings, Info, MousePointerClick, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CookiePolicy() {
    const navigate = useNavigate();

    return (
        <div
            className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed relative"
            style={{ backgroundImage: "url('/background4.png')" }}
        >
            <Navbar />

            <div className="max-w-4xl mx-auto px-4 pt-32 pb-20">

                <div className="bg-white rounded-xl shadow-xl shadow-slate-200/60 overflow-hidden border border-slate-100">
                    <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 mt-3 gap-2">
                        <ArrowLeft className="w-4 h-4" /> Back to service
                    </Button>
                    {/* Header Banner */}
                    <div className="bg-white p-2 md:p-16 text-black">
                        <div className="flex items-center gap-3 mb-6 text-primary">
                            <Cookie className="w-8 h-8" />
                            <span className="font-bold tracking-widest uppercase text-sm">Transparency</span>
                        </div>
                        <h1 className="text-3xl md:text-3xl font-black mb-4 tracking-tight">
                            Cookie Policy
                        </h1>
                        <p className="text-slate-400 font-medium max-w-2xl leading-relaxed">
                            This policy explains how HommieGo uses cookies and similar technologies (like Local Storage) to recognize you when you visit our platform.
                        </p>
                        <p className="text-slate-500 text-sm mt-6">
                            Last updated: May 18, 2026
                        </p>
                    </div>

                    <div className="p-8 md:p-16 space-y-12 text-slate-600 leading-relaxed text-lg">

                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <Info className="text-primary w-6 h-6" />
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">1. What are Cookies?</h2>
                            </div>
                            <p>
                                Cookies are small data files that are placed on your computer or mobile device when you visit a website. For our <strong>Progressive Web App (PWA)</strong>, we also use "Local Storage" and "Session Storage." These technologies allow us to store information locally on your phone so the app remains fast and works even when your internet is slow or offline.
                            </p>
                        </section>

                        <section className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
                            <div className="flex items-center gap-3 mb-6">
                                <Activity className="text-primary w-6 h-6" />
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">2. How We Use Them</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[
                                    {
                                        title: "Authentication",
                                        desc: "To keep you signed in as you move between pages and prevent you from having to re-enter your password constantly.",
                                        icon: ShieldCheck
                                    },
                                    {
                                        title: "Personalization",
                                        desc: "Remembering your city, preferred services, and dashboard settings.",
                                        icon: Settings
                                    },
                                    {
                                        title: "Security",
                                        desc: "Detecting fraudulent activity and protecting your account from unauthorized access.",
                                        icon: MousePointerClick
                                    },
                                    {
                                        title: "PWA Caching",
                                        desc: "Storing app icons and core logic so HommieGo opens instantly on your mobile home screen.",
                                        icon: Cookie
                                    }
                                ].map((item, idx) => (
                                    <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-4 text-primary">
                                            <item.icon className="w-5 h-5" />
                                        </div>
                                        <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                                        <p className="text-sm text-slate-500">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-4">3. Essential Cookies</h2>
                            <p>
                                These are strictly necessary to provide you with services available through our platform. Because these cookies are strictly necessary to deliver the platform, you cannot refuse them without impacting how our platform functions (e.g., logging into your Provider Dashboard).
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-4">4. Third-Party Cookies</h2>
                            <p className="mb-4">
                                In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the platform and facilitate payments:
                            </p>
                            <ul className="list-disc pl-6 space-y-3 font-medium">
                                <li><strong>Supabase:</strong> Used for secure user session management.</li>
                                <li><strong>M-Pesa/Payment Gateways:</strong> Used to securely track transaction statuses.</li>
                                <li><strong>Google Analytics:</strong> (Optional) Used to help us understand which service categories are most popular in Kenya.</li>
                            </ul>
                        </section>

                        <section className="border-l-4 border-primary pl-6 py-2 bg-slate-50">
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-4">5. Managing Your Preferences</h2>
                            <p>
                                You have the right to decide whether to accept or reject cookies. You can set or amend your web browser controls to accept or refuse cookies. If you choose to reject cookies, you may still use our platform though your access to some functionality and areas (like your account) may be restricted.
                            </p>
                        </section>

                        <section className="bg-white text-white rounded-xl p-10 text-center">
                            <Mail className="w-12 h-12 mx-auto mb-6 text-primary" />
                            <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 text-black">6. Questions?</h2>
                            <p className="text-slate-400 mb-8 max-w-md mx-auto">
                                If you have any questions about our use of cookies or other technologies, please email us.
                            </p>
                            <div className="inline-block bg-white/10 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/10">
                                <p className="font-bold text-lg">hommiegocare@gmail.com</p>
                                <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">Nairobi, Kenya</p>
                            </div>
                        </section>

                        <div className="mt-12 text-center text-slate-400 text-sm font-medium">
                            <p>© {new Date().getFullYear()} HommieGo Inc. All Rights Reserved.</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
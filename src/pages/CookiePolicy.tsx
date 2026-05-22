"use client";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Cookie, ShieldCheck, Activity, ArrowLeft, Settings, Info, MousePointerClick, Mail, Globe, Smartphone, Database, Eye, Trash2, AlertCircle, Clock, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CookiePolicy() {
    const navigate = useNavigate();

    return (
        <div
            className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed relative transition-colors duration-300"
            style={{ backgroundImage: "url('/background4.png')" }}
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
                            <Cookie className="w-8 h-8" />
                            <span className="font-bold tracking-widest uppercase text-sm">Transparency & Compliance</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black mb-4 tracking-tight text-slate-900 dark:text-white">
                            Cookie Policy
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl leading-relaxed">
                            This policy explains how HommieGo uses cookies and similar tracking technologies (like Local Storage, Session Storage, and IndexedDB) to recognize you when you visit our platform. We are committed to transparency and compliance with the Data Protection Act, 2019 (Kenya).
                        </p>
                        <p className="text-slate-400 dark:text-slate-500 text-sm mt-6">
                            Last updated: May 22, 2026
                        </p>
                    </div>

                    <div className="p-4 md:p-16 space-y-12 text-slate-600 dark:text-slate-300 leading-relaxed text-base md:text-lg">

                        {/* Section 1: What Are Cookies */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <Info className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">1. What Are Cookies & Similar Technologies?</h2>
                            </div>
                            <p className="mb-4">
                                Cookies are small data files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to the website owners.
                            </p>
                            <p className="mb-4">
                                For our <strong>Progressive Web App (PWA)</strong>, we also use additional browser storage technologies:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Local Storage:</strong> Stores data persistently on your device so the app remains fast and works even when your internet is slow or offline.</li>
                                <li><strong>Session Storage:</strong> Temporarily stores data during your browsing session and is cleared when you close the app.</li>
                                <li><strong>IndexedDB:</strong> A more powerful database system that allows us to cache service listings and images for faster loading.</li>
                                <li><strong>Service Workers:</strong> Enable offline functionality and push notifications on your mobile device.</li>
                            </ul>
                        </section>

                        {/* Section 2: How We Use Them */}
                        <section className="bg-slate-50 dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700 transition-colors">
                            <div className="flex items-center gap-3 mb-6">
                                <Activity className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">2. How We Use Cookies & Storage</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[
                                    {
                                        title: "Authentication",
                                        desc: "To keep you signed in as you move between pages and prevent you from having to re-enter your credentials constantly.",
                                        icon: ShieldCheck
                                    },
                                    {
                                        title: "Personalization",
                                        desc: "Remembering your city, preferred service categories, language preferences, and dashboard layout settings.",
                                        icon: Settings
                                    },
                                    {
                                        title: "Security & Fraud Prevention",
                                        desc: "Detecting suspicious activity, preventing unauthorized access, and protecting your account from fraudulent logins.",
                                        icon: MousePointerClick
                                    },
                                    {
                                        title: "PWA Caching",
                                        desc: "Storing app icons, core logic, and frequently accessed pages so HommieGo opens instantly from your mobile home screen.",
                                        icon: Smartphone
                                    },
                                    {
                                        title: "Analytics & Performance",
                                        desc: "Understanding which service categories are most popular in Kenya and how users navigate the platform to improve experience.",
                                        icon: Activity
                                    },
                                    {
                                        title: "Payment Processing",
                                        desc: "Securely tracking M-Pesa transaction statuses and maintaining payment session integrity.",
                                        icon: Database
                                    }
                                ].map((item, idx) => (
                                    <div key={idx} className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
                                        <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center mb-4 text-primary">
                                            <item.icon className="w-5 h-5" />
                                        </div>
                                        <h3 className="font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Section 3: Types of Cookies */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <Cookie className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">3. Types of Cookies We Use</h2>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-2">3.1 Essential Cookies (Strictly Necessary)</h3>
                                    <p className="mb-2">These are strictly necessary to provide you with services available through our platform. They enable core functionality such as:</p>
                                    <ul className="list-disc pl-6 space-y-1">
                                        <li>User authentication and session management</li>
                                        <li>Security features and CSRF protection</li>
                                        <li>Booking process functionality</li>
                                        <li>Payment transaction integrity</li>
                                    </ul>
                                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 italic">Because these cookies are strictly necessary, you cannot refuse them without impacting how our platform functions.</p>
                                </div>

                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-2">3.2 Functional Cookies</h3>
                                    <p>These enable us to remember choices you make and provide enhanced, more personal features such as your preferred location, recently viewed services, and saved favorites.</p>
                                </div>

                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-2">3.3 Performance & Analytics Cookies</h3>
                                    <p>These help us understand how visitors interact with our platform by collecting and reporting information anonymously. This helps us improve which categories of services to promote in Kenya.</p>
                                </div>

                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-2">3.4 Marketing Cookies</h3>
                                    <p>These may be used to deliver advertisements more relevant to you and your interests. HommieGo currently uses minimal marketing cookies, primarily for promoting featured services within Kenya.</p>
                                </div>
                            </div>
                        </section>

                        {/* Section 4: Third-Party Cookies */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <Globe className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">4. Third-Party Cookies & Services</h2>
                            </div>
                            <p className="mb-4">
                                In addition to our own cookies, we may also use various third-party services that set cookies to report usage statistics and facilitate platform operations:
                            </p>
                            <div className="space-y-3">
                                {[
                                    {
                                        name: "Supabase",
                                        purpose: "Secure user session management, authentication tokens, and database queries.",
                                        type: "Essential"
                                    },
                                    {
                                        name: "M-Pesa (Safaricom)",
                                        purpose: "Securely tracking payment transaction statuses and processing STK push requests.",
                                        type: "Essential"
                                    },
                                    {
                                        name: "Cloudinary",
                                        purpose: "Image optimization, caching, and delivery for service photos and profile avatars.",
                                        type: "Functional"
                                    },
                                    {
                                        name: "Google Analytics",
                                        purpose: "Anonymous usage statistics to help us understand which service categories are most popular.",
                                        type: "Analytics (Optional)"
                                    }
                                ].map((item, idx) => (
                                    <div key={idx} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-slate-900 dark:text-white">{item.name}</h3>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{item.type}</span>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">{item.purpose}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Section 5: Your Rights & Choices */}
                        <section className="border-l-4 border-primary pl-6 py-2 bg-slate-50 dark:bg-slate-800 transition-colors">
                            <div className="flex items-center gap-3 mb-4">
                                <Eye className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">5. Your Rights & Choices</h2>
                            </div>
                            <p className="mb-4">
                                You have the right to decide whether to accept or reject cookies. Under the <strong>Data Protection Act, 2019 (Kenya)</strong>, you have the following rights:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 mb-4">
                                <li><strong>Right to be informed:</strong> You have the right to know what data is being collected and how it is used.</li>
                                <li><strong>Right to access:</strong> You can request information about the personal data we hold about you.</li>
                                <li><strong>Right to object:</strong> You can object to the processing of your personal data for marketing purposes.</li>
                                <li><strong>Right to erasure:</strong> You can request deletion of your personal data where applicable.</li>
                            </ul>
                            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 transition-colors">
                                <h4 className="font-bold text-slate-900 dark:text-white mb-2">How to Manage Cookies:</h4>
                                <ul className="list-disc pl-6 space-y-1 text-sm">
                                    <li><strong>Browser Settings:</strong> You can set or amend your web browser controls to accept or refuse cookies through your browser's settings menu.</li>
                                    <li><strong>PWA Storage:</strong> You can clear Local Storage and IndexedDB through your browser's developer tools or by clearing site data in your browser settings.</li>
                                    <li><strong>Mobile Devices:</strong> On Android, go to Settings → Apps → HommieGo → Storage → Clear Data. On iOS, go to Settings → Safari → Advanced → Website Data.</li>
                                </ul>
                                <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
                                    <AlertCircle className="w-4 h-4 inline mr-1" />
                                    If you choose to reject essential cookies, you may still browse the platform but access to your account, bookings, and dashboard may be restricted.
                                </p>
                            </div>
                        </section>

                        {/* Section 6: Cookie Duration */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <Clock className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">6. Cookie Duration</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 transition-colors">
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-2">Session Cookies</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">These are temporary and expire when you close your browser or app. Used for maintaining your login session during a single visit.</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 transition-colors">
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-2">Persistent Cookies</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">These remain on your device for a set period (typically 30-90 days). Used for remembering your preferences and keeping you logged in.</p>
                                </div>
                            </div>
                        </section>

                        {/* Section 7: Data Protection Compliance */}
                        <section className="bg-primary/5 dark:bg-primary/10 rounded-3xl p-6 md:p-8 border border-primary/20">
                            <div className="flex items-center gap-3 mb-4">
                                <ShieldCheck className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">7. Data Protection Compliance (Kenya)</h2>
                            </div>
                            <p className="mb-4">
                                HommieGo is committed to compliance with the <strong>Data Protection Act, 2019</strong> and its accompanying regulations. We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.
                            </p>
                            <p>
                                Our Data Protection Officer can be contacted at the email below for any concerns regarding how your data is processed or stored.
                            </p>
                        </section>

                        {/* Section 8: Updates to This Policy */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <AlertCircle className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">8. Updates to This Cookie Policy</h2>
                            </div>
                            <p>
                                We may update this Cookie Policy from time to time to reflect changes in technology, law, or our business operations. When we make changes, we will update the "Last updated" date at the top of this policy and notify users through the platform. We encourage you to review this policy periodically to stay informed about how we use cookies and similar technologies.
                            </p>
                        </section>

                        {/* Section 9: Contact */}
                        <section className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-10 text-center border dark:border-slate-800 shadow-lg transition-colors">
                            <Mail className="w-12 h-12 mx-auto mb-6 text-primary" />
                            <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 text-slate-900 dark:text-white">9. Questions or Concerns?</h2>
                            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
                                If you have any questions about our use of cookies, data storage, or this policy, please contact our Data Protection team:
                            </p>
                            <div className="inline-block bg-slate-50 dark:bg-slate-800 px-8 py-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-2 justify-center mb-2">
                                    <Mail className="w-4 h-4 text-primary" />
                                    <p className="font-bold text-slate-900 dark:text-white text-lg">hommiegocare@gmail.com</p>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">Data Protection Officer</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Nairobi, Republic of Kenya</p>
                            </div>
                        </section>

                        {/* Footer */}
                        <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500 text-sm">
                            <div className="flex items-center justify-center gap-2 mb-3">
                                <Heart className="w-4 h-4 text-rose-400" />
                                <p>© {new Date().getFullYear()} HommieGo Inc. Registered in the Republic of Kenya. All Rights Reserved.</p>
                            </div>
                            <p className="text-xs mt-2 text-slate-400 dark:text-slate-500">
                                This policy is governed by the Laws of Kenya, including the Data Protection Act, 2019.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
"use client";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import {
    Cookie,
    ShieldCheck,
    Activity,
    ArrowLeft,
    Settings,
    Info,
    MousePointerClick,
    Mail,
    Globe,
    Smartphone,
    Database,
    Eye,
    Trash2,
    AlertCircle,
    Clock,
    Heart,
    Stethoscope,
    Pill,
    UserCheck
} from "lucide-react";
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
                <div className="bg-white dark:bg-gray-950 rounded-xl shadow-xl shadow-slate-200/60 dark:shadow-slate-800/60 overflow-hidden border border-slate-100 dark:border-slate-800 transition-colors">
                    <div className="p-4 md:p-6">
                        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 gap-2 dark:text-slate-300 dark:hover:bg-slate-800">
                            <ArrowLeft className="w-4 h-4" /> Back
                        </Button>
                    </div>

                    {/* Header Banner - Updated for Medical Focus */}
                    <div className="bg-white dark:bg-gray-950 p-4 md:p-16 text-black dark:text-white border-b dark:border-slate-800">
                        <div className="flex items-center gap-3 mb-6 text-primary">
                            <Cookie className="w-8 h-8" />
                            <span className="font-bold tracking-widest uppercase text-sm">Medical Data Privacy & Compliance</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black mb-4 tracking-tight text-slate-900 dark:text-white">
                            Cookie Policy
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl leading-relaxed">
                            This policy explains how HommieCare Medical uses cookies and similar tracking technologies to provide secure, compliant, and efficient healthcare services. We are committed to protecting patient data in accordance with the Data Protection Act, 2019 (Kenya) and the Kenya Health Act.
                        </p>
                        <p className="text-slate-400 dark:text-slate-500 text-sm mt-6">
                            Last updated: July 17, 2026
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
                                For our <strong>Medical Progressive Web App (PWA)</strong>, we use additional browser storage technologies to ensure secure and efficient healthcare delivery:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Local Storage:</strong> Securely stores patient preferences and session data persistently on your device for faster access to medical information.</li>
                                <li><strong>Session Storage:</strong> Temporarily stores sensitive medical session data during your consultation and is cleared when you close the app.</li>
                                <li><strong>IndexedDB:</strong> A powerful database system that caches medical service listings, healthcare provider profiles, and appointment details for offline access.</li>
                                <li><strong>Service Workers:</strong> Enable offline functionality and secure push notifications for appointment reminders and medication alerts.</li>
                            </ul>
                        </section>

                        {/* Section 2: How We Use Them - Medical Focus */}
                        <section className="bg-slate-50 dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700 transition-colors">
                            <div className="flex items-center gap-3 mb-6">
                                <Activity className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">2. How We Use Cookies & Storage</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[
                                    {
                                        title: "Patient Authentication",
                                        desc: "Securely identifying patients and healthcare providers, ensuring only authorized access to medical records and consultations.",
                                        icon: UserCheck
                                    },
                                    {
                                        title: "Medical Data Security",
                                        desc: "Detecting suspicious activity, preventing unauthorized access, and protecting sensitive medical information from breaches.",
                                        icon: ShieldCheck
                                    },
                                    {
                                        title: "Appointment Management",
                                        desc: "Remembering your appointment history, medication schedules, and upcoming consultations.",
                                        icon: Clock
                                    },
                                    {
                                        title: "PWA Medical Caching",
                                        desc: "Storing healthcare provider profiles, service details, and medical information for offline access in areas with poor connectivity.",
                                        icon: Smartphone
                                    },
                                    {
                                        title: "Healthcare Analytics",
                                        desc: "Understanding which medical services are most requested and how patients navigate the platform to improve healthcare delivery.",
                                        icon: Activity
                                    },
                                    {
                                        title: "Payment Processing",
                                        desc: "Securely tracking M-Pesa transactions for medical services and maintaining payment session integrity.",
                                        icon: Database
                                    }
                                ].map((item, idx) => (
                                    <div key={idx} className="bg-white dark:bg-gray-950 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
                                        <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center mb-4 text-primary">
                                            <item.icon className="w-5 h-5" />
                                        </div>
                                        <h3 className="font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Section 3: Types of Cookies - Medical Focus */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <Cookie className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">3. Types of Cookies We Use</h2>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-2">3.1 Essential Medical Cookies (Strictly Necessary)</h3>
                                    <p className="mb-2">These are strictly necessary to provide you with healthcare services through our platform. They enable core functionality such as:</p>
                                    <ul className="list-disc pl-6 space-y-1">
                                        <li>Patient authentication and secure session management</li>
                                        <li>Medical data protection and CSRF protection</li>
                                        <li>Appointment booking and scheduling functionality</li>
                                        <li>Secure payment transaction integrity for medical services</li>
                                        <li>Emergency contact information storage</li>
                                    </ul>
                                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 italic">Because these cookies are strictly necessary for healthcare delivery, you cannot refuse them without impacting medical service functionality.</p>
                                </div>

                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-2">3.2 Functional Medical Cookies</h3>
                                    <p>These enable us to remember your healthcare preferences and provide enhanced features such as your preferred healthcare providers, frequently used medical services, and medication reminders.</p>
                                </div>

                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-2">3.3 Performance & Healthcare Analytics Cookies</h3>
                                    <p>These help us understand how patients interact with our medical platform by collecting and reporting anonymous information. This helps us improve which healthcare services to prioritize and where to deploy more nurses.</p>
                                </div>

                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-2">3.4 Medical Marketing Cookies</h3>
                                    <p>These may be used to deliver health awareness information and medical service updates more relevant to you and your healthcare needs. HommieCare Medical uses minimal marketing cookies, primarily for promoting health education and preventive care.</p>
                                </div>
                            </div>
                        </section>

                        {/* Section 4: Third-Party Cookies - Medical Focus */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <Globe className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">4. Third-Party Cookies & Medical Services</h2>
                            </div>
                            <p className="mb-4">
                                In addition to our own cookies, we partner with trusted medical and technology service providers that set cookies to ensure secure and efficient healthcare delivery:
                            </p>
                            <div className="space-y-3">
                                {[
                                    {
                                        name: "Supabase (Secure Database)",
                                        purpose: "Secure patient authentication tokens, encrypted medical data storage, and HIPAA-compliant database queries.",
                                        type: "Essential"
                                    },
                                    {
                                        name: "M-Pesa (Safaricom)",
                                        purpose: "Securely processing medical service payments, tracking transaction statuses, and managing STK push requests.",
                                        type: "Essential"
                                    },
                                    {
                                        name: "Cloudinary (Medical Media)",
                                        purpose: "Secure storage and delivery of medical images, healthcare provider photos, and patient educational materials.",
                                        type: "Functional"
                                    },
                                    {
                                        name: "Healthcare Analytics Platform",
                                        purpose: "Anonymous usage statistics to help us understand which medical services are most needed in different regions of Kenya.",
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

                        {/* Section 5: Your Rights & Choices - Medical Focus */}
                        <section className="border-l-4 border-primary pl-6 py-2 bg-slate-50 dark:bg-slate-800 transition-colors">
                            <div className="flex items-center gap-3 mb-4">
                                <Eye className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">5. Your Rights & Choices</h2>
                            </div>
                            <p className="mb-4">
                                You have the right to decide whether to accept or reject cookies. Under the <strong>Data Protection Act, 2019 (Kenya)</strong> and <strong>Kenya Health Act</strong>, you have the following rights regarding your medical data:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 mb-4">
                                <li><strong>Right to be informed:</strong> You have the right to know what medical data is being collected and how it is used.</li>
                                <li><strong>Right to access:</strong> You can request information about the personal and medical data we hold about you.</li>
                                <li><strong>Right to object:</strong> You can object to the processing of your medical data for non-treatment purposes.</li>
                                <li><strong>Right to erasure:</strong> You can request deletion of your personal data where applicable, subject to medical record retention requirements.</li>
                                <li><strong>Right to data portability:</strong> You can request your medical data in a portable format.</li>
                            </ul>
                            <div className="bg-white dark:bg-gray-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 transition-colors">
                                <h4 className="font-bold text-slate-900 dark:text-white mb-2">How to Manage Medical Data Cookies:</h4>
                                <ul className="list-disc pl-6 space-y-1 text-sm">
                                    <li><strong>Browser Settings:</strong> You can set or amend your web browser controls to accept or refuse cookies through your browser's settings menu.</li>
                                    <li><strong>PWA Storage:</strong> You can clear Local Storage and IndexedDB through your browser's developer tools or by clearing site data in your browser settings.</li>
                                    <li><strong>Mobile Devices:</strong> On Android, go to Settings → Apps → HommieCare Medical → Storage → Clear Data. On iOS, go to Settings → Safari → Advanced → Website Data.</li>
                                    <li><strong>Medical Data Request:</strong> Contact our Data Protection Officer to request access to or deletion of your medical data.</li>
                                </ul>
                                <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
                                    <AlertCircle className="w-4 h-4 inline mr-1" />
                                    If you choose to reject essential medical cookies, you may still browse the platform but access to your medical records, appointments, and healthcare services may be restricted.
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
                                    <p className="text-sm text-slate-600 dark:text-slate-400">These are temporary and expire when you close your browser or app. Used for maintaining your secure medical session during a single visit.</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 transition-colors">
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-2">Persistent Medical Cookies</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">These remain on your device for a set period (typically 30-90 days). Used for remembering your healthcare preferences and keeping your medical session secure.</p>
                                </div>
                            </div>
                        </section>

                        {/* Section 7: Data Protection & Medical Compliance */}
                        <section className="bg-primary/5 dark:bg-primary/10 rounded-3xl p-6 md:p-8 border border-primary/20">
                            <div className="flex items-center gap-3 mb-4">
                                <ShieldCheck className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">7. Data Protection & Medical Compliance (Kenya)</h2>
                            </div>
                            <p className="mb-4">
                                HommieCare Medical is committed to compliance with:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 mb-4">
                                <li><strong>Data Protection Act, 2019</strong> - Protecting patient personal data with appropriate technical and organizational measures.</li>
                                <li><strong>Kenya Health Act</strong> - Ensuring all medical data handling complies with healthcare regulations and standards.</li>
                                <li><strong>Health Information Privacy Guidelines</strong> - Maintaining strict confidentiality of patient medical records.</li>
                                <li><strong>Nursing Council of Kenya Act</strong> - Adhering to professional standards for nursing and healthcare delivery.</li>
                            </ul>
                            <p>
                                Our Data Protection Officer can be contacted at the email below for any concerns regarding how your medical data is processed or stored.
                            </p>
                        </section>

                        {/* Section 8: Updates to This Policy */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <AlertCircle className="text-primary w-6 h-6 flex-shrink-0" />
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">8. Updates to This Cookie Policy</h2>
                            </div>
                            <p>
                                We may update this Cookie Policy from time to time to reflect changes in healthcare regulations, technology, or our medical operations. When we make changes, we will update the "Last updated" date at the top of this policy and notify patients through the platform. We encourage you to review this policy periodically to stay informed about how we use cookies and similar technologies to protect your medical data.
                            </p>
                        </section>

                        {/* Section 9: Contact - Medical Focus */}
                        <section className="bg-white dark:bg-gray-950 rounded-[2rem] p-6 md:p-10 text-center border dark:border-slate-800 shadow-lg transition-colors">
                            <Stethoscope className="w-12 h-12 mx-auto mb-6 text-primary" />
                            <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 text-slate-900 dark:text-white">9. Questions or Medical Data Concerns?</h2>
                            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
                                If you have any questions about our use of cookies, medical data storage, or this policy, please contact our Data Protection team:
                            </p>
                            <div className="inline-block bg-slate-50 dark:bg-slate-800 px-8 py-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-2 justify-center mb-2">
                                    <Mail className="w-4 h-4 text-primary" />
                                    <p className="font-bold text-slate-900 dark:text-white text-lg">hommiegocare@gmail.com</p>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">Medical Data Protection Officer</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Nairobi, Republic of Kenya</p>
                            </div>
                        </section>

                        {/* Footer */}
                        <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500 text-sm">
                            <div className="flex items-center justify-center gap-2 mb-3">
                                <Heart className="w-4 h-4 text-rose-400" />
                                <p>© {new Date().getFullYear()} HommieCare Medical. Registered in the Republic of Kenya. All Rights Reserved.</p>
                            </div>
                            <p className="text-xs mt-2 text-slate-400 dark:text-slate-500">
                                This policy is governed by the Laws of Kenya, including the Data Protection Act, 2019, and the Kenya Health Act.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
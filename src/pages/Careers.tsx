import { Navbar } from "@/components/Navbar";
import { Briefcase, Users, ShieldCheck, FileSearch, Gavel, Globe, Mail, AlertTriangle } from "lucide-react";

export default function Careers() {
    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Navbar />

            <div className="max-w-4xl mx-auto px-4 pt-32 pb-20">
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/60 overflow-hidden border border-slate-100">

                    {/* Header Banner */}
                    <div className="bg-white p-10 md:p-16 text-black relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6 text-primary">
                                <Briefcase className="w-8 h-8" />
                                <span className="font-bold tracking-widest uppercase text-sm">Join the Mission</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
                                Work at <span className="text-primary">HommieGo</span>
                            </h1>
                            <p className="text-slate-400 font-medium max-w-2xl leading-relaxed text-lg">
                                We are building Kenya's most trusted service ecosystem. Join a team dedicated to empowering local professionals and simplifying lives.
                            </p>
                            <p className="text-slate-500 text-sm mt-6">
                                Last updated: May 18, 2026
                            </p>
                        </div>
                    </div>

                    <div className="p-8 md:p-16 space-y-12 text-slate-600 leading-relaxed text-lg">

                        {/* 1. Opportunity Section */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <Globe className="text-primary w-6 h-6" />
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">1. Corporate vs. Marketplace</h2>
                            </div>
                            <p className="mb-4">
                                It is important to distinguish between the two ways to work with us:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                    <span className="font-bold text-slate-900 block mb-2">Corporate Roles</span>
                                    <p className="text-sm text-slate-500">Direct employees of HommieGo Inc. involved in tech, marketing, and operations.</p>
                                </div>
                                <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
                                    <span className="font-bold text-primary block mb-2">Independent Providers</span>
                                    <p className="text-sm text-slate-500">Self-employed professionals using our platform to find clients. This is not corporate employment.</p>
                                </div>
                            </div>
                        </section>

                        {/* 2. Equal Opportunity Section */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <Gavel className="text-primary w-6 h-6" />
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">2. Equal Opportunity Statement</h2>
                            </div>
                            <p>
                                In accordance with <strong>Article 27 of the Constitution of Kenya</strong> and the <strong>Employment Act (2007)</strong>, HommieGo is an equal opportunity employer. We do not discriminate on the basis of race, religion, color, national origin, gender, sexual orientation, age, marital status, or disability status.
                            </p>
                        </section>

                        {/* 3. Fraud Warning - EXTREMELY IMPORTANT IN KENYA */}
                        <section className="bg-red-50 rounded-3xl p-8 border border-red-100">
                            <div className="flex items-center gap-3 mb-4">
                                <AlertTriangle className="text-red-600 w-6 h-6" />
                                <h2 className="text-2xl font-black text-red-900 uppercase tracking-tighter">3. Recruitment Fraud Alert</h2>
                            </div>
                            <p className="text-red-800 font-medium mb-4">
                                Please be advised that HommieGo:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-red-700 text-sm md:text-base">
                                <li>Never asks for "processing fees," "medical exam fees," or "uniform deposits."</li>
                                <li>Only communicates through <strong>@hommiego.co.ke</strong> or official channels.</li>
                                <li>Does not conduct interviews via WhatsApp or Telegram without prior formal email scheduling.</li>
                            </ul>
                        </section>

                        {/* 4. Data Privacy for Applicants */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <ShieldCheck className="text-primary w-6 h-6" />
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">4. Applicant Data Protection</h2>
                            </div>
                            <p>
                                By submitting your CV or portfolio, you consent to HommieGo processing your personal data for recruitment purposes under the <strong>Data Protection Act, 2019</strong>. We retain unsuccessful application data for a maximum of 12 months for future talent pool consideration unless you request earlier deletion.
                            </p>
                        </section>

                        {/* 5. Professional Conduct */}
                        <section>
                            <div className="flex items-center gap-3 mb-4 text-slate-900">
                                <FileSearch className="text-primary w-6 h-6" />
                                <h2 className="text-2xl font-black uppercase tracking-tighter">5. Integrity & Verification</h2>
                            </div>
                            <p>
                                HommieGo maintains a zero-tolerance policy for academic or professional misrepresentation. All shortlisted candidates will undergo background checks, including verification of previous employment and criminal record checks where required for the role.
                            </p>
                        </section>

                        {/* 6. Contact Section */}
                        <section className="bg-white text-black rounded-[2rem] p-10 text-center">
                            <Mail className="w-12 h-12 mx-auto mb-6 text-primary" />
                            <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 text-black">How to Apply</h2>
                            <p className="text-slate-400 mb-8 max-w-md mx-auto">
                                We currently do not accept walk-in applications. All CVs must be sent to our official talent acquisition email.
                            </p>
                            <div className="inline-block bg-white/10 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/10">
                                <p className="font-bold text-lg">careers@hommiego.co.ke</p>
                                <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">Official Talent Channel</p>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-6 italic">
                                HommieGo is a registered trademark. Unauthorized use of our brand for recruitment is a criminal offense.
                            </p>
                        </section>

                    </div>
                </div>

                <div className="mt-12 text-center text-slate-400 text-sm font-medium">
                    <p>© {new Date().getFullYear()} HommieGo Inc. Built in Nairobi, for the World.</p>
                </div>
            </div>
        </div>
    );
}
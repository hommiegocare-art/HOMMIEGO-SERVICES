import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    ArrowRight,
    Home,
    ShieldCheck,
    Users,
    Sparkles,
} from "lucide-react";

export default function AboutUsPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800">

            {/* HERO SECTION */}
            <section className="relative overflow-hidden bg-gradient-to-r from-primary to-blue-600 text-white py-24 px-6">

                {/* Glow Effects */}
                <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl"></div>

                <div className="max-w-6xl mx-auto text-center relative z-10">

                    <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-2 rounded-full mb-6 backdrop-blur-sm">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-sm font-medium">
                            Student Oriented Platform
                        </span>
                    </div>

                    <h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight">
                        About HommieGo
                    </h1>

                    <p className="text-lg md:text-xl max-w-3xl mx-auto text-white/90 leading-relaxed mb-10">
                        HommieGo connects students and young people with trusted
                        services, and everyday essentials  making student life easier,
                        safer, and more convenient.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Button
                            size="lg"
                            variant="secondary"
                            className="rounded-2xl px-8"
                            onClick={() => navigate("/explore")}
                        >
                            Explore Services
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>

                        <Button
                            size="lg"
                            variant="outline"
                            className="rounded-2xl px-8 bg-transparent border-white/30 hover:bg-white/10"
                            onClick={() => navigate("/")}
                        >
                            Back Home
                        </Button>
                    </div>
                </div>
            </section>

            {/* MISSION SECTION */}
            <section className="py-24 px-6">
                <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-14 items-center">

                    {/* LEFT */}
                    <div>
                        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
                            <ShieldCheck className="w-4 h-4" />
                            <span className="font-medium">
                                Our Mission
                            </span>
                        </div>

                        <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                            Simplifying Student Living Through Technology
                        </h2>

                        <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                            At HommieGo, our mission is to create a trusted digital ecosystem
                            where students and young people can discover and connect with
                            service providers, and access everyday essentials in one place.
                        </p>

                        <p className="text-lg text-muted-foreground leading-relaxed">
                            We believe student life should be affordable, safe, convenient,
                            and community-driven.
                        </p>
                    </div>

                    {/* RIGHT */}
                    <div className="bg-white rounded-[2rem] shadow-2xl border p-10">

                        <div className="grid grid-cols-2 gap-6">

                            <div className="bg-blue-50 rounded-3xl p-6 text-center">
                                <h3 className="text-4xl font-bold text-blue-600 mb-2">
                                    24/7
                                </h3>

                                <p className="text-muted-foreground">
                                    Platform Access
                                </p>
                            </div>

                            <div className="bg-green-50 rounded-3xl p-6 text-center">
                                <h3 className="text-4xl font-bold text-green-600 mb-2">
                                    Safe
                                </h3>

                                <p className="text-muted-foreground">
                                    Trusted Experience
                                </p>
                            </div>

                            <div className="bg-yellow-50 rounded-3xl p-6 text-center">
                                <h3 className="text-4xl font-bold text-yellow-600 mb-2">
                                    Easy
                                </h3>

                                <p className="text-muted-foreground">
                                    Simple Booking
                                </p>
                            </div>

                            <div className="bg-red-50 rounded-3xl p-6 text-center">
                                <h3 className="text-4xl font-bold text-red-600 mb-2">
                                    Fast
                                </h3>

                                <p className="text-muted-foreground">
                                    Quick Discovery
                                </p>
                            </div>

                        </div>
                    </div>
                </div>
            </section>

            {/* WHY CHOOSE US */}
            <section className="bg-white py-24 px-6 border-y">

                <div className="max-w-6xl mx-auto">

                    <div className="text-center mb-16">

                        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
                            <Users className="w-4 h-4" />
                            <span className="font-medium">
                                Why Choose Us
                            </span>
                        </div>

                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            Built Around Student Needs
                        </h2>

                        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                            HommieGo is designed to help students discover opportunities and services faster and more safely.
                        </p>
                    </div>

                    {/* CARDS */}
                    <div className="grid md:grid-cols-3 gap-8">

                        {/* CARD 1 */}
                        <div className="bg-slate-50 rounded-[2rem] border p-8 hover:shadow-xl transition-all duration-300">

                            <div className="w-16 h-16 rounded-3xl bg-blue-100 flex items-center justify-center mb-6">
                                <Home className="w-8 h-8 text-blue-600" />
                            </div>

                            <h3 className="text-2xl font-bold mb-4">
                                Student Housing
                            </h3>

                            <p className="text-muted-foreground leading-relaxed">
                                Discover affordable and student-friendly services
                                and tutors from all over the country.
                            </p>
                        </div>

                        {/* CARD 2 */}
                        <div className="bg-slate-50 rounded-[2rem] border p-8 hover:shadow-xl transition-all duration-300">

                            <div className="w-16 h-16 rounded-3xl bg-green-100 flex items-center justify-center mb-6 text-3xl">
                                🔧
                            </div>

                            <h3 className="text-2xl font-bold mb-4">
                                Trusted Services
                            </h3>

                            <p className="text-muted-foreground leading-relaxed">
                                Connect with trusted local professionals and service providers
                                whenever you need help.
                            </p>
                        </div>

                        {/* CARD 3 */}
                        <div className="bg-slate-50 rounded-[2rem] border p-8 hover:shadow-xl transition-all duration-300">

                            <div className="w-16 h-16 rounded-3xl bg-yellow-100 flex items-center justify-center mb-6 text-3xl">
                                🌍
                            </div>

                            <h3 className="text-2xl font-bold mb-4">
                                Community Driven
                            </h3>

                            <p className="text-muted-foreground leading-relaxed">
                                Empowering students and communities through technology,
                                accessibility, and innovation.
                            </p>
                        </div>

                    </div>
                </div>
            </section>

            {/* VISION SECTION */}
            <section className="py-24 px-6">
                <div className="max-w-4xl mx-auto text-center">

                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
                        <Sparkles className="w-4 h-4" />
                        <span className="font-medium">
                            Our Vision
                        </span>
                    </div>

                    <h2 className="text-4xl md:text-5xl font-bold mb-8">
                        Building Kenya’s Leading Student Lifestyle Platform
                    </h2>

                    <p className="text-lg text-muted-foreground leading-relaxed">
                        Our vision is to empower students and young professionals across
                        Kenya through innovative digital experiences that simplify everyday
                        life and strengthen communities.
                    </p>
                </div>
            </section>

            {/* CTA SECTION */}
            <section className="pb-24 px-6">

                <div className="max-w-5xl mx-auto bg-gradient-to-r from-primary to-blue-600 rounded-[2.5rem] p-12 md:p-16 text-center text-white shadow-2xl relative overflow-hidden">

                    <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>

                    <div className="relative z-10">

                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            Join The HommieGo Community
                        </h2>

                        <p className="text-white/80 max-w-2xl mx-auto text-lg mb-10 leading-relaxed">
                            Discover trusted tutors, connect with service providers, and
                            simplify your student lifestyle using one powerful platform.
                        </p>

                        <Button
                            size="lg"
                            variant="secondary"
                            className="rounded-2xl px-10 py-6 text-lg"
                            onClick={() => navigate("/explore")}
                        >
                            Start Exploring
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>

                    </div>
                </div>
            </section>

        </div>
    );
}
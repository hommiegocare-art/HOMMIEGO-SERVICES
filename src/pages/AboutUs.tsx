import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    ArrowRight,
    Home,
    ShieldCheck,
    Users,
    Sparkles,
    Heart,
    Stethoscope,
    Pill,
    Clock,
    Award,
    Target,
    Globe,
    Calendar,
    PhoneCall,
} from "lucide-react";

export default function AboutUsPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-slate-200 transition-colors duration-300 overflow-x-hidden">

            {/* HERO SECTION */}
            <section className="relative overflow-hidden bg-gradient-to-r from-primary to-blue-600 dark:from-primary dark:to-blue-800 text-white py-16 md:py-24 px-4 transition-colors duration-300">
                {/* Glow Effects */}
                <div className="absolute -top-20 -right-20 w-64 md:w-96 h-64 md:h-96 bg-white/10 dark:bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 md:w-80 h-64 md:h-80 bg-blue-400/20 dark:bg-blue-600/20 rounded-full blur-3xl"></div>

                <div className="max-w-6xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 bg-white/10 dark:bg-white/10 border border-white/20 dark:border-white/20 px-3 md:px-4 py-1.5 md:py-2 rounded-full mb-4 md:mb-6 backdrop-blur-sm">
                        <Heart className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="text-[10px] md:text-sm font-medium whitespace-nowrap">
                            Professional Home Nursing Services
                        </span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold mb-3 md:mb-6 tracking-tight leading-tight">
                        About HommieCare Medical
                    </h1>

                    <p className="text-sm sm:text-base md:text-xl max-w-3xl mx-auto text-white/90 dark:text-white/90 leading-relaxed mb-6 md:mb-10 px-2">
                        HommieCare connects patients with qualified nurses and healthcare
                        professionals who deliver compassionate medical care right at your
                        doorstep. Safe, reliable, and professional home healthcare.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
                        <Button
                            size="lg"
                            variant="secondary"
                            className="rounded-2xl px-6 md:px-8 text-sm md:text-base"
                            onClick={() => navigate("/explore")}
                        >
                            Find Nursing Services
                            <ArrowRight className="w-3 h-3 md:w-4 md:h-4 ml-1 md:ml-2" />
                        </Button>

                        <Button
                            size="lg"
                            variant="outline"
                            className="rounded-2xl px-6 md:px-8 text-sm md:text-base bg-transparent border-white/30 hover:bg-white/10 dark:border-white/30 dark:hover:bg-white/10"
                            onClick={() => navigate("/")}
                        >
                            Back Home
                        </Button>
                    </div>
                </div>
            </section>

            {/* MISSION SECTION */}
            <section className="py-16 md:py-24 px-4 transition-colors duration-300">
                <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 md:gap-14 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary px-3 md:px-4 py-1.5 md:py-2 rounded-full mb-4 md:mb-6">
                            <Target className="w-3 h-3 md:w-4 md:h-4" />
                            <span className="text-xs md:text-sm font-medium">
                                Our Mission
                            </span>
                        </div>

                        <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-3 md:mb-6 leading-tight">
                            Delivering Quality Healthcare at Your Doorstep
                        </h2>

                        <p className="text-sm sm:text-base md:text-lg text-muted-foreground dark:text-slate-400 leading-relaxed mb-4 md:mb-6">
                            At HommieCare Medical, our mission is to make professional healthcare
                            accessible, convenient, and compassionate. We connect patients with
                            licensed nurses and healthcare providers who deliver personalized
                            medical care in the comfort of your home.
                        </p>

                        <p className="text-sm sm:text-base md:text-lg text-muted-foreground dark:text-slate-400 leading-relaxed">
                            We believe everyone deserves quality healthcare, and we're committed
                            to bringing medical excellence directly to you.
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="bg-white dark:bg-gray-950 rounded-[1.5rem] md:rounded-[2rem] shadow-2xl border dark:border-slate-800 p-6 md:p-10 transition-colors duration-300">
                        <div className="grid grid-cols-2 gap-4 md:gap-6">
                            <div className="bg-blue-50 dark:bg-blue-950/50 rounded-2xl md:rounded-3xl p-4 md:p-6 text-center transition-colors duration-300">
                                <h3 className="text-2xl md:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-1 md:mb-2">
                                    24/7
                                </h3>
                                <p className="text-xs md:text-sm text-muted-foreground dark:text-slate-400">
                                    Nursing Care
                                </p>
                            </div>

                            <div className="bg-green-50 dark:bg-green-950/50 rounded-2xl md:rounded-3xl p-4 md:p-6 text-center transition-colors duration-300">
                                <h3 className="text-2xl md:text-4xl font-bold text-green-600 dark:text-green-400 mb-1 md:mb-2">
                                    Licensed
                                </h3>
                                <p className="text-xs md:text-sm text-muted-foreground dark:text-slate-400">
                                    Healthcare Providers
                                </p>
                            </div>

                            <div className="bg-yellow-50 dark:bg-yellow-950/50 rounded-2xl md:rounded-3xl p-4 md:p-6 text-center transition-colors duration-300">
                                <h3 className="text-2xl md:text-4xl font-bold text-yellow-600 dark:text-yellow-400 mb-1 md:mb-2">
                                    Safe
                                </h3>
                                <p className="text-xs md:text-sm text-muted-foreground dark:text-slate-400">
                                    Medical Care
                                </p>
                            </div>

                            <div className="bg-red-50 dark:bg-red-950/50 rounded-2xl md:rounded-3xl p-4 md:p-6 text-center transition-colors duration-300">
                                <h3 className="text-2xl md:text-4xl font-bold text-red-600 dark:text-red-400 mb-1 md:mb-2">
                                    Fast
                                </h3>
                                <p className="text-xs md:text-sm text-muted-foreground dark:text-slate-400">
                                    Service Delivery
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* WHY CHOOSE US */}
            <section className="bg-white dark:bg-gray-950 py-16 md:py-24 px-4 border-y dark:border-slate-800 transition-colors duration-300">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-10 md:mb-16">
                        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary px-3 md:px-4 py-1.5 md:py-2 rounded-full mb-4 md:mb-6">
                            <Award className="w-3 h-3 md:w-4 md:h-4" />
                            <span className="text-xs md:text-sm font-medium">
                                Why Choose HommieCare Medical
                            </span>
                        </div>

                        <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-3 md:mb-6 leading-tight">
                            Professional Healthcare at Home
                        </h2>

                        <p className="text-sm sm:text-base md:text-lg text-muted-foreground dark:text-slate-400 max-w-3xl mx-auto px-2">
                            We provide trusted, compassionate, and professional nursing services
                            delivered by licensed healthcare providers.
                        </p>
                    </div>

                    {/* CARDS */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                        {[
                            {
                                icon: Stethoscope,
                                bg: "bg-blue-100 dark:bg-blue-950",
                                color: "text-blue-600 dark:text-blue-400",
                                title: "Licensed Nurses",
                                desc: "All our nurses are fully licensed, certified, and experienced in providing professional home healthcare services."
                            },
                            {
                                icon: Clock,
                                bg: "bg-green-100 dark:bg-green-950",
                                color: "text-green-600 dark:text-green-400",
                                title: "Flexible Scheduling",
                                desc: "Book nursing services at your convenience with flexible scheduling options that fit your needs."
                            },
                            {
                                icon: Heart,
                                bg: "bg-yellow-100 dark:bg-yellow-950",
                                color: "text-yellow-600 dark:text-yellow-400",
                                title: "Compassionate Care",
                                desc: "We prioritize your comfort and well-being, delivering personalized care with empathy and compassion."
                            }
                        ].map((card, idx) => (
                            <div key={idx} className="bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] md:rounded-[2rem] border dark:border-slate-700 p-6 md:p-8 hover:shadow-xl dark:hover:shadow-slate-900/50 transition-all duration-300">
                                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl ${card.bg} flex items-center justify-center mb-4 md:mb-6`}>
                                    <card.icon className={`w-6 h-6 md:w-8 md:h-8 ${card.color}`} />
                                </div>
                                <h3 className="text-lg md:text-2xl font-bold mb-2 md:mb-4 leading-tight">
                                    {card.title}
                                </h3>
                                <p className="text-sm md:text-base text-muted-foreground dark:text-slate-400 leading-relaxed">
                                    {card.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SERVICES OVERVIEW */}
            <section className="py-16 md:py-24 px-4 transition-colors duration-300">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-10 md:mb-16">
                        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary px-3 md:px-4 py-1.5 md:py-2 rounded-full mb-4 md:mb-6">
                            <Pill className="w-3 h-3 md:w-4 md:h-4" />
                            <span className="text-xs md:text-sm font-medium">
                                Our Services
                            </span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-3 md:mb-6 leading-tight">
                            Comprehensive Home Nursing Services
                        </h2>
                        <p className="text-sm sm:text-base md:text-lg text-muted-foreground dark:text-slate-400 max-w-3xl mx-auto px-2">
                            We offer a wide range of professional medical services delivered
                            by qualified nurses in the comfort of your home.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {[
                            { icon: Heart, label: "Home Nursing Care", desc: "Comprehensive nursing care for patients of all ages." },
                            { icon: Pill, label: "Medication Administration", desc: "Safe and accurate medication management." },
                            { icon: Stethoscope, label: "Injection Services", desc: "Professional injection services at home." },
                            { icon: Users, label: "Elderly Care", desc: "Compassionate care for your elderly loved ones." },
                            { icon: Calendar, label: "Post-Hospital Care", desc: "Recover in comfort with professional support." },
                            { icon: Home, label: "Wound Care & Therapy", desc: "Expert wound management and physiotherapy." },
                        ].map((service, idx) => (
                            <div key={idx} className="bg-white dark:bg-gray-950 rounded-2xl border dark:border-slate-800 p-4 md:p-6 hover:shadow-lg transition-all duration-300">
                                <service.icon className="w-8 h-8 md:w-10 md:h-10 text-primary mb-2 md:mb-4" />
                                <h4 className="font-bold text-base md:text-lg mb-1 md:mb-2 leading-tight">{service.label}</h4>
                                <p className="text-xs md:text-sm text-muted-foreground dark:text-slate-400 leading-relaxed">{service.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-8 md:mt-12">
                        <Button
                            size="lg"
                            className="rounded-2xl px-6 md:px-8 text-sm md:text-base"
                            onClick={() => navigate("/explore")}
                        >
                            View All Services
                            <ArrowRight className="w-3 h-3 md:w-4 md:h-4 ml-1 md:ml-2" />
                        </Button>
                    </div>
                </div>
            </section>

            {/* VISION SECTION */}
            <section className="py-16 md:py-24 px-4 bg-white dark:bg-gray-950 border-y dark:border-slate-800 transition-colors duration-300">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary px-3 md:px-4 py-1.5 md:py-2 rounded-full mb-4 md:mb-6">
                        <Globe className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="text-xs md:text-sm font-medium">
                            Our Vision
                        </span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 md:mb-8 leading-tight">
                        Transforming Home Healthcare in Kenya
                    </h2>

                    <p className="text-sm sm:text-base md:text-lg text-muted-foreground dark:text-slate-400 leading-relaxed px-2">
                        Our vision is to make professional home healthcare accessible to every
                        household in Kenya. We're building a trusted network of healthcare
                        professionals who deliver quality medical care with compassion,
                        dignity, and excellence.
                    </p>
                </div>
            </section>

            {/* CTA SECTION */}
            <section className="pb-16 md:pb-24 px-4 transition-colors duration-300">
                <div className="max-w-5xl mx-auto bg-gradient-to-r from-primary to-blue-600 dark:from-primary dark:to-blue-800 rounded-[1.5rem] md:rounded-[2.5rem] p-8 md:p-16 text-center text-white shadow-2xl relative overflow-hidden transition-colors duration-300">
                    <div className="absolute top-0 right-0 w-48 md:w-72 h-48 md:h-72 bg-white/10 dark:bg-white/5 rounded-full blur-3xl"></div>

                    <div className="relative z-10">
                        <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 md:mb-6 leading-tight">
                            Need Professional Nursing Care?
                        </h2>

                        <p className="text-sm sm:text-base md:text-lg text-white/80 dark:text-white/80 max-w-2xl mx-auto mb-6 md:mb-10 leading-relaxed px-2">
                            Connect with licensed nurses and healthcare professionals who deliver
                            compassionate medical care right at your doorstep. Book your service today.
                        </p>

                        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
                            <Button
                                size="lg"
                                variant="secondary"
                                className="rounded-2xl px-6 md:px-10 py-4 md:py-6 text-sm md:text-lg"
                                onClick={() => navigate("/explore")}
                            >
                                Book Nursing Services
                                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-1 md:ml-2" />
                            </Button>

                            <Button
                                size="lg"
                                variant="outline"
                                className="rounded-2xl px-6 md:px-10 py-4 md:py-6 text-sm md:text-lg bg-transparent border-white/30 hover:bg-white/10 dark:border-white/30 dark:hover:bg-white/10"
                                onClick={() => navigate("/emergency-home-nursing")}
                            >
                                <PhoneCall className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
                                Emergency Care
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
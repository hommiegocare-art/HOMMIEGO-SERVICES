import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useEffect, useRef, useState } from "react";
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
    Building2,
    Briefcase,
    UserCheck,
    Star,
    Mail,
    MapPin,
    Phone,
    Facebook,
    Twitter,
    Instagram,
    Linkedin,
    GraduationCap,
    FileCheck,
    HeartHandshake,
    Droplets,
    Activity,
    Thermometer,
    Syringe,
    Bandage,
    Scissors,
    Microscope,
    Bone,
    Brain,
    Smile,
    Shield,
    Lock,
    ThumbsUp,
    Info,
    HelpCircle,
    ChevronDown,
    ChevronUp,
    Wind,
    Play,
    CircleCheck,
    CheckCircle,
    AlertCircle,
    Clock as ClockIcon,
    CalendarDays,
    AwardIcon,
    UsersRound,
    Hospital,
    Ambulance,
    StarHalf,
    Quote,
    TrendingUp,
    Zap,
    Lightbulb,
    Flag,
    BookOpen,
    GraduationCap as GraduationIcon,
    HeartPulse,
    UserPlus,
    Settings,
    BarChart3,
    LineChart,
    PieChart,
    Layers,
    Sparkle,
    Target as TargetIcon,
    Eye,
    FileText,
    ClipboardCheck,
    BadgeCheck,
    UserCog,
    Handshake,
    MessageCircle,
    Newspaper,
    Radio,
    Megaphone,
    Send,
    Gift,
    Truck,
    Wifi,
    Coffee,
    Utensils,
    ShoppingBag,
    Plane,
    Cloud,
    Sun,
    Moon,
    Star as StarIcon,
    Crown,
    Gem,
    Rocket,
    Infinity,
    Anchor,
    Compass,
    Map,
    Navigation,
    Route,
    TrendingUp as TrendingUpIcon,
    BarChart as BarChartIcon,
    PieChart as PieChartIcon,
    LineChart as LineChartIcon,
    Layers as LayersIcon,
    Sparkles as SparklesIcon,
    Sparkle as SparkleIcon,
    Target as TargetIcon2,
    Eye as EyeIcon,
    FileText as FileTextIcon,
    ClipboardCheck as ClipboardCheckIcon,
    BadgeCheck as BadgeCheckIcon,
    UserCog as UserCogIcon,
    Handshake as HandshakeIcon,
    MessageCircle as MessageCircleIcon,
    Newspaper as NewspaperIcon,
    Radio as RadioIcon,
    Megaphone as MegaphoneIcon,
    Send as SendIcon,
    Gift as GiftIcon,
    Truck as TruckIcon,
    Wifi as WifiIcon,
    Coffee as CoffeeIcon,
    Utensils as UtensilsIcon,
    ShoppingBag as ShoppingBagIcon,
    Plane as PlaneIcon,
    Cloud as CloudIcon,
    Sun as SunIcon,
    Moon as MoonIcon,
    Star as StarIcon2,
    Crown as CrownIcon,
    Gem as GemIcon,
    Rocket as RocketIcon,
    Infinity as InfinityIcon,
    Anchor as AnchorIcon,
    Compass as CompassIcon,
    Map as MapIcon,
    Navigation as NavigationIcon,
    Route as RouteIcon,
    Baby,
} from "lucide-react";

export default function AboutUsPage() {
    const navigate = useNavigate();
    const { currentWorkspace, workspaces } = useWorkspace();
    const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
    const [counters, setCounters] = useState({
        patients: 0,
        providers: 0,
        counties: 0,
        satisfaction: 0
    });
    const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    // Get workspace type label
    const getWorkspaceTypeLabel = (type: string) => {
        switch (type) {
            case 'individual':
                return 'Independent Provider';
            case 'family':
                return 'Family Workspace';
            case 'organization':
                return 'Healthcare Organization';
            case 'agency':
                return 'Healthcare Agency';
            default:
                return 'Healthcare Provider';
        }
    };

    // Intersection Observer for scroll animations
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const id = entry.target.id;
                        setVisibleSections((prev) => new Set([...prev, id]));
                    }
                });
            },
            {
                threshold: 0.15,
                rootMargin: '0px 0px -50px 0px'
            }
        );

        Object.values(sectionRefs.current).forEach((ref) => {
            if (ref) observer.observe(ref);
        });

        return () => observer.disconnect();
    }, []);

    // Counter animation for stats
    useEffect(() => {
        const targetPatients = 1000;
        const targetProviders = 500;
        const targetCounties = 15;
        const targetSatisfaction = 98;

        const duration = 2000;
        const steps = 60;
        const increment = duration / steps;

        let currentStep = 0;

        const animateCounter = () => {
            if (currentStep >= steps) {
                setCounters({
                    patients: targetPatients,
                    providers: targetProviders,
                    counties: targetCounties,
                    satisfaction: targetSatisfaction
                });
                return;
            }

            const progress = currentStep / steps;
            setCounters({
                patients: Math.floor(progress * targetPatients),
                providers: Math.floor(progress * targetProviders),
                counties: Math.floor(progress * targetCounties),
                satisfaction: Math.floor(progress * targetSatisfaction)
            });

            currentStep++;
            setTimeout(animateCounter, increment);
        };

        // Start counter when stats section is visible
        if (visibleSections.has('stats-section')) {
            animateCounter();
        }
    }, [visibleSections]);

    // Team members data
    const teamMembers = [
        {
            name: "Dr. Grace Muthoni",
            role: "Chief Medical Officer",
            specialty: "Internal Medicine",
            experience: "15+ years",
            image: "/team1.jpg",
            bio: "Leading our medical team with expertise in home healthcare delivery."
        },
        {
            name: "Nurse Jane Wanjiru",
            role: "Head of Nursing Services",
            specialty: "Critical Care Nursing",
            experience: "12+ years",
            image: "/team2.jpg",
            bio: "Overseeing our nursing team and ensuring quality care standards."
        },
        {
            name: "Dr. Peter Ochieng",
            role: "Medical Advisor",
            specialty: "Family Medicine",
            experience: "20+ years",
            image: "/team3.jpg",
            bio: "Providing strategic medical guidance and quality assurance."
        },
        {
            name: "Nurse Mary Akinyi",
            role: "Senior Nursing Supervisor",
            specialty: "Community Health Nursing",
            experience: "10+ years",
            image: "/team4.jpg",
            bio: "Leading community outreach and patient education initiatives."
        }
    ];

    // Core values data
    const coreValues = [
        {
            icon: HeartPulse,
            title: "Compassionate Care",
            description: "We deliver care with empathy, dignity, and respect for every patient.",
            color: "text-rose-600",
            bg: "bg-rose-100 dark:bg-rose-950/30"
        },
        {
            icon: ShieldCheck,
            title: "Professional Excellence",
            description: "We maintain the highest standards of professional healthcare delivery.",
            color: "text-blue-600",
            bg: "bg-blue-100 dark:bg-blue-950/30"
        },
        {
            icon: Users,
            title: "Patient-Centered",
            description: "We put patients first, tailoring care to individual needs.",
            color: "text-emerald-600",
            bg: "bg-emerald-100 dark:bg-emerald-950/30"
        },
        {
            icon: Award,
            title: "Quality Assurance",
            description: "We continuously improve our services to ensure optimal outcomes.",
            color: "text-amber-600",
            bg: "bg-amber-100 dark:bg-amber-950/30"
        },
        {
            icon: Handshake,
            title: "Trust & Integrity",
            description: "We build lasting relationships through honesty and transparency.",
            color: "text-purple-600",
            bg: "bg-purple-100 dark:bg-purple-950/30"
        },
        {
            icon: Target,
            title: "Continuous Improvement",
            description: "We embrace innovation to enhance healthcare delivery.",
            color: "text-indigo-600",
            bg: "bg-indigo-100 dark:bg-indigo-950/30"
        }
    ];

    // Healthcare services offered
    const healthcareServices = [
        {
            icon: Stethoscope,
            title: "General Nursing Care",
            description: "Comprehensive nursing care for patients of all ages with various medical conditions.",
            features: ["24/7 Monitoring", "Vital Signs Check", "Personal Care Assistance"]
        },
        {
            icon: Pill,
            title: "Medication Management",
            description: "Safe and accurate medication administration, management, and monitoring.",
            features: ["Medication Scheduling", "Dose Administration", "Side Effect Monitoring"]
        },
        {
            icon: HeartPulse,
            title: "Cardiac Care",
            description: "Specialized care for patients with heart conditions and post-cardiac procedures.",
            features: ["Heart Monitoring", "BP Management", "Cardiac Rehabilitation"]
        },
        {
            icon: Brain,
            title: "Neurological Care",
            description: "Expert care for patients with neurological conditions and post-stroke recovery.",
            features: ["Stroke Recovery", "Parkinson's Care", "Dementia Support"]
        },
        {
            icon: Activity,
            title: "Post-Surgery Care",
            description: "Professional post-operative care to ensure smooth recovery at home.",
            features: ["Wound Care", "Pain Management", "Mobility Support"]
        },
        {
            icon: Baby,
            title: "Maternal & Child Care",
            description: "Comprehensive care for new mothers and infants in the comfort of home.",
            features: ["Postnatal Care", "Newborn Care", "Breastfeeding Support"]
        },
        {
            icon: Users,
            title: "Elderly Care Services",
            description: "Compassionate care for elderly patients with respect and dignity.",
            features: ["Daily Living Assistance", "Medication Reminders", "Companionship"]
        },
        {
            icon: Syringe,
            title: "Wound & Injection Services",
            description: "Professional wound care management and safe injection services.",
            features: ["Wound Dressing", "Vaccination", "IV Therapy"]
        }
    ];

    // Testimonials
    const testimonials = [
        {
            name: "Mary Wanjiru",
            role: "Family Caregiver",
            content: "HommieCare provided exceptional care for my mother after her surgery. The nurses were professional, compassionate, and truly dedicated.",
            rating: 5,
            date: "March 2024"
        },
        {
            name: "Dr. James Ochieng",
            role: "Medical Professional",
            content: "As a doctor, I appreciate the quality of care HommieCare delivers. Their nurses are well-trained and follow medical protocols diligently.",
            rating: 5,
            date: "February 2024"
        },
        {
            name: "Grace Akinyi",
            role: "New Mother",
            content: "The postnatal care I received was outstanding. The nurse was knowledgeable, supportive, and made my transition to motherhood so much easier.",
            rating: 5,
            date: "January 2024"
        }
    ];

    // Milestones
    const milestones = [
        { year: "2020", title: "Founded", description: "HommieCare Medical was established with a vision to transform home healthcare." },
        { year: "2021", title: "First 100 Patients", description: "Served our first 100 patients with exceptional home nursing care." },
        { year: "2022", title: "Expansion", description: "Expanded services to 5 counties across Kenya." },
        { year: "2023", title: "500+ Patients", description: "Reached over 500 patients served with quality healthcare." },
        { year: "2024", title: "Digital Platform", description: "Launched advanced platform for seamless healthcare booking." },
        { year: "2025", title: "National Reach", description: "Expanding services nationwide with 1000+ providers." }
    ];

    // Partnerships
    const partnerships = [
        { name: "KNH Hospital", icon: Hospital },
        { name: "Kenya Red Cross", icon: Shield },
        { name: "Ministry of Health", icon: Building2 },
        { name: "Nursing Council of Kenya", icon: GraduationCap },
        { name: "Kenya Medical Association", icon: Stethoscope },
        { name: "WHO Kenya", icon: Globe }
    ];

    // Check if section is visible
    const isVisible = (id: string) => visibleSections.has(id);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-slate-200 transition-colors duration-300 overflow-x-hidden">

            {/* ===== HERO SECTION ===== */}
            <section className="relative overflow-hidden bg-gradient-to-r from-primary via-primary/90 to-blue-700 dark:from-primary dark:via-primary/90 dark:to-blue-800 text-white py-20 md:py-32 px-4 transition-colors duration-300">
                {/* Animated Background Effects */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-20 w-80 md:w-96 h-80 md:h-96 bg-white/10 dark:bg-white/5 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-0 left-0 w-64 md:w-80 h-64 md:h-80 bg-blue-400/20 dark:bg-blue-600/20 rounded-full blur-3xl animate-pulse delay-700"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-10 w-40 h-40 bg-yellow-400/10 rounded-full blur-2xl"></div>

                    {/* Floating particles */}
                    <div className="absolute top-10 left-10 w-2 h-2 bg-white/30 rounded-full animate-bounce"></div>
                    <div className="absolute top-20 right-20 w-3 h-3 bg-white/20 rounded-full animate-bounce delay-300"></div>
                    <div className="absolute bottom-40 left-20 w-2 h-2 bg-white/40 rounded-full animate-bounce delay-700"></div>
                    <div className="absolute top-1/2 right-10 w-4 h-4 bg-white/10 rounded-full animate-pulse"></div>
                </div>

                <div className="max-w-6xl mx-auto text-center relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <div className="inline-flex items-center gap-2 bg-white/10 dark:bg-white/10 border border-white/20 dark:border-white/20 px-4 py-2 rounded-full mb-6 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 hover:scale-105">
                        <Heart className="w-4 h-4 animate-pulse" />
                        <span className="text-xs md:text-sm font-medium">
                            Trusted Home Healthcare Provider in Kenya
                        </span>
                        <ShieldCheck className="w-4 h-4 ml-1" />
                    </div>

                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold mb-4 md:mb-6 tracking-tight leading-tight">
                        About <span className="text-white/90">HommieCare</span>
                        <span className="block text-2xl md:text-4xl font-light mt-2 text-white/80">Medical</span>
                    </h1>

                    <p className="text-base sm:text-lg md:text-xl max-w-3xl mx-auto text-white/90 dark:text-white/90 leading-relaxed mb-8 px-2">
                        Connecting patients with qualified healthcare professionals who deliver
                        compassionate medical care right at your doorstep. Safe, reliable, and
                        professional home healthcare services across Kenya.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
                        <Button
                            size="lg"
                            variant="secondary"
                            className="rounded-2xl px-8 py-6 text-base font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:rotate-1"
                            onClick={() => navigate("/explore")}
                        >
                            Find Healthcare Services
                            <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                        </Button>

                        <Button
                            size="lg"
                            variant="outline"
                            className="rounded-2xl px-8 py-6 text-base font-bold bg-transparent border-white/30 hover:bg-white/10 dark:border-white/30 dark:hover:bg-white/10 transition-all duration-300 hover:scale-105"
                            onClick={() => navigate("/")}
                        >
                            <Home className="w-4 h-4 mr-2" />
                            Back Home
                        </Button>
                    </div>

                    {/* Trust Indicators with animation */}
                    <div className="mt-8 md:mt-12 flex flex-wrap items-center justify-center gap-4 md:gap-8 text-white/80">
                        {[
                            { icon: ShieldCheck, label: "Licensed Providers" },
                            { icon: Clock, label: "24/7 Availability" },
                            { icon: Heart, label: "Compassionate Care" },
                            { icon: Users, label: "1000+ Patients Served" }
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: `${idx * 150}ms` }}>
                                <item.icon className="w-5 h-5" />
                                <span className="text-sm font-medium">{item.label}</span>
                                {idx < 3 && <div className="w-px h-6 bg-white/20 hidden sm:block ml-2"></div>}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== MISSION & VISION ===== */}
            <section
                id="mission-section"
                ref={(el) => sectionRefs.current['mission-section'] = el}
                className={`py-16 md:py-24 px-4 transition-all duration-1000 ${isVisible('mission-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                    }`}
            >
                <div className="max-w-6xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-8 md:gap-14 items-start">
                        {/* Mission */}
                        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-8 md:p-10 shadow-xl border border-slate-100 dark:border-slate-800 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group">
                            <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-full mb-6 group-hover:scale-105 transition-transform">
                                <TargetIcon className="w-4 h-4" />
                                <span className="text-sm font-medium">Our Mission</span>
                            </div>

                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 leading-tight group-hover:text-primary transition-colors">
                                Delivering Quality Healthcare at Your Doorstep
                            </h2>

                            <p className="text-base text-muted-foreground dark:text-slate-400 leading-relaxed mb-4">
                                At HommieCare Medical, our mission is to make professional healthcare
                                accessible, convenient, and compassionate. We connect patients with
                                licensed nurses and healthcare providers who deliver personalized
                                medical care in the comfort of your home.
                            </p>

                            <p className="text-base text-muted-foreground dark:text-slate-400 leading-relaxed">
                                We believe everyone deserves quality healthcare, and we're committed
                                to bringing medical excellence directly to you, wherever you are in Kenya.
                            </p>

                            <div className="mt-6 flex flex-wrap gap-3">
                                {[
                                    { icon: CheckCircle, label: "Licensed Providers", color: "emerald" },
                                    { icon: Clock, label: "24/7 Care", color: "blue" },
                                    { icon: Heart, label: "Compassionate Service", color: "purple" }
                                ].map((item, idx) => (
                                    <span key={idx} className={`inline-flex items-center gap-2 bg-${item.color}-50 dark:bg-${item.color}-950/30 text-${item.color}-700 dark:text-${item.color}-400 px-3 py-1.5 rounded-full text-sm animate-in fade-in zoom-in duration-500`} style={{ animationDelay: `${idx * 200}ms` }}>
                                        <item.icon className="w-4 h-4" />
                                        {item.label}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Vision */}
                        <div className="bg-gradient-to-br from-primary/5 to-blue-500/5 dark:from-primary/10 dark:to-blue-500/10 rounded-[2rem] p-8 md:p-10 border border-primary/10 dark:border-primary/20 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group">
                            <div className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 px-4 py-2 rounded-full mb-6 group-hover:scale-105 transition-transform">
                                <Eye className="w-4 h-4" />
                                <span className="text-sm font-medium">Our Vision</span>
                            </div>

                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 leading-tight group-hover:text-primary transition-colors">
                                Transforming Home Healthcare Across Kenya
                            </h2>

                            <p className="text-base text-muted-foreground dark:text-slate-400 leading-relaxed mb-4">
                                Our vision is to make professional home healthcare accessible to every
                                household in Kenya. We're building a trusted network of healthcare
                                professionals who deliver quality medical care with compassion,
                                dignity, and excellence.
                            </p>

                            <p className="text-base text-muted-foreground dark:text-slate-400 leading-relaxed">
                                By 2026, we aim to have served over 10,000 families and established
                                a presence in all 47 counties across Kenya.
                            </p>

                            {/* Vision Stats with animation */}
                            <div className="grid grid-cols-3 gap-4 mt-6">
                                {[
                                    { value: "1000+", label: "Patients Served" },
                                    { value: "15", label: "Counties Active" },
                                    { value: "47", label: "Target Counties" }
                                ].map((stat, idx) => (
                                    <div key={idx} className="bg-white/50 dark:bg-zinc-800/50 rounded-xl p-4 text-center backdrop-blur-sm hover:scale-105 transition-transform duration-300">
                                        <div className="text-2xl font-bold text-primary">{stat.value}</div>
                                        <div className="text-xs text-muted-foreground">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== CORE VALUES ===== */}
            <section
                id="values-section"
                ref={(el) => sectionRefs.current['values-section'] = el}
                className={`bg-white dark:bg-zinc-900 py-16 md:py-24 px-4 border-y border-slate-200 dark:border-slate-800 transition-all duration-1000 ${isVisible('values-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                    }`}
            >
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12 md:mb-16">
                        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary px-4 py-2 rounded-full mb-4 md:mb-6 hover:scale-105 transition-transform">
                            <Award className="w-4 h-4" />
                            <span className="text-sm font-medium">Our Core Values</span>
                        </div>

                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 md:mb-6 leading-tight">
                            What We <span className="text-primary">Stand For</span>
                        </h2>

                        <p className="text-base md:text-lg text-muted-foreground dark:text-slate-400 max-w-3xl mx-auto">
                            Our values guide everything we do, from patient care to provider partnerships.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {coreValues.map((value, idx) => (
                            <div
                                key={idx}
                                className={`bg-slate-50 dark:bg-zinc-800/50 rounded-2xl p-6 md:p-8 border border-slate-100 dark:border-slate-700 hover:shadow-xl transition-all duration-500 hover:-translate-y-2 group animate-in fade-in zoom-in duration-700`}
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                <div className={`w-14 h-14 rounded-2xl ${value.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                    <value.icon className={`w-7 h-7 ${value.color}`} />
                                </div>
                                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{value.title}</h3>
                                <p className="text-sm text-muted-foreground dark:text-slate-400 leading-relaxed">
                                    {value.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== SERVICES ===== */}
            <section
                id="services-section"
                ref={(el) => sectionRefs.current['services-section'] = el}
                className={`py-16 md:py-24 px-4 transition-all duration-1000 ${isVisible('services-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                    }`}
            >
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12 md:mb-16">
                        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary px-4 py-2 rounded-full mb-4 md:mb-6 hover:scale-105 transition-transform">
                            <Stethoscope className="w-4 h-4" />
                            <span className="text-sm font-medium">Our Healthcare Services</span>
                        </div>

                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 md:mb-6 leading-tight">
                            Comprehensive <span className="text-primary">Home Healthcare</span>
                        </h2>

                        <p className="text-base md:text-lg text-muted-foreground dark:text-slate-400 max-w-3xl mx-auto">
                            We offer a wide range of professional medical services delivered
                            by qualified healthcare providers in the comfort of your home.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        {healthcareServices.map((service, idx) => (
                            <div
                                key={idx}
                                className={`bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 hover:shadow-xl transition-all duration-500 hover:-translate-y-2 group animate-in fade-in zoom-in duration-700`}
                                style={{ animationDelay: `${idx * 80}ms` }}
                            >
                                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 group-hover:bg-primary/20">
                                    <service.icon className="w-6 h-6" />
                                </div>
                                <h4 className="font-bold text-lg mb-2 leading-tight group-hover:text-primary transition-colors">{service.title}</h4>
                                <p className="text-sm text-muted-foreground dark:text-slate-400 leading-relaxed mb-3">
                                    {service.description}
                                </p>
                                <ul className="space-y-1">
                                    {service.features.map((feature, fi) => (
                                        <li key={fi} className="text-xs text-muted-foreground dark:text-slate-400 flex items-center gap-2 animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${fi * 100}ms` }}>
                                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-8 md:mt-12">
                        <Button
                            size="lg"
                            className="rounded-2xl px-8 py-6 text-base font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                            onClick={() => navigate("/explore")}
                        >
                            View All Services
                            <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                        </Button>
                    </div>
                </div>
            </section>

            {/* ===== STATISTICS ===== */}
            <section
                id="stats-section"
                ref={(el) => sectionRefs.current['stats-section'] = el}
                className="bg-gradient-to-r from-primary to-blue-700 dark:from-primary dark:to-blue-800 text-white py-16 md:py-20 px-4 transition-all duration-1000"
            >
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                        {[
                            { value: counters.patients, label: "Patients Served", suffix: "+" },
                            { value: counters.providers, label: "Healthcare Providers", suffix: "+" },
                            { value: counters.counties, label: "Counties Served", suffix: "" },
                            { value: counters.satisfaction, label: "Patient Satisfaction", suffix: "%" }
                        ].map((stat, idx) => (
                            <div
                                key={idx}
                                className="text-center animate-in fade-in zoom-in duration-700 hover:scale-105 transition-transform cursor-default"
                                style={{ animationDelay: `${idx * 150}ms` }}
                            >
                                <div className="text-4xl md:text-6xl font-black mb-2">
                                    {stat.value}{stat.suffix}
                                </div>
                                <div className="text-sm md:text-base text-white/80 font-medium">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== WHY CHOOSE US ===== */}
            <section
                id="why-section"
                ref={(el) => sectionRefs.current['why-section'] = el}
                className={`bg-white dark:bg-zinc-900 py-16 md:py-24 px-4 border-y border-slate-200 dark:border-slate-800 transition-all duration-1000 ${isVisible('why-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                    }`}
            >
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12 md:mb-16">
                        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary px-4 py-2 rounded-full mb-4 md:mb-6 hover:scale-105 transition-transform">
                            <Award className="w-4 h-4" />
                            <span className="text-sm font-medium">Why Choose Us</span>
                        </div>

                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 md:mb-6 leading-tight">
                            Why Choose <span className="text-primary">HommieCare Medical</span>
                        </h2>

                        <p className="text-base md:text-lg text-muted-foreground dark:text-slate-400 max-w-3xl mx-auto">
                            We provide trusted, compassionate, and professional healthcare services
                            delivered by licensed providers across Kenya.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {[
                            {
                                icon: Stethoscope,
                                bg: "bg-blue-100 dark:bg-blue-950/30",
                                color: "text-blue-600 dark:text-blue-400",
                                title: "Licensed Healthcare Providers",
                                desc: "All our providers are fully licensed, certified, and experienced in delivering professional home healthcare."
                            },
                            {
                                icon: Clock,
                                bg: "bg-green-100 dark:bg-green-950/30",
                                color: "text-green-600 dark:text-green-400",
                                title: "Flexible Scheduling",
                                desc: "Book healthcare services at your convenience with flexible scheduling options that fit your needs."
                            },
                            {
                                icon: Heart,
                                bg: "bg-rose-100 dark:bg-rose-950/30",
                                color: "text-rose-600 dark:text-rose-400",
                                title: "Compassionate Care",
                                desc: "We prioritize your comfort and well-being, delivering personalized care with empathy and compassion."
                            },
                            {
                                icon: ShieldCheck,
                                bg: "bg-emerald-100 dark:bg-emerald-950/30",
                                color: "text-emerald-600 dark:text-emerald-400",
                                title: "Verified & Trusted",
                                desc: "Every provider undergoes rigorous verification including background checks and credential validation."
                            },
                            {
                                icon: Globe,
                                bg: "bg-indigo-100 dark:bg-indigo-950/30",
                                color: "text-indigo-600 dark:text-indigo-400",
                                title: "Nationwide Coverage",
                                desc: "We serve patients across Kenya with an expanding network of healthcare professionals."
                            },
                            {
                                icon: Users,
                                bg: "bg-purple-100 dark:bg-purple-950/30",
                                color: "text-purple-600 dark:text-purple-400",
                                title: "Patient-Centered Approach",
                                desc: "We put patients at the center of everything we do, tailoring care to individual needs."
                            }
                        ].map((item, idx) => (
                            <div
                                key={idx}
                                className={`bg-slate-50 dark:bg-zinc-800/50 rounded-[1.5rem] p-6 md:p-8 border border-slate-100 dark:border-slate-700 hover:shadow-xl transition-all duration-500 hover:-translate-y-2 group animate-in fade-in zoom-in duration-700`}
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                <div className={`w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                    <item.icon className={`w-7 h-7 ${item.color}`} />
                                </div>
                                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
                                <p className="text-sm text-muted-foreground dark:text-slate-400 leading-relaxed">
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== TEAM ===== */}
            <section
                id="team-section"
                ref={(el) => sectionRefs.current['team-section'] = el}
                className={`py-16 md:py-24 px-4 transition-all duration-1000 ${isVisible('team-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                    }`}
            >
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12 md:mb-16">
                        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary px-4 py-2 rounded-full mb-4 md:mb-6 hover:scale-105 transition-transform">
                            <Users className="w-4 h-4" />
                            <span className="text-sm font-medium">Our Leadership Team</span>
                        </div>

                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 md:mb-6 leading-tight">
                            Meet Our <span className="text-primary">Healthcare Leaders</span>
                        </h2>

                        <p className="text-base md:text-lg text-muted-foreground dark:text-slate-400 max-w-3xl mx-auto">
                            Our team of experienced medical professionals is dedicated to delivering
                            exceptional healthcare services to every patient.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                        {teamMembers.map((member, idx) => (
                            <div
                                key={idx}
                                className={`bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-xl transition-all duration-500 hover:-translate-y-2 group animate-in fade-in zoom-in duration-700`}
                                style={{ animationDelay: `${idx * 150}ms` }}
                            >
                                <div className="h-48 bg-gradient-to-br from-primary/10 to-blue-500/10 flex items-center justify-center relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-blue-500/5 group-hover:scale-110 transition-transform duration-700"></div>
                                    <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-4xl font-bold text-primary relative z-10 group-hover:scale-110 transition-transform duration-300">
                                        {member.name.charAt(0)}
                                    </div>
                                    <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-primary/5 rounded-full blur-2xl"></div>
                                </div>
                                <div className="p-6">
                                    <h4 className="font-bold text-lg group-hover:text-primary transition-colors">{member.name}</h4>
                                    <p className="text-sm text-primary font-medium">{member.role}</p>
                                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                                        <span className="inline-flex items-center gap-1">
                                            <GraduationCap className="w-3 h-3" />
                                            {member.specialty}
                                        </span>
                                        <span className="w-px h-3 bg-slate-300 dark:bg-slate-700"></span>
                                        <span className="inline-flex items-center gap-1">
                                            <Award className="w-3 h-3" />
                                            {member.experience}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{member.bio}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== PARTNERSHIPS ===== */}
            <section
                id="partners-section"
                ref={(el) => sectionRefs.current['partners-section'] = el}
                className={`bg-white dark:bg-zinc-900 py-16 md:py-20 px-4 border-y border-slate-200 dark:border-slate-800 transition-all duration-1000 ${isVisible('partners-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                    }`}
            >
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-10 md:mb-14">
                        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary px-4 py-2 rounded-full mb-4 hover:scale-105 transition-transform">
                            <Handshake className="w-4 h-4" />
                            <span className="text-sm font-medium">Our Partners</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Trusted by <span className="text-primary">Leading Organizations</span></h2>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
                        {partnerships.map((partner, idx) => (
                            <div
                                key={idx}
                                className={`flex items-center gap-3 bg-slate-50 dark:bg-zinc-800/50 px-4 py-2 rounded-full border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all duration-300 hover:scale-105 animate-in fade-in zoom-in duration-700`}
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                <partner.icon className="w-5 h-5 text-primary" />
                                <span className="text-sm font-medium">{partner.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== MILESTONES ===== */}
            <section
                id="milestones-section"
                ref={(el) => sectionRefs.current['milestones-section'] = el}
                className={`py-16 md:py-24 px-4 transition-all duration-1000 ${isVisible('milestones-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                    }`}
            >
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary px-4 py-2 rounded-full mb-4 hover:scale-105 transition-transform">
                            <CalendarDays className="w-4 h-4" />
                            <span className="text-sm font-medium">Our Journey</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
                            Our <span className="text-primary">Milestones</span>
                        </h2>
                    </div>

                    <div className="relative">
                        <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-primary/20 dark:bg-primary/30"></div>
                        {milestones.map((milestone, idx) => (
                            <div
                                key={idx}
                                className={`relative flex items-center mb-12 ${idx % 2 === 0 ? 'flex-row' : 'flex-row-reverse'} animate-in fade-in slide-in-from-bottom-8 duration-700`}
                                style={{ animationDelay: `${idx * 150}ms` }}
                            >
                                <div className="w-1/2"></div>
                                <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-primary border-4 border-white dark:border-zinc-950 shadow-lg hover:scale-150 transition-transform duration-300"></div>
                                <div className={`w-1/2 ${idx % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                                        <div className="text-2xl font-bold text-primary">{milestone.year}</div>
                                        <h4 className="font-bold text-lg">{milestone.title}</h4>
                                        <p className="text-sm text-muted-foreground">{milestone.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== TESTIMONIALS ===== */}
            <section
                id="testimonials-section"
                ref={(el) => sectionRefs.current['testimonials-section'] = el}
                className={`bg-white dark:bg-zinc-900 py-16 md:py-24 px-4 border-y border-slate-200 dark:border-slate-800 transition-all duration-1000 ${isVisible('testimonials-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                    }`}
            >
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary px-4 py-2 rounded-full mb-4 hover:scale-105 transition-transform">
                            <Quote className="w-4 h-4" />
                            <span className="text-sm font-medium">Testimonials</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
                            What Our <span className="text-primary">Patients Say</span>
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 md:gap-8">
                        {testimonials.map((testimonial, idx) => (
                            <div
                                key={idx}
                                className={`bg-slate-50 dark:bg-zinc-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 hover:shadow-xl transition-all duration-500 hover:-translate-y-2 animate-in fade-in zoom-in duration-700`}
                                style={{ animationDelay: `${idx * 150}ms` }}
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xl group-hover:scale-110 transition-transform">
                                        {testimonial.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold">{testimonial.name}</h4>
                                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                                    </div>
                                </div>
                                <div className="flex mb-3">
                                    {[...Array(5)].map((_, i) => (
                                        <StarIcon key={i} className={`w-4 h-4 ${i < testimonial.rating ? 'text-yellow-400 fill-current' : 'text-slate-300'}`} />
                                    ))}
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">"{testimonial.content}"</p>
                                <p className="text-xs text-muted-foreground mt-3">{testimonial.date}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== CTA ===== */}
            <section
                id="cta-section"
                ref={(el) => sectionRefs.current['cta-section'] = el}
                className={`pb-16 md:pb-24 px-4 transition-all duration-1000 ${isVisible('cta-section') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                    }`}
            >
                <div className="max-w-5xl mx-auto bg-gradient-to-r from-primary to-blue-700 dark:from-primary dark:to-blue-800 rounded-[2rem] p-8 md:p-16 text-center text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000 delay-300"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000 delay-700"></div>
                    </div>

                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/20 hover:bg-white/30 transition-all duration-300">
                            <Heart className="w-4 h-4 animate-pulse" />
                            <span className="text-sm font-medium">Need Professional Healthcare?</span>
                        </div>

                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 md:mb-6 leading-tight">
                            Ready to Get <span className="text-white/90">Quality Healthcare</span> at Home?
                        </h2>

                        <p className="text-base md:text-lg text-white/80 max-w-2xl mx-auto mb-8 leading-relaxed">
                            Connect with licensed healthcare professionals who deliver compassionate
                            medical care right at your doorstep. Book your service today.
                        </p>

                        <div className="flex flex-wrap items-center justify-center gap-4">
                            <Button
                                size="lg"
                                variant="secondary"
                                className="rounded-2xl px-8 py-6 text-base font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-white text-primary hover:bg-slate-100"
                                onClick={() => navigate("/explore")}
                            >
                                Book Healthcare Services
                                <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                            </Button>

                            <Button
                                size="lg"
                                variant="outline"
                                className="rounded-2xl px-8 py-6 text-base font-bold bg-transparent border-white/30 hover:bg-white/10 transition-all duration-300 hover:scale-105"
                                onClick={() => navigate("/emergency")}
                            >
                                <PhoneCall className="w-4 h-4 mr-2" />
                                Emergency Care
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== FOOTER ===== */}
            <footer className="bg-white dark:bg-zinc-950 border-t border-slate-200 dark:border-slate-800 py-8 px-4 transition-colors">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <img
                            src="/pwa-192x192.png"
                            alt="HommieCare Medical"
                            className="w-8 h-8 rounded-lg"
                        />
                        <span className="font-bold text-sm">
                            HommieCare Medical
                        </span>
                        {currentWorkspace && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-2 animate-in fade-in zoom-in duration-500">
                                {getWorkspaceTypeLabel(currentWorkspace.type)}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <Link to="/privacy-policy" className="hover:text-primary transition-colors hover:scale-105">Privacy Policy</Link>
                        <Link to="/terms-of-service" className="hover:text-primary transition-colors hover:scale-105">Terms of Service</Link>
                        <Link to="/contact" className="hover:text-primary transition-colors hover:scale-105">Contact Us</Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground">
                            &copy; {new Date().getFullYear()} HommieCare Medical. All rights reserved.
                        </span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
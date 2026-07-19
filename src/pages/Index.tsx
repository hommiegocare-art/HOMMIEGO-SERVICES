import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { ServiceCard } from "@/components/ServiceCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {

  // UI & Navigation
  Search,
  CheckCircle,
  MessageSquare,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Star,
  ArrowRight,
  ShieldCheck,
  Globe,

  // Contact
  Mail,
  MapPin,
  Phone,

  // Social Media
  Facebook,
  Twitter,
  Instagram,
  Linkedin,

  // Education
  GraduationCap,
  FileText,
  FileCheck,

  // Medical & Health
  Pill,
  Stethoscope,
  Heart,
  HeartHandshake,
  Droplets,
  Sparkles,
  Fan,
  Baby,
  Building2,
  Settings,
  AlertCircle,
  Calendar,
  Video,
  Dumbbell,
  Package,
  Users,

  // Utilities
  PhoneCall,
  Mic,

  // Misc
  ShoppingBag,
  Clock,
  Award,
  Briefcase,
  Home,
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
  UserCheck,
  ThumbsUp,
  Info,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Wind,
} from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";
import HeroCube from "@/components/HeroCube";

// --- TYPES ---
interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
}

interface Ad {
  id: string;
  title: string;
  caption: string;
  image_url: string;
  link?: string | null;
}

interface Service {
  id: string;
  provider_id: string;
  title: string;
  short_description: string | null;
  description: string | null;
  price: number | null;
  cover_image: string | null;
  location_name: string | null;
  categories: { name: string; icon?: string | null } | null;
  profiles: { full_name: string | null; avatar_url: string | null; city: string | null } | null;
  provider_profiles?: {
    average_rating: number | null;
    total_reviews: number | null;
    business_name: string | null;
  };
}

const Index = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [animatedStats, setAnimatedStats] = useState(false);
  const [visibleCategories, setVisibleCategories] = useState<number[]>([]);

  const heroImages = [
    "/background2.png",
    "/background3.png",
    "/background4.png",
    "/background5.png",
    "/background6.png",
  ];

  const [currentHeroImage, setCurrentHeroImage] = useState(0);

  const iconMap: Record<string, any> = {
    GraduationCap,
    FileText,
    FileCheck,
    Pill,
    Stethoscope,
    Heart,
    HeartHandshake,
    Droplets,
    Sparkles,
    Fan,
    Baby,
    Building2,
    Settings,
    AlertCircle,
    Calendar,
    Video,
    Dumbbell,
    Package,
    Users,
    PhoneCall,
    Mic,
    MessageSquare,
    ShoppingBag,
    Syringe,
    Bandage,
    Scissors,
    Thermometer,
    Activity,
    Microscope,
    Bone,
    Brain,
    Smile,
    Shield,
    Lock,
    UserCheck,
    ThumbsUp,
  };

  const categoryColors = [
    "bg-blue-100 text-blue-600",
    "bg-green-100 text-green-600",
    "bg-yellow-100 text-yellow-600",
    "bg-red-100 text-red-600",
    "bg-purple-100 text-purple-600",
    "bg-pink-100 text-pink-600",
    "bg-indigo-100 text-indigo-600",
    "bg-orange-100 text-orange-600",
  ];

  // Sample testimonials (placeholder)
  const testimonials = [
    {
      id: "1",
      name: "Dr. Sarah Muthoni",
      role: "Daughter of an elderly parent",
      content: "HommieCare provided exceptional care for my mother during her recovery. The nurses were professional, compassionate, and truly made a difference in our lives.",
      rating: 5,
    },
    {
      id: "2",
      name: "James Ochieng",
      role: "Post-surgery patient",
      content: "After my surgery, I needed reliable care at home. HommieCare exceeded my expectations with their professional and personalized service.",
      rating: 5,
    },
    {
      id: "3",
      name: "Grace Wanjiru",
      role: "New mother",
      content: "As a first-time mom, having a professional nurse at home gave me peace of mind. Their mother and baby care services are outstanding.",
      rating: 5,
    }
  ];

  const faqs = [
    {
      question: "Are your nurses licensed and verified?",
      answer: "Yes, every nurse on HommieCare undergoes rigorous verification including license validation, identity checks, and professional reference verification. We only work with qualified healthcare professionals."
    },
    {
      question: "How do bookings work?",
      answer: "Simply search for the service you need, choose a verified nurse, select your preferred time, and book securely. You'll receive confirmation and the nurse's details immediately."
    },
    {
      question: "Can I choose my nurse?",
      answer: "Absolutely! You can view nurse profiles, their qualifications, ratings, and experience. Choose the healthcare professional that best fits your needs."
    },
    {
      question: "Can I book same-day care?",
      answer: "Yes, we offer same-day booking for urgent care needs. Our platform shows real-time availability of our nurses across Kenya."
    },
    {
      question: "Which counties do you serve?",
      answer: "We currently serve Nairobi, Kiambu, Mombasa, and surrounding areas. We're rapidly expanding to other counties across Kenya."
    },
    {
      question: "How are providers verified?",
      answer: "We verify licenses, run background checks, validate professional credentials, and conduct in-person interviews. Only the most qualified providers join our platform."
    },
    {
      question: "How much does a visit cost?",
      answer: "Pricing varies based on the service type and duration. We provide transparent pricing upfront before you book, with no hidden fees."
    }
  ];

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        setProfile(data);
      }
      await Promise.all([fetchServices(), fetchCategories(), fetchAds()]);
      setLoading(false);
    };
    initialize();

    const handleScroll = () => {
      const statsSection = document.getElementById('stats-section');
      if (statsSection) {
        const rect = statsSection.getBoundingClientRect();
        if (rect.top < window.innerHeight && !animatedStats) {
          setAnimatedStats(true);
        }
      }

      const categoryCards = document.querySelectorAll('.category-card');
      categoryCards.forEach((card, index) => {
        const rect = card.getBoundingClientRect();
        if (rect.top < window.innerHeight && !visibleCategories.includes(index)) {
          setVisibleCategories(prev => [...prev, index]);
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    setTimeout(handleScroll, 100);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHeroImage((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (ads.length === 0) return;
    const interval = setInterval(() => setCurrentAdIndex(p => (p + 1) % ads.length), 6000);
    return () => clearInterval(interval);
  }, [ads]);

  async function fetchCategories() {
    const { data } = await supabase.from("categories").select("*").order("name");
    setCategories(data || []);
  }

  async function fetchAds() {
    const { data } = await supabase.from("ads").select("*").eq("is_active", true);
    setAds(data || []);
  }

  async function fetchServices() {
    const { data: sData } = await supabase.from("services").select(`
      id, provider_id, title, short_description, description, price, cover_image, location_name,
      categories (name, icon),
      profiles:profiles!services_provider_id_fkey (full_name, avatar_url, city)
    `).eq("is_active", true).limit(8);

    const providerIds = sData?.map(s => s.provider_id) || [];
    const { data: pData } = await supabase.from("provider_profiles").select("user_id, average_rating, total_reviews, business_name").in("user_id", providerIds);

    const merged = sData?.map((service: any) => ({
      ...service,
      provider_profiles: pData?.find(p => p.user_id === service.provider_id)
    }));
    setServices(merged || []);
  }

  const filteredServices = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return services;
    return services.filter(s => s.title?.toLowerCase().includes(q));
  }, [services, searchQuery]);

  const dashboardLink = profile?.role === "provider" ? "/dashboard/provider" : "/dashboard/customer";

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col">
      <Navbar />

      {/* ===== HERO SECTION ===== */}
      <section className="relative pt-32 pb-16 overflow-hidden bg-white dark:bg-zinc-950">
        <div
          className="absolute inset-0 z-0 pointer-events-none opacity-30 dark:opacity-60 transition-opacity duration-1000 mix-blend-multiply dark:mix-blend-normal"
          style={{
            backgroundImage: "url('/background11.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center bottom',
            filter: 'contrast(0.9) brightness(1.1)',
          }}
        />

        <div className="absolute inset-0 z-0 bg-gradient-to-r from-white via-white/80 to-transparent dark:from-slate-950 dark:via-slate-950/80 dark:to-transparent pointer-events-none" />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-white via-transparent to-white/50 dark:from-slate-950 dark:via-transparent dark:to-slate-950/50 pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-left">
              <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-bold text-primary dark:text-primary-foreground mb-6 backdrop-blur-md border border-primary/20">
                🏥 Professional Healthcare. Delivered to Your Home.
              </div>

              <h1 className="text-5xl md:text-7xl font-black text-slate-950 dark:text-white leading-[1.1] mb-6 drop-shadow-sm">
                Professional <br /> <span className="text-primary">Home Nursing</span> Care
              </h1>

              <div className="flex flex-wrap gap-2 mb-6">
                <span className="inline-flex items-center gap-1.5 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Licensed & Verified Nurses
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <Globe className="w-4 h-4 text-blue-600" />
                  Home Visits Across Kenya
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <Lock className="w-4 h-4 text-purple-600" />
                  Safe & Confidential Care
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <Clock className="w-4 h-4 text-orange-600" />
                  Fast Booking
                </span>
              </div>

              <p className="text-xl text-slate-800 dark:text-slate-200 mb-8 max-w-lg leading-relaxed font-semibold">
                Expert nurses and caregivers delivering compassionate medical care right at your doorstep. Safe, reliable, and professional.
              </p>

              {/* SEARCH BAR - Filters services from Supabase */}
              <div className="flex flex-col sm:flex-row gap-3 p-2.5 bg-white/95 dark:bg-slate-800/90 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-2xl border border-slate-300 dark:border-slate-700 mb-8 max-w-xl">
                <div className="flex-1 flex items-center px-4">
                  <Search className="text-slate-500 dark:text-slate-400 mr-2 h-5 w-5" />
                  <Input
                    placeholder="Find nursing services..."
                    className="border-none shadow-none focus-visible:ring-0 text-lg h-12 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button size="lg" onClick={() => navigate("/explore")} className="h-12 px-8 rounded-xl bg-primary shadow-lg hover:scale-105 transition-all font-bold">
                  Find Care
                </Button>
              </div>

              <div className="flex flex-wrap gap-6 text-slate-900 dark:text-slate-100 font-extrabold">
                <div className="flex items-center gap-2 bg-white/40 dark:bg-transparent px-3 py-1 rounded-full backdrop-blur-sm">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  Licensed Nurses
                </div>
                <div className="flex items-center gap-2 bg-white/40 dark:bg-transparent px-3 py-1 rounded-full backdrop-blur-sm">
                  <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  24/7 Availability
                </div>
                <div className="flex items-center gap-2 bg-white/40 dark:bg-transparent px-3 py-1 rounded-full backdrop-blur-sm">
                  <Heart className="w-5 h-5 text-red-600 dark:text-red-400" />
                  Quality Care
                </div>
              </div>
            </div>

            <div className="lg:block relative z-10">
              <HeroCube />
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES GRID - ORIGINAL */}
      <section className="py-24 bg-white dark:bg-zinc-950 relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-slate-900 dark:text-white tracking-tight">
              Our <span className="text-primary">Medical</span> Services
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-6">
              Professional nursing and healthcare services delivered with compassion and expertise.
            </p>
            <div className="w-24 h-1.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20 mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {categories.map((cat, index) => (
              <div
                key={cat.id}
                className={`category-card transition-all duration-700 ${visibleCategories.includes(index)
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-12'
                  }`}
                style={{
                  transitionDelay: `${index * 80}ms`,
                }}
              >
                <Card
                  onClick={() => {
                    if (!session) {
                      navigate("/auth", { state: { message: "Join HommieCare to access medical services" } });
                      return;
                    }
                    navigate(`/explore?category=${cat.slug}`);
                  }}
                  className="group relative border-0 bg-white dark:bg-gray-950 shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer rounded-xl overflow-hidden py-10 hover:-translate-y-2"
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shimmer"
                      style={{ width: '200%', height: '100%' }} />
                  </div>

                  <div className="absolute bottom-0 left-0 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <Sparkles className="w-6 h-6 animate-spin-slow" />
                  </div>

                  <CardContent className="flex flex-col items-center relative z-10">
                    <div
                      className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6
                        transition-all duration-500 group-hover:rotate-[10deg] group-hover:scale-110
                        shadow-inner ${categoryColors[index % categoryColors.length]}`}
                    >
                      {(() => {
                        const IconComponent = iconMap[cat.icon || ""];
                        return IconComponent ? (
                          <IconComponent className="w-10 h-10 transition-transform duration-500 group-hover:rotate-12" />
                        ) : (
                          <Star className="w-10 h-10" />
                        );
                      })()}
                    </div>

                    <p className="font-extrabold text-slate-800 dark:text-slate-200 text-base tracking-tight group-hover:text-primary transition-colors">
                      {cat.name}
                    </p>

                    <div className="mt-4 w-0 group-hover:w-8 h-1 bg-primary rounded-full transition-all duration-500" />
                  </CardContent>

                  <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRENDING SERVICES - ORIGINAL */}
      <section className="py-20 bg-slate-50 dark:bg-zinc-950">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Available Nursing Services</h2>
            <Button variant="ghost" className="text-primary font-bold" onClick={() => navigate("/explore")}>
              View All Services <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredServices.map((service) => (
              <ServiceCard
                key={service.id}
                id={service.id}
                title={service.title}
                description={service.short_description || ""}
                price={service.price || 0}
                location={service.location_name || "Remote"}
                rating={service.provider_profiles?.average_rating || 0}
                reviews={service.provider_profiles?.total_reviews || 0}
                image={service.cover_image || ""}
                name={service.provider_profiles?.business_name || service.profiles?.full_name || "Provider"}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ===== TRUST SECTION ===== */}
      <section className="py-12 bg-slate-50/80 dark:bg-zinc-900/50 border-y border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="flex items-center gap-3 bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <ShieldCheck className="w-6 h-6 text-emerald-600 flex-shrink-0" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Licensed Healthcare Professionals</span>
            </div>
            <div className="flex items-center gap-3 bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <UserCheck className="w-6 h-6 text-blue-600 flex-shrink-0" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Verified Identity & Credentials</span>
            </div>
            <div className="flex items-center gap-3 bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <Lock className="w-6 h-6 text-purple-600 flex-shrink-0" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Secure Online Booking</span>
            </div>
            <div className="flex items-center gap-3 bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <CreditCard className="w-6 h-6 text-green-600 flex-shrink-0" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Transparent Pricing</span>
            </div>
            <div className="flex items-center gap-3 bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <HeartHandshake className="w-6 h-6 text-red-600 flex-shrink-0" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Compassionate Home Care</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-24 bg-white dark:bg-zinc-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-slate-900 dark:text-white tracking-tight">
              How It <span className="text-primary">Works</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              Getting professional healthcare at home is simple and hassle-free
            </p>
            <div className="w-24 h-1.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20 mx-auto rounded-full mt-4" />
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Search className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">1. Search</h3>
              <p className="text-slate-500 dark:text-slate-400">Find the healthcare service you need for your loved ones</p>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Users className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">2. Choose</h3>
              <p className="text-slate-500 dark:text-slate-400">Select a verified nurse who matches your requirements</p>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <CreditCard className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">3. Book & Pay</h3>
              <p className="text-slate-500 dark:text-slate-400">Secure your booking with transparent payment</p>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Heart className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">4. Receive Care</h3>
              <p className="text-slate-500 dark:text-slate-400">Get professional care delivered to your home</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== STATISTICS SECTION ===== */}
      <section id="stats-section" className="py-16 bg-gradient-to-r from-primary to-primary/80 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-black mb-2">
                {animatedStats ? '10+' : '0'}
              </div>
              <p className="text-white/80 font-semibold">Professional Nursing Services</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black mb-2">
                {animatedStats ? '100%' : '0%'}
              </div>
              <p className="text-white/80 font-semibold">Verified Healthcare Providers</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black mb-2">
                {animatedStats ? '24/7' : '0'}
              </div>
              <p className="text-white/80 font-semibold">Booking Availability</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black mb-2">
                {animatedStats ? '100%' : '0%'}
              </div>
              <p className="text-white/80 font-semibold">Patient-Focused Care</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SAFETY & TRUST SECTION ===== */}
      <section className="py-24 bg-white dark:bg-zinc-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-slate-900 dark:text-white tracking-tight">
              Safety & <span className="text-primary">Trust</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              Your safety and peace of mind are our highest priorities
            </p>
            <div className="w-24 h-1.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20 mx-auto rounded-full mt-4" />
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <ShieldCheck className="w-8 h-8 text-emerald-600 mb-4" />
              <h3 className="font-bold mb-2 text-slate-900 dark:text-white">Provider Verification</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Every healthcare provider is carefully vetted</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <FileCheck className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="font-bold mb-2 text-slate-900 dark:text-white">License Verification</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Valid professional licenses verified</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <UserCheck className="w-8 h-8 text-purple-600 mb-4" />
              <h3 className="font-bold mb-2 text-slate-900 dark:text-white">Identity Verification</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Government ID and identity confirmation</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <Award className="w-8 h-8 text-amber-600 mb-4" />
              <h3 className="font-bold mb-2 text-slate-900 dark:text-white">Professional Standards</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Adherence to highest industry standards</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <Lock className="w-8 h-8 text-green-600 mb-4" />
              <h3 className="font-bold mb-2 text-slate-900 dark:text-white">Patient Privacy</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Your medical information is confidential</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <Shield className="w-8 h-8 text-red-600 mb-4" />
              <h3 className="font-bold mb-2 text-slate-900 dark:text-white">Data Protection</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Secure handling of personal information</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <Star className="w-8 h-8 text-yellow-600 mb-4" />
              <h3 className="font-bold mb-2 text-slate-900 dark:text-white">Ratings & Reviews</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Transparent feedback from real patients</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <MessageSquare className="w-8 h-8 text-indigo-600 mb-4" />
              <h3 className="font-bold mb-2 text-slate-900 dark:text-white">Reliable Support</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">24/7 customer support availability</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== WHO WE HELP ===== */}
      <section className="py-24 bg-slate-50 dark:bg-zinc-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-slate-900 dark:text-white tracking-tight">
              Who We <span className="text-primary">Help</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              We provide compassionate care for people at every stage of their healthcare journey
            </p>
            <div className="w-24 h-1.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20 mx-auto rounded-full mt-4" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-zinc-800 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 mb-4 flex items-center justify-center">
                <Activity className="w-7 h-7" />
              </div>
              <h3 className="font-bold mb-2 text-slate-900 dark:text-white">Recovering After Surgery</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Specialized post-operative care and monitoring</p>
            </div>
            <div className="bg-white dark:bg-zinc-800 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-14 h-14 rounded-xl bg-pink-100 dark:bg-pink-900/30 text-pink-600 mb-4 flex items-center justify-center">
                <Baby className="w-7 h-7" />
              </div>
              <h3 className="font-bold mb-2 text-slate-900 dark:text-white">New Mothers</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Maternal and newborn care at home</p>
            </div>
            <div className="bg-white dark:bg-zinc-800 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-14 h-14 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 mb-4 flex items-center justify-center">
                <Heart className="w-7 h-7" />
              </div>
              <h3 className="font-bold mb-2 text-slate-900 dark:text-white">Older Adults</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Compassionate elderly care and companionship</p>
            </div>
            <div className="bg-white dark:bg-zinc-800 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-14 h-14 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 mb-4 flex items-center justify-center">
                <Stethoscope className="w-7 h-7" />
              </div>
              <h3 className="font-bold mb-2 text-slate-900 dark:text-white">Chronic Illness Support</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Ongoing care for chronic conditions</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-24 bg-white dark:bg-zinc-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-slate-900 dark:text-white tracking-tight">
              What Our Families <span className="text-primary">Say</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              *Sample testimonials until we collect real reviews from our clients
            </p>
            <div className="w-24 h-1.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20 mx-auto rounded-full mt-4" />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="bg-slate-50 dark:bg-zinc-800/50 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{testimonial.name}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < testimonial.rating ? 'text-yellow-400 fill-current' : 'text-slate-300'}`} />
                  ))}
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">"{testimonial.content}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ SECTION ===== */}
      <section className="py-24 bg-slate-50 dark:bg-zinc-900">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-slate-900 dark:text-white tracking-tight">
              Frequently Asked <span className="text-primary">Questions</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Everything you need to know about HommieCare services
            </p>
            <div className="w-24 h-1.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20 mx-auto rounded-full mt-4" />
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                <button
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-zinc-700/50 transition-colors"
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                >
                  <span className="font-semibold text-slate-900 dark:text-white">{faq.question}</span>
                  {expandedFaq === index ? <ChevronUp className="w-5 h-5 text-primary" /> : <ChevronDown className="w-5 h-5 text-primary" />}
                </button>
                {expandedFaq === index && (
                  <div className="px-6 pb-4 text-slate-600 dark:text-slate-300 leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AD CAROUSEL / PROMOTIONS - ORIGINAL */}
      {ads.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="relative h-[450px] md:h-[450px] rounded-xl overflow-hidden group shadow-xl">
              {ads.map((ad, i) => (
                <div
                  key={ad.id}
                  className={`absolute inset-0 transition-all duration-1000 transform
      ${i === currentAdIndex
                      ? "opacity-100 scale-100 z-10 pointer-events-auto"
                      : "opacity-0 scale-105 z-0 pointer-events-none"
                    }`}
                >
                  <img src={ad.image_url} className="w-full h-full object-cover" alt="" />

                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent flex items-center p-12 z-20">
                    <div className="max-w-md text-white">
                      <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase mb-4 inline-block">
                        Medical Care Offer
                      </span>
                      <h2 className="text-4xl font-bold mb-4">{ad.title}</h2>
                      <p className="text-lg text-white/80 mb-6">{ad.caption}</p>

                      <Button
                        size="lg"
                        className="relative z-30 rounded-full px-8 bg-white text-slate-900 hover:bg-slate-100 active:scale-95 transition-transform"
                        onClick={(e) => {
                          e.stopPropagation();
                          const target = ad.link?.trim();
                          if (!target) {
                            navigate("/ads");
                            return;
                          }
                          if (target.startsWith("http")) {
                            window.open(target, "_blank", "noopener,noreferrer");
                          } else {
                            const path = target.startsWith("/") ? target : `/${target}`;
                            navigate(path);
                          }
                        }}
                      >
                        Book Now
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              <div className="absolute bottom-6 right-6 z-40 flex gap-2">
                <Button size="icon" variant="secondary" onClick={() => setCurrentAdIndex(p => (p - 1 + ads.length) % ads.length)} className="rounded-full bg-white/10 border-white/20 backdrop-blur-md text-white hover:bg-white/20"><ChevronLeft /></Button>
                <Button size="icon" variant="secondary" onClick={() => setCurrentAdIndex(p => (p + 1) % ads.length)} className="rounded-full bg-white/10 border-white/20 backdrop-blur-md text-white hover:bg-white/20"><ChevronRight /></Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* FOOTER SECTION - ORIGINAL */}
      <footer className="bg-white dark:bg-zinc-950 border-t border-gray-200 dark:border-slate-800 pt-20 pb-10 transition-colors">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div>
              <div className="flex items-center gap-2 text-gray-900 dark:text-white mb-6">
                <img
                  src="/pwa-192x192.png"
                  alt="HommieCare Medical Services Logo"
                  className="w-10 h-10 rounded-lg object-cover"
                />
                <span className="text-2xl font-bold tracking-tight">
                  HommieCare
                </span>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
                  Medical
                </span>
              </div>
              <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-6">
                Your trusted partner for professional home nursing and medical care services. Compassionate healthcare delivered with excellence.
              </p>
              <div className="flex gap-4">
                <Facebook className="w-5 h-5 text-gray-500 dark:text-slate-300 hover:text-primary dark:hover:text-primary cursor-pointer transition-colors" />
                <Twitter className="w-5 h-5 text-gray-500 dark:text-slate-300 hover:text-primary dark:hover:text-primary cursor-pointer transition-colors" />
                <Instagram className="w-5 h-5 text-gray-500 dark:text-slate-300 hover:text-primary dark:hover:text-primary cursor-pointer transition-colors" />
                <Linkedin className="w-5 h-5 text-gray-500 dark:text-slate-300 hover:text-primary dark:hover:text-primary cursor-pointer transition-colors" />
              </div>
            </div>

            <div>
              <h4 className="text-gray-900 dark:text-white font-bold mb-6">Quick Links</h4>
              <ul className="space-y-4">
                <li>
                  <Link to="/explore" className="text-gray-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors">
                    Find Nursing Services
                  </Link>
                </li>
                <li>
                  <Link to="/auth" className="text-gray-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors">
                    Join as a Nurse
                  </Link>
                </li>
                <li>
                  <Link to="/careers" className="text-gray-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors">
                    Careers in Healthcare
                  </Link>
                </li>
                <li>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/about")}
                    className="text-gray-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary"
                  >
                    About Us
                  </Button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-gray-900 dark:text-white font-bold mb-6">Medical Services</h4>
              <ul className="space-y-4">
                <li>
                  <Link to="/explore?category=home-nursing" className="text-gray-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors">
                    Home Nursing
                  </Link>
                </li>
                <li>
                  <Link to="/explore?category=medication-administration" className="text-gray-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors">
                    Medication Administration
                  </Link>
                </li>
                <li>
                  <Link to="/explore?category=elderly-care" className="text-gray-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors">
                    Elderly Care
                  </Link>
                </li>
                <li>
                  <Link to="/explore?category=physiotherapy-support" className="text-gray-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors">
                    Physiotherapy
                  </Link>
                </li>
                <li>
                  <Link to="/explore?category=wound-care" className="text-gray-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors">
                    Wound Care
                  </Link>
                </li>
                <li>
                  <Link to="/explore?category=oxygen-therapy" className="text-gray-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors">
                    Oxygen Therapy
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-gray-900 dark:text-white font-bold mb-6">Get Medical Help</h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-primary mt-0.5" />
                  <span className="text-gray-600 dark:text-slate-300">hommiegocare@gmail.com</span>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-0.5" />
                  <span className="text-gray-600 dark:text-slate-300">Nairobi, Kenya</span>
                </li>
                <li className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-primary mt-0.5" />
                  <span className="text-gray-600 dark:text-slate-300">+254 704 473 503</span>
                </li>
                <li className="flex items-start gap-3">
                  <Heart className="w-5 h-5 text-primary mt-0.5" />
                  <span className="text-gray-600 dark:text-slate-300">24/7 Emergency Support</span>
                </li>
              </ul>
              <Button
                className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-bold"
                onClick={() => navigate("/emergency")}
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                Emergency Nursing
              </Button>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500 dark:text-slate-400">
              © {new Date().getFullYear()} HommieCare Medical Services. All rights reserved.
            </p>
            <div className="flex gap-8 text-sm">
              <Link
                to="/privacy-policy"
                className="text-sm text-gray-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms-of-service"
                className="text-sm text-gray-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                to="/cookie-policy"
                className="text-sm text-gray-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
              >
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        .animate-spin-slow {
          animation: spin 6s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default Index;
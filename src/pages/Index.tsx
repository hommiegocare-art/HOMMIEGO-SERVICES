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

  // Users & Communication
  Users,
  PhoneCall,
  Mic,

  // Shopping & Packages
  ShoppingBag,
  Package,

  // Utilities
  Calendar,
  Sparkles,
  Bug,
  Droplets,
  Flame,
  Fan,

  // Lifestyle
  Shirt,
  Dumbbell,
  Paintbrush,
  Brush,
  PartyPopper,
  Trees,
  Dog,
  Utensils,

  // Transport
  Car,
  Truck,

  // Tech
  Wifi,
  Zap,

  // Work
  Briefcase,
  Settings,
  AlertCircle,

  // Media
  Camera,
  Video,

  // Home & Repairs
  Wrench,
  Hammer,
  Key,
  // Media


  // Misc
  Baby,
  Building2,
  HeartHandshake,

} from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

// --- TYPES (Fixed Red Lines) ---
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

  const iconMap: Record<string, any> = {

    // Education
    GraduationCap,
    FileText,
    FileCheck,

    // Medical & Health
    Pill,
    Stethoscope,
    Heart,
    HeartHandshake,

    // Users & Communication
    Users,
    PhoneCall,
    Mic,
    MessageSquare,

    // Shopping & Packages
    ShoppingBag,
    Package,

    // Utilities
    Calendar,
    Sparkles,
    Settings,
    AlertCircle,

    // Media
    Camera,
    Video,

    // Home & Repairs
    Wrench,
    Hammer,
    Key,
    Building2,
    Bug,
    Droplets,
    Flame,
    Fan,

    // Lifestyle
    Shirt,
    Dumbbell,
    Paintbrush,
    Brush,
    PartyPopper,
    Trees,
    Dog,
    Utensils,

    // Transport
    Car,
    Truck,

    // Tech
    Wifi,
    Zap,

    // Work
    Briefcase,

    // Misc
    Baby,

  };
  const categoryColors = [
    "bg-blue-100 text-blue-600",
    "bg-green-100 text-green-600",
    "bg-yellow-100 text-yellow-600",
    "bg-red-100 text-red-600",
    "bg-purple-100 text-purple-600",
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
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-16 overflow-hidden bg-slate-50">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-left">
              <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary mb-6">
                ✨ Trusted by 10,000+ local users
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 leading-tight mb-6">
                Your Comfort, <br /> Our <span className="text-primary">Commitment.</span>
              </h1>
              <p className="text-xl text-slate-600 mb-8 max-w-lg leading-relaxed">
                Book top-rated verified professionals for any service you need. Reliable, fast, and secure.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 p-2 bg-white shadow-2xl rounded-2xl border border-slate-200 mb-8 max-w-xl">
                <div className="flex-1 flex items-center px-4">
                  <Search className="text-slate-400 mr-2 h-5 w-5" />
                  <Input
                    placeholder="What do you need help with?"
                    className="border-none shadow-none focus-visible:ring-0 text-lg h-12"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button size="lg" onClick={() => navigate("/explore")} className="h-12 px-8 rounded-xl bg-primary shadow-lg">
                  Search
                </Button>
              </div>

              <div className="flex flex-wrap gap-6 text-slate-500">
                <div className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-500" /> Verified Pros</div>
                <div className="flex items-center gap-2"><Globe className="w-5 h-5 text-blue-500" /> 24/7 Service</div>
              </div>
            </div>

            <div className="hidden lg:block">
              <img src={heroImage} alt="Hero" className="rounded-[3rem] shadow-2xl border-8 border-white object-cover aspect-[4/5] w-full max-w-md ml-auto" />
            </div>
          </div>
        </div>
      </section>

      {/* AD CAROUSEL / PROMOTIONS */}
      {/* AD CAROUSEL / PROMOTIONS */}
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

                  {/* ADD z-20 here to ensure the content is above the image layer */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent flex items-center p-12 z-20">
                    <div className="max-w-md text-white">
                      <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase mb-4 inline-block">
                        Special Offer
                      </span>
                      <h2 className="text-4xl font-bold mb-4">{ad.title}</h2>
                      <p className="text-lg text-white/80 mb-6">{ad.caption}</p>

                      <Button
                        size="lg"
                        // Add relative and a high z-index to the button itself
                        className="relative z-30 rounded-full px-8 bg-white text-slate-900 hover:bg-slate-100 active:scale-95 transition-transform"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevents the carousel from "stealing" the click

                          const target = ad.link?.trim();
                          if (!target) {
                            navigate("/ads");
                            return;
                          }

                          if (target.startsWith("http")) {
                            window.open(target, "_blank", "noopener,noreferrer");
                          } else {
                            // Standardize the path to ensure it navigates correctly
                            const path = target.startsWith("/") ? target : `/${target}`;
                            navigate(path);
                          }
                        }}
                      >
                        Claim Now
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
      {/* CATEGORIES GRID */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Explore by Category</h2>
            <div className="w-20 h-1 bg-primary mx-auto" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {categories.map((cat, index) => (
              <Card
                key={cat.id}
                onClick={() => {
                  // IF USER NOT LOGGED IN
                  if (!session) {
                    navigate("/auth", {
                      state: {
                        message: "Join HommieGo to explore services",
                      },
                    });
                    return;
                  }

                  // GO TO EXPLORE PAGE WITH CATEGORY
                  navigate(`/explore?category=${cat.slug}`);
                }}
                className="border-none shadow-sm hover:shadow-xl transition-all cursor-pointer group rounded-3xl overflow-hidden py-8"
              >
                <CardContent className="flex flex-col items-center">
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4
              group-hover:scale-110 transition-transform
              ${categoryColors[index % categoryColors.length]}`}
                  >
                    {(() => {
                      const IconComponent = iconMap[cat.icon || ""];

                      return IconComponent ? (
                        <IconComponent className="w-8 h-8 text-primary" />
                      ) : (
                        <div className="text-2xl"></div>
                      );
                    })()}
                  </div>

                  <p className="font-bold text-slate-800 text-sm">
                    {cat.name}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* TRENDING SERVICES */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold">Recommended for You</h2>
            <Button variant="ghost" className="text-primary font-bold" onClick={() => navigate("/explore")}>
              See all services <ArrowRight className="ml-2 w-4 h-4" />
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

      {/* FOOTER SECTION */}
      <footer className="bg-slate-900 text-slate-300 pt-20 pb-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            {/* Branding */}
            <div>
              <div className="flex items-center gap-2 text-white mb-6">
                <img
                  src="/pwa-192x192.png"
                  alt="HommieGo Logo"
                  className="w-10 h-10 rounded-lg object-cover"
                />

                <span className="text-2xl font-bold tracking-tight">
                  HommieGo
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed mb-6">
                The leading platform for finding professional services at the click of a button. We verify, you relax.
              </p>
              <div className="flex gap-4">
                <Facebook className="w-5 h-5 hover:text-primary cursor-pointer transition-colors" />
                <Twitter className="w-5 h-5 hover:text-primary cursor-pointer transition-colors" />
                <Instagram className="w-5 h-5 hover:text-primary cursor-pointer transition-colors" />
                <Linkedin className="w-5 h-5 hover:text-primary cursor-pointer transition-colors" />
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-white font-bold mb-6">Company</h4>
              <ul className="space-y-4">
                <li><Link to="/explore" className="hover:text-primary">Find Services</Link></li>
                <li><Link to="/auth" className="hover:text-primary">Become a Provider</Link></li>


                <li><Link to="/careers" className="hover:text-primary">Careers</Link></li>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/about")}
                >
                  About Us
                </Button>
              </ul>
            </div>

            {/* Categories */}
            <div>
              <h4 className="text-white font-bold mb-6">Popular Services</h4>
              <ul className="space-y-4">
                <li><Link to="/explore" className="hover:text-primary">Home Cleaning</Link></li>
                <li><Link to="/explore" className="hover:text-primary">Plumbing Repairs</Link></li>
                <li><Link to="/explore" className="hover:text-primary">Beauty & Wellness</Link></li>
                <li><Link to="/explore" className="hover:text-primary">Tech Support</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-bold mb-6">Contact Us</h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-primary" />
                  <span>hommiegocare@gmail.com</span>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span>Nairobi, Kenya</span>
                </li>
                <li className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-primary" />
                  <span>+254 704 473 503</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">© {new Date().getFullYear()} HommieGo Inc. All rights reserved.</p>
            <div className="flex gap-8 text-sm">
              <Link
                to="/privacy-policy"
                className="text-sm text-slate-500 hover:text-primary"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms-of-service"
                className="text-sm text-slate-500 hover:text-primary"
              >
                Terms of Service
              </Link>
              <Link
                to="/cookie-policy"
                className="text-sm text-slate-500 hover:text-primary"
              >
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
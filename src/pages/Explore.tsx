import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { ServiceCard } from "@/components/ServiceCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {

  // UI & Navigation
  Search,
  SlidersHorizontal,
  MapPin,
  X,

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
  MessageSquare,

} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// --- TYPES ---
interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
}

interface Service {
  id: string;
  title: string;
  short_description: string | null;
  description: string | null;
  price: number | null;
  cover_image: string | null;
  location_name: string | null;
  provider_id: string;
  categories: { id: string; name: string; slug: string; icon?: string | null } | null;
  profiles: { full_name: string | null; city: string | null; country: string | null } | null;
  provider_profiles?: {
    average_rating: number | null;
    total_reviews: number | null;
    business_name: string | null;
  };
  // Add this new line:
  service_ratings?: {
    average_rating: number;
    total_reviews: number;
  };
}

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
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
  useEffect(() => {
    const initialize = async () => {
      await Promise.all([fetchCategories(), fetchServices()]);
    };
    initialize();
  }, []);
  async function fetchCategories() {
    const { data } = await supabase.from("categories").select("*").order("name");
    if (data) setCategories(data);
  }

  async function fetchServices() {
    setLoading(true);
    try {
      // 1. Fetch Services, Profiles, AND the new reviews summary
      const { data: servicesData, error: sError } = await supabase
        .from("services")
        .select(`
        id, title, short_description, description, price, cover_image, location_name, provider_id,
        categories(id, name, slug, icon),
        profiles:profiles!services_provider_id_fkey(full_name, city, country),
        service_ratings:reviews(rating)
      `)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (sError) throw sError;

      // 2. Fetch Provider Business Names
      const providerIds = servicesData?.map(s => s.provider_id) || [];
      const { data: providerData } = await supabase
        .from("provider_profiles")
        .select("user_id, business_name")
        .in("user_id", providerIds);

      // 3. Merge data and calculate ratings manually if not using a view
      const merged = servicesData?.map((service: any) => {
        const revs = service.service_ratings || [];
        const avg = revs.length > 0
          ? revs.reduce((acc: number, r: any) => acc + r.rating, 0) / revs.length
          : 0;

        return {
          ...service,
          provider_profiles: providerData?.find(p => p.user_id === service.provider_id),
          calculated_rating: avg,
          calculated_count: revs.length
        };
      });

      setServices(merged || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = !query ||
        s.title?.toLowerCase().includes(query) ||
        s.location_name?.toLowerCase().includes(query) ||
        s.provider_profiles?.business_name?.toLowerCase().includes(query);

      const matchesCategory = !selectedCategory || s.categories?.id === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [services, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      {/* Hero / Search Section */}
      <section className="pt-32 pb-12 bg-white border-b">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-4">
            Find the perfect professional
          </h1>
          <p className="text-slate-500 mb-8 max-w-xl mx-auto">
            Browse through thousands of trusted service providers for your needs.
          </p>

          <div className="max-w-3xl mx-auto relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
            </div>
            <Input
              className="w-full h-14 pl-12 pr-32 rounded-2xl border-slate-200 shadow-lg focus-visible:ring-primary text-lg"
              placeholder="What service are you looking for?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute inset-y-2 right-2 flex items-center">
              <Button className="h-10 rounded-xl px-6 bg-primary hover:bg-primary/90">
                Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-8">
        {/* Categories Horizontal Scroll */}
        <div className="flex items-center gap-4 mb-10 overflow-x-auto pb-4 no-scrollbar">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
            className="rounded-full px-6 whitespace-nowrap"
          >
            All Services
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(cat.id)}
              className="rounded-full px-6 py-5 whitespace-nowrap gap-2
hover:scale-105 transition-all duration-300 shadow-sm">
              {(() => {
                const IconComponent = iconMap[cat.icon || ""];

                return IconComponent ? (
                  <IconComponent className="w-4 h-4" />
                ) : (
                  <span></span>
                );
              })()}
              {cat.name}
            </Button>
          ))}
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">
              {loading ? "Searching..." : `${filteredServices.length} Results`}
            </h2>
            {selectedCategory && (
              <Badge variant="secondary" className="gap-1 pl-2">
                Category Active
                <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCategory(null)} />
              </Badge>
            )}
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </Button>
        </div>

        {/* Services Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-80 w-full bg-slate-200 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : filteredServices.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredServices.map((service: any) => (
              <ServiceCard
                key={service.id}
                id={service.id}
                title={service.title}
                description={service.short_description || "Expert service provider"}
                price={service.price || 0}
                location={service.location_name || service.profiles?.city || "Remote"}

                // EDIT THESE TWO LINES:
                rating={service.calculated_rating || 0}
                reviews={service.calculated_count || 0}

                image={service.cover_image || "https://images.unsplash.com/photo-1521790797524-b2497295b8a0"}
                name={service.provider_profiles?.business_name || service.profiles?.full_name || "Provider"}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="text-slate-300 w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold">No services found</h3>
            <p className="text-slate-500">Try adjusting your search or category filters.</p>
            <Button variant="link" onClick={() => { setSearchQuery(""); setSelectedCategory(null); }}>
              Clear all filters
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
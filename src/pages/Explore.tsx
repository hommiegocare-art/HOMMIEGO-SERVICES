import { useEffect, useMemo, useState, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { ServiceCard } from "@/components/ServiceCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams } from "react-router-dom";
import {
  Search, SlidersHorizontal, MapPin, X, Bookmark, GraduationCap, FileText, FileCheck, Pill, Stethoscope,
  Heart, HeartHandshake, Users, PhoneCall, Mic, ShoppingBag, Package, Calendar, Sparkles, Settings, AlertCircle,
  Camera, Video, Wrench, Hammer, Key, Building2, Bug, Droplets, Flame, Fan, Shirt, Dumbbell, Paintbrush, Brush,
  PartyPopper, Trees, Dog, Utensils, Car, Truck, Wifi, Zap, Briefcase, Baby, MessageSquare, ShieldCheck,
  Clock, Award, Target, Globe, Phone, Mail, MapPin as MapPinIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// --- TYPES ---
interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  description?: string | null;
}

interface Service {
  id: string;
  title: string;
  short_description: string | null;
  description: string | null;
  price: number | null;
  cover_image: string | null;
  location_name: string | null;
  like_count?: number;
  is_liked_by_user?: boolean;
  is_favorited_by_user?: boolean;
  provider_id: string;
  categories: { id: string; name: string; slug: string; icon?: string | null } | null;
  profiles: { full_name: string | null; city: string | null; country: string | null } | null;
  provider_profiles?: {
    average_rating: number | null;
    total_reviews: number | null;
    business_name: string | null;
  };
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
    GraduationCap, FileText, FileCheck, Pill, Stethoscope, Heart, HeartHandshake, Users, PhoneCall,
    Mic, MessageSquare, ShoppingBag, Package, Calendar, Sparkles, Settings, AlertCircle, Camera, Video, Wrench,
    Hammer, Key, Building2, Bug, Droplets, Flame, Fan, Shirt, Dumbbell, Paintbrush, Brush, PartyPopper, Trees, Dog, Utensils,
    Car, Truck, Wifi, Zap, Briefcase, Baby, ShieldCheck, Clock, Award, Target, Globe, Phone, Mail, MapPinIcon
  };

  const [searchParams, setSearchParams] = useSearchParams();
  const filterParam = searchParams.get("filter");
  const categoryParam = searchParams.get("category");

  // AUTO SELECT CATEGORY FROM URL
  useEffect(() => {
    if (categoryParam && categories.length > 0) {
      const foundCategory = categories.find(
        (cat) => cat.slug === categoryParam
      );

      if (foundCategory) {
        setSelectedCategory(foundCategory.id);
      }
    }
  }, [categoryParam, categories]);

  useEffect(() => {
    const initialize = async () => {
      await Promise.all([fetchCategories(), fetchServices()]);
    };
    initialize();
  }, []);

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase.from("categories").select("*").order("name");
    if (data) setCategories(data);
  }, []);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      // Check cache first
      const cacheKey = 'explore_services';
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < 30000) {
          setServices(parsed.data);
          setLoading(false);
          return;
        }
      }

      const { data: { user } } = await supabase.auth.getUser();

      const { data: servicesData, error: sError } = await supabase
        .from("services")
        .select(`
        *,
        categories(id, name, slug, icon),
        profiles:profiles!services_provider_id_fkey(full_name, city, country),
        service_ratings:reviews(rating),
        likes:service_likes(user_id),
        favorites:service_favorites(user_id)
      `)
        .eq("is_active", true);

      if (sError) throw sError;

      const merged = servicesData?.map((service: any) => {
        const revs = service.service_ratings || [];
        const avg = revs.length > 0 ? revs.reduce((acc: any, r: any) => acc + r.rating, 0) / revs.length : 0;

        return {
          ...service,
          calculated_rating: avg,
          calculated_count: revs.length,
          like_count: service.likes?.length || 0,
          is_liked_by_user: service.likes?.some((l: any) => l.user_id === user?.id),
          is_favorited_by_user: service.favorites?.some((f: any) => f.user_id === user?.id)
        };
      });

      const servicesDataFinal = merged || [];
      sessionStorage.setItem(cacheKey, JSON.stringify({
        data: servicesDataFinal,
        timestamp: Date.now()
      }));

      setServices(servicesDataFinal);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const query = searchQuery.toLowerCase();

      const matchesSearch = !query ||
        s.title?.toLowerCase().includes(query) ||
        s.location_name?.toLowerCase().includes(query) ||
        s.short_description?.toLowerCase().includes(query) ||
        s.categories?.name?.toLowerCase().includes(query);

      const matchesCategory = !selectedCategory || s.categories?.id === selectedCategory;
      const matchesFavorites = filterParam === "favorites" ? s.is_favorited_by_user : true;

      return matchesSearch && matchesCategory && matchesFavorites;
    });
  }, [services, searchQuery, selectedCategory, filterParam]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300 overflow-x-hidden">
      <Navbar />

      {/* Hero / Search Section - Edge to Edge */}
      <section className="w-full pt-24 md:pt-28 pb-8 md:pb-12 bg-gradient-to-b from-primary/5 via-zinc-50 to-zinc-50 dark:from-primary/10 dark:via-zinc-950 dark:to-zinc-950 border-0 transition-colors">
        <div className="w-full px-4 md:px-6 max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 md:px-4 py-1.5 md:py-2 rounded-full mb-3 md:mb-4">
            <HeartHandshake className="w-3 h-3 md:w-4 md:h-4" />
            <span className="text-[10px] md:text-sm font-semibold whitespace-nowrap">Professional Home Nursing & Healthcare Services</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-2 md:mb-4 leading-tight">
            Find the Perfect <span className="text-primary">Healthcare Professional</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-zinc-600 dark:text-zinc-300 mb-6 md:mb-8 max-w-xl mx-auto px-2">
            Browse through licensed nurses and healthcare providers offering compassionate
            medical care at your doorstep. Quality healthcare, delivered to you.
          </p>

          <div className="max-w-3xl mx-auto relative group w-full px-0">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 md:h-5 md:w-5 text-zinc-400 dark:text-zinc-500 group-focus-within:text-primary transition-colors" />
            </div>
            <Input
              className="
                w-full h-11 md:h-14 pl-10 md:pl-12 pr-28 md:pr-32 rounded-2xl md:rounded-3xl
                border-zinc-200 dark:border-transparent
                bg-white dark:bg-zinc-800
                text-zinc-900 dark:text-white
                placeholder:text-zinc-400 dark:placeholder:text-zinc-500
                shadow-lg dark:shadow-black/20
                focus-visible:ring-primary
                text-sm md:text-lg
              "
              placeholder="Find nursing services, medication administration, elderly care..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute inset-y-1.5 md:inset-y-2 right-1.5 md:right-2 flex items-center">
              <Button className="h-8 md:h-10 rounded-xl md:rounded-2xl px-4 md:px-6 text-xs md:text-sm bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                Find Care
              </Button>
            </div>
          </div>

          {/* Quick Action Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 mt-4 md:mt-6 px-2">
            <Badge className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-transparent px-3 md:px-4 py-1.5 md:py-2 text-[10px] md:text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 rounded-full">
              <Clock className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1 md:mr-1.5 text-primary" />
              24/7 Availability
            </Badge>
            <Badge className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-transparent px-3 md:px-4 py-1.5 md:py-2 text-[10px] md:text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 rounded-full">
              <ShieldCheck className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1 md:mr-1.5 text-primary" />
              Licensed Nurses
            </Badge>
            <Badge className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-transparent px-3 md:px-4 py-1.5 md:py-2 text-[10px] md:text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 rounded-full">
              <Heart className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1 md:mr-1.5 text-primary" />
              Compassionate Care
            </Badge>
            <Badge className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-transparent px-3 md:px-4 py-1.5 md:py-2 text-[10px] md:text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 rounded-full">
              <MapPinIcon className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1 md:mr-1.5 text-primary" />
              Services Across Kenya
            </Badge>
          </div>
        </div>
      </section>

      <main className="w-full px-4 md:px-6 py-4 md:py-8 max-w-6xl mx-auto">
        {/* Categories Horizontal Scroll */}
        <div className="flex items-center gap-2 md:gap-4 mb-6 md:mb-10 overflow-x-auto pb-3 md:pb-4 no-scrollbar">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
            className="rounded-full px-4 md:px-6 whitespace-nowrap text-xs md:text-sm h-8 md:h-10"
          >
            All Services
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              onClick={() => {
                setSelectedCategory(cat.id);
                setSearchParams({
                  category: cat.slug,
                });
              }}
              className="
                rounded-full px-4 md:px-6 py-1.5 md:py-2.5 whitespace-nowrap gap-1.5 md:gap-2
                hover:scale-105 transition-all duration-300 shadow-sm
                bg-white dark:bg-zinc-800
                text-zinc-700 dark:text-zinc-200
                border border-zinc-200 dark:border-transparent
                hover:bg-zinc-100 dark:hover:bg-zinc-700/50
                text-xs md:text-sm h-8 md:h-10
              "
            >
              {(() => {
                const IconComponent = iconMap[cat.icon || ""];
                return IconComponent ? <IconComponent className="w-3 h-3 md:w-4 md:h-4" /> : <span></span>;
              })()}
              {cat.name}
            </Button>
          ))}
        </div>

        {/* Unified Results & Filter Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            {/* Total Count */}
            <div className="flex items-baseline gap-1">
              <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white">
                {loading ? "..." : filteredServices.length}
              </h2>
              <span className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-tight">
                {loading ? "Searching" : "Healthcare Services Available"}
              </span>
            </div>

            <div className="hidden md:block h-6 w-px bg-zinc-200 dark:bg-zinc-700 mx-2" />

            {/* Active Filter Badges Area */}
            <div className="flex flex-wrap gap-1.5 md:gap-2">
              {filterParam === "favorites" && (
                <Badge className="bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 border-rose-100 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-colors gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-full border shadow-sm animate-in fade-in slide-in-from-left-2 text-[10px] md:text-xs">
                  <Bookmark className="w-3 h-3 md:w-3.5 md:h-3.5 fill-current" />
                  <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">Saved Services</span>
                  <X
                    className="w-3 h-3 md:w-3.5 md:h-3.5 cursor-pointer hover:bg-rose-200 dark:hover:bg-rose-800/50 rounded-full transition-colors"
                    onClick={() => setSearchParams({})}
                  />
                </Badge>
              )}

              {selectedCategory && (
                <Badge className="bg-primary/5 text-primary border-primary/10 hover:bg-primary/10 dark:bg-primary/10 dark:border-primary/20 transition-colors gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-full border shadow-sm animate-in fade-in slide-in-from-left-2 text-[10px] md:text-xs">
                  <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">
                    {categories.find(c => c.id === selectedCategory)?.name || "Category"}
                  </span>
                  <X
                    className="w-3 h-3 md:w-3.5 md:h-3.5 cursor-pointer hover:bg-primary/10 rounded-full transition-colors"
                    onClick={() => {
                      setSelectedCategory(null);
                      setSearchParams({});
                    }}
                  />
                </Badge>
              )}

              {(filterParam === "favorites" || selectedCategory) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 md:h-8 px-1.5 md:px-2 text-[8px] md:text-[10px] font-bold text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white uppercase tracking-tighter"
                  onClick={() => {
                    setSelectedCategory(null);
                    setSearchParams({});
                  }}
                >
                  Reset Filters
                </Button>
              )}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="
              h-8 md:h-10 rounded-xl md:rounded-2xl px-3 md:px-5 gap-1.5 md:gap-2
              border-zinc-200 dark:border-transparent
              bg-white dark:bg-zinc-800
              text-zinc-700 dark:text-zinc-200
              hover:bg-zinc-100 dark:hover:bg-zinc-700/50
              shadow-sm transition-all font-semibold
              text-xs md:text-sm
            "
          >
            <SlidersHorizontal className="w-3 h-3 md:w-4 md:h-4 text-zinc-400 dark:text-zinc-500" />
            Sort & Filters
          </Button>
        </div>

        {/* Services Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="h-72 md:h-80 w-full bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-2xl md:rounded-3xl"
              />
            ))}
          </div>
        ) : filteredServices.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 pb-20 md:pb-24">
            {filteredServices.map((service: any) => (
              <ServiceCard
                key={service.id}
                id={service.id}
                title={service.title}
                description={service.short_description || "Professional healthcare service delivered with compassion and expertise"}
                price={service.price || 0}
                location={service.location_name || service.profiles?.city || "Service at your location"}
                rating={service.calculated_rating || 0}
                reviews={service.calculated_count || 0}
                initialIsLiked={service.is_liked_by_user}
                initialIsFavorited={service.is_favorited_by_user}
                likeCount={service.like_count}
                image={service.cover_image || "https://images.unsplash.com/photo-1584515933487-779824d29309?w=800"}
                name={service.provider_profiles?.business_name || service.profiles?.full_name || "Healthcare Provider"}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 md:py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-transparent shadow-sm">
            <div className="bg-zinc-50 dark:bg-zinc-800 w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
              <Search className="text-zinc-300 dark:text-zinc-500 w-6 h-6 md:w-8 md:h-8" />
            </div>
            <h3 className="text-base md:text-lg font-bold text-zinc-900 dark:text-white">No Healthcare Services Found</h3>
            <p className="text-sm md:text-base text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mt-1 md:mt-2 px-4">
              We couldn't find any services matching your criteria. Try adjusting your search or category filters.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 mt-4 md:mt-6">
              <Button
                variant="default"
                size="sm"
                className="text-xs md:text-sm rounded-xl"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory(null);
                }}
              >
                Clear all filters
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs md:text-sm rounded-xl"
                onClick={() => window.location.href = "/contact"}
              >
                <MessageSquare className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                Need help?
              </Button>
            </div>
          </div>
        )}

        {/* Medical Services Info Banner */}
        {filteredServices.length > 0 && (
          <div className="mt-8 md:mt-16 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 dark:from-primary/10 dark:via-primary/20 dark:to-primary/10 rounded-3xl p-4 md:p-8 border border-primary/10 dark:border-primary/20">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="bg-primary/10 dark:bg-primary/20 p-2.5 md:p-4 rounded-full">
                  <ShieldCheck className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-white text-sm md:text-lg">Trusted Healthcare at Your Doorstep</h3>
                  <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-300">
                    All healthcare providers are licensed, verified, and committed to delivering compassionate care.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 md:gap-6">
                <div className="text-center">
                  <div className="font-bold text-primary text-lg md:text-2xl">100%</div>
                  <div className="text-[10px] md:text-xs text-zinc-500 dark:text-zinc-400">Verified Nurses</div>
                </div>
                <div className="w-px bg-zinc-200 dark:bg-zinc-700" />
                <div className="text-center">
                  <div className="font-bold text-primary text-lg md:text-2xl">24/7</div>
                  <div className="text-[10px] md:text-xs text-zinc-500 dark:text-zinc-400">Availability</div>
                </div>
                <div className="w-px bg-zinc-200 dark:bg-zinc-700" />
                <div className="text-center">
                  <div className="font-bold text-primary text-lg md:text-2xl">⭐ 4.9</div>
                  <div className="text-[10px] md:text-xs text-zinc-500 dark:text-zinc-400">Patient Rating</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
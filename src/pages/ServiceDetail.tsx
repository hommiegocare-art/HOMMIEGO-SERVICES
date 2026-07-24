import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Star,
  MessageCircle,
  Share2,
  Stethoscope,
  Clock,
  Calendar,
  Shield,
  Heart,
  Building2,
  User,
  Users,
  Briefcase,
  CheckCircle,
  BadgeCheck,
  Home,
  HeartPulse,
  ArrowLeft,
  Skeleton
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { format } from "date-fns";

// --- Types ---
interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  patient: {
    full_name: string;
    avatar_url?: string;
  } | null;
}

interface ServiceDetail {
  id: string;
  title: string;
  description: string;
  price: number;
  cover_image: string;
  location_name: string;
  provider_id: string;
  workspace_id: string;
  provider_profiles: {
    business_name: string;
    professional_title: string | null;
    average_rating: number | null;
    total_reviews: number | null;
    verification_status: string;
  } | null;
  profiles: {
    full_name: string;
    avatar_url: string | null;
    city: string | null;
  } | null;
  workspaces: {
    name: string;
    type: string;
    verification_status: string;
  } | null;
  categories: {
    name: string;
    icon?: string | null;
  } | null;
}

// --- Skeleton Components ---
const SkeletonImage = () => (
  <div className="w-full h-full rounded-3xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
);

const SkeletonText = ({ className = "h-4" }: { className?: string }) => (
  <div className={`${className} bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse`} />
);

const SkeletonBadge = () => (
  <div className="h-8 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse" />
);

const SkeletonFeature = () => (
  <div className="flex items-center gap-2 bg-zinc-200 dark:bg-zinc-800 p-3 rounded-xl animate-pulse h-12" />
);

const SkeletonReview = () => (
  <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl border border-zinc-100 dark:border-transparent">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
      <div className="flex-1">
        <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
        <div className="flex gap-1 mt-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-4 h-4 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
    <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
    <div className="h-4 w-3/4 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mt-2" />
  </div>
);

// --- Main Component ---
export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  const abortControllerRef = useRef<AbortController | null>(null);

  const [service, setService] = useState<ServiceDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Cache key for service data ---
  const cacheKey = useMemo(() => `service_${id}`, [id]);

  // --- Get workspace icon (memoized) ---
  const getWorkspaceIcon = useCallback((type: string) => {
    const icons = {
      individual: <User className="w-4 h-4" />,
      family: <Home className="w-4 h-4" />,
      organization: <Building2 className="w-4 h-4" />,
      agency: <Briefcase className="w-4 h-4" />,
    };
    return icons[type as keyof typeof icons] || <Building2 className="w-4 h-4" />;
  }, []);

  // --- Get workspace type label (memoized) ---
  const getWorkspaceTypeLabel = useCallback((type: string) => {
    const labels = {
      individual: 'Independent Provider',
      family: 'Family Care',
      organization: 'Healthcare Organization',
      agency: 'Healthcare Agency',
    };
    return labels[type as keyof typeof labels] || 'Healthcare Provider';
  }, []);

  // --- Check if favorite ---
  const checkIfFavorite = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const favCacheKey = `fav_${id}_${session.user.id}`;
      const cached = sessionStorage.getItem(favCacheKey);
      if (cached) {
        setIsFavorite(JSON.parse(cached));
        return;
      }

      const { data } = await supabase
        .from("service_favorites")
        .select("id")
        .eq("service_id", id)
        .eq("user_id", session.user.id)
        .maybeSingle();

      const isFav = !!data;
      setIsFavorite(isFav);
      sessionStorage.setItem(favCacheKey, JSON.stringify(isFav));
    } catch (error) {
      // Not favorited
    }
  }, [id]);

  // --- Toggle favorite ---
  const toggleFavorite = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Login Required",
          description: "Please sign in to save this service.",
          variant: "destructive",
        });
        return;
      }

      if (isFavorite) {
        await supabase
          .from("service_favorites")
          .delete()
          .eq("service_id", id)
          .eq("user_id", session.user.id);
        setIsFavorite(false);
        sessionStorage.removeItem(`fav_${id}_${session.user.id}`);
        toast({ title: "Removed from favorites" });
      } else {
        await supabase
          .from("service_favorites")
          .insert({ service_id: id, user_id: session.user.id });
        setIsFavorite(true);
        sessionStorage.setItem(`fav_${id}_${session.user.id}`, JSON.stringify(true));
        toast({ title: "Added to favorites!" });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [id, isFavorite, toast]);

  // --- Fetch service data ---
  const fetchServiceAndReviews = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      // Check cache
      const cachedData = sessionStorage.getItem(cacheKey);
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          setService(parsed.service);
          setReviews(parsed.reviews || []);
          setLoading(false);
          // Still fetch fresh data in background
          fetchFreshData();
          return;
        } catch (e) {
          // Cache parse error, continue with fetch
        }
      }

      await fetchFreshData();

    } catch (error: any) {
      if (error.name === 'AbortError') {
        return;
      }
      console.error("Error:", error);
      setError("Failed to load service details");
      toast({ variant: "destructive", title: "Error loading service details" });
    } finally {
      setLoading(false);
    }
  }, [id, cacheKey, toast]);

  // --- Fetch fresh data from API ---
  const fetchFreshData = useCallback(async () => {
    // 1. Fetch Service Data
    const { data: sData, error: sError } = await supabase
      .from("services")
      .select(`
        *,
        profiles!services_provider_id_fkey (
          full_name,
          avatar_url,
          city,
          provider_profiles!user_id (
            business_name,
            professional_title,
            average_rating,
            total_reviews,
            verification_status
          )
        ),
        workspaces!services_workspace_id_fkey (
          name,
          type,
          verification_status
        ),
        categories (
          name,
          icon
        )
      `)
      .eq("id", id)
      .maybeSingle();

    if (sError) {
      console.error("Service fetch error:", sError);
      throw sError;
    }

    if (!sData) {
      setError("Service not found");
      setLoading(false);
      return;
    }

    const transformedService = {
      ...sData,
      provider_profiles: sData.profiles?.provider_profiles || null,
      profiles: {
        full_name: sData.profiles?.full_name || null,
        avatar_url: sData.profiles?.avatar_url || null,
        city: sData.profiles?.city || null
      }
    };

    setService(transformedService as any);

    // 2. Fetch Reviews - FIXED: Use customer_id instead of patient_id
    const { data: rData, error: rError } = await supabase
      .from("reviews")
      .select(`
        id,
        rating,
        comment,
        created_at,
        customer_id
      `)
      .eq("service_id", id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (rError) {
      console.error("Reviews fetch error:", rError);
      setReviews([]);
    } else {
      // Get customer profiles separately
      const customerIds = (rData || []).map(r => r.customer_id).filter(Boolean);
      let customers: any[] = [];

      if (customerIds.length > 0) {
        const { data: customerData } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", customerIds);
        customers = customerData || [];
      }

      // Merge reviews with customer data
      const mergedReviews = (rData || []).map((review: any) => ({
        ...review,
        patient: customers.find(c => c.id === review.customer_id) || null
      }));

      setReviews(mergedReviews as any);
    }

    // Cache the data
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify({
        service: transformedService,
        reviews: rData || []
      }));
    } catch (e) {
      // Cache storage error
    }

  }, [id, cacheKey]);

  // --- Initialize ---
  useEffect(() => {
    if (id) {
      fetchServiceAndReviews();
      checkIfFavorite();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [id, fetchServiceAndReviews, checkIfFavorite]);

  // --- Memoized values ---
  const avgRating = useMemo(() => {
    if (reviews.length === 0) return "0.0";
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  const isVerified = useMemo(() =>
    service?.workspaces?.verification_status === 'verified',
    [service]
  );

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link copied!", description: "Service link copied to clipboard" });
  }, [toast]);

  // --- Render Skeleton ---
  if (loading && !service) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
        <Navbar />
        <div className="w-full pt-20 md:pt-24">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
            <div className="flex items-center gap-2">
              <SkeletonText className="h-10 w-24" />
            </div>
          </div>

          {/* Skeleton Content */}
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            {/* Desktop Skeleton */}
            <div className="hidden md:grid md:grid-cols-2 gap-8 lg:gap-12">
              <div className="relative sticky top-28 h-[calc(100vh-8rem)]">
                <SkeletonImage />
              </div>
              <div className="space-y-6 pb-16">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                  <div className="flex-1">
                    <SkeletonText className="h-6 w-48" />
                    <SkeletonText className="h-4 w-32 mt-2" />
                    <SkeletonText className="h-4 w-40 mt-1" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <SkeletonBadge />
                  <SkeletonBadge />
                </div>
                <SkeletonText className="h-10 w-3/4" />
                <SkeletonText className="h-6 w-1/2" />
                <SkeletonText className="h-20 w-full" />
                <div className="grid grid-cols-2 gap-3">
                  {[...Array(4)].map((_, i) => (
                    <SkeletonFeature key={i} />
                  ))}
                </div>
                <div className="h-24 bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />
                <div className="flex gap-3">
                  <div className="flex-1 h-14 bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />
                  <div className="w-14 h-14 bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />
                  <div className="w-14 h-14 bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />
                </div>
              </div>
            </div>

            {/* Mobile Skeleton */}
            <div className="md:hidden space-y-6 pb-16">
              <div className="w-full h-72 rounded-3xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="flex-1">
                  <SkeletonText className="h-6 w-40" />
                  <SkeletonText className="h-4 w-28 mt-2" />
                  <SkeletonText className="h-4 w-36 mt-1" />
                </div>
              </div>
              <div className="flex gap-2">
                <SkeletonBadge />
                <SkeletonBadge />
              </div>
              <SkeletonText className="h-8 w-3/4" />
              <SkeletonText className="h-5 w-1/2" />
              <SkeletonText className="h-16 w-full" />
              <div className="grid grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => (
                  <SkeletonFeature key={i} />
                ))}
              </div>
              <div className="h-20 bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />
              <div className="flex gap-3">
                <div className="flex-1 h-14 bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />
                <div className="w-14 h-14 bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />
                <div className="w-14 h-14 bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <Navbar />
        <div className="pt-24 px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Service Not Found</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mb-6">The service you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate("/explore")}>Back to Explore</Button>
        </div>
      </div>
    );
  }

  // --- Main Render ---
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
      <Navbar />

      <div className="w-full pt-20 md:pt-24">
        {/* Back Button */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <Button
            variant="ghost"
            className="gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-xl"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          {/* Desktop Layout */}
          <div className="hidden md:grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Left: Image */}
            <div className="relative sticky top-28 h-[calc(100vh-8rem)]">
              <div className="relative w-full h-full rounded-3xl overflow-hidden bg-zinc-200 dark:bg-zinc-800">
                <img
                  src={service.cover_image || "https://images.unsplash.com/photo-1584515933487-779824d29309?w=800"}
                  alt={service.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                {service.workspaces && (
                  <Badge className="absolute bottom-4 left-4 bg-black/70 text-white border-0 flex items-center gap-1.5 px-3 py-1.5">
                    {getWorkspaceIcon(service.workspaces.type)}
                    <span className="text-xs font-medium">{service.workspaces.name}</span>
                    {isVerified && (
                      <BadgeCheck className="w-3 h-3 text-emerald-400" />
                    )}
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="icon"
                  className={`absolute top-4 right-4 rounded-full bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:scale-105 transition-transform ${isFavorite ? 'text-rose-500 bg-rose-50' : 'text-slate-400'
                    }`}
                  onClick={toggleFavorite}
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                </Button>
              </div>
            </div>

            {/* Right: Content */}
            <div className="space-y-6 pb-16">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xl">
                  {service.provider_profiles?.business_name?.[0] || service.profiles?.full_name?.[0] || "P"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-zinc-900 dark:text-white">
                      {service.provider_profiles?.business_name || service.profiles?.full_name || "Healthcare Provider"}
                    </h3>
                    {isVerified && (
                      <BadgeCheck className="w-4 h-4 text-emerald-500" />
                    )}
                  </div>
                  {service.provider_profiles?.professional_title && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {service.provider_profiles.professional_title}
                    </p>
                  )}
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-zinc-700 dark:text-zinc-300">{avgRating}</span>
                    <span className="text-zinc-500 dark:text-zinc-400">({reviews.length} patient reviews)</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {service.workspaces && (
                  <Badge className="bg-primary/10 text-primary border-0 flex items-center gap-1.5 rounded-full px-3 py-1.5">
                    {getWorkspaceIcon(service.workspaces.type)}
                    <span className="text-xs font-medium">
                      {getWorkspaceTypeLabel(service.workspaces.type)}
                    </span>
                  </Badge>
                )}
                {service.categories && (
                  <Badge className="bg-primary/10 text-primary border-0 flex items-center gap-1.5 rounded-full px-3 py-1.5">
                    <Stethoscope className="w-3 h-3" />
                    <span className="text-xs font-medium">{service.categories.name}</span>
                  </Badge>
                )}
              </div>

              <h1 className="text-3xl lg:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                {service.title}
              </h1>

              <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                <MapPin className="w-5 h-5 text-primary" />
                <span className="text-lg">{service.location_name || "Service at your location"}</span>
              </div>

              <p className="text-zinc-600 dark:text-zinc-300 text-base leading-relaxed">
                {service.description || "Professional healthcare service provided by licensed professionals."}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm bg-white dark:bg-zinc-800 p-3 rounded-xl border border-zinc-100 dark:border-transparent">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-zinc-600 dark:text-zinc-300">Flexible scheduling</span>
                </div>
                <div className="flex items-center gap-2 text-sm bg-white dark:bg-zinc-800 p-3 rounded-xl border border-zinc-100 dark:border-transparent">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="text-zinc-600 dark:text-zinc-300">Licensed professional</span>
                </div>
                <div className="flex items-center gap-2 text-sm bg-white dark:bg-zinc-800 p-3 rounded-xl border border-zinc-100 dark:border-transparent">
                  <Heart className="w-4 h-4 text-primary" />
                  <span className="text-zinc-600 dark:text-zinc-300">Compassionate care</span>
                </div>
                <div className="flex items-center gap-2 text-sm bg-white dark:bg-zinc-800 p-3 rounded-xl border border-zinc-100 dark:border-transparent">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="text-zinc-600 dark:text-zinc-300">24/7 availability</span>
                </div>
              </div>

              <Card className="p-6 border-0 bg-white dark:bg-zinc-800 shadow-sm rounded-2xl">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 dark:text-zinc-400 font-medium">Service Fee</span>
                  <span className="text-3xl font-black text-primary">
                    KES {service.price.toLocaleString()}
                  </span>
                </div>
              </Card>

              <div className="flex gap-3">
                <Button
                  size="lg"
                  className="flex-1 rounded-2xl h-14 text-base font-bold"
                  onClick={() => navigate(`/booking/${service.id}`)}
                >
                  Book Service
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-2xl h-14 w-14 p-0 border-zinc-200 dark:border-transparent"
                  onClick={() => navigate(`/chat/${service.id}`)}
                >
                  <MessageCircle className="w-5 h-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-2xl h-14 w-14 p-0 border-zinc-200 dark:border-transparent"
                  onClick={handleShare}
                >
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>

              <div className="text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-transparent">
                <p>⚠️ Medical Disclaimer: This service is provided by licensed healthcare professionals. In case of emergency, please call 911 or visit your nearest hospital.</p>
              </div>

              {service.workspaces && (
                <div className="bg-white dark:bg-zinc-800 p-4 rounded-2xl border border-zinc-100 dark:border-transparent">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {getWorkspaceIcon(service.workspaces.type)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">
                        Provided by {service.workspaces.name}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                        {getWorkspaceTypeLabel(service.workspaces.type)}
                        {isVerified && (
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle className="w-3 h-3" />
                            Verified
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden space-y-6 pb-16">
            <div className="relative w-full h-72 rounded-3xl overflow-hidden bg-zinc-200 dark:bg-zinc-800">
              <img
                src={service.cover_image || "https://images.unsplash.com/photo-1584515933487-779824d29309?w=800"}
                alt={service.title}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
              {service.workspaces && (
                <Badge className="absolute bottom-4 left-4 bg-black/70 text-white border-0 flex items-center gap-1.5 px-3 py-1.5">
                  {getWorkspaceIcon(service.workspaces.type)}
                  <span className="text-xs font-medium">{service.workspaces.name}</span>
                  {isVerified && (
                    <BadgeCheck className="w-3 h-3 text-emerald-400" />
                  )}
                </Badge>
              )}
              <Button
                variant="outline"
                size="icon"
                className={`absolute top-4 right-4 rounded-full bg-white/90 backdrop-blur-sm border-0 shadow-lg ${isFavorite ? 'text-rose-500 bg-rose-50' : 'text-slate-400'
                  }`}
                onClick={toggleFavorite}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xl">
                {service.provider_profiles?.business_name?.[0] || service.profiles?.full_name?.[0] || "P"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-zinc-900 dark:text-white">
                    {service.provider_profiles?.business_name || service.profiles?.full_name || "Healthcare Provider"}
                  </h3>
                  {isVerified && (
                    <BadgeCheck className="w-4 h-4 text-emerald-500" />
                  )}
                </div>
                {service.provider_profiles?.professional_title && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {service.provider_profiles.professional_title}
                  </p>
                )}
                <div className="flex items-center gap-1 text-sm">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold text-zinc-700 dark:text-zinc-300">{avgRating}</span>
                  <span className="text-zinc-500 dark:text-zinc-400">({reviews.length} patient reviews)</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {service.workspaces && (
                <Badge className="bg-primary/10 text-primary border-0 flex items-center gap-1.5 rounded-full px-3 py-1.5">
                  {getWorkspaceIcon(service.workspaces.type)}
                  <span className="text-xs font-medium">
                    {getWorkspaceTypeLabel(service.workspaces.type)}
                  </span>
                </Badge>
              )}
              {service.categories && (
                <Badge className="bg-primary/10 text-primary border-0 flex items-center gap-1.5 rounded-full px-3 py-1.5">
                  <Stethoscope className="w-3 h-3" />
                  <span className="text-xs font-medium">{service.categories.name}</span>
                </Badge>
              )}
            </div>

            <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              {service.title}
            </h1>

            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
              <MapPin className="w-5 h-5 text-primary" />
              <span>{service.location_name || "Service at your location"}</span>
            </div>

            <p className="text-zinc-600 dark:text-zinc-300 text-base leading-relaxed">
              {service.description || "Professional healthcare service provided by licensed professionals."}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm bg-white dark:bg-zinc-800 p-3 rounded-xl border border-zinc-100 dark:border-transparent">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-zinc-600 dark:text-zinc-300">Flexible scheduling</span>
              </div>
              <div className="flex items-center gap-2 text-sm bg-white dark:bg-zinc-800 p-3 rounded-xl border border-zinc-100 dark:border-transparent">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-zinc-600 dark:text-zinc-300">Licensed professional</span>
              </div>
              <div className="flex items-center gap-2 text-sm bg-white dark:bg-zinc-800 p-3 rounded-xl border border-zinc-100 dark:border-transparent">
                <Heart className="w-4 h-4 text-primary" />
                <span className="text-zinc-600 dark:text-zinc-300">Compassionate care</span>
              </div>
              <div className="flex items-center gap-2 text-sm bg-white dark:bg-zinc-800 p-3 rounded-xl border border-zinc-100 dark:border-transparent">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-zinc-600 dark:text-zinc-300">24/7 availability</span>
              </div>
            </div>

            <Card className="p-6 border-0 bg-white dark:bg-zinc-800 shadow-sm rounded-2xl">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">Service Fee</span>
                <span className="text-3xl font-black text-primary">
                  KES {service.price.toLocaleString()}
                </span>
              </div>
            </Card>

            <div className="flex gap-3">
              <Button
                size="lg"
                className="flex-1 rounded-2xl h-14 text-base font-bold"
                onClick={() => navigate(`/booking/${service.id}`)}
              >
                Book Service
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-2xl h-14 w-14 p-0 border-zinc-200 dark:border-transparent"
                onClick={() => navigate(`/chat/${service.id}`)}
              >
                <MessageCircle className="w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-2xl h-14 w-14 p-0 border-zinc-200 dark:border-transparent"
                onClick={handleShare}
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </div>

            <div className="text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-transparent">
              <p>⚠️ Medical Disclaimer: This service is provided by licensed healthcare professionals. In case of emergency, please call 911 or visit your nearest hospital.</p>
            </div>

            {service.workspaces && (
              <div className="bg-white dark:bg-zinc-800 p-4 rounded-2xl border border-zinc-100 dark:border-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {getWorkspaceIcon(service.workspaces.type)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">
                      Provided by {service.workspaces.name}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                      {getWorkspaceTypeLabel(service.workspaces.type)}
                      {isVerified && (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle className="w-3 h-3" />
                          Verified
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Reviews - Mobile */}
            <Separator className="my-4" />

            <div>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-zinc-900 dark:text-white">
                Patient Reviews
                <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md">
                  {reviews.length}
                </span>
              </h2>

              {reviews.length === 0 ? (
                <div className="bg-white dark:bg-zinc-800 rounded-2xl p-8 text-center border border-zinc-100 dark:border-transparent">
                  <p className="text-zinc-500 dark:text-zinc-400">No patient reviews yet for this healthcare service.</p>
                  <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-2">Be the first to share your experience</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="bg-white dark:bg-zinc-800 p-5 rounded-2xl border border-zinc-100 dark:border-transparent">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-sm font-bold text-zinc-700 dark:text-zinc-300">
                            {review.patient?.full_name?.[0] || "P"}
                          </div>
                          <div>
                            <p className="font-bold text-zinc-900 dark:text-white">{review.patient?.full_name || "Patient"}</p>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-zinc-300 dark:text-zinc-600"}`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-sm text-zinc-400">
                          {format(new Date(review.created_at), "MMM d, yyyy")}
                        </span>
                      </div>
                      <p className="text-zinc-600 dark:text-zinc-300">
                        {review.comment}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section - Desktop */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 pb-16">
          <div className="hidden md:block">
            <Separator className="my-12" />

            <div className="max-w-4xl">
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-2 text-zinc-900 dark:text-white">
                Patient Reviews
                <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md">
                  {reviews.length}
                </span>
              </h2>

              {reviews.length === 0 ? (
                <div className="bg-white dark:bg-zinc-800 rounded-2xl p-8 text-center border border-zinc-100 dark:border-transparent">
                  <p className="text-zinc-500 dark:text-zinc-400">No patient reviews yet for this healthcare service.</p>
                  <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-2">Be the first to share your experience</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {reviews.map((review) => (
                    <div key={review.id} className="bg-white dark:bg-zinc-800 p-6 rounded-2xl border border-zinc-100 dark:border-transparent">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-sm font-bold text-zinc-700 dark:text-zinc-300">
                            {review.patient?.full_name?.[0] || "P"}
                          </div>
                          <div>
                            <p className="font-bold text-zinc-900 dark:text-white">{review.patient?.full_name || "Patient"}</p>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-zinc-300 dark:text-zinc-600"}`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-sm text-zinc-400">
                          {format(new Date(review.created_at), "MMM d, yyyy")}
                        </span>
                      </div>
                      <p className="text-zinc-600 dark:text-zinc-300">
                        {review.comment}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Why Choose Section */}
            <Separator className="my-12" />

            <div className="max-w-4xl bg-primary/5 dark:bg-primary/10 p-8 rounded-3xl">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-zinc-900 dark:text-white">
                <Shield className="w-5 h-5 text-primary" />
                Why Choose HommieCare Medical?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">Licensed and verified healthcare professionals</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">Compassionate care delivered at your doorstep</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">Flexible scheduling to fit your needs</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">Secure M-Pesa payments and transparent pricing</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MapPin, Star, MessageCircle, Share2, Loader2, Stethoscope, Clock, Calendar, Shield, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  };
}

interface ServiceDetail {
  id: string;
  title: string;
  description: string;
  price: number;
  cover_image: string;
  location_name: string;
  provider_profiles: {
    business_name: string;
  } | null;
  profiles: {
    full_name: string;
  } | null;
  categories: {
    name: string;
    icon?: string | null;
  } | null;
}

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [service, setService] = useState<ServiceDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchServiceAndReviews();
    }
  }, [id]);

  async function fetchServiceAndReviews() {
    try {
      setLoading(true);

      // 1. Fetch Service Data with Category
      const { data: sData, error: sError } = await supabase
        .from("services")
        .select(`
          id, title, description, price, cover_image, location_name,
          provider_profiles:provider_id(business_name),
          profiles:provider_id(full_name),
          categories (name, icon)
        `)
        .eq("id", id)
        .single();

      if (sError) throw sError;
      setService(sData as any);

      // 2. Fetch Reviews and Patient Profiles
      const { data: rData, error: rError } = await supabase
        .from("reviews")
        .select(`
          id, rating, comment, created_at,
          patient:patient_id(full_name, avatar_url)
        `)
        .eq("service_id", id)
        .order("created_at", { ascending: false });

      if (rError) throw rError;
      setReviews((rData as any) || []);

    } catch (error) {
      console.error("Error:", error);
      toast({ variant: "destructive", title: "Error loading service details" });
    } finally {
      setLoading(false);
    }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link copied!", description: "Service link copied to clipboard" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Service Not Found</h1>
          <Button onClick={() => navigate("/explore")}>Back to Explore</Button>
        </div>
      </div>
    );
  }

  // Calculate average rating from fetched reviews
  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : "0.0";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 mb-12">
            {/* Left: Image */}
            <div>
              <img
                src={service.cover_image || "https://images.unsplash.com/photo-1584515933487-779824d29309?w=800"}
                alt={service.title}
                className="w-full h-[450px] object-cover rounded-3xl shadow-xl"
              />
            </div>

            {/* Right: Info */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                  {service.provider_profiles?.business_name?.[0] || service.profiles?.full_name?.[0] || "N"}
                </div>
                <div>
                  <h3 className="font-bold text-lg">
                    {service.provider_profiles?.business_name || service.profiles?.full_name || "Healthcare Provider"}
                  </h3>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold">{avgRating}</span>
                    <span className="text-muted-foreground">({reviews.length} patient reviews)</span>
                  </div>
                </div>
              </div>

              {/* Category Badge */}
              {service.categories && (
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full mb-4 text-sm font-medium">
                  <Stethoscope className="w-4 h-4" />
                  {service.categories.name}
                </div>
              )}

              <h1 className="text-4xl font-extrabold mb-4 tracking-tight">{service.title}</h1>

              <div className="flex items-center gap-2 text-muted-foreground mb-6">
                <MapPin className="w-5 h-5 text-primary" />
                <span className="text-lg">{service.location_name || "Service at your location"}</span>
              </div>

              <p className="text-slate-600 text-lg leading-relaxed mb-8">
                {service.description || "Professional medical care provided by licensed healthcare professionals."}
              </p>

              {/* Medical Service Features */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                <div className="flex items-center gap-2 text-sm bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-slate-600 dark:text-slate-300">Flexible scheduling</span>
                </div>
                <div className="flex items-center gap-2 text-sm bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="text-slate-600 dark:text-slate-300">Licensed professional</span>
                </div>
                <div className="flex items-center gap-2 text-sm bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                  <Heart className="w-4 h-4 text-primary" />
                  <span className="text-slate-600 dark:text-slate-300">Compassionate care</span>
                </div>
                <div className="flex items-center gap-2 text-sm bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="text-slate-600 dark:text-slate-300">24/7 availability</span>
                </div>
              </div>

              <Card className="p-6 mb-8 border-none bg-slate-50 dark:bg-slate-800">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Service Fee</span>
                  <span className="text-3xl font-black text-slate-900 dark:text-white">
                    KES {service.price.toLocaleString()}
                  </span>
                </div>
              </Card>

              <div className="flex gap-4">
                <Button
                  size="lg"
                  className="flex-1 rounded-2xl h-14 text-lg font-bold"
                  onClick={() => navigate(`/booking/${service.id}`)}
                >
                  Book Nursing Service
                </Button>
                <Button size="lg" variant="outline" className="rounded-2xl h-14 w-14 p-0" onClick={() => navigate(`/chat/${service.id}`)}>
                  <MessageCircle className="w-6 h-6" />
                </Button>
                <Button size="lg" variant="outline" className="rounded-2xl h-14 w-14 p-0" onClick={handleShare}>
                  <Share2 className="w-6 h-6" />
                </Button>
              </div>

              {/* Medical Disclaimer */}
              <div className="mt-6 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                <p>⚠️ Medical Disclaimer: This service is provided by licensed healthcare professionals. In case of emergency, please call 911 or visit your nearest hospital.</p>
              </div>
            </div>
          </div>

          <Separator className="my-12" />

          {/* --- REVIEWS SECTION --- */}
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
              Patient Reviews
              <span className="text-sm font-normal text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                {reviews.length}
              </span>
            </h2>

            {reviews.length === 0 ? (
              <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-8 text-center border border-dashed dark:border-slate-700">
                <p className="text-muted-foreground">No patient reviews yet for this medical service.</p>
                <p className="text-sm text-slate-400 mt-2">Be the first to share your experience</p>
              </div>
            ) : (
              <div className="space-y-8">
                {reviews.map((review) => (
                  <div key={review.id} className="group bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-700 dark:text-slate-300">
                          {review.patient?.full_name?.[0] || "P"}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{review.patient?.full_name || "Patient"}</p>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-300 dark:text-slate-600"}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-sm text-slate-400">
                        {format(new Date(review.created_at), "MMM d, yyyy")}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 ml-13">
                      {review.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* --- RELATED INFORMATION --- */}
          <Separator className="my-12" />

          <div className="max-w-3xl bg-primary/5 dark:bg-primary/10 p-8 rounded-3xl">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Why Choose HommieCare Medical?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <p className="text-sm text-slate-600 dark:text-slate-300">Licensed and verified healthcare professionals</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <p className="text-sm text-slate-600 dark:text-slate-300">Compassionate care delivered at your doorstep</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <p className="text-sm text-slate-600 dark:text-slate-300">Flexible scheduling to fit your needs</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <p className="text-sm text-slate-600 dark:text-slate-300">Secure M-Pesa payments and transparent pricing</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
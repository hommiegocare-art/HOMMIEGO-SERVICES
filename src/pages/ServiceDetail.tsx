import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MapPin, Star, MessageCircle, Share2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// --- Types ---
interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  customer: {
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

      // 1. Fetch Service Data
      const { data: sData, error: sError } = await supabase
        .from("services")
        .select(`
          id, title, description, price, cover_image, location_name,
          provider_profiles:provider_id(business_name),
          profiles:provider_id(full_name)
        `)
        .eq("id", id)
        .single();

      if (sError) throw sError;
      setService(sData as any);

      // 2. Fetch Reviews and Customer Profiles
      const { data: rData, error: rError } = await supabase
        .from("reviews")
        .select(`
          id, rating, comment, created_at,
          customer:customer_id(full_name, avatar_url)
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
                src={service.cover_image || "https://images.unsplash.com/photo-1521790797524-b2497295b8a0"}
                alt={service.title}
                className="w-full h-[450px] object-cover rounded-3xl shadow-xl"
              />
            </div>

            {/* Right: Info */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                  {service.provider_profiles?.business_name?.[0] || service.profiles?.full_name?.[0]}
                </div>
                <div>
                  <h3 className="font-bold text-lg">
                    {service.provider_profiles?.business_name || service.profiles?.full_name}
                  </h3>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold">{avgRating}</span>
                    <span className="text-muted-foreground">({reviews.length} reviews)</span>
                  </div>
                </div>
              </div>

              <h1 className="text-4xl font-extrabold mb-4 tracking-tight">{service.title}</h1>

              <div className="flex items-center gap-2 text-muted-foreground mb-6">
                <MapPin className="w-5 h-5 text-primary" />
                <span className="text-lg">{service.location_name}</span>
              </div>

              <p className="text-slate-600 text-lg leading-relaxed mb-8">
                {service.description}
              </p>

              <Card className="p-6 mb-8 border-none bg-slate-50">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Service Fee</span>
                  <span className="text-3xl font-black text-slate-900">
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
                  Book Now
                </Button>
                <Button size="lg" variant="outline" className="rounded-2xl h-14 w-14 p-0" onClick={() => navigate(`/chat/${service.id}`)}>
                  <MessageCircle className="w-6 h-6" />
                </Button>
                <Button size="lg" variant="outline" className="rounded-2xl h-14 w-14 p-0" onClick={handleShare}>
                  <Share2 className="w-6 h-6" />
                </Button>
              </div>
            </div>
          </div>

          <Separator className="my-12" />

          {/* --- REVIEWS SECTION --- */}
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
              Customer Reviews
              <span className="text-sm font-normal text-muted-foreground bg-slate-100 px-2 py-1 rounded-md">
                {reviews.length}
              </span>
            </h2>

            {reviews.length === 0 ? (
              <div className="bg-slate-50 rounded-2xl p-8 text-center border border-dashed">
                <p className="text-muted-foreground">No reviews yet for this service.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {reviews.map((review) => (
                  <div key={review.id} className="group">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold">
                          {review.customer?.full_name?.[0] || "C"}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{review.customer?.full_name || "Customer"}</p>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-300"}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-sm text-slate-400">
                        {format(new Date(review.created_at), "MMM d, yyyy")}
                      </span>
                    </div>
                    <p className="text-slate-600 ml-13 pl-13">
                      {review.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
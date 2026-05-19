import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { HommieLoader } from "@/components/HommieLoader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Loader2, MapPin, Star, Calendar, Clock,
  ArrowLeft, ShieldCheck, Smartphone, CheckCircle2,
  MessageSquare // Added icon
} from "lucide-react";
import { format } from "date-fns"; // To format review dates

// Add Review to your Types
interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  customer: {
    full_name: string;
  } | null;
}
// --- Types ---
interface Service {
  id: string;
  provider_id: string;
  title: string;
  short_description: string | null;
  description: string | null;      // ADDED
  price: number;
  pricing_type: string | null;    // ADDED
  cover_image: string | null;
  location_name: string | null;
  categories: { id: string; name: string; icon: string | null } | null;
  profiles: { id: string; full_name: string | null; avatar_url: string | null } | null;
  provider_profile?: {
    average_rating: number | null;
    total_reviews: number | null;
    business_name: string | null;
    is_available: boolean | null;
  };
}
export default function Booking() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [creatingBooking, setCreatingBooking] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [whatsapp, setWhatsapp] = useState("");
  // Form State
  const [bookingDate, setBookingDate] = useState("");
  const [notes, setNotes] = useState("");
  const [reviewCount, setReviewCount] = useState(0);
  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [phone, setPhone] = useState("");
  const [paymentStep, setPaymentStep] = useState<"input" | "processing" | "success">("input");
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  useEffect(() => {
    initializePage();
  }, [serviceId]);


  // NEW: Function to fetch reviews when user clicks "See Reviews"
  async function fetchReviews() {
    try {
      setLoadingReviews(true);
      setShowReviewsModal(true);

      const { data, error } = await supabase
        .from("reviews")
        .select(`
          id, rating, comment, created_at,
          customer:customer_id(full_name)
        `)
        .eq("service_id", serviceId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReviews(data as any || []);
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setLoadingReviews(false);
    }
  }
  async function initializePage() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      setUserId(session.user.id);

      // 1. Fetch Service Data
      const { data: serviceData, error: sError } = await supabase
        .from("services")
        .select(`*, categories (id, name, icon), profiles!services_provider_id_fkey (id, full_name, avatar_url)`)
        .eq("id", serviceId)
        .single();

      if (sError) throw sError;

      // 2. Fetch Provider Data
      const { data: providerData } = await supabase
        .from("provider_profiles")
        .select(`average_rating, business_name, is_available`)
        .eq("user_id", serviceData.provider_id)
        .single();

      // 3. NEW: Fetch the actual count of reviews for THIS specific service
      const { count, error: countError } = await supabase
        .from("reviews")
        .select("*", { count: "exact", head: true })
        .eq("service_id", serviceId);

      if (!countError) setReviewCount(count || 0);

      setService({
        ...serviceData,
        provider_profile: providerData,
      } as Service);

    } catch (error: any) {
      toast({ title: "Error", description: "Could not load service details.", variant: "destructive" });
      navigate("/explore");
    } finally {
      setLoading(false);
    }
  }

  // Phase 1: Click "Confirm & Proceed" -> Open Modal
  const handleInitiateBooking = () => {
    if (!bookingDate) {
      toast({ title: "Select Date", description: "Please choose booking date and time", variant: "destructive" });
      return;
    }
    setShowPaymentModal(true);
  };

  // Phase 2: Click "Pay Now" inside Modal -> Call M-Pesa
  async function handleMpesaPayment() {
    if (!phone || phone.length < 10) {
      toast({ title: "Invalid Phone", description: "Please enter a valid M-Pesa number", variant: "destructive" });
      return;
    }

    try {
      setPaymentStep("processing");
      setCreatingBooking(true);

      const formattedPhone = phone.startsWith("0") ? `254${phone.substring(1)}` : phone;

      const { data, error } = await supabase.functions.invoke("mpesa-stk-push", {
        body: {
          phone: formattedPhone,
          amount: service?.price,
          customer_id: userId,
          provider_id: service?.provider_id,
          service_id: service?.id,
          scheduled_at: bookingDate,
          notes,
          whatsapp_number: whatsapp, // ADD THIS LINE
        },
      });

      if (error) throw error;

      if (data.ResponseCode === "0") {
        setPaymentStep("success");
        toast({ title: "Request Sent", description: "Please check your phone to enter PIN" });

        // --- FIXED NAVIGATION HERE ---
        setTimeout(() => {
          navigate("/my-bookings"); // Matches your Route path exactly
        }, 4000);
      } else {
        throw new Error(data.ResponseDescription || "Payment initiation failed");
      }

    } catch (err: any) {
      setPaymentStep("input");
      toast({ title: "Payment Failed", description: err.message || "Something went wrong", variant: "destructive" });
    } finally {
      setCreatingBooking(false);
    }
  }

  if (loading) return <HommieLoader />;

  if (!service) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <Navbar />

      <div className="pt-32 px-4 container mx-auto max-w-5xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to service
        </Button>

        <div className="flex flex-col gap-8 max-w-3xl mx-auto">
          {/* LEFT COLUMN */}


          {/* RIGHT COLUMN */}
          <div>
            {/* LEFT COLUMN */}
            <div className="space-y-6">
              <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white">
                <img src={service.cover_image || ""} className="w-full h-48 object-cover" alt="" />
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <Badge variant="secondary">{service.categories?.name}</Badge>
                    {/* NEW PRICING TYPE BADGE */}
                    <Badge variant="outline" className="capitalize bg-primary/5 text-primary border-primary/20">
                      {service.pricing_type || 'Fixed'} Price
                    </Badge>
                  </div>

                  <h2 className="text-2xl font-bold text-slate-900 mb-2">{service.title}</h2>

                  <div className="flex items-center gap-1 text-sm text-slate-500 mb-4">
                    <MapPin className="w-4 h-4" />
                    {service.location_name}
                  </div>

                  {/* NEW FULL DESCRIPTION SECTION */}
                  <div className="space-y-2 mt-6 pt-6 border-t border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Service Description</h3>
                    <div className="text-sm text-slate-600 leading-7 space-y-3">
                      {(service.description || service.short_description || "No detailed description available.")
                        .split(/[\n\.]+/)
                        .filter((line) => line.trim() !== "")
                        .map((line, index) => (
                          <p key={index} className="text-slate-600">
                            {line.trim()}.
                          </p>
                        ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full rounded-xl gap-2 border-primary/20 text-primary"
                      onClick={fetchReviews}
                    >
                      <MessageSquare className="w-4 h-4" />
                      See all {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm rounded-xl bg-emerald-600 text-white p-6">
                <div className="flex items-center gap-3 mb-4">
                  <ShieldCheck className="w-6 h-6" />
                  <h3 className="font-bold">Secure Payment</h3>
                </div>
                <p className="text-sm opacity-90 leading-relaxed">
                  Money is held safely by HommieGo and only released after the service is completed.
                </p>
              </Card>
            </div>
            <Card className="border-none shadow-xl rounded-xl bg-white overflow-hidden">
              <CardHeader className="p-8 border-b bg-slate-50/50">
                <CardTitle className="text-2xl font-black">Schedule Appointment</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-3">
                  <Label className="text-base font-bold flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" /> Select Date & Time
                  </Label>
                  <Input
                    type="datetime-local"
                    className="h-14 rounded-2xl border-slate-200"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-base font-bold flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-primary" /> WhatsApp Number
                  </Label>
                  <Input
                    placeholder="e.g. 0712345678"
                    className="h-14 rounded-2xl border-slate-200"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                  />
                  <p className="text-[10px] text-slate-400">The professional will contact you here after payment.</p>
                </div>
                <div className="space-y-3">
                  <Label className="text-base font-bold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" /> Instructions
                  </Label>
                  <Textarea
                    placeholder="Any special requirements?"
                    className="rounded-2xl min-h-[120px]"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div className="bg-slate-50 p-6 rounded-3xl space-y-3 border border-slate-100">
                  <div className="flex justify-between text-slate-600"><span>Booking Price</span><span>KES {service.price.toLocaleString()}</span></div>
                  <div className="border-t pt-3 flex justify-between items-center">
                    <span className="font-bold text-slate-900">Total Amount</span>
                    <span className="text-3xl font-black text-primary">KES {service.price.toLocaleString()}</span>
                  </div>
                </div>

                <Button
                  onClick={handleInitiateBooking}
                  className="w-full h-16 rounded-xl text-xl font-bold shadow-xl shadow-primary/20"
                >
                  Proceed to Payment
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-[400px] rounded-xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-emerald-600 p-6 text-white text-center">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/M-PESA_LOGO-01.svg/1200px-M-PESA_LOGO-01.svg.png" className="w-12" alt="Mpesa" />
            </div>
            <DialogTitle className="text-xl font-bold text-white">M-Pesa Express</DialogTitle>
            <DialogDescription className="text-emerald-50 opacity-90">Secure Checkout via Safaricom</DialogDescription>
          </div>

          <div className="p-8">
            {paymentStep === "input" && (
              <div className="space-y-6">
                <div className="bg-slate-50 p-6 rounded-3xl space-y-3 border border-slate-100">
                  <div className="flex justify-between text-slate-600">
                    <span>Platform Booking Fee</span>
                    <span>KES {service.price.toLocaleString()}</span>
                  </div>

                  <div className="border-t pt-3 flex justify-between items-end">
                    <div>
                      <span className="font-bold text-slate-900 block">Total Due Now</span>
                      {/* PRICING TYPE NOTICE */}
                      <span className="text-[10px] text-slate-400">
                        Note: This is a {service.pricing_type} platform fee to secure service.
                      </span>
                    </div>
                    <span className="text-3xl font-black text-primary">KES {service.price.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-bold text-slate-700">M-Pesa Phone Number</Label>
                  <div className="relative">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      placeholder="2547XXXXXXXX"
                      className="h-14 pl-12 rounded-xl text-lg font-medium border-slate-200 focus:ring-emerald-500"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 text-center">Enter number starting with 254</p>
                </div>

                <Button
                  onClick={handleMpesaPayment}
                  className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-lg font-bold"
                >
                  Pay Now
                </Button>
              </div>
            )}

            {paymentStep === "processing" && (
              <div className="py-10 text-center space-y-4">
                <div className="relative w-20 h-20 mx-auto animate-pulse">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/M-PESA_LOGO-01.svg/1200px-M-PESA_LOGO-01.svg.png" className="w-12 mx-auto" alt="Mpesa" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Requesting Payment...</h3>
                <p className="text-slate-500">Please check your phone and enter your <b>M-Pesa PIN</b>.</p>
              </div>
            )}

            {paymentStep === "success" && (
              <div className="py-10 text-center space-y-4">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Request Sent!</h3>
                <p className="text-slate-500">Redirecting to your booking history...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>


      {/* NEW: REVIEWS DIALOG */}
      <Dialog open={showReviewsModal} onOpenChange={setShowReviewsModal}>
        <DialogContent className="sm:max-w-[500px] rounded-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Service Reviews</DialogTitle>
            <DialogDescription>
              What other customers say about this service.
            </DialogDescription>
          </DialogHeader>

          {loadingReviews ? (
            <div className="py-10 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="py-10 text-center text-slate-500">
              No reviews yet for this service.
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-slate-100 pb-4 last:border-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-slate-900">{review.customer?.full_name || "Verified Customer"}</p>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-200"}`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {format(new Date(review.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 italic">"{review.comment}"</p>
                </div>
              ))}
            </div>
          )}

          <Button onClick={() => setShowReviewsModal(false)} className="w-full rounded-xl">
            Close
          </Button>
        </DialogContent>
      </Dialog>

    </div>
  );
}
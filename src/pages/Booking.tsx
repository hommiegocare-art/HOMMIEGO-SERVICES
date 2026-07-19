import { useEffect, useState, useCallback, useMemo } from "react";
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
  MessageSquare, X, Zap, Stethoscope, HeartHandshake,
  User, Award, FileText, Users, Sparkles
} from "lucide-react";
import { format } from "date-fns";

// --- Types ---
interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  customer: {
    full_name: string;
  } | null;
}

interface Service {
  id: string;
  provider_id: string;
  title: string;
  regular_booking_fee: number;
  priority_booking_fee: number;
  short_description: string | null;
  description: string | null;
  price: number;
  pricing_type: string | null;
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
  const [bookingType, setBookingType] = useState<"regular" | "priority">("regular");
  const [loading, setLoading] = useState(true);
  const [creatingBooking, setCreatingBooking] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [whatsapp, setWhatsapp] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [notes, setNotes] = useState("");
  const [reviewCount, setReviewCount] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [phone, setPhone] = useState("");
  const [paymentStep, setPaymentStep] = useState<"input" | "processing" | "success">("input");
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showFullScreenImage, setShowFullScreenImage] = useState(false);

  useEffect(() => {
    initializePage();
  }, [serviceId]);

  const fetchReviews = useCallback(async () => {
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
  }, [serviceId]);

  const initializePage = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      setUserId(session.user.id);

      const { data: serviceData, error: sError } = await supabase
        .from("services")
        .select(`*, regular_booking_fee, priority_booking_fee, categories (id, name, icon), profiles!services_provider_id_fkey (id, full_name, avatar_url)`)
        .eq("id", serviceId)
        .single();

      if (sError) throw sError;

      const { data: providerData } = await supabase
        .from("provider_profiles")
        .select(`average_rating, business_name, is_available`)
        .eq("user_id", serviceData.provider_id)
        .single();

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
  }, [serviceId, navigate, toast]);

  const handleInitiateBooking = useCallback(() => {
    if (!bookingDate) {
      toast({ title: "Select Date", description: "Please choose booking date and time", variant: "destructive" });
      return;
    }
    setShowPaymentModal(true);
  }, [bookingDate, toast]);

  const handleMpesaPayment = useCallback(async () => {
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
          amount: bookingType === "priority"
            ? service?.priority_booking_fee
            : service?.regular_booking_fee,
          customer_id: userId,
          provider_id: service?.provider_id,
          service_id: service?.id,
          scheduled_at: bookingDate,
          notes,
          whatsapp_number: whatsapp,
          booking_type: bookingType,
        },
      });

      if (error) throw error;

      if (data?.success && data?.data?.ResponseCode === "0") {
        setPaymentStep("success");
        toast({ title: "Request Sent", description: "Please check your phone to enter PIN" });

        setTimeout(() => {
          navigate("/my-bookings");
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
  }, [phone, bookingType, service, userId, bookingDate, notes, whatsapp, navigate, toast]);

  // Memoized values
  const bookingFee = useMemo(() => {
    return bookingType === "priority"
      ? service?.priority_booking_fee || 0
      : service?.regular_booking_fee || 0;
  }, [bookingType, service]);

  if (loading) return <HommieLoader />;
  if (!service) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20 transition-colors duration-300">
      <Navbar />

      <div className="w-full px-0 pt-24 md:pt-28">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6 gap-2 dark:text-zinc-300 dark:hover:bg-zinc-800/50 rounded-2xl"
          >
            <ArrowLeft className="w-4 h-4" /> Back to service
          </Button>

          <div className="grid md:grid-cols-5 gap-6 md:gap-8">
            {/* LEFT COLUMN - Service Details */}
            <div className="md:col-span-3 space-y-6">
              <Card className="border border-zinc-100 dark:border-transparent shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 transition-colors">
                <img
                  src={service.cover_image || "https://images.unsplash.com/photo-1584515933487-779824d29309?w=800"}
                  className="w-full h-48 md:h-64 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                  alt={service.title}
                  onClick={() => setShowFullScreenImage(true)}
                  loading="lazy"
                />
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full">
                      {service.categories?.name || "Healthcare Service"}
                    </Badge>
                    <Badge variant="outline" className="capitalize bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 rounded-full">
                      <Award className="w-3 h-3 mr-1" />
                      {service.pricing_type || 'Fixed'}
                    </Badge>
                    {service.provider_profile?.is_available && (
                      <Badge className="bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 rounded-full">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Available
                      </Badge>
                    )}
                  </div>

                  <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white mb-2">
                    {service.title}
                  </h2>

                  <div className="flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                    <MapPin className="w-4 h-4" />
                    {service.location_name || "Service at your location"}
                  </div>

                  {/* Provider Info */}
                  <div className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                      {service.provider_profile?.business_name?.[0] || service.profiles?.full_name?.[0] || "N"}
                    </div>
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-white text-sm">
                        {service.provider_profile?.business_name || service.profiles?.full_name || "Healthcare Provider"}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span>{service.provider_profile?.average_rating?.toFixed(1) || "New"}</span>
                        <span>•</span>
                        <span>{reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      Service Description
                    </h3>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-2">
                      {(service.description || service.short_description || "Professional healthcare service delivered with compassion and expertise.")
                        .split(/[\n\.]+/)
                        .filter((line) => line.trim() !== "")
                        .slice(0, 8)
                        .map((line, index) => (
                          <p key={index} className="text-zinc-600 dark:text-zinc-400">
                            {line.trim()}.
                          </p>
                        ))}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-6 rounded-2xl gap-2 border-primary/20 text-primary dark:border-primary/30 dark:hover:bg-primary/10"
                    onClick={fetchReviews}
                  >
                    <MessageSquare className="w-4 h-4" />
                    Read {reviewCount} Patient {reviewCount === 1 ? 'Review' : 'Reviews'}
                  </Button>
                </CardContent>
              </Card>

              {/* Trust Badge */}
              <Card className="border-none shadow-sm rounded-3xl bg-gradient-to-r from-emerald-600 to-green-600 dark:from-emerald-700 dark:to-green-700 text-white p-4 md:p-6 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-full">
                    <HeartHandshake className="w-6 h-6 md:w-8 md:h-8" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base md:text-lg">Trusted Healthcare Platform</h3>
                    <p className="text-xs md:text-sm opacity-90 leading-relaxed">
                      All healthcare providers are licensed and verified. Your payment is secure and only released after service completion.
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* RIGHT COLUMN - Booking Form */}
            <div className="md:col-span-2">
              <Card className="border border-zinc-100 dark:border-transparent shadow-lg rounded-3xl bg-white dark:bg-zinc-900 overflow-hidden transition-colors sticky top-28">
                <CardHeader className="p-4 md:p-6 border-b bg-gradient-to-r from-primary/5 to-blue-500/5 dark:from-primary/10 dark:to-blue-500/10">
                  <CardTitle className="text-xl font-black dark:text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Book Healthcare Service
                  </CardTitle>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Schedule your appointment with a licensed healthcare professional
                  </p>
                </CardHeader>
                <CardContent className="p-4 md:p-6 space-y-5">
                  {/* Date & Time */}
                  <div className="space-y-2">
                    <Label className="text-sm font-bold flex items-center gap-2 dark:text-zinc-300">
                      <Calendar className="w-4 h-4 text-primary" /> Date & Time
                    </Label>
                    <Input
                      type="datetime-local"
                      className="h-12 rounded-2xl border-zinc-200 dark:border-transparent dark:bg-zinc-800 dark:text-white"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      required
                    />
                  </div>

                  {/* WhatsApp */}
                  <div className="space-y-2">
                    <Label className="text-sm font-bold flex items-center gap-2 dark:text-zinc-300">
                      <Smartphone className="w-4 h-4 text-primary" /> WhatsApp Number
                    </Label>
                    <Input
                      placeholder="e.g. 0712345678"
                      className="h-12 rounded-2xl border-zinc-200 dark:border-transparent dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                    />
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                      The healthcare provider will contact you here after booking.
                    </p>
                  </div>

                  {/* Booking Type Selection */}
                  <div className="space-y-2">
                    <Label className="text-sm font-bold flex items-center gap-2 dark:text-zinc-300">
                      <Zap className="w-4 h-4 text-primary" /> Booking Priority
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setBookingType("regular")}
                        className={`p-3 rounded-2xl border-2 transition-all text-left ${bookingType === "regular"
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-zinc-200 dark:border-zinc-700"
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <Clock className={`w-4 h-4 ${bookingType === "regular" ? "text-blue-500" : "text-zinc-400"}`} />
                          <span className={`font-bold text-sm ${bookingType === "regular" ? "text-blue-700 dark:text-blue-400" : "text-zinc-500"}`}>
                            Standard
                          </span>
                        </div>
                        <span className="text-lg font-black dark:text-white">KES {service.regular_booking_fee}</span>
                        <p className="text-[10px] text-zinc-400">Regular queue</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBookingType("priority")}
                        className={`p-3 rounded-2xl border-2 transition-all text-left ${bookingType === "priority"
                          ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                          : "border-zinc-200 dark:border-zinc-700"
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <Zap className={`w-4 h-4 ${bookingType === "priority" ? "text-orange-500" : "text-zinc-400"}`} />
                          <span className={`font-bold text-sm ${bookingType === "priority" ? "text-orange-700 dark:text-orange-400" : "text-zinc-500"}`}>
                            Priority
                          </span>
                        </div>
                        <span className="text-lg font-black dark:text-white">KES {service.priority_booking_fee}</span>
                        <p className="text-[10px] text-zinc-400">Get care first</p>
                      </button>
                    </div>
                  </div>

                  {/* Special Instructions */}
                  <div className="space-y-2">
                    <Label className="text-sm font-bold flex items-center gap-2 dark:text-zinc-300">
                      <FileText className="w-4 h-4 text-primary" /> Special Instructions
                    </Label>
                    <Textarea
                      placeholder="Any special requirements or medical notes for the provider..."
                      className="rounded-2xl min-h-[80px] dark:bg-zinc-800 dark:border-transparent dark:text-white dark:placeholder:text-zinc-500 text-sm"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  {/* Price Summary */}
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl space-y-2 border border-zinc-100 dark:border-transparent">
                    <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
                      <span>Booking Fee ({bookingType})</span>
                      <span>KES {bookingFee.toLocaleString()}</span>
                    </div>
                    <div className="border-t dark:border-zinc-700 pt-2 flex justify-between items-end">
                      <div>
                        <span className="font-bold text-zinc-900 dark:text-white block text-sm">Total Due</span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                          Secures your {bookingType} appointment
                        </span>
                      </div>
                      <span className="text-2xl font-black text-primary">
                        KES {bookingFee.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={handleInitiateBooking}
                    className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                  >
                    <Stethoscope className="w-5 h-5 mr-2" />
                    Book Appointment
                  </Button>

                  <p className="text-[10px] text-center text-zinc-400 dark:text-zinc-500">
                    By booking, you agree to our Terms of Service and Privacy Policy
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* FULL SCREEN IMAGE MODAL */}
      {showFullScreenImage && service.cover_image && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowFullScreenImage(false)}
        >
          <button
            onClick={() => setShowFullScreenImage(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full bg-black/50 hover:bg-black/70 transition-all z-10"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={service.cover_image}
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
            alt={service.title}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* PAYMENT MODAL */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-[400px] rounded-3xl p-0 overflow-hidden border-0 shadow-2xl dark:bg-zinc-900 transition-colors">
          <div className="bg-gradient-to-r from-emerald-600 to-green-600 dark:from-emerald-700 dark:to-green-700 p-6 text-white text-center">
            <div className="w-16 h-16 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/M-PESA_LOGO-01.svg/1200px-M-PESA_LOGO-01.svg.png" className="w-12" alt="Mpesa" />
            </div>
            <DialogTitle className="text-xl font-bold text-white">M-Pesa Express</DialogTitle>
            <DialogDescription className="text-emerald-50 opacity-90">
              Secure Medical Booking Payment • {bookingType === "priority" ? "Priority" : "Standard"} Care
            </DialogDescription>
          </div>

          <div className="p-6">
            {paymentStep === "input" && (
              <div className="space-y-6">
                <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-3xl space-y-3 border border-zinc-100 dark:border-transparent">
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>Booking Fee ({bookingType})</span>
                    <span>KES {bookingFee.toLocaleString()}</span>
                  </div>
                  <div className="border-t dark:border-zinc-700 pt-3 flex justify-between items-end">
                    <div>
                      <span className="font-bold text-zinc-900 dark:text-white block">Total Due Now</span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                        Secures your {bookingType} healthcare appointment
                      </span>
                    </div>
                    <span className="text-3xl font-black text-primary">
                      KES {bookingFee.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-bold text-zinc-700 dark:text-zinc-300">M-Pesa Phone Number</Label>
                  <div className="relative">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 dark:text-zinc-500" />
                    <Input
                      placeholder="2547XXXXXXXX"
                      className="h-14 pl-12 rounded-2xl text-lg font-medium border-zinc-200 dark:border-transparent dark:bg-zinc-800 dark:text-white focus:ring-emerald-500"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 text-center">Enter number starting with 254</p>
                </div>

                <Button
                  onClick={handleMpesaPayment}
                  className="w-full h-14 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 rounded-2xl text-lg font-bold"
                >
                  Pay KES {bookingFee.toLocaleString()}
                </Button>
              </div>
            )}

            {paymentStep === "processing" && (
              <div className="py-10 text-center space-y-4">
                <div className="relative w-20 h-20 mx-auto animate-pulse">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/M-PESA_LOGO-01.svg/1200px-M-PESA_LOGO-01.svg.png" className="w-12 mx-auto" alt="Mpesa" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Processing Payment...</h3>
                <p className="text-zinc-500 dark:text-zinc-400">
                  Please check your phone and enter your <b>M-Pesa PIN</b> for KES {bookingFee.toLocaleString()}
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">You will be redirected after confirmation</p>
              </div>
            )}

            {paymentStep === "success" && (
              <div className="py-10 text-center space-y-4">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">Booking Confirmed!</h3>
                <p className="text-zinc-500 dark:text-zinc-400">Redirecting to your bookings...</p>
                <div className="flex items-center justify-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
                  <HeartHandshake className="w-4 h-4 text-primary" />
                  <span>Your healthcare provider will contact you shortly</span>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* REVIEWS DIALOG */}
      <Dialog open={showReviewsModal} onOpenChange={setShowReviewsModal}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl max-h-[80vh] overflow-y-auto no-scrollbar border-0 shadow-2xl dark:bg-zinc-900 transition-colors p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl font-bold dark:text-white flex items-center gap-2">
              <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
              Patient Reviews
            </DialogTitle>
            <DialogDescription className="dark:text-zinc-400">
              What patients say about this healthcare service
            </DialogDescription>
          </DialogHeader>

          <div className="p-6">
            {loadingReviews ? (
              <div className="py-10 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="py-10 text-center text-zinc-500 dark:text-zinc-400">
                <Users className="w-12 h-12 mx-auto mb-3 text-zinc-300 dark:text-zinc-600" />
                <p className="font-semibold">No reviews yet</p>
                <p className="text-sm">Be the first to share your healthcare experience</p>
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-zinc-100 dark:border-zinc-800 pb-4 last:border-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-white">{review.customer?.full_name || "Verified Patient"}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-zinc-200 dark:text-zinc-600"}`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                        {format(new Date(review.created_at), "MMM d, yyyy")}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 italic">"{review.comment}"</p>
                  </div>
                ))}
              </div>
            )}

            <Button
              onClick={() => setShowReviewsModal(false)}
              className="w-full rounded-2xl mt-4"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
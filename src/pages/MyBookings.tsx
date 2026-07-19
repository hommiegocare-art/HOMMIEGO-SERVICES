import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { jsPDF } from "jspdf";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader2, Calendar, User, CreditCard, ChevronRight,
  ShoppingBag, Star, Download, CheckCircle2, ArrowLeft,
  Zap, Clock, Stethoscope, Heart, HeartHandshake, Pill, ShieldCheck, FileText, MapPin, Phone,
  Sparkles
} from "lucide-react";
import { HommieLoader } from "@/components/HommieLoader";
import { motion } from "framer-motion";

// --- Types ---
interface Booking {
  id: string;
  customer_id: string;
  provider_id: string;
  service_id: string;
  scheduled_at: string | null;
  status: string;
  booking_type: string | null;
  total_amount: number | null;
  payment_status: string | null;
  created_at: string;
  services: {
    id: string;
    title: string;
    cover_image: string | null;
  } | null;
  profiles: {
    full_name: string | null;
  } | null;
}

export default function MyBookings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }

      // Check cache first
      const cacheKey = `bookings_${session.user.id}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < 30000) {
          setBookings(parsed.data);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          services (id, title, cover_image),
          profiles!bookings_provider_id_fkey (full_name)
        `)
        .eq("customer_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const bookingsData = (data as any) || [];
      sessionStorage.setItem(cacheKey, JSON.stringify({
        data: bookingsData,
        timestamp: Date.now()
      }));

      setBookings(bookingsData);
    } catch (err) {
      console.error("Error fetching bookings:", err);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // --- FEATURE 1: DOWNLOAD RECEIPT ---
  const downloadReceipt = useCallback((booking: Booking) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    const img = new Image();
    img.src = "/pwa-192x192.png";
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas context failed");

        ctx.drawImage(img, 0, 0);
        const imgData = canvas.toDataURL("image/jpeg", 1.0);
        renderPDF(imgData);
      } catch (e) {
        console.error("Logo failed to load, generating without logo", e);
        renderPDF(null);
      }
    };

    img.onerror = () => {
      console.error("Logo path not found, generating without logo");
      renderPDF(null);
    };

    const renderPDF = (logoData: string | null) => {
      const primaryColor = "#0F172A";
      const accentColor = "#10B981";

      doc.setFillColor(248, 250, 252);
      doc.rect(0, 0, pageWidth, 40, 'F');

      if (logoData) {
        doc.addImage(logoData, 'JPEG', 15, 10, 20, 20);
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(primaryColor);
      doc.text("HommieCare Kenya", logoData ? 40 : 15, 24);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("MEDICAL SERVICE RECEIPT", pageWidth - 15, 24, { align: "right" });

      doc.setDrawColor(230);
      doc.line(15, 50, pageWidth - 15, 50);

      doc.setFontSize(10);
      doc.text("RECEIPT ID", 15, 60);
      doc.text("DATE ISSUED", pageWidth - 15, 60, { align: "right" });
      doc.text("SERVICE TYPE", 15, 75);
      doc.text("PROVIDER", pageWidth - 15, 75, { align: "right" });

      doc.setTextColor(primaryColor);
      doc.setFontSize(11);
      doc.text(`#${booking.id.toUpperCase().slice(0, 12)}`, 15, 66);
      doc.text(new Date(booking.created_at).toLocaleDateString(), pageWidth - 15, 66, { align: "right" });
      doc.text(booking.services?.title || "Healthcare Service", 15, 81);
      doc.text(booking.profiles?.full_name || "Healthcare Provider", pageWidth - 15, 81, { align: "right" });

      doc.setFillColor(primaryColor);
      doc.rect(15, 110, pageWidth - 30, 10, 'F');
      doc.setTextColor("#FFFFFF");
      doc.text("Medical Service Description", 20, 116);
      doc.text("Total Amount", pageWidth - 20, 116, { align: "right" });

      doc.setTextColor(primaryColor);
      doc.setFont("helvetica", "normal");
      doc.text(booking.services?.title || "Nursing Service", 20, 130);
      doc.setFont("helvetica", "bold");
      doc.text(`KES ${booking.total_amount?.toLocaleString()}`, pageWidth - 20, 130, { align: "right" });

      doc.setTextColor(accentColor);
      doc.setFontSize(14);
      doc.text("PAID IN FULL", 15, 155);

      doc.setTextColor(primaryColor);
      doc.text(`Total: KES ${booking.total_amount?.toLocaleString()}`, pageWidth - 15, 155, { align: "right" });

      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text("This is a computer generated receipt for medical services provided.", pageWidth / 2, 185, { align: "center" });
      doc.text("For any medical concerns, please contact the healthcare provider directly.", pageWidth / 2, 192, { align: "center" });

      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text("Thank you for choosing HommieCare Kenya - Professional Healthcare at Your Doorstep.", pageWidth / 2, 200, { align: "center" });

      doc.save(`MedicalReceipt-${booking.id.slice(0, 8)}.pdf`);
    };
  }, []);

  // --- FEATURE 2: SUBMIT REVIEW ---
  const openReviewModal = useCallback((booking: Booking) => {
    setSelectedBooking(booking);
    setIsReviewModalOpen(true);
  }, []);

  const handleReviewSubmit = useCallback(async () => {
    if (!selectedBooking) return;
    try {
      setSubmittingReview(true);
      const { error } = await supabase.from("reviews").insert({
        booking_id: selectedBooking.id,
        service_id: selectedBooking.service_id,
        customer_id: selectedBooking.customer_id,
        provider_id: selectedBooking.provider_id,
        rating: rating,
        comment: comment,
      });

      if (error) throw error;

      toast({
        title: "Thank You for Your Feedback!",
        description: "Your review helps us improve healthcare services for everyone."
      });
      setIsReviewModalOpen(false);
      setComment("");
      setRating(5);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmittingReview(false);
    }
  }, [selectedBooking, rating, comment, toast]);

  const getStatusColor = useCallback((status: string) => {
    switch (status?.toLowerCase()) {
      case "completed": return "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
      case "pending": return "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800";
      case "confirmed": return "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800";
      case "cancelled": return "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800";
      default: return "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400";
    }
  }, []);

  // Memoized bookings
  const bookingItems = useMemo(() => bookings, [bookings]);

  if (loading) return <HommieLoader />;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
      <Navbar />

      {/* Edge-to-Edge Container */}
      <div className="w-full px-0 pt-20 pb-20">
        <div className="max-w-4xl mx-auto px-4 md:px-6">

          {/* BACK BUTTON */}
          <Button
            variant="ghost"
            className="mb-4 -ml-2 text-zinc-600 dark:text-zinc-400 gap-2 rounded-2xl"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>

          <div className="flex items-center gap-3 mb-8">
            <h1 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white">My Healthcare Bookings</h1>
            <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full">
              Medical Services
            </Badge>
          </div>

          {bookings.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-full h-[450px] md:h-[500px] rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center group"
            >
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-[2s] group-hover:scale-110"
                style={{ backgroundImage: "url('/background1.png')" }}
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/20 via-zinc-900/60 to-zinc-900/90" />

              {/* Content */}
              <div className="relative z-10 px-8 text-center flex flex-col items-center">

                {/* Glassmorphism Icon Circle */}
                <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 flex items-center justify-center mb-6 shadow-xl">
                  <HeartHandshake className="w-10 h-10 text-white" />
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
                    Your Healthcare Journey <br /><span className="text-primary-foreground/80">Starts Here.</span>
                  </h2>

                  <p className="text-slate-200 text-base md:text-lg mb-8 max-w-[280px] mx-auto leading-relaxed opacity-90">
                    You haven't booked any healthcare services yet. Find licensed nurses and medical professionals near you.
                  </p>

                  <Button
                    onClick={() => navigate("/explore")}
                    size="lg"
                    className="rounded-2xl h-14 px-10 text-lg font-bold bg-white text-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-200 shadow-xl transition-all active:scale-95 border-none"
                  >
                    Find Healthcare Services
                  </Button>
                </motion.div>
              </div>

              {/* Decorative Tag */}
              <div className="absolute top-8 right-8 bg-white/10 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full">
                <span className="text-[8px] font-bold text-white uppercase tracking-[0.2em]">24/7 Healthcare Support</span>
              </div>
            </motion.div>
          ) : (
            /* --- BOOKINGS LIST --- */
            <div className="grid gap-4 md:gap-6">
              {bookingItems.map((booking) => (
                <Card
                  key={booking.id}
                  className="rounded-3xl overflow-hidden border border-zinc-100 dark:border-transparent shadow-sm bg-white dark:bg-zinc-900 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Service Image */}
                    <div className="relative w-full md:w-56 h-48 md:h-auto overflow-hidden">
                      <img
                        src={booking.services?.cover_image || "https://images.unsplash.com/photo-1584515933487-779824d29309?w=400"}
                        className="w-full h-full object-cover"
                        alt={booking.services?.title || "Healthcare Service"}
                        loading="lazy"
                      />
                      {/* Medical Badge Overlay */}
                      <div className="absolute top-3 left-3 bg-primary/90 backdrop-blur-sm px-3 py-1.5 rounded-xl">
                        <span className="text-[8px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
                          <Stethoscope className="w-3 h-3" />
                          Medical
                        </span>
                      </div>
                    </div>

                    <div className="p-4 md:p-6 flex-1">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3 mb-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={`${getStatusColor(booking.status)} rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-wider`}>
                              {booking.status}
                            </Badge>
                            {booking.booking_type === 'priority' ? (
                              <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 border-orange-200 dark:border-orange-800 rounded-full px-3 py-0.5 text-[10px] flex items-center gap-1">
                                <Zap className="w-3 h-3 fill-orange-500" /> Priority
                              </Badge>
                            ) : (
                              <Badge className="bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 border-blue-100 dark:border-blue-800 rounded-full px-3 py-0.5 text-[10px] flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Standard
                              </Badge>
                            )}
                          </div>
                          <h3 className="text-xl md:text-2xl font-black mt-2 text-zinc-900 dark:text-white">
                            {booking.services?.title || "Healthcare Service"}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-zinc-500 dark:text-zinc-400">
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              <span className="text-sm font-medium">{booking.profiles?.full_name || "Healthcare Provider"}</span>
                            </div>
                            {booking.scheduled_at && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span className="text-sm">{new Date(booking.scheduled_at).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-left md:text-right">
                          <p className="text-2xl font-black text-primary">KES {booking.total_amount?.toLocaleString()}</p>
                          <Badge variant="outline" className={`mt-1 border-none bg-transparent ${booking.payment_status === 'paid' ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                            {booking.payment_status === 'paid' ? "✓ PAID" : "● PENDING"}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                        {booking.payment_status === 'paid' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-2xl gap-2 font-bold border-zinc-200 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800/50"
                            onClick={() => downloadReceipt(booking)}
                          >
                            <Download className="w-4 h-4" /> Receipt
                          </Button>
                        )}

                        {booking.payment_status === 'paid' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="rounded-2xl gap-2 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/50 font-bold border-none"
                            onClick={() => openReviewModal(booking)}
                          >
                            <Star className="w-4 h-4 fill-amber-700 dark:fill-amber-400" /> Rate Care
                          </Button>
                        )}

                        {booking.status?.toLowerCase() === 'completed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-2xl gap-2 text-primary hover:bg-primary/10 font-bold"
                            onClick={() => navigate(`/service/${booking.service_id}`)}
                          >
                            <Heart className="w-4 h-4" /> Book Again
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* REVIEW DIALOG - Native Android Style */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="rounded-3xl max-w-md border-0 shadow-2xl bg-white dark:bg-zinc-900 p-0 gap-0">
          <DialogHeader className="p-6 pb-0">
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-6 h-6 text-primary" />
              <DialogTitle className="text-2xl font-bold text-zinc-900 dark:text-white">Rate Your Healthcare Experience</DialogTitle>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Your feedback helps us improve healthcare services and recognize exceptional care providers.
            </p>
          </DialogHeader>

          <div className="p-6 space-y-6">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-10 h-10 cursor-pointer transition-all hover:scale-110 ${rating >= star ? "fill-yellow-400 text-yellow-400" : "text-zinc-300 dark:text-zinc-600"}`}
                  onClick={() => setRating(star)}
                />
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Your Feedback
              </label>
              <Textarea
                placeholder="How was your healthcare experience? Share your thoughts about the care you received..."
                className="rounded-2xl min-h-[100px] bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-transparent text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-primary"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            <div className="bg-primary/5 dark:bg-primary/10 p-4 rounded-2xl border border-primary/10">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span>Your review helps other patients make informed decisions about their healthcare. Thank you for sharing your experience!</span>
              </p>
            </div>
          </div>

          <DialogFooter className="p-6 pt-0">
            <Button
              className="w-full h-12 rounded-2xl font-bold shadow-lg shadow-primary/20"
              onClick={handleReviewSubmit}
              disabled={submittingReview}
            >
              {submittingReview ? <Loader2 className="animate-spin" /> : "Submit Your Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import { useEffect, useState } from "react";
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
  ShoppingBag, Star, Download, CheckCircle2, ArrowLeft
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

  async function fetchBookings() {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }

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
      setBookings((data as any) || []);
    } catch (err) {
      console.error("Error fetching bookings:", err);
    } finally {
      setLoading(false);
    }
  }

  // --- FEATURE 1: DOWNLOAD RECEIPT ---
  // 1. Add this import at the top

  // ... inside your MyBookings component ...

  const downloadReceipt = (booking: Booking) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // 1. Create a canvas to "sanitize" the image
    const img = new Image();
    // Ensure the path is correct - usually /pwa-192x192.png if in public folder
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
        // Convert to JPEG data URL (much more stable for jsPDF than PNG)
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

    // Move the PDF generation logic into a separate internal function
    const renderPDF = (logoData: string | null) => {
      const primaryColor = "#0F172A";
      const accentColor = "#10B981";

      // Header Background
      doc.setFillColor(248, 250, 252);
      doc.rect(0, 0, pageWidth, 40, 'F');

      // 2. Add Logo if it exists
      if (logoData) {
        doc.addImage(logoData, 'JPEG', 15, 10, 20, 20);
      }

      // Brand Name
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(primaryColor);
      doc.text("HommieGo", logoData ? 40 : 15, 24);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("OFFICIAL SERVICE RECEIPT", pageWidth - 15, 24, { align: "right" });

      // Transaction Info Section
      doc.setDrawColor(230);
      doc.line(15, 50, pageWidth - 15, 50);

      doc.setFontSize(10);
      doc.text("RECEIPT ID", 15, 60);
      doc.text("DATE ISSUED", pageWidth - 15, 60, { align: "right" });

      doc.setTextColor(primaryColor);
      doc.setFontSize(11);
      doc.text(`#${booking.id.toUpperCase().slice(0, 12)}`, 15, 66);
      doc.text(new Date(booking.created_at).toLocaleDateString(), pageWidth - 15, 66, { align: "right" });

      // Table Header
      doc.setFillColor(primaryColor);
      doc.rect(15, 110, pageWidth - 30, 10, 'F');
      doc.setTextColor("#FFFFFF");
      doc.text("Description", 20, 116);
      doc.text("Total Amount", pageWidth - 20, 116, { align: "right" });

      // Table Body
      doc.setTextColor(primaryColor);
      doc.setFont("helvetica", "normal");
      doc.text(booking.services?.title || "Service", 20, 130);
      doc.setFont("helvetica", "bold");
      doc.text(`KES ${booking.total_amount?.toLocaleString()}`, pageWidth - 20, 130, { align: "right" });

      // Status Watermark
      doc.setTextColor(accentColor);
      doc.setFontSize(14);
      doc.text("PAID IN FULL", 15, 155);

      doc.setTextColor(primaryColor);
      doc.text(`Total: KES ${booking.total_amount?.toLocaleString()}`, pageWidth - 15, 155, { align: "right" });

      // Footer
      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text("Thank you for using HommieGo. Computer generated receipt.", pageWidth / 2, 200, { align: "center" });

      doc.save(`Receipt-${booking.id.slice(0, 8)}.pdf`);
    };
  };

  // --- FEATURE 2: SUBMIT REVIEW ---
  const openReviewModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsReviewModalOpen(true);
  };

  const handleReviewSubmit = async () => {
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

      toast({ title: "Review Submitted", description: "Thank you for your feedback!" });
      setIsReviewModalOpen(false);
      setComment("");
      setRating(5);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed": return "bg-green-100 text-green-700 border-green-200";
      case "pending": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "confirmed": return "bg-blue-100 text-blue-700 border-blue-200";
      case "cancelled": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-slate-100 text-slate-700";
    }
  };
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      <div className="pt-32 pb-20 px-4 container mx-auto max-w-4xl">

        {/* BACK BUTTON */}
        <Button
          variant="ghost"
          className="mb-4 -ml-2 text-slate-600 gap-2 rounded-xl"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>

        <h1 className="text-4xl font-black text-slate-900 mb-8">My Bookings</h1>


        {bookings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full h-[450px] md:h-[500px] rounded-xl overflow-hidden shadow-2xl flex items-center justify-center group"
          >
            {/* 1. THE BACKGROUND IMAGE */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-[2s]] group-hover:scale-110"
              style={{ backgroundImage: "url('/background1.png')" }}
            />

            {/* 2. THE SWEET GRADIENT OVERLAY */}
            {/* This gradient goes from nearly transparent at the top to a deep slate at the bottom */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/20 via-slate-900/60 to-slate-900/90" />

            {/* 3. THE CONTENT (Aligned for readability) */}
            <div className="relative z-10 px-8 text-center flex flex-col items-center">

              {/* Glassmorphism Icon Circle */}
              <div className="w-18 h-18 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 flex items-center justify-center mb-6 shadow-xl">
                <ShoppingBag className="w-10 h-10 text-white" />
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
                  Your journey <br /><span className="text-primary-foreground/80">starts here.</span>
                </h2>

                <p className="text-slate-200 text-base md:text-lg mb-8 max-w-[280px] mx-auto leading-relaxed opacity-90">
                  You haven't booked any services yet. Discover top-rated professionals nearby.
                </p>

                <Button
                  onClick={() => navigate("/explore")}
                  size="lg"
                  className="rounded-2xl h-14 px-10 text-lg font-bold bg-white text-slate-900 hover:bg-slate-100 shadow-xl transition-all active:scale-95 border-none"
                >
                  Explore Services
                </Button>
              </motion.div>
            </div>

            {/* Small Decorative Tag */}
            <div className="absolute top-8 right-8 bg-white/10 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full">
              <span className="text-[5px] font-bold text-white uppercase tracking-[0.2em]">HommieGo is free</span>
            </div>
          </motion.div>
        ) : (
          /* --- BOOKINGS LIST --- */
          <div className="grid gap-6">
            {bookings.map((booking) => (
              <Card key={booking.id} className="rounded-[2.5rem] overflow-hidden border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row">
                  {/* Service Image */}
                  <div className="relative w-full md:w-56 h-48 md:h-auto overflow-hidden">
                    <img
                      src={booking.services?.cover_image || "/placeholder.svg"}
                      className="w-full h-full object-cover"
                      alt="service"
                    />
                  </div>

                  <div className="p-8 flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <Badge className={`${getStatusColor(booking.status)} rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-wider`}>
                          {booking.status}
                        </Badge>
                        <h3 className="text-2xl font-black mt-3 text-slate-900">{booking.services?.title}</h3>
                        <div className="flex items-center gap-2 mt-1 text-slate-500">
                          <User className="w-4 h-4" />
                          <span className="text-sm font-medium">Provider: {booking.profiles?.full_name}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-primary">KES {booking.total_amount?.toLocaleString()}</p>
                        <Badge variant="outline" className={`mt-1 border-none bg-transparent ${booking.payment_status === 'paid' ? "text-green-600" : "text-amber-600"}`}>
                          {booking.payment_status === 'paid' ? "✓ PAID" : "● PENDING PAYMENT"}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-50">
                      {booking.payment_status === 'paid' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl gap-2 font-bold border-slate-200"
                          onClick={() => downloadReceipt(booking)}
                        >
                          <Download className="w-4 h-4" /> Receipt
                        </Button>
                      )}

                      {booking.payment_status === 'paid' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="rounded-xl gap-2 bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold border-none"
                          onClick={() => openReviewModal(booking)}
                        >
                          <Star className="w-4 h-4 fill-amber-700" /> Review
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
      {/* REVIEW DIALOG */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="rounded-[2rem] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Rate Service</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-10 h-10 cursor-pointer transition-colors ${rating >= star ? "fill-yellow-400 text-yellow-400" : "text-slate-300"}`}
                  onClick={() => setRating(star)}
                />
              ))}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Your Feedback</label>
              <Textarea
                placeholder="How was the service?"
                className="rounded-2xl min-h-[100px]"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full h-12 rounded-xl font-bold" onClick={handleReviewSubmit} disabled={submittingReview}>
              {submittingReview ? <Loader2 className="animate-spin" /> : "Submit Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
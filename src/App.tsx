import { useEffect, useRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner, toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Bell, GraduationCap, Info, X } from "lucide-react"; // Added X for close button
import { ThemeProvider } from "./components/theme-provider";
import { Navbar } from "./components/Navbar"; // IMPORT THE NAVBAR
import Contact from "./pages/Contact";
// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Explore from "./pages/Explore";
import CustomerDashboard from "./pages/CustomerDashboard";
import ProviderDashboard from "./pages/ProviderDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ServiceDetail from "./pages/ServiceDetail";
import Booking from "./pages/Booking";
import Payment from "./pages/Payment";
import BookingConfirmation from "./pages/BookingConfirmation";
import MyBookings from "./pages/MyBookings";
import Ads from "./pages/Ads";
import ProviderOnboarding from "./pages/ProviderOnboarding";
import NotFound from "./pages/NotFound";
import Notifications from "./pages/Notifications";
import { BottomNav } from "./components/BottomNav";
import NewService from "./pages/provider/NewService";
import AboutUsPage from "./pages/AboutUs";
import EditProfile from "./pages/EditProfile";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import Careers from "./pages/Careers";
import AuthCallback from "./pages/AuthCallback";
import Emergency from "./pages/Emergency";
import HelpCenter from "./pages/HelpCenter";
import MedicalProfile from "./pages/MedicalProfile";
import Profile from "./pages/Profile";

const queryClient = new QueryClient();

const App = () => {
  const audioPlayer = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioPlayer.current = new Audio("/sound.mp3");

    const channel = supabase
      .channel('global-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        async (payload) => {
          const newNotif = payload.new;
          const { data: { session } } = await supabase.auth.getSession();
          const currentUserId = session?.user?.id;

          if (!newNotif.user_id || newNotif.user_id === currentUserId) {
            audioPlayer.current?.play().catch((err) => {
              console.log("Audio play deferred until user interaction.");
            });

            toast.custom((t) => (
              <div className="bg-white/95 backdrop-blur-md border border-slate-100 p-4 rounded-[1.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.08)] flex items-center gap-4 max-w-sm w-full animate-in fade-in slide-in-from-top-4 duration-500 pointer-events-auto">
                <div className="relative">
                  <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="absolute top-0 right-0 h-3 w-3 bg-red-600 rounded-full border-2 border-white animate-pulse" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-red-600/70">
                      Notification
                    </span>
                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                    <span className="text-[10px] text-slate-400 font-medium">Just now</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-[14px] leading-tight truncate">
                    {newNotif.title}
                  </h4>
                  <p className="text-slate-500 text-[12px] leading-relaxed line-clamp-1">
                    {newNotif.body}
                  </p>
                </div>

                <button
                  onClick={() => toast.dismiss(t)}
                  className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-slate-50 text-slate-300 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ), {
              duration: 6000,
              position: "top-center",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Sonner position="top-center" expand={true} richColors closeButton />
          <Toaster />

          <BrowserRouter>
            {/* ADD THE NAVBAR HERE - OUTSIDE OF ROUTES SO IT SHOWS ON ALL PAGES */}
            <Navbar />

            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/dashboard/client" element={<CustomerDashboard />} />
              <Route path="/dashboard/provider" element={<ProviderDashboard />} />
              <Route path="/dashboard/admin" element={<AdminDashboard />} />
              <Route path="/service/:id" element={<ServiceDetail />} />
              <Route path="/booking/:serviceId" element={<Booking />} />
              <Route path="/payment/:bookingId" element={<Payment />} />
              <Route path="/booking/confirmation/:id" element={<BookingConfirmation />} />
              <Route path="/my-bookings" element={<MyBookings />} />
              <Route path="/ads" element={<Ads />} />
              <Route path="/provider/onboarding" element={<ProviderOnboarding />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/about" element={<AboutUsPage />} />
              <Route path="/edit-profile" element={<EditProfile />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/cookie-policy" element={<CookiePolicy />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/provider/services/new" element={<NewService />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/emergency" element={<Emergency />} />
              <Route path="/help" element={<HelpCenter />} />

              <Route path="/medical-profile/:patientId?" element={<MedicalProfile />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="*" element={<NotFound />} />
              {/* View profile by userId */}
              <Route path="/profile/:userId" element={<Profile />} />

              {/* View own profile (redirects to current user) */}
              <Route path="/profile" element={<Profile />} />
            </Routes>
            <BottomNav />
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
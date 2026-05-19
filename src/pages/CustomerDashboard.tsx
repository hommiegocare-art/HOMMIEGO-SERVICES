import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  MapPin,
  Heart,
  Star,
  LogOut,
  Search,
  Home,
  User,
  ShieldCheck,
  Bookmark
} from "lucide-react";
import { HommieLoader } from "@/components/HommieLoader";
const discoveryImages = [
  "/background1.png",
  "/background2.png",
  "/background3.png",
  "/background4.png",
  "/background5.png",
  "/background6.png",
];
// Enhanced Profile interface based on your SQL schema
interface Profile {
  full_name: string | null;
  city: string | null;
  country: string | null;
  avatar_url: string | null;
  is_verified: boolean | null;
  bio: string | null;
}

export default function ClientDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [stats, setStats] = useState({
    bookings: 0,
    reviews: 0,
    favorites: 0,
  });
  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % discoveryImages.length);
    }, 3000); // Changes image every 5 seconds
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth");
        return;
      }

      // Fetch Profile and Stats (Messages section removed)
      const [profileRes, bookingsRes, favoritesRes, reviewsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", session.user.id).single(),
        supabase.from("bookings").select("*", { count: "exact", head: true }).eq("customer_id", session.user.id),
        // Updated to use your new service_favorites table
        supabase.from("service_favorites").select("*", { count: "exact", head: true }).eq("user_id", session.user.id),
        supabase.from("reviews").select("*", { count: "exact", head: true }).eq("customer_id", session.user.id),
      ]);

      if (profileRes.error) throw profileRes.error;

      setProfile(profileRes.data);

      setStats({
        bookings: bookingsRes.count || 0,
        reviews: reviewsRes.count || 0,
        favorites: favoritesRes.count || 0,
      });

    } catch (error: any) {
      console.error(error);
      toast({
        title: "Sync Error",
        description: "Failed to load dashboard data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) return <HommieLoader />;

  // Adjusted cards to 3 items for a professional layout
  const statCards = [
    { label: "Bookings", value: stats.bookings, icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Reviews", value: stats.reviews, icon: Star, color: "text-amber-500", bg: "bg-amber-50" },
    { label: "Saved Services", value: stats.favorites, icon: Bookmark, color: "text-rose-500", bg: "bg-rose-50" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Client Portal
          </span>

          <div className="flex gap-1 md:gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="hidden sm:flex gap-2">
              <Home className="w-4 h-4" /> Home
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/explore")} className="gap-2 text-primary font-semibold">
              <Search className="w-4 h-4" /> Explore
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/edit-profile")}>
              Profile
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLogoutPopup(true)}
              className="text-slate-500 hover:text-destructive"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Logout Popup */}
      {showLogoutPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-[90%] max-w-md rounded-2xl shadow-2xl p-8 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 mx-auto rounded-full bg-rose-50 flex items-center justify-center mb-4">
              <LogOut className="w-8 h-8 text-rose-600" />
            </div>
            <h2 className="text-2xl font-bold text-center text-slate-900 mb-2">Confirm Logout</h2>
            <p className="text-slate-500 text-center mb-6">Are you sure you want to exit your session?</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-11 rounded-xl" onClick={() => setShowLogoutPopup(false)}>
                Cancel
              </Button>
              <Button className="flex-1 h-11 rounded-xl bg-rose-600 hover:bg-rose-700" onClick={handleLogout}>
                Yes, Logout
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-10">
        {/* Header Section with Avatar */}
        <header className="mb-10 flex flex-col md:flex-row md:items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-white shadow-md bg-slate-200 overflow-hidden flex items-center justify-center">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-slate-400" />
              )}
            </div>
            {profile?.is_verified && (
              <div className="absolute bottom-1 right-1 bg-white rounded-full p-0.5">
                <ShieldCheck className="w-6 h-6 text-primary fill-primary/10" />
              </div>
            )}
          </div>

          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-1">
              Hello, {profile?.full_name?.split(' ')[0] || "Client"}
            </h1>
            <div className="flex items-center text-slate-500">
              <MapPin className="w-4 h-4 mr-1.5" />
              <span className="text-sm font-medium">
                {profile?.city ? `${profile.city}, ${profile.country}` : "Location not set"}
              </span>
            </div>
            {profile?.bio && (
              <p className="text-slate-400 text-sm mt-2 max-w-md line-clamp-1 italic">
                "{profile.bio}"
              </p>
            )}
          </div>
        </header>

        {/* Stats Grid - 3 Columns */}
        {/* Stats Grid - Updated with Click Logic */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          {statCards.map((stat) => (
            <Card
              key={stat.label}
              className={`border-none shadow-sm transition-all duration-300 ${stat.label === "Saved Services"
                ? "cursor-pointer hover:shadow-md hover:ring-2 hover:ring-rose-100"
                : ""
                }`}
              onClick={() => {
                if (stat.label === "Saved Services") {
                  navigate("/explore?filter=favorites");
                }
              }}
            >
              <CardContent className="p-6">
                <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                  {stat.label === "Saved Services" && (
                    <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">View All</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Discovery Section */}
        {/* Discovery Section with Smooth Slideshow */}
        <Card className="relative overflow-hidden border-none shadow-2xl min-h-[400px] flex flex-col justify-center">

          {/* --- SLIDESHOW LAYER --- */}
          <div className="absolute inset-0 z-0">
            {discoveryImages.map((img, index) => (
              <div
                key={img}
                className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[2000ms] ease-in-out ${index === bgIndex ? "opacity-100 scale-105" : "opacity-0 scale-100"
                  }`}
                style={{
                  backgroundImage: `url(${img})`,
                  transitionProperty: "opacity, transform"
                }}
              />
            ))}
            {/* Professional Overlay: Darkens the image so white text pops */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px]" />
          </div>

          {/* --- CONTENT LAYER --- */}
          <CardHeader className="relative z-10 pt-12 px-8 md:px-12">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-1 w-8 bg-primary rounded-full" />
              <span className="text-primary-foreground/80 text-xs font-bold uppercase tracking-widest">
                Exclusive Services
              </span>
            </div>
            <CardTitle className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
              Discover Amazing <br />
              <span className="text-primary">Professional</span> Services
            </CardTitle>
          </CardHeader>

          <CardContent className="relative z-10 px-8 md:px-12 pb-12">
            <p className="text-slate-200 max-w-xl mb-8 text-lg leading-relaxed">
              Find and book top-rated professionals near you. We ensure all service providers meet our high quality standards for your peace of mind.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className="font-bold bg-primary hover:bg-primary/90 px-10 rounded-xl shadow-lg shadow-primary/20 transition-all hover:-translate-y-1"
                onClick={() => navigate("/explore")}
              >
                <Search className="w-4 h-4 mr-2" />
                Start Exploring
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-md px-10 rounded-xl transition-all"
                onClick={() => navigate("/my-bookings")}
              >
                My Bookings
              </Button>
            </div>
          </CardContent>

          {/* Simple dot indicators at the bottom */}
          <div className="absolute bottom-6 right-12 z-10 flex gap-1.5">
            {discoveryImages.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-500 ${i === bgIndex ? "w-6 bg-primary" : "w-2 bg-white/30"
                  }`}
              />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
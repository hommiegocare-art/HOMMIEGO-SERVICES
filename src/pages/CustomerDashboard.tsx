import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageSquare, Calendar, MapPin, Heart, Star, LogOut, Search, Home } from "lucide-react";
import { HommieLoader } from "@/components/HommieLoader";
// Define a type for the profile to fix "red lines"
interface Profile {
  full_name: string | null;
  city: string | null;
  country: string | null;
  avatar_url?: string | null;
}

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [stats, setStats] = useState({
    bookings: 0,
    messages: 0,
    reviews: 0,
    favorites: 0,
  });

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

      // Fetch Profile and Stats in parallel for better performance
      const [profileRes, bookingsRes, favoritesRes, reviewsRes, convosRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", session.user.id).single(),
        supabase.from("bookings").select("*", { count: "exact", head: true }).eq("customer_id", session.user.id),
        supabase.from("favorites").select("*", { count: "exact", head: true }).eq("user_id", session.user.id),
        supabase.from("reviews").select("*", { count: "exact", head: true }).eq("customer_id", session.user.id),
        supabase.from("conversations").select("id").eq("customer_id", session.user.id)
      ]);

      setProfile(profileRes.data);

      // Fetch message count if conversations exist
      let messageCount = 0;
      if (convosRes.data?.length) {
        const ids = convosRes.data.map(c => c.id);
        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .in("conversation_id", ids);
        messageCount = count || 0;
      }

      setStats({
        bookings: bookingsRes.count || 0,
        messages: messageCount,
        reviews: reviewsRes.count || 0,
        favorites: favoritesRes.count || 0,
      });

    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to sync dashboard data.",
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

  const statCards = [
    { label: "My Bookings", value: stats.bookings, icon: Calendar, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Messages", value: stats.messages, icon: MessageSquare, color: "text-green-500", bg: "bg-green-50" },
    { label: "Reviews", value: stats.reviews, icon: Star, color: "text-yellow-500", bg: "bg-yellow-50" },
    { label: "Favorites", value: stats.favorites, icon: Heart, color: "text-red-500", bg: "bg-red-50" },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Customer Portal
          </span>

          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2">
              <Home className="w-4 h-4" /> Home
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/explore")} className="gap-2">
              <Search className="w-4 h-4" /> Explore
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/edit-profile")}
            >
              Edit Profile
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/about")}
            >
              About Us
            </Button>
            {/* Logout Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLogoutPopup(true)}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>


          </div>
        </div>
      </nav>
      {/* Custom Logout Popup */}
      {showLogoutPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-[90%] max-w-md rounded-3xl shadow-2xl p-6 animate-in fade-in zoom-in-95">

            {/* Icon */}
            <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
              <LogOut className="w-8 h-8 text-red-600" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-center mb-2">
              Confirm Logout
            </h2>

            {/* Description */}
            <p className="text-muted-foreground text-center mb-6">
              Are you sure you want to logout from your account?
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setShowLogoutPopup(false)}
              >
                Cancel
              </Button>

              <Button
                className="flex-1 rounded-xl bg-red-600 hover:bg-red-700"
                onClick={() => {
                  setShowLogoutPopup(false);
                  handleLogout();
                }}
              >
                Yes, Logout
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <header className="mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-2">
            Welcome, {profile?.full_name?.split(' ')[0] || "Guest"}!
          </h1>
          <div className="flex items-center text-muted-foreground">
            <MapPin className="w-4 h-4 mr-1" />
            <span>{profile?.city ? `${profile.city}, ${profile.country}` : "Location not set"}</span>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {statCards.map((stat) => (
            <Card key={stat.label} className="border-none shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Discovery Section */}
        <Card className="relative overflow-hidden border-none shadow-xl bg-primary text-primary-foreground">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Search className="w-40 h-40" />
          </div>
          <CardHeader className="relative z-10 pt-10 px-10">
            <CardTitle className="text-3xl font-bold">Discover Amazing Services</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10 px-10 pb-10">
            <p className="text-primary-foreground/80 max-w-xl mb-8 text-lg">
              Find and book the best rated professionals in your area. From home repairs to wellness, we've got you covered.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                variant="secondary"
                className="font-semibold px-8"
                onClick={() => navigate("/explore")}
              >
                Explore Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent border-primary-foreground/20 hover:bg-primary-foreground/10 px-8"
                onClick={() => navigate("/my-bookings")}
              >
                View Bookings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
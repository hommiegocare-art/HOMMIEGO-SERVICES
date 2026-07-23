import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/contexts/WorkspaceContext";
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
  Bookmark,
  Building2,
  Users,
  Briefcase,
  ChevronDown,
  CheckCircle,
  Clock,
  UserCheck,
  Stethoscope,
  HeartPulse,
  Activity,
  Award,
  Target,
  Sparkles,
  BadgeCheck
} from "lucide-react";
import { HommieLoader } from "@/components/HommieLoader";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const discoveryImages = [
  "/background1.png",
  "/background2.png",
  "/background3.png",
  "/background4.png",
  "/background5.png",
  "/background6.png",
];

interface Profile {
  full_name: string | null;
  city: string | null;
  country: string | null;
  avatar_url: string | null;
  is_verified: boolean | null;
  bio: string | null;
  current_workspace_id: string | null;
}

interface WorkspaceInfo {
  id: string;
  name: string;
  type: string;
  verification_status: string;
}

interface Booking {
  id: string;
  status: string;
  total_amount: number;
  scheduled_at: string | null;
  services: { title: string };
  provider: { full_name: string };
}

export default function ClientDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentWorkspace, workspaces, switchWorkspace } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userWorkspaces, setUserWorkspaces] = useState<WorkspaceInfo[]>([]);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [stats, setStats] = useState({
    bookings: 0,
    reviews: 0,
    favorites: 0,
    patients: 0,
  });
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % discoveryImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [currentWorkspace]);

  // Get workspace icon
  const getWorkspaceIcon = (type: string) => {
    switch (type) {
      case 'individual':
        return <User className="w-4 h-4" />;
      case 'family':
        return <Users className="w-4 h-4" />;
      case 'organization':
        return <Building2 className="w-4 h-4" />;
      case 'agency':
        return <Briefcase className="w-4 h-4" />;
      default:
        return <Building2 className="w-4 h-4" />;
    }
  };

  // Get workspace type label
  const getWorkspaceTypeLabel = (type: string) => {
    switch (type) {
      case 'individual':
        return 'Independent Provider';
      case 'family':
        return 'Family Workspace';
      case 'organization':
        return 'Healthcare Organization';
      case 'agency':
        return 'Healthcare Agency';
      default:
        return 'Healthcare Provider';
    }
  };

  async function loadDashboard() {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth");
        return;
      }

      const userId = session.user.id;

      // 1. Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, city, country, avatar_url, is_verified, bio, current_workspace_id")
        .eq("id", userId)
        .single();
      setProfile(profileData);

      // 2. Fetch user's workspaces
      const { data: workspaceMembers } = await supabase
        .from("workspace_members")
        .select(`
          workspace_id,
          role,
          workspaces:workspace_id (
            id,
            name,
            type,
            verification_status
          )
        `)
        .eq("user_id", userId)
        .eq("status", "active");

      if (workspaceMembers) {
        const wsData = workspaceMembers
          .map(wm => wm.workspaces)
          .filter(Boolean) as WorkspaceInfo[];
        setUserWorkspaces(wsData);
      }

      // 3. Fetch stats based on workspace
      let bookingsQuery = supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("customer_id", userId);

      if (currentWorkspace) {
        bookingsQuery = bookingsQuery.eq("client_workspace_id", currentWorkspace.id);
      }

      const [bookingsRes, favoritesRes, reviewsRes, recentRes] = await Promise.all([
        bookingsQuery,
        supabase.from("service_favorites").select("*", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("reviews").select("*", { count: "exact", head: true }).eq("customer_id", userId),
        supabase.from("bookings")
          .select(`
            id,
            status,
            total_amount,
            scheduled_at,
            services(title),
            provider:profiles!bookings_provider_id_fkey(full_name)
          `)
          .eq("customer_id", userId)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      // Get family members count if family workspace
      let patientCount = 0;
      if (currentWorkspace?.type === 'family') {
        const { count } = await supabase
          .from("patients")
          .select("*", { count: "exact", head: true })
          .eq("workspace_id", currentWorkspace.id);
        patientCount = count || 0;
      }

      setStats({
        bookings: bookingsRes.count || 0,
        reviews: reviewsRes.count || 0,
        favorites: favoritesRes.count || 0,
        patients: patientCount,
      });

      setRecentBookings(recentRes.data as unknown as Booking[] || []);

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

  // Dynamic stat cards based on workspace type
  const getStatCards = () => {
    const baseStats = [
      { label: "Bookings", value: stats.bookings, icon: Calendar, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30" },
      { label: "Reviews", value: stats.reviews, icon: Star, color: "text-amber-500 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30" },
      { label: "Saved Services", value: stats.favorites, icon: Bookmark, color: "text-rose-500 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/30" },
    ];

    // Add family members stat for family workspace
    if (currentWorkspace?.type === 'family') {
      baseStats.push({
        label: "Family Members",
        value: stats.patients,
        icon: Users,
        color: "text-emerald-500 dark:text-emerald-400",
        bg: "bg-emerald-50 dark:bg-emerald-950/30"
      });
    }

    return baseStats;
  };

  const statCards = getStatCards();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-12 transition-colors duration-300 pt-20 md:pt-24">
      {/* Logout Popup */}
      {showLogoutPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 w-[90%] max-w-md rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in-95 border border-zinc-100 dark:border-transparent transition-colors">
            <div className="w-16 h-16 mx-auto rounded-full bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center mb-4">
              <LogOut className="w-8 h-8 text-rose-600 dark:text-rose-400" />
            </div>
            <h2 className="text-2xl font-bold text-center text-zinc-900 dark:text-white mb-2">Confirm Logout</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-center mb-6">Are you sure you want to exit your session?</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-11 rounded-2xl border-zinc-200 dark:border-transparent dark:text-zinc-300 dark:hover:bg-zinc-800/50" onClick={() => setShowLogoutPopup(false)}>
                Cancel
              </Button>
              <Button className="flex-1 h-11 rounded-2xl bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-700" onClick={handleLogout}>
                Yes, Logout
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full px-4 md:px-6 max-w-6xl mx-auto py-6 md:py-10">
        {/* Header Section with Avatar and Workspace */}
        <header className="mb-8 md:mb-10 flex flex-col md:flex-row md:items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-white dark:border-zinc-700 shadow-md bg-zinc-200 dark:bg-zinc-700 overflow-hidden flex items-center justify-center transition-colors">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-zinc-400 dark:text-zinc-500" />
              )}
            </div>
            {profile?.is_verified && (
              <div className="absolute bottom-1 right-1 bg-white dark:bg-zinc-800 rounded-full p-0.5">
                <BadgeCheck className="w-6 h-6 text-primary fill-primary/10" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-1">
                Hello, {profile?.full_name?.split(' ')[0] || "Patient"}
              </h1>
              {currentWorkspace && (
                <Badge className="bg-primary/10 text-primary border-0 flex items-center gap-1.5 rounded-full px-3 py-1">
                  {getWorkspaceIcon(currentWorkspace.type)}
                  <span className="text-xs font-bold uppercase">
                    {getWorkspaceTypeLabel(currentWorkspace.type)}
                  </span>
                </Badge>
              )}
            </div>
            <div className="flex items-center text-zinc-500 dark:text-zinc-400">
              <MapPin className="w-4 h-4 mr-1.5" />
              <span className="text-sm font-medium">
                {profile?.city ? `${profile.city}, ${profile.country}` : "Location not set"}
              </span>
            </div>
            {profile?.bio && (
              <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-2 max-w-md line-clamp-1 italic">
                "{profile.bio}"
              </p>
            )}
          </div>

          {/* Workspace Selector */}
          {userWorkspaces.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-2xl gap-2 border-zinc-200 dark:border-transparent">
                  <Building2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Switch Workspace</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 rounded-2xl p-2">
                <DropdownMenuLabel className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-3">
                  Your Workspaces
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {userWorkspaces.map((ws) => (
                  <DropdownMenuItem
                    key={ws.id}
                    className={`cursor-pointer rounded-xl p-3 ${currentWorkspace?.id === ws.id ? 'bg-primary/10 dark:bg-primary/20' : ''}`}
                    onClick={() => switchWorkspace(ws.id)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      {getWorkspaceIcon(ws.type)}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{ws.name}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{getWorkspaceTypeLabel(ws.type)}</p>
                      </div>
                      {currentWorkspace?.id === ws.id && (
                        <CheckCircle className="w-4 h-4 text-primary" />
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Quick Action Buttons */}
          <div className="md:ml-auto flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="rounded-2xl border-zinc-200 dark:border-transparent dark:text-zinc-300 dark:hover:bg-zinc-800/50"
              onClick={() => navigate("/edit-profile")}
            >
              <User className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
            <Button
              variant="outline"
              className="rounded-2xl text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-800/30"
              onClick={() => setShowLogoutPopup(true)}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-10 md:mb-12">
          {statCards.map((stat) => (
            <Card
              key={stat.label}
              className={`border border-zinc-100 dark:border-transparent shadow-sm rounded-2xl transition-all duration-300 bg-white dark:bg-zinc-900 ${stat.label === "Saved Services"
                ? "cursor-pointer hover:shadow-md hover:ring-2 hover:ring-rose-100 dark:hover:ring-rose-900/30"
                : stat.label === "Family Members"
                  ? "cursor-pointer hover:shadow-md hover:ring-2 hover:ring-emerald-100 dark:hover:ring-emerald-900/30"
                  : ""
                }`}
              onClick={() => {
                if (stat.label === "Saved Services") {
                  navigate("/explore?filter=favorites");
                }
                if (stat.label === "Family Members" && currentWorkspace?.type === 'family') {
                  navigate("/family/members");
                }
              }}
            >
              <CardContent className="p-5 md:p-6">
                <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4 transition-colors`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <p className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white">{stat.value}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs md:text-sm font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{stat.label}</p>
                  {(stat.label === "Saved Services" || stat.label === "Family Members") && (
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">View All</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Bookings Section */}
        {recentBookings.length > 0 && (
          <div className="mb-10 md:mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Recent Bookings
              </h2>
              <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate("/my-bookings")}>
                View All <ChevronDown className="w-3 h-3 rotate-270" />
              </Button>
            </div>
            <div className="grid gap-3">
              {recentBookings.map((booking) => (
                <Card key={booking.id} className="border border-zinc-100 dark:border-transparent shadow-sm rounded-2xl bg-white dark:bg-zinc-900">
                  <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <HeartPulse className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-white">{booking.services?.title || "Healthcare Service"}</p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">with {booking.provider?.full_name || "Provider"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-bold text-primary">KES {booking.total_amount?.toLocaleString()}</p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">
                          {booking.scheduled_at ? new Date(booking.scheduled_at).toLocaleDateString() : "Pending"}
                        </p>
                      </div>
                      <Badge className={`uppercase text-[10px] font-black px-3 py-1 rounded-full ${booking.status === 'confirmed' ? 'bg-blue-500 text-white' :
                        booking.status === 'completed' ? 'bg-emerald-500 text-white' :
                          booking.status === 'pending' ? 'bg-yellow-500 text-white' :
                            'bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400'
                        }`}>
                        {booking.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Discovery Section */}
        <Card className="relative overflow-hidden border-0 shadow-2xl min-h-[400px] flex flex-col justify-center rounded-3xl bg-zinc-900 dark:bg-zinc-950 transition-colors">
          {/* Slideshow Layer */}
          <div className="absolute inset-0 z-0 rounded-3xl overflow-hidden">
            {discoveryImages.map((img, index) => (
              <div
                key={img}
                className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[2s] ease-in-out ${index === bgIndex ? "opacity-100 scale-105" : "opacity-0 scale-100"
                  }`}
                style={{
                  backgroundImage: `url(${img})`,
                  transitionProperty: "opacity, transform"
                }}
              />
            ))}
            <div className="absolute inset-0 bg-slate-900/60 dark:bg-zinc-950/70 backdrop-blur-[1px]" />
          </div>

          {/* Content Layer */}
          <CardHeader className="relative z-10 pt-12 px-6 md:px-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-1 w-8 bg-primary rounded-full" />
              <span className="text-primary-foreground/80 dark:text-zinc-300 text-xs font-bold uppercase tracking-widest">
                Healthcare Services
              </span>
            </div>
            <CardTitle className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
              Find Professional <br />
              <span className="text-primary">Healthcare</span> Services
            </CardTitle>
          </CardHeader>

          <CardContent className="relative z-10 px-6 md:px-10 pb-12">
            <p className="text-slate-200 dark:text-slate-300 max-w-xl mb-8 text-base md:text-lg leading-relaxed">
              Book licensed healthcare professionals for home visits, nursing care, and medical consultations. Quality care delivered to your doorstep.
            </p>

            <div className="flex flex-wrap gap-3 md:gap-4">
              <Button
                size="lg"
                className="font-bold bg-primary hover:bg-primary/90 px-8 md:px-10 rounded-2xl shadow-lg shadow-primary/20 transition-all hover:-translate-y-1"
                onClick={() => navigate("/explore")}
              >
                <Search className="w-4 h-4 mr-2" />
                Find Care
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 dark:hover:bg-white/30 backdrop-blur-md px-8 md:px-10 rounded-2xl transition-all"
                onClick={() => navigate("/my-bookings")}
              >
                My Bookings
              </Button>

              {currentWorkspace?.type === 'family' && (
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 dark:hover:bg-white/30 backdrop-blur-md px-8 md:px-10 rounded-2xl transition-all"
                  onClick={() => navigate("/family/members")}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Family Members
                </Button>
              )}
            </div>
          </CardContent>

          {/* Dot indicators */}
          <div className="absolute bottom-6 right-6 md:right-10 z-10 flex gap-1.5">
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
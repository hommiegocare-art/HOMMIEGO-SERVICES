// src/pages/FamilyDashboard.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import {
    Users,
    Calendar,
    Heart,
    UserPlus,
    Clock,
    ArrowRight,
    Activity,
    Home,
    User,
    ShieldCheck,
    LogOut,
    Search,
    MapPin,
    Bookmark,
    Star,
    Building2,
    Briefcase,
    ChevronDown,
    CheckCircle,
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

interface FamilyMember {
    id: string;
    full_name: string;
    relationship_to_owner: string;
    phone_number: string;
    date_of_birth: string;
    gender: string;
}

interface Profile {
    full_name: string | null;
    city: string | null;
    country: string | null;
    avatar_url: string | null;
    is_verified: boolean | null;
    bio: string | null;
}

export default function FamilyDashboard() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { currentWorkspace, workspaces, switchWorkspace } = useWorkspace();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
    const [upcomingBookings, setUpcomingBookings] = useState<any[]>([]);
    const [stats, setStats] = useState({
        members: 0,
        bookings: 0,
        activeCare: 0
    });
    const [showLogoutPopup, setShowLogoutPopup] = useState(false);

    useEffect(() => {
        if (currentWorkspace) {
            loadDashboard();
        }
    }, [currentWorkspace]);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate("/auth");
                return;
            }

            if (!currentWorkspace) return;

            const userId = session.user.id;

            // Fetch profile
            const { data: profileData } = await supabase
                .from("profiles")
                .select("full_name, city, country, avatar_url, is_verified, bio")
                .eq("id", userId)
                .single();
            setProfile(profileData);

            // Fetch family members (patients in this workspace)
            const { data: membersData } = await supabase
                .from("patients")
                .select("*")
                .eq("workspace_id", currentWorkspace.id)
                .eq("is_active", true);
            setFamilyMembers(membersData || []);
            setStats(prev => ({ ...prev, members: membersData?.length || 0 }));

            // Fetch upcoming bookings
            const { data: bookingsData } = await supabase
                .from("bookings")
                .select(`
          *,
          services (title),
          provider_workspace:workspaces!bookings_provider_workspace_id_fkey (name)
        `)
                .eq("client_workspace_id", currentWorkspace.id)
                .in("status", ["pending", "confirmed", "in_progress"])
                .order("scheduled_at", { ascending: true })
                .limit(5);

            setUpcomingBookings(bookingsData || []);
            setStats(prev => ({ ...prev, bookings: bookingsData?.length || 0 }));

        } catch (error) {
            console.error("Error loading family dashboard:", error);
            toast({
                title: "Error",
                description: "Failed to load dashboard data",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/");
    };

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

    if (loading) return <HommieLoader />;

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-12 transition-colors duration-300 pt-20 md:pt-24">
            {/* Logout Popup */}
            {showLogoutPopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 w-[90%] max-w-md rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in-95 border border-zinc-100 dark:border-transparent">
                        <div className="w-16 h-16 mx-auto rounded-full bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center mb-4">
                            <LogOut className="w-8 h-8 text-rose-600 dark:text-rose-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-center text-zinc-900 dark:text-white mb-2">Confirm Logout</h2>
                        <p className="text-zinc-500 dark:text-zinc-400 text-center mb-6">Are you sure you want to exit your session?</p>
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1 h-11 rounded-2xl" onClick={() => setShowLogoutPopup(false)}>
                                Cancel
                            </Button>
                            <Button className="flex-1 h-11 rounded-2xl bg-rose-600 hover:bg-rose-700" onClick={handleLogout}>
                                Yes, Logout
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="w-full px-4 md:px-6 max-w-6xl mx-auto py-6 md:py-10">
                {/* Header */}
                <header className="mb-8 md:mb-10 flex flex-col md:flex-row md:items-center gap-6">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full border-4 border-white dark:border-zinc-700 shadow-md bg-zinc-200 dark:bg-zinc-700 overflow-hidden flex items-center justify-center">
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
                            <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-900 dark:text-white">
                                Hello, {profile?.full_name?.split(' ')[0] || "Family"}
                            </h1>
                            <Badge className="bg-primary/10 text-primary border-0 flex items-center gap-1.5 rounded-full px-3 py-1">
                                <Home className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase">{currentWorkspace?.name || 'Family'}</span>
                            </Badge>
                        </div>
                        <div className="flex items-center text-zinc-500 dark:text-zinc-400">
                            <MapPin className="w-4 h-4 mr-1.5" />
                            <span className="text-sm font-medium">
                                {profile?.city ? `${profile.city}, ${profile.country}` : "Location not set"}
                            </span>
                        </div>
                    </div>

                    <div className="md:ml-auto flex flex-wrap gap-3">
                        <Button
                            variant="outline"
                            className="rounded-2xl"
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-10">
                    <Card className="border border-zinc-100 dark:border-transparent shadow-sm rounded-2xl bg-white dark:bg-zinc-900">
                        <CardContent className="p-5 md:p-6">
                            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-4">
                                <Users className="w-6 h-6" />
                            </div>
                            <p className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white">{stats.members}</p>
                            <p className="text-xs md:text-sm font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Family Members</p>
                        </CardContent>
                    </Card>

                    <Card className="border border-zinc-100 dark:border-transparent shadow-sm rounded-2xl bg-white dark:bg-zinc-900">
                        <CardContent className="p-5 md:p-6">
                            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-4">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <p className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white">{stats.bookings}</p>
                            <p className="text-xs md:text-sm font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Upcoming Care</p>
                        </CardContent>
                    </Card>

                    <Card className="border border-zinc-100 dark:border-transparent shadow-sm rounded-2xl bg-white dark:bg-zinc-900">
                        <CardContent className="p-5 md:p-6">
                            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center mb-4">
                                <Heart className="w-6 h-6" />
                            </div>
                            <p className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white">{stats.members}</p>
                            <p className="text-xs md:text-sm font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Active Care Plans</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Family Members & Bookings Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Family Members List */}
                    <Card className="border border-zinc-100 dark:border-transparent shadow-sm rounded-2xl bg-white dark:bg-zinc-900">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Users className="w-5 h-5 text-primary" />
                                    Family Members
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate("/family/members/add")}
                                    className="text-primary"
                                >
                                    <UserPlus className="w-4 h-4 mr-1" />
                                    Add Member
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {familyMembers.length === 0 ? (
                                <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                                    <Users className="w-12 h-12 mx-auto mb-3 text-zinc-300" />
                                    <p>No family members added yet</p>
                                    <Button
                                        variant="outline"
                                        className="mt-4 rounded-xl"
                                        onClick={() => navigate("/family/members/add")}
                                    >
                                        <UserPlus className="w-4 h-4 mr-1" />
                                        Add Your First Family Member
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {familyMembers.map((member) => (
                                        <div
                                            key={member.id}
                                            className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                                            onClick={() => navigate(`/medical-profile/${member.id}`)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                    {member.full_name?.charAt(0) || "?"}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-zinc-900 dark:text-white">
                                                        {member.full_name}
                                                    </p>
                                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                                        {member.relationship_to_owner || "Family Member"}
                                                    </p>
                                                </div>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-zinc-400" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Upcoming Bookings */}
                    <Card className="border border-zinc-100 dark:border-transparent shadow-sm rounded-2xl bg-white dark:bg-zinc-900">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-primary" />
                                    Upcoming Care
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate("/my-bookings")}
                                    className="text-primary"
                                >
                                    View All
                                    <ArrowRight className="w-4 h-4 ml-1" />
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {upcomingBookings.length === 0 ? (
                                <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                                    <Calendar className="w-12 h-12 mx-auto mb-3 text-zinc-300" />
                                    <p>No upcoming care appointments</p>
                                    <Button
                                        variant="outline"
                                        className="mt-4 rounded-xl"
                                        onClick={() => navigate("/explore")}
                                    >
                                        <Search className="w-4 h-4 mr-1" />
                                        Book Care Now
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {upcomingBookings.map((booking) => (
                                        <div key={booking.id} className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-medium text-zinc-900 dark:text-white">
                                                        {booking.services?.title || "Healthcare Service"}
                                                    </p>
                                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                                        {booking.provider_workspace?.name || "Provider"}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Clock className="w-3 h-3 text-zinc-400" />
                                                        <span className="text-xs text-zinc-500">
                                                            {new Date(booking.scheduled_at).toLocaleDateString()} at{" "}
                                                            {new Date(booking.scheduled_at).toLocaleTimeString()}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Badge className={`uppercase text-[10px] font-bold px-2 py-1 rounded-full ${booking.status === 'confirmed' ? 'bg-emerald-500 text-white' :
                                                    booking.status === 'pending' ? 'bg-yellow-500 text-white' :
                                                        'bg-blue-500 text-white'
                                                    }`}>
                                                    {booking.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
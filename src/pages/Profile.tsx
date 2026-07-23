import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { HommieLoader } from "@/components/HommieLoader";
import {
    MapPin,
    Mail,
    Phone,
    Calendar,
    User,
    ShieldCheck,
    Star,
    Heart,
    Users,
    Briefcase,
    Award,
    CheckCircle,
    XCircle,
    Clock,
    MessageSquare,
    ExternalLink,
    Building2,
    Globe,
    ArrowLeft,
    Edit2,
    Camera,
    Sparkles,
    Stethoscope,
    HeartHandshake,
    FileCheck,
    BadgeCheck,
    VerifiedIcon,
    Building,
    Home,
    UserCircle,
    Layers,
    Filter,
    ChevronDown,
    ChevronRight,
    Info,
    AlertCircle,
    TrendingUp,
    Award as AwardIcon,
    Target,
    Zap
} from "lucide-react";
import { format } from "date-fns";

interface ProfileData {
    id: string;
    role: string;
    full_name: string | null;
    username: string | null;
    email: string | null;
    phone_number: string | null;
    avatar_url: string | null;
    cover_image_url: string | null;
    bio: string | null;
    country: string | null;
    city: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    is_verified: boolean;
    is_active: boolean;
    is_banned: boolean;
    last_seen_at: string | null;
    created_at: string;
    updated_at: string;
    current_workspace_id: string | null;
}

interface WorkspaceInfo {
    id: string;
    name: string;
    type: string;
    slug: string;
    verification_status: string;
    description: string | null;
    logo_url: string | null;
    country: string | null;
    county: string | null;
    city: string | null;
}

interface ServiceStats {
    total_services: number;
    total_bookings: number;
    total_reviews: number;
    average_rating: number;
    total_likes: number;
}

interface RecentService {
    id: string;
    title: string;
    cover_image: string | null;
    price: number;
    created_at: string;
    workspace_id: string;
    workspaces?: {
        name: string;
        type: string;
        verification_status: string;
    };
}

export default function ProfilePage() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { currentWorkspace, workspaces, switchWorkspace } = useWorkspace();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [userWorkspaces, setUserWorkspaces] = useState<WorkspaceInfo[]>([]);
    const [stats, setStats] = useState<ServiceStats | null>(null);
    const [recentServices, setRecentServices] = useState<RecentService[]>([]);
    const [isOwner, setIsOwner] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [selectedWorkspaceFilter, setSelectedWorkspaceFilter] = useState<string | null>(null);
    const [showWorkspaceSelector, setShowWorkspaceSelector] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, [userId]);

    const fetchProfile = useCallback(async () => {
        try {
            setLoading(true);

            const { data: { session } } = await supabase.auth.getSession();
            setCurrentUserId(session?.user?.id || null);

            const targetId = userId || session?.user?.id;
            if (!targetId) {
                navigate("/auth");
                return;
            }

            setIsOwner(targetId === session?.user?.id);

            // 1. Fetch profile
            const { data: profileData, error: profileError } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", targetId)
                .single();

            if (profileError) throw profileError;
            setProfile(profileData);

            // 2. Fetch user's workspaces
            const { data: workspaceMembers, error: workspaceError } = await supabase
                .from("workspace_members")
                .select(`
                    workspace_id,
                    role,
                    workspaces:workspace_id (
                        id,
                        name,
                        type,
                        slug,
                        verification_status,
                        description,
                        logo_url,
                        country,
                        county,
                        city
                    )
                `)
                .eq("user_id", targetId)
                .eq("status", "active");

            if (!workspaceError && workspaceMembers) {
                const wsData = workspaceMembers
                    .map(wm => wm.workspaces)
                    .filter(Boolean) as WorkspaceInfo[];
                setUserWorkspaces(wsData);
            }

            // 3. Fetch recent services with workspace info
            let servicesQuery = supabase
                .from("services")
                .select(`
                    id,
                    title,
                    cover_image,
                    price,
                    created_at,
                    workspace_id,
                    workspaces:workspace_id (
                        name,
                        type,
                        verification_status
                    )
                `)
                .eq("provider_id", targetId)
                .eq("is_active", true)
                .order("created_at", { ascending: false })
                .limit(4);

            // Apply workspace filter if selected
            if (selectedWorkspaceFilter) {
                servicesQuery = servicesQuery.eq("workspace_id", selectedWorkspaceFilter);
            }

            const { data: servicesData } = await servicesQuery;
            setRecentServices(servicesData || []);

            // 4. Get stats from service_stats table
            const { data: statsData, error: statsError } = await supabase
                .from("service_stats")
                .select(`
                    service_id,
                    total_likes,
                    total_favorites,
                    total_reviews,
                    average_rating,
                    total_bookings
                `)
                .eq("provider_id", targetId);

            if (statsError) throw statsError;

            // 5. Calculate provider totals
            const providerStats: ServiceStats = {
                total_services: servicesData?.length || 0,
                total_bookings: statsData?.reduce((sum, s) => sum + (s.total_bookings || 0), 0) || 0,
                total_reviews: statsData?.reduce((sum, s) => sum + (s.total_reviews || 0), 0) || 0,
                average_rating: 0,
                total_likes: statsData?.reduce((sum, s) => sum + (s.total_likes || 0), 0) || 0
            };

            // Calculate weighted average rating
            if (providerStats.total_reviews > 0 && statsData) {
                let weightedSum = 0;
                statsData.forEach(s => {
                    weightedSum += (s.average_rating || 0) * (s.total_reviews || 0);
                });
                providerStats.average_rating = weightedSum / providerStats.total_reviews;
            }

            setStats(providerStats);

        } catch (error: any) {
            console.error("Error fetching profile:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to load profile",
                variant: "destructive"
            });
            navigate(-1);
        } finally {
            setLoading(false);
        }
    }, [userId, navigate, toast, selectedWorkspaceFilter]);

    const getInitials = (name: string | null) => {
        if (!name) return "U";
        return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'provider':
                return <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full">Healthcare Provider</Badge>;
            case 'admin':
                return <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border-purple-200 dark:border-purple-800 rounded-full">Administrator</Badge>;
            default:
                return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200 dark:border-blue-800 rounded-full">Patient</Badge>;
        }
    };

    const getWorkspaceIcon = (type: string) => {
        switch (type) {
            case 'individual':
                return <User className="w-4 h-4" />;
            case 'family':
                return <Home className="w-4 h-4" />;
            case 'organization':
                return <Building className="w-4 h-4" />;
            case 'agency':
                return <Briefcase className="w-4 h-4" />;
            default:
                return <Building className="w-4 h-4" />;
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

    const getVerificationBadge = (status: string) => {
        switch (status) {
            case 'verified':
                return {
                    icon: <CheckCircle className="w-3 h-3" />,
                    label: 'Verified',
                    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                };
            case 'pending':
                return {
                    icon: <Clock className="w-3 h-3" />,
                    label: 'Pending',
                    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400'
                };
            default:
                return {
                    icon: <AlertCircle className="w-3 h-3" />,
                    label: 'Unverified',
                    className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                };
        }
    };

    const handleEditProfile = () => {
        navigate("/edit-profile");
    };

    const handleMessage = () => {
        toast({
            title: "Coming Soon",
            description: "Messaging feature will be available soon.",
        });
    };

    const handleWorkspaceSwitch = async (workspaceId: string) => {
        await switchWorkspace(workspaceId);
        setSelectedWorkspaceFilter(workspaceId);
        setShowWorkspaceSelector(false);
        fetchProfile();
    };

    if (loading) return <HommieLoader />;
    if (!profile) return null;

    const isProvider = profile.role === 'provider';

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20 transition-colors duration-300">
            <Navbar />

            <div className="w-full px-0 pt-20 md:pt-24">
                <div className="max-w-4xl mx-auto px-4 md:px-6">

                    {/* Back Button */}
                    <Button
                        variant="ghost"
                        className="mb-4 -ml-2 text-zinc-600 dark:text-zinc-400 gap-2 rounded-2xl"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </Button>

                    {/* Profile Header - Cover Image & Avatar */}
                    <div className="relative mb-20">
                        <div className="w-full h-48 md:h-64 rounded-3xl overflow-hidden bg-gradient-to-r from-primary/20 to-blue-500/20 dark:from-primary/30 dark:to-blue-500/30">
                            {profile.cover_image_url ? (
                                <img
                                    src={profile.cover_image_url}
                                    alt="Cover"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <div className="text-center">
                                        <HeartHandshake className="w-12 h-12 text-primary/40 mx-auto" />
                                        <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-2">Healthcare Professional</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="absolute -bottom-12 left-6 md:left-8">
                            <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-white dark:border-zinc-950 shadow-xl">
                                <AvatarImage src={profile.avatar_url || undefined} />
                                <AvatarFallback className="bg-primary text-white text-3xl font-bold">
                                    {getInitials(profile.full_name)}
                                </AvatarFallback>
                            </Avatar>
                        </div>

                        {isOwner && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="absolute top-4 right-4 rounded-2xl gap-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border-zinc-200 dark:border-zinc-700"
                                onClick={handleEditProfile}
                            >
                                <Edit2 className="w-4 h-4" />
                                Edit Profile
                            </Button>
                        )}
                    </div>

                    {/* Profile Info */}
                    <div className="mb-6">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white">
                                        {profile.full_name || "Anonymous User"}
                                    </h1>
                                    {profile.is_verified && (
                                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 rounded-full gap-1">
                                            <BadgeCheck className="w-3 h-3" />
                                            Verified
                                        </Badge>
                                    )}
                                    {getRoleBadge(profile.role)}
                                </div>

                                {profile.username && (
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                                        @{profile.username}
                                    </p>
                                )}

                                {profile.bio && (
                                    <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-3 max-w-2xl leading-relaxed">
                                        {profile.bio}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-2 flex-wrap">
                                {!isOwner && (
                                    <Button
                                        className="rounded-2xl gap-2"
                                        onClick={handleMessage}
                                    >
                                        <MessageSquare className="w-4 h-4" />
                                        Message
                                    </Button>
                                )}
                                {isProvider && (
                                    <Button
                                        variant="outline"
                                        className="rounded-2xl gap-2"
                                        onClick={() => navigate(`/explore?provider=${profile.id}`)}
                                    >
                                        <Stethoscope className="w-4 h-4" />
                                        View Services
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 mt-4 text-sm text-zinc-500 dark:text-zinc-400">
                            {(profile.city || profile.country) && (
                                <div className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    <span>{[profile.city, profile.country].filter(Boolean).join(", ")}</span>
                                </div>
                            )}
                            {profile.email && (
                                <div className="flex items-center gap-1">
                                    <Mail className="w-4 h-4" />
                                    <span>{profile.email}</span>
                                </div>
                            )}
                            {profile.phone_number && (
                                <div className="flex items-center gap-1">
                                    <Phone className="w-4 h-4" />
                                    <span>{profile.phone_number}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>Joined {format(new Date(profile.created_at), "MMM yyyy")}</span>
                            </div>
                            {profile.last_seen_at && (
                                <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    <span>Last seen {format(new Date(profile.last_seen_at), "MMM d, yyyy")}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2 mt-3">
                            {profile.is_verified && (
                                <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 rounded-full gap-1">
                                    <ShieldCheck className="w-3 h-3" />
                                    Identity Verified
                                </Badge>
                            )}
                            {profile.is_active && (
                                <Badge className="bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 border-green-200 dark:border-green-800 rounded-full gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    Active
                                </Badge>
                            )}
                            {profile.is_banned && (
                                <Badge className="bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-800 rounded-full gap-1">
                                    <XCircle className="w-3 h-3" />
                                    Banned
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Workspace Section */}
                    {userWorkspaces.length > 0 && (
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                                    <Building2 className="w-4 h-4 inline mr-2" />
                                    Workspaces
                                </h3>
                                {userWorkspaces.length > 1 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs gap-1"
                                        onClick={() => setShowWorkspaceSelector(!showWorkspaceSelector)}
                                    >
                                        {showWorkspaceSelector ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                        {userWorkspaces.length} workspaces
                                    </Button>
                                )}
                            </div>

                            {showWorkspaceSelector ? (
                                <div className="space-y-2">
                                    {userWorkspaces.map((ws) => {
                                        const verification = getVerificationBadge(ws.verification_status);
                                        const isActive = currentWorkspace?.id === ws.id || selectedWorkspaceFilter === ws.id;
                                        return (
                                            <div
                                                key={ws.id}
                                                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${isActive
                                                    ? 'bg-primary/10 dark:bg-primary/20 border border-primary/20'
                                                    : 'bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800'
                                                    }`}
                                                onClick={() => handleWorkspaceSwitch(ws.id)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {getWorkspaceIcon(ws.type)}
                                                    <div>
                                                        <p className="font-medium text-sm text-zinc-900 dark:text-white">
                                                            {ws.name}
                                                        </p>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                                                {getWorkspaceTypeLabel(ws.type)}
                                                            </span>
                                                            <span className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full ${verification.className}`}>
                                                                {verification.icon}
                                                                {verification.label}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {isActive && (
                                                    <Badge className="bg-primary/20 text-primary text-[10px]">
                                                        Active
                                                    </Badge>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {userWorkspaces.map((ws) => {
                                        const verification = getVerificationBadge(ws.verification_status);
                                        const isActive = currentWorkspace?.id === ws.id || selectedWorkspaceFilter === ws.id;
                                        return (
                                            <Badge
                                                key={ws.id}
                                                className={`cursor-pointer px-3 py-1.5 rounded-full text-xs ${isActive
                                                    ? 'bg-primary text-white hover:bg-primary/90'
                                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                                    }`}
                                                onClick={() => {
                                                    setSelectedWorkspaceFilter(ws.id);
                                                    fetchProfile();
                                                }}
                                            >
                                                <span className="flex items-center gap-1.5">
                                                    {getWorkspaceIcon(ws.type)}
                                                    {ws.name}
                                                    {ws.verification_status === 'verified' && (
                                                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                                                    )}
                                                </span>
                                            </Badge>
                                        );
                                    })}
                                    {selectedWorkspaceFilter && (
                                        <Badge
                                            className="cursor-pointer px-3 py-1.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                                            onClick={() => {
                                                setSelectedWorkspaceFilter(null);
                                                fetchProfile();
                                            }}
                                        >
                                            <XCircle className="w-3 h-3 mr-1" />
                                            Clear Filter
                                        </Badge>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
                        <Card className="border border-zinc-100 dark:border-transparent shadow-sm rounded-2xl bg-white dark:bg-zinc-900">
                            <CardContent className="p-4 text-center">
                                <div className="text-2xl font-black text-zinc-900 dark:text-white">
                                    {stats?.total_services || 0}
                                </div>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wider">
                                    Services
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="border border-zinc-100 dark:border-transparent shadow-sm rounded-2xl bg-white dark:bg-zinc-900">
                            <CardContent className="p-4 text-center">
                                <div className="text-2xl font-black text-zinc-900 dark:text-white">
                                    {stats?.total_bookings || 0}
                                </div>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wider">
                                    Bookings
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="border border-zinc-100 dark:border-transparent shadow-sm rounded-2xl bg-white dark:bg-zinc-900">
                            <CardContent className="p-4 text-center">
                                <div className="text-2xl font-black text-zinc-900 dark:text-white">
                                    {stats?.average_rating ? stats.average_rating.toFixed(1) : "0.0"}
                                    <span className="text-sm text-zinc-400 dark:text-zinc-500 ml-0.5">★</span>
                                </div>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wider">
                                    Rating ({stats?.total_reviews || 0})
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="border border-zinc-100 dark:border-transparent shadow-sm rounded-2xl bg-white dark:bg-zinc-900">
                            <CardContent className="p-4 text-center">
                                <div className="text-2xl font-black text-zinc-900 dark:text-white">
                                    {stats?.total_likes || 0}
                                </div>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wider">
                                    <Heart className="w-3 h-3 inline text-red-500 fill-red-500" /> Likes
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tabs - Services & Reviews */}
                    <Tabs defaultValue="services" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-2xl mb-6">
                            <TabsTrigger
                                value="services"
                                className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-sm"
                            >
                                <Stethoscope className="w-4 h-4 mr-2" />
                                Services
                            </TabsTrigger>
                            <TabsTrigger
                                value="reviews"
                                className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-sm"
                            >
                                <Star className="w-4 h-4 mr-2" />
                                Reviews
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="services">
                            {isProvider ? (
                                recentServices.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {recentServices.map((service) => (
                                            <Card
                                                key={service.id}
                                                className="border border-zinc-100 dark:border-transparent shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 hover:shadow-md transition-all cursor-pointer"
                                                onClick={() => navigate(`/service/${service.id}`)}
                                            >
                                                <div className="h-40 overflow-hidden">
                                                    <img
                                                        src={service.cover_image || "https://images.unsplash.com/photo-1584515933487-779824d29309?w=400"}
                                                        alt={service.title}
                                                        className="w-full h-full object-cover"
                                                        loading="lazy"
                                                    />
                                                    {service.workspaces && (
                                                        <div className="absolute top-2 left-2">
                                                            <Badge className="bg-black/60 text-white text-[10px] backdrop-blur-sm flex items-center gap-1">
                                                                {getWorkspaceIcon(service.workspaces.type)}
                                                                {service.workspaces.name}
                                                            </Badge>
                                                        </div>
                                                    )}
                                                </div>
                                                <CardContent className="p-4">
                                                    <h3 className="font-bold text-zinc-900 dark:text-white line-clamp-1">
                                                        {service.title}
                                                    </h3>
                                                    <p className="text-sm text-primary font-bold mt-1">
                                                        KES {service.price?.toLocaleString()}
                                                    </p>
                                                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                                                        {format(new Date(service.created_at), "MMM d, yyyy")}
                                                    </p>
                                                    {service.workspaces && (
                                                        <div className="flex items-center gap-1 mt-1">
                                                            <Badge className={`text-[8px] px-1.5 py-0.5 ${service.workspaces.verification_status === 'verified'
                                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                                                                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400'
                                                                }`}>
                                                                {service.workspaces.verification_status === 'verified' ? '✓ Verified' : 'Pending'}
                                                            </Badge>
                                                            <span className="text-[8px] text-zinc-400 dark:text-zinc-500">
                                                                {getWorkspaceTypeLabel(service.workspaces.type)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-transparent shadow-sm">
                                        <Stethoscope className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
                                        <p className="text-zinc-500 dark:text-zinc-400">No services offered yet</p>
                                        {selectedWorkspaceFilter && (
                                            <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
                                                Try clearing the workspace filter
                                            </p>
                                        )}
                                    </div>
                                )
                            ) : (
                                <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-transparent shadow-sm">
                                    <Users className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
                                    <p className="text-zinc-500 dark:text-zinc-400">This user is not a healthcare provider</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="reviews">
                            <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-transparent shadow-sm">
                                <Star className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
                                <p className="text-zinc-500 dark:text-zinc-400">No reviews yet</p>
                                <p className="text-sm text-zinc-400 dark:text-zinc-500">Reviews will appear here once patients share their experience</p>
                            </div>
                        </TabsContent>
                    </Tabs>

                    {/* Trust & Verification Section */}
                    <div className="mt-8 bg-gradient-to-r from-primary/5 to-blue-500/5 dark:from-primary/10 dark:to-blue-500/10 rounded-3xl p-6 border border-primary/10 dark:border-primary/20">
                        <div className="flex items-center gap-3 mb-4">
                            <ShieldCheck className="w-6 h-6 text-primary" />
                            <h3 className="font-bold text-zinc-900 dark:text-white">Trust & Verification</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <BadgeCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm text-zinc-900 dark:text-white">Identity Verified</p>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Profile has been verified</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Star className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm text-zinc-900 dark:text-white">Patient Rating</p>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                        {stats?.average_rating ? `${stats.average_rating.toFixed(1)} ★` : "No ratings yet"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm text-zinc-900 dark:text-white">Active Member</p>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                        {profile.is_active ? "Currently active" : "Inactive"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Edit Profile Button */}
                    {isOwner && (
                        <div className="mt-6">
                            <Button
                                className="w-full rounded-2xl h-12 gap-2"
                                onClick={handleEditProfile}
                            >
                                <Edit2 className="w-4 h-4" />
                                Edit Your Profile
                            </Button>
                            <p className="text-xs text-center text-zinc-400 dark:text-zinc-500 mt-2">
                                Update your personal information, bio, and profile photo
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
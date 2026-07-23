// src/pages/AgencyDashboard.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import {
    Briefcase,
    Users,
    Calendar,
    DollarSign,
    Activity,
    Plus,
    Settings,
    ArrowRight,
    Clock,
    UserPlus,
    TrendingUp,
    ShieldCheck,
    LogOut,
    User,
    MapPin,
    BadgeCheck,
    Building2
} from "lucide-react";
import { HommieLoader } from "@/components/HommieLoader";
import { Badge } from "@/components/ui/badge";

export default function AgencyDashboard() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { currentWorkspace } = useWorkspace();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        providers: 0,
        activeBookings: 0,
        pendingRequests: 0,
        revenue: 0,
    });
    const [recentActivity, setRecentActivity] = useState<any[]>([]);

    useEffect(() => {
        if (currentWorkspace) {
            loadDashboard();
        }
    }, [currentWorkspace]);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            if (!currentWorkspace) return;

            // Get providers count
            const { count: providerCount } = await supabase
                .from("workspace_members")
                .select("*", { count: 'exact', head: true })
                .eq("workspace_id", currentWorkspace.id)
                .eq("status", "active")
                .in("role", ["staff", "manager"]);

            // Get pending bookings
            const { count: pendingCount } = await supabase
                .from("bookings")
                .select("*", { count: 'exact', head: true })
                .eq("provider_workspace_id", currentWorkspace.id)
                .eq("status", "pending");

            // Get active bookings
            const { count: activeCount } = await supabase
                .from("bookings")
                .select("*", { count: 'exact', head: true })
                .eq("provider_workspace_id", currentWorkspace.id)
                .in("status", ["confirmed", "in_progress"]);

            // Get recent activity
            const { data: activityData } = await supabase
                .from("bookings")
                .select(`
          *,
          client_workspace:workspaces!bookings_client_workspace_id_fkey (name),
          services (title)
        `)
                .eq("provider_workspace_id", currentWorkspace.id)
                .order("created_at", { ascending: false })
                .limit(5);

            setStats({
                providers: providerCount || 0,
                activeBookings: activeCount || 0,
                pendingRequests: pendingCount || 0,
                revenue: 0,
            });
            setRecentActivity(activityData || []);

        } catch (error) {
            console.error("Error loading agency dashboard:", error);
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

    if (loading) return <HommieLoader />;

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-12 transition-colors duration-300 pt-20 md:pt-24">
            <div className="w-full px-4 md:px-6 max-w-6xl mx-auto py-6 md:py-10">
                {/* Header */}
                <header className="mb-8 md:mb-10 flex flex-col md:flex-row md:items-center gap-6">
                    <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-900 dark:text-white">
                                {currentWorkspace?.name || 'Agency Dashboard'}
                            </h1>
                            <Badge className="bg-primary/10 text-primary border-0 flex items-center gap-1.5 rounded-full px-3 py-1">
                                <Briefcase className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase">Agency</span>
                            </Badge>
                        </div>
                        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage your healthcare agency's operations</p>
                    </div>

                    <div className="md:ml-auto flex flex-wrap gap-3">
                        <Button variant="outline" className="rounded-2xl" onClick={() => navigate("/settings")}>
                            <Settings className="w-4 h-4 mr-2" />
                            Settings
                        </Button>
                        <Button className="rounded-2xl" onClick={() => navigate("/providers/invite")}>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Add Provider
                        </Button>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
                    <Card className="border border-zinc-100 dark:border-transparent shadow-sm rounded-2xl bg-white dark:bg-zinc-900">
                        <CardContent className="p-5 md:p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-zinc-500">Active Providers</p>
                                    <p className="text-3xl font-bold text-zinc-900 dark:text-white">{stats.providers}</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
                                    <Users className="w-6 h-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-zinc-100 dark:border-transparent shadow-sm rounded-2xl bg-white dark:bg-zinc-900">
                        <CardContent className="p-5 md:p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-zinc-500">Active Bookings</p>
                                    <p className="text-3xl font-bold text-zinc-900 dark:text-white">{stats.activeBookings}</p>
                                </div>
                                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center">
                                    <Calendar className="w-6 h-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-zinc-100 dark:border-transparent shadow-sm rounded-2xl bg-white dark:bg-zinc-900">
                        <CardContent className="p-5 md:p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-zinc-500">Pending Requests</p>
                                    <p className="text-3xl font-bold text-zinc-900 dark:text-white">{stats.pendingRequests}</p>
                                </div>
                                <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center">
                                    <Clock className="w-6 h-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-zinc-100 dark:border-transparent shadow-sm rounded-2xl bg-white dark:bg-zinc-900">
                        <CardContent className="p-5 md:p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-zinc-500">Revenue</p>
                                    <p className="text-3xl font-bold text-zinc-900 dark:text-white">KES 0</p>
                                </div>
                                <div className="w-12 h-12 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center">
                                    <DollarSign className="w-6 h-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Activity */}
                <Card className="border border-zinc-100 dark:border-transparent shadow-sm rounded-2xl bg-white dark:bg-zinc-900">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Activity className="w-5 h-5 text-primary" />
                                Recent Activity
                            </span>
                            <Button variant="ghost" size="sm" onClick={() => navigate("/bookings")} className="text-primary">
                                View All <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentActivity.length === 0 ? (
                            <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                                <Activity className="w-12 h-12 mx-auto mb-3 text-zinc-300" />
                                <p>No recent activity</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentActivity.map((activity) => (
                                    <div key={activity.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                                        <div>
                                            <p className="font-medium text-zinc-900 dark:text-white">
                                                {activity.services?.title || "Healthcare Service"}
                                            </p>
                                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                                {activity.client_workspace?.name || "Client"}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Clock className="w-3 h-3 text-zinc-400" />
                                                <span className="text-xs text-zinc-500">
                                                    {new Date(activity.scheduled_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <Badge className={`uppercase text-[10px] font-bold px-2 py-1 rounded-full ${activity.status === 'confirmed' ? 'bg-emerald-500 text-white' :
                                            activity.status === 'pending' ? 'bg-yellow-500 text-white' :
                                                activity.status === 'completed' ? 'bg-blue-500 text-white' :
                                                    'bg-red-500 text-white'
                                            }`}>
                                            {activity.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
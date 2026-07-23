import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CheckCircle, ImagePlus, LayoutDashboard, Smartphone, XCircle, Zap } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Loader2, Briefcase, Star, MessageSquare,
  Calendar, Plus, MapPin, Trash2, Eye, LogOut, Settings,
  Home, Search, Pencil, User, Menu, Building2, Users,
  ShieldCheck, Clock, Award, Target, TrendingUp, BarChart3,
  UserCheck, Verified, Building, BriefcaseBusiness
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HommieLoader } from "@/components/HommieLoader";
import { useWorkspace } from "@/contexts/WorkspaceContext";

// --- TYPES ---
interface Profile {
  full_name: string | null;
  avatar_url: string | null;
}

interface ProviderProfile {
  business_name: string | null;
  professional_title: string | null;
  license_number: string | null;
  specialties: string[];
  years_experience: number | null;
  average_rating: number | null;
  total_reviews: number | null;
  verification_status: string;
  bio: string | null;
}

interface WorkspaceInfo {
  id: string;
  name: string;
  type: string;
  verification_status: string;
}

interface Subscription {
  status: string;
  plan: string;
  end_date: string;
}

interface Service {
  id: string;
  title: string;
  short_description: string | null;
  price: number | null;
  cover_image: string | null;
  location_name: string | null;
  is_active: boolean | null;
  workspace_id: string;
  categories: { name: string; icon?: string | null } | null;
  service_images: { image_url: string }[] | null;
  workspaces?: {
    name: string;
    type: string;
    verification_status: string;
  };
}

interface Booking {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  scheduled_at: string | null;
  notes: string | null;
  payment_status: string | null;
  whatsapp_number: string;
  booking_type: string | null;
  service_number: number;
  services: { title: string };
  customer: {
    id: string;
    full_name: string;
    avatar_url: string | null
  };
  client_workspace?: {
    name: string;
    type: string;
  };
}

export default function ProviderDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentWorkspace, workspaces, switchWorkspace } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    price: 0,
    short_description: "",
    location_name: ""
  });

  const [profile, setProfile] = useState<Profile | null>(null);
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [userWorkspaces, setUserWorkspaces] = useState<WorkspaceInfo[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [viewingService, setViewingService] = useState<Service | null>(null);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [calculatedRating, setCalculatedRating] = useState(0);
  const [totalReviewCount, setTotalReviewCount] = useState(0);
  const [selectedWorkspaceFilter, setSelectedWorkspaceFilter] = useState<string | null>(null);

  useEffect(() => {
    initializeDashboard();
  }, [currentWorkspace, selectedWorkspaceFilter]);

  async function handleUpdateService() {
    try {
      setLoading(true);
      if (!viewingService) return;

      let finalImageUrl = viewingService.cover_image;

      if (newImageFile) {
        const formData = new FormData();
        formData.append("file", newImageFile);
        formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error("Failed to upload new image to Cloudinary");
        }

        const data = await response.json();
        finalImageUrl = data.secure_url;
      }

      const { error: dbError } = await supabase
        .from("services")
        .update({
          title: editForm.title,
          price: editForm.price,
          short_description: editForm.short_description,
          location_name: editForm.location_name,
          cover_image: finalImageUrl
        })
        .eq("id", viewingService.id);

      if (dbError) throw dbError;

      setServices(prev => prev.map(s =>
        s.id === viewingService.id
          ? { ...s, ...editForm, cover_image: finalImageUrl }
          : s
      ));

      toast({ title: "Updated", description: "Service details and image updated successfully" });

      setIsEditing(false);
      setViewingService(null);
      setNewImageFile(null);
      setImagePreview(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function initializeDashboard() {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }

      const userId = session.user.id;

      // 1. Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", userId)
        .single();
      setProfile(profileData);

      // 2. Fetch provider profile
      const { data: providerData } = await supabase
        .from("provider_profiles")
        .select("business_name, professional_title, license_number, specialties, years_experience, average_rating, total_reviews, verification_status, bio")
        .eq("user_id", userId)
        .single();
      setProviderProfile(providerData);

      // 3. Fetch user's workspaces
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

      // 4. Fetch services with workspace data
      let servicesQuery = supabase
        .from("services")
        .select(`
          id,
          title,
          short_description,
          price,
          cover_image,
          location_name,
          is_active,
          workspace_id,
          categories(name, icon),
          service_images(image_url),
          workspaces:workspace_id (
            name,
            type,
            verification_status
          )
        `)
        .eq("provider_id", userId)
        .order("created_at", { ascending: false });

      // Apply workspace filter if selected
      if (selectedWorkspaceFilter) {
        servicesQuery = servicesQuery.eq("workspace_id", selectedWorkspaceFilter);
      } else if (currentWorkspace) {
        servicesQuery = servicesQuery.eq("workspace_id", currentWorkspace.id);
      }

      const { data: servicesData } = await servicesQuery;
      setServices(servicesData || []);

      // 5. Fetch bookings with workspace data
      let bookingsQuery = supabase
        .from("bookings")
        .select(`
          id,
          status,
          total_amount,
          booking_type,
          service_number,
          scheduled_at,
          notes,
          created_at,
          services(title),
          whatsapp_number,
          customer:profiles!bookings_customer_id_fkey(full_name, avatar_url),
          client_workspace:workspaces!bookings_client_workspace_id_fkey(name, type)
        `)
        .eq("provider_id", userId)
        .order("created_at", { ascending: false });

      if (selectedWorkspaceFilter) {
        bookingsQuery = bookingsQuery.eq("provider_workspace_id", selectedWorkspaceFilter);
      } else if (currentWorkspace) {
        bookingsQuery = bookingsQuery.eq("provider_workspace_id", currentWorkspace.id);
      }

      const { data: bookingsData } = await bookingsQuery;
      setBookings(bookingsData as unknown as Booking[] || []);

      // 6. Fetch subscription
      const { data: subData } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("provider_id", userId)
        .single();
      setSubscription(subData);

      // 7. Fetch reviews for rating
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select("rating")
        .eq("provider_id", userId);

      if (reviewsData && reviewsData.length > 0) {
        const total = reviewsData.length;
        const sum = reviewsData.reduce((acc, r) => acc + (r.rating || 0), 0);
        setCalculatedRating(Number((sum / total).toFixed(1)));
        setTotalReviewCount(total);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Get workspace icon
  const getWorkspaceIcon = (type: string) => {
    switch (type) {
      case 'individual':
        return <User className="w-3 h-3" />;
      case 'family':
        return <Users className="w-3 h-3" />;
      case 'organization':
        return <Building className="w-3 h-3" />;
      case 'agency':
        return <Briefcase className="w-3 h-3" />;
      default:
        return <Building className="w-3 h-3" />;
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

  const stats = useMemo(() => ({
    totalServices: services.length,
    totalBookings: bookings.length,
    totalRevenue: bookings.filter(b => b.status === "completed").reduce((sum, b) => sum + Number(b.total_amount || 0), 0),
    rating: calculatedRating,
    reviewCount: totalReviewCount,
    activeWorkspace: currentWorkspace?.name || 'No Workspace'
  }), [services, bookings, calculatedRating, totalReviewCount, currentWorkspace]);

  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) => {
      if (a.booking_type === 'priority' && b.booking_type !== 'priority') return -1;
      if (b.booking_type === 'priority' && a.booking_type !== 'priority') return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [bookings]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/");
      toast({ title: "Logged out", description: "See you again soon!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const deleteService = async (id: string) => {
    if (!confirm("Are you sure? This will permanently remove this service.")) return;

    try {
      setDeletingId(id);

      const { error: imgError } = await supabase
        .from("service_images")
        .delete()
        .eq("service_id", id);

      if (imgError) throw imgError;

      const { error: srvError } = await supabase
        .from("services")
        .delete()
        .eq("id", id);

      if (srvError) throw srvError;

      setServices(prev => prev.filter(s => s.id !== id));
      toast({ title: "Deleted", description: "Service removed successfully" });

    } catch (err: any) {
      console.error(err);
      toast({
        title: "Delete failed",
        description: "If this service has active bookings, you cannot delete it. Try 'Disabling' it instead.",
        variant: "destructive"
      });
    } finally {
      setDeletingId(null);
    }
  };

  const toggleService = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from("services").update({ is_active: !currentStatus }).eq("id", id);
    if (!error) {
      setServices(prev => prev.map(s => s.id === id ? { ...s, is_active: !currentStatus } : s));
      toast({ title: "Updated", description: `Service ${!currentStatus ? 'enabled' : 'disabled'}` });
    }
  };

  useEffect(() => {
    if (viewingService) {
      setEditForm({
        title: viewingService.title || "",
        price: viewingService.price || 0,
        short_description: viewingService.short_description || "",
        location_name: viewingService.location_name || ""
      });
    }
  }, [viewingService]);

  if (loading) return <HommieLoader />;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20 transition-colors duration-300 pt-24 sm:pt-28">
      <div className="w-full px-4 md:px-6 max-w-7xl mx-auto">

        {/* Workspace Header */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                {currentWorkspace?.name || 'Provider Dashboard'}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge className="bg-primary/10 text-primary border-0 flex items-center gap-1.5 rounded-full px-3 py-1">
                  {currentWorkspace && getWorkspaceIcon(currentWorkspace.type)}
                  <span className="text-xs font-bold uppercase">
                    {currentWorkspace ? getWorkspaceTypeLabel(currentWorkspace.type) : 'Provider'}
                  </span>
                </Badge>
                {currentWorkspace?.verification_status === 'verified' && (
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-0 flex items-center gap-1 rounded-full">
                    <Verified className="w-3 h-3" />
                    Verified
                  </Badge>
                )}
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  {stats.totalServices} services • {stats.totalBookings} bookings
                </span>
              </div>
            </div>

            {/* Workspace Selector Dropdown */}
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
                      onClick={() => {
                        switchWorkspace(ws.id);
                        setSelectedWorkspaceFilter(ws.id);
                      }}
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
          </div>

          {/* Workspace Filter Chips */}
          {userWorkspaces.length > 1 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {userWorkspaces.map((ws) => (
                <Badge
                  key={ws.id}
                  className={`cursor-pointer px-3 py-1.5 rounded-full text-xs transition-all ${selectedWorkspaceFilter === ws.id || (!selectedWorkspaceFilter && currentWorkspace?.id === ws.id)
                    ? 'bg-primary text-white hover:bg-primary/90'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  onClick={() => {
                    if (selectedWorkspaceFilter === ws.id) {
                      setSelectedWorkspaceFilter(null);
                    } else {
                      setSelectedWorkspaceFilter(ws.id);
                    }
                  }}
                >
                  {getWorkspaceIcon(ws.type)}
                  <span className="ml-1">{ws.name}</span>
                </Badge>
              ))}
              {selectedWorkspaceFilter && (
                <Badge
                  className="cursor-pointer px-3 py-1.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  onClick={() => setSelectedWorkspaceFilter(null)}
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  Clear Filter
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
          {[
            { label: "Reviews", val: stats.reviewCount, icon: MessageSquare, color: "text-emerald-600 dark:text-emerald-400" },
            { label: "Rating", val: stats.rating > 0 ? `${stats.rating} / 5` : "No ratings", icon: Star, color: "text-orange-500 dark:text-orange-400" },
            { label: "Services", val: stats.totalServices, icon: Briefcase, color: "text-blue-600 dark:text-blue-400" },
            { label: "Bookings", val: stats.totalBookings, icon: Calendar, color: "text-purple-600 dark:text-purple-400" },
          ].map((s, i) => (
            <Card key={i} className="border border-zinc-100 dark:border-transparent shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 transition-colors">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 ${s.color}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-black tracking-wider">{s.label}</p>
                  <p className="text-xl font-black text-zinc-900 dark:text-white">{s.val}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Floating Action Button */}
        <div className="fixed bottom-6 right-6 z-40">
          <Button
            onClick={() => navigate("/provider/services/new")}
            className="rounded-full h-14 w-14 shadow-2xl shadow-primary/30 bg-primary hover:bg-primary/90"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>

        <Tabs defaultValue="services" className="space-y-4">
          <TabsList className="mx-auto flex w-fit items-center justify-center rounded-2xl border-0 bg-zinc-100 dark:bg-zinc-800/50 p-1 h-14 shadow-sm">
            <TabsTrigger value="services" className="px-6 py-2 rounded-xl text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow dark:text-zinc-400 dark:data-[state=active]:bg-zinc-900 dark:data-[state=active]:text-white">My Services</TabsTrigger>
            <TabsTrigger value="bookings" className="px-6 py-2 rounded-xl text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow dark:text-zinc-400 dark:data-[state=active]:bg-zinc-900 dark:data-[state=active]:text-white">Bookings</TabsTrigger>
            <TabsTrigger value="subscription" className="px-6 py-2 rounded-xl text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow dark:text-zinc-400 dark:data-[state=active]:bg-zinc-900 dark:data-[state=active]:text-white">Subscription</TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="space-y-4">
            {services.length === 0 ? (
              <Card className="p-12 text-center border border-zinc-100 dark:border-transparent shadow-sm rounded-3xl bg-white dark:bg-zinc-900 transition-colors">
                <Briefcase className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-600 mb-4" />
                <h3 className="text-lg font-medium dark:text-white">No services listed</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                  {selectedWorkspaceFilter ? 'Try clearing the workspace filter' : 'Create your first service'}
                </p>
                <Button className="mt-4 rounded-2xl" onClick={() => navigate("/provider/services/new")}>Create Service</Button>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 max-w-7xl mx-auto">
                {services.map((service) => (
                  <Card key={service.id} className="overflow-hidden border border-zinc-100 dark:border-transparent shadow-sm hover:shadow-md transition-shadow rounded-2xl bg-white dark:bg-zinc-900">
                    <div className="relative h-48">
                      <img
                        src={service.cover_image || service.service_images?.[0]?.image_url}
                        className="w-full h-full object-cover"
                        alt={service.title}
                      />
                      <Badge className={`absolute top-3 right-3 rounded-full ${service.is_active ? 'bg-emerald-500' : 'bg-zinc-500'}`}>
                        {service.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {service.workspaces && (
                        <Badge className="absolute bottom-3 left-3 bg-black/60 text-white border-0 flex items-center gap-1 text-[10px]">
                          {getWorkspaceIcon(service.workspaces.type)}
                          {service.workspaces.name}
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-5">
                      <h3 className="font-bold text-lg mb-1 line-clamp-1 text-zinc-900 dark:text-white">{service.title}</h3>
                      <div className="flex items-center text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                        <MapPin className="w-3 h-3 mr-1" /> {service.location_name}
                      </div>
                      <div className="flex justify-between items-end mb-6">
                        <div>
                          <p className="text-[10px] uppercase text-zinc-400 dark:text-zinc-500 font-bold">Price</p>
                          <p className="text-lg font-bold text-primary">KES {Number(service.price).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase text-zinc-400 dark:text-zinc-500 font-bold">Category</p>
                          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{service.categories?.name}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 rounded-xl border-zinc-200 dark:border-transparent dark:text-zinc-300 dark:hover:bg-zinc-800/50" onClick={() => setViewingService(service)}>
                          <Eye className="w-4 h-4 mr-2" /> View
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-xl border-zinc-200 dark:border-transparent dark:text-zinc-300 dark:hover:bg-zinc-800/50" onClick={() => toggleService(service.id, !!service.is_active)}>
                          {service.is_active ? 'Disable' : 'Enable'}
                        </Button>
                        <Button variant="ghost" size="sm" className="rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" disabled={deletingId === service.id} onClick={() => deleteService(service.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="bookings" className="space-y-4">
            {bookings.length === 0 ? (
              <Card className="p-12 text-center border border-zinc-100 dark:border-transparent shadow-sm rounded-3xl bg-white dark:bg-zinc-900 transition-colors">
                <div className="flex flex-col items-center gap-2">
                  <Calendar className="w-10 h-10 opacity-20 text-zinc-400 dark:text-zinc-500" />
                  <p className="text-zinc-500 dark:text-zinc-400">No bookings found yet.</p>
                  {selectedWorkspaceFilter && (
                    <p className="text-sm text-zinc-400 dark:text-zinc-500">Try clearing the workspace filter</p>
                  )}
                </div>
              </Card>
            ) : (
              <div className="grid gap-4 md:gap-6 max-w-6xl mx-auto">
                {sortedBookings.map((booking) => (
                  <Card key={booking.id} className="border border-zinc-100 dark:border-transparent shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 transition-colors">
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row">
                        <div className="p-6 md:p-8 bg-zinc-50/50 dark:bg-zinc-800/30 md:w-64 border-b md:border-b-0 md:border-r border-zinc-100 dark:border-transparent flex flex-col items-center justify-center">
                          <div className="relative mb-4">
                            <div className="h-24 w-24 rounded-2xl bg-white dark:bg-zinc-700 shadow-xl flex items-center justify-center overflow-hidden border-4 border-white dark:border-zinc-700">
                              {booking.customer.avatar_url ? (
                                <img src={booking.customer.avatar_url} className="w-full h-full object-cover" alt={booking.customer.full_name} />
                              ) : (
                                <span className="text-3xl font-black text-primary">{booking.customer.full_name[0]}</span>
                              )}
                            </div>
                          </div>
                          <h4 className="font-black text-zinc-900 dark:text-white text-center text-lg leading-tight">
                            {booking.customer.full_name}
                          </h4>
                          <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-1">Customer</p>
                          <div className="mt-3 flex items-center gap-2">
                            <Badge variant="outline" className="bg-zinc-900 text-white border-none font-mono rounded-full">
                              #{booking.service_number}
                            </Badge>
                            {booking.booking_type === 'priority' ? (
                              <Badge className="bg-orange-500 text-white border-none rounded-full px-3 py-1 text-[10px] font-black shadow-lg">
                                <Zap className="w-3 h-3 mr-1 fill-white" /> Priority
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-zinc-400 border-zinc-200 dark:border-zinc-700 text-[10px] font-bold rounded-full">
                                Regular
                              </Badge>
                            )}
                          </div>
                          {booking.client_workspace && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500">
                              {getWorkspaceIcon(booking.client_workspace.type)}
                              {booking.client_workspace.name}
                            </div>
                          )}
                        </div>

                        <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
                              <div>
                                <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-1">Service Requested</p>
                                <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{booking.services?.title}</h3>
                              </div>
                              <div className="sm:text-right">
                                <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-1">Revenue</p>
                                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">KES {booking.total_amount.toLocaleString()}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                              <div className="space-y-1">
                                <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase flex items-center gap-2">
                                  <Calendar className="w-3 h-3 text-primary" /> Appointment
                                </p>
                                <p className="font-bold text-zinc-700 dark:text-zinc-300">
                                  {booking.scheduled_at ? new Date(booking.scheduled_at).toLocaleString('en-GB', {
                                    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                                  }) : "Not Scheduled"}
                                </p>
                              </div>

                              <div className="space-y-1">
                                <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase flex items-center gap-2">
                                  <MessageSquare className="w-3 h-3 text-primary" /> Instructions
                                </p>
                                <p className="text-zinc-600 dark:text-zinc-400 italic text-sm line-clamp-2">
                                  {booking.notes ? `"${booking.notes}"` : "No specific notes provided."}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                            <Badge className={`uppercase text-[10px] font-black px-4 py-1.5 rounded-full ${booking.status === 'confirmed' ? 'bg-blue-500 text-white' :
                              booking.status === 'completed' ? 'bg-emerald-500 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400'
                              }`}>
                              {booking.status}
                            </Badge>

                            {(booking.status === 'confirmed' || booking.status === 'completed') ? (
                              <Button
                                onClick={() => {
                                  const rawNumber = booking.whatsapp_number || "";
                                  if (!rawNumber) {
                                    toast({ title: "No Number", variant: "destructive" });
                                    return;
                                  }

                                  const cleanNum = rawNumber.startsWith("0") ? `254${rawNumber.substring(1)}` : rawNumber;

                                  const apptDate = booking.scheduled_at
                                    ? new Date(booking.scheduled_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
                                    : "TBD";
                                  const apptTime = booking.scheduled_at
                                    ? new Date(booking.scheduled_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                                    : "TBD";

                                  const message = encodeURIComponent(
                                    `Hello! I am your HommieCare Service Provider regarding your booking for *${booking.services?.title}*.\n\n` +
                                    `🎫 *Service Number:* #${booking.service_number}\n` +
                                    `📅 *Scheduled For:* ${apptDate} at ${apptTime}\n` +
                                    `⚡ *Priority Type:* ${booking.booking_type?.toUpperCase()}\n\n` +
                                    `Thank you for using HommieCare!`
                                  );

                                  window.open(`https://wa.me/${cleanNum}?text=${message}`, '_blank');
                                }}
                                className="rounded-2xl font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
                              >
                                <Smartphone className="w-4 h-4" />
                                WhatsApp Customer
                              </Button>
                            ) : (
                              <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500 italic">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Awaiting Confirmation</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="subscription">
            <Card className="max-w-md border border-zinc-100 dark:border-transparent shadow-sm rounded-3xl bg-white dark:bg-zinc-900 transition-colors">
              <CardHeader>
                <CardTitle className="text-zinc-900 dark:text-white">Plan Details</CardTitle>
                <CardDescription className="text-zinc-500 dark:text-zinc-400">Manage your provider subscription and billing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl transition-colors">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">Status</span>
                  <Badge className="bg-emerald-500 capitalize rounded-full">{subscription?.status || 'Inactive'}</Badge>
                </div>
                <div className="flex justify-between items-center p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl transition-colors">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">Current Plan</span>
                  <span className="font-bold uppercase text-primary">{subscription?.plan || 'None'}</span>
                </div>
                {currentWorkspace && (
                  <div className="flex justify-between items-center p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl transition-colors">
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">Workspace</span>
                    <span className="font-bold text-zinc-900 dark:text-white flex items-center gap-1">
                      {getWorkspaceIcon(currentWorkspace.type)}
                      {currentWorkspace.name}
                    </span>
                  </div>
                )}
                <Button className="w-full rounded-2xl">Upgrade Plan</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Logout Popup */}
      {showLogoutPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 w-[90%] max-w-md rounded-3xl shadow-2xl p-6 animate-in fade-in zoom-in-95 border border-zinc-100 dark:border-transparent transition-colors">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
              <LogOut className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-center mb-2 text-zinc-900 dark:text-white">Confirm Logout</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-center mb-6">
              Are you sure you want to logout from your account?
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-2xl border-zinc-200 dark:border-transparent dark:text-zinc-300 dark:hover:bg-zinc-800/50"
                onClick={() => setShowLogoutPopup(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-2xl bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
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

      {/* Service Detail Modal */}
      <Dialog open={!!viewingService} onOpenChange={() => { setViewingService(null); setIsEditing(false); }}>
        <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden border-0 shadow-2xl bg-white dark:bg-zinc-900 transition-colors">
          {viewingService && (
            <>
              <div className="h-64 w-full relative group">
                <img
                  src={imagePreview || viewingService.cover_image || undefined}
                  className="w-full h-full object-cover"
                  alt={viewingService.title}
                />

                {isEditing && (
                  <label className="absolute inset-0 bg-black/40 dark:bg-black/60 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                    <ImagePlus className="w-10 h-10 text-white mb-2" />
                    <span className="text-white font-bold text-sm">Change Photo</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setNewImageFile(file);
                          setImagePreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                )}

                {!isEditing && (
                  <Badge className="absolute top-4 right-4 rounded-full bg-primary">{viewingService.categories?.name}</Badge>
                )}
                {viewingService.workspaces && (
                  <Badge className="absolute bottom-4 left-4 bg-black/60 text-white border-0 flex items-center gap-1">
                    {getWorkspaceIcon(viewingService.workspaces.type)}
                    {viewingService.workspaces.name}
                  </Badge>
                )}
              </div>

              <div className="p-6 md:p-8">
                <DialogHeader className="mb-6">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="space-y-2 flex-1 w-full">
                      {isEditing ? (
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase">Service Title</Label>
                          <Input
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            className="h-12 text-xl font-bold rounded-2xl border-primary/20 focus:border-primary dark:bg-zinc-800 dark:border-transparent dark:text-white"
                          />
                        </div>
                      ) : (
                        <DialogTitle className="text-3xl font-black text-zinc-900 dark:text-white leading-tight">
                          {viewingService.title}
                        </DialogTitle>
                      )}

                      <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 font-medium">
                        <MapPin className="w-4 h-4 text-primary" />
                        {isEditing ? (
                          <Input
                            value={editForm.location_name}
                            onChange={(e) => setEditForm({ ...editForm, location_name: e.target.value })}
                            className="h-9 rounded-xl border-zinc-200 dark:border-transparent dark:bg-zinc-800 dark:text-white"
                            placeholder="Location"
                          />
                        ) : (
                          <span>{viewingService.location_name || "Location not set"}</span>
                        )}
                      </div>
                    </div>

                    <div className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-100 dark:border-transparent min-w-[150px] text-center transition-colors">
                      <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Price (KES)</p>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editForm.price}
                          onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                          className="h-10 text-center font-bold text-primary rounded-xl border-primary/20 dark:bg-zinc-800 dark:border-transparent"
                        />
                      ) : (
                        <p className="text-2xl font-black text-primary">KES {viewingService.price?.toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-4">
                  <h4 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-primary" /> Service Description
                  </h4>
                  {isEditing ? (
                    <Textarea
                      value={editForm.short_description}
                      onChange={(e) => setEditForm({ ...editForm, short_description: e.target.value })}
                      className="rounded-2xl min-h-[120px] p-4 bg-zinc-50/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-transparent focus:border-primary dark:text-white dark:placeholder:text-zinc-500"
                      placeholder="Describe what you offer..."
                    />
                  ) : (
                    <div className="bg-zinc-50/50 dark:bg-zinc-800/50 rounded-2xl p-4 border border-zinc-100 dark:border-transparent transition-colors">
                      <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed italic">
                        "{viewingService.short_description || "No description provided."}"
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-8 flex gap-3">
                  {isEditing ? (
                    <>
                      <Button
                        className="flex-1 rounded-2xl h-14 font-bold gap-2 shadow-lg shadow-primary/20"
                        onClick={handleUpdateService}
                        disabled={loading}
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                        Save Changes
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 rounded-2xl h-14 font-bold border-zinc-200 dark:border-transparent dark:text-zinc-300 dark:hover:bg-zinc-800/50"
                        onClick={() => setIsEditing(false)}
                      >
                        <XCircle className="w-5 h-5 mr-2" /> Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        className="flex-1 rounded-2xl h-14 font-bold gap-2 shadow-lg shadow-primary/20"
                        onClick={() => setIsEditing(true)}
                      >
                        <Pencil className="w-4 h-4" /> Edit Details
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 rounded-2xl h-14 font-bold border-zinc-200 dark:border-transparent dark:text-zinc-300 dark:hover:bg-zinc-800/50"
                        onClick={() => setViewingService(null)}
                      >
                        Close Preview
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
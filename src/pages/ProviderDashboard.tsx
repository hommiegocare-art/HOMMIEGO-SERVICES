import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CheckCircle, ChevronRight, ImagePlus, Smartphone, XCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
// Add 'User' to your lucide-react imports
import {
  Loader2, DollarSign, Briefcase, Star, MessageSquare,
  Calendar, Plus, MapPin, Trash2, Eye, LogOut, Settings,
  Home, Search, Pencil, User, Menu // <--- Add User and Menu here
} from "lucide-react";

// Add these Dropdown imports
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HommieLoader } from "@/components/HommieLoader";
// --- TYPES TO FIX RED LINES ---
interface Profile {
  full_name: string | null;
  avatar_url: string | null;
}

interface ProviderProfile {
  business_name: string | null;
  tagline: string | null;
  average_rating: number | null;
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
  categories: { name: string; icon?: string | null } | null;
  service_images: { image_url: string }[] | null;
}

// --- UPDATED TYPES ---
interface Booking {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  scheduled_at: string | null; // Added
  notes: string | null;        // Added
  payment_status: string | null; // Added
  whatsapp_number: string; // ADD THIS
  services: { title: string };
  customer: {
    id: string;
    full_name: string;
    avatar_url: string | null
  };
}

export default function ProviderDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    price: 0,
    short_description: "",
    location_name: ""
  });

  // State with proper interfaces
  const [profile, setProfile] = useState<Profile | null>(null);
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [viewingService, setViewingService] = useState<Service | null>(null);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [calculatedRating, setCalculatedRating] = useState(0);
  const [totalReviewCount, setTotalReviewCount] = useState(0);
  useEffect(() => {
    initializeDashboard();
  }, []);
  async function handleUpdateService() {
    try {
      setLoading(true);
      if (!viewingService) return;

      let finalImageUrl = viewingService.cover_image;

      // 1. Check if a new image needs to be uploaded to Cloudinary
      if (newImageFile) {
        // --- NEW CLOUDINARY UPLOAD LOGIC ---
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
        finalImageUrl = data.secure_url; // This is the new link
      }

      // 2. Update the Database Row
      // (We don't need to manually delete the old file from Cloudinary
      // because we are just overwriting the link in the database)
      const { error: dbError } = await supabase
        .from("services")
        .update({
          title: editForm.title,
          price: editForm.price,
          short_description: editForm.short_description,
          location_name: editForm.location_name,
          cover_image: finalImageUrl // Save the new Cloudinary link
        })
        .eq("id", viewingService.id);

      if (dbError) throw dbError;

      // 3. Sync the UI so the changes show up immediately
      setServices(prev => prev.map(s =>
        s.id === viewingService.id
          ? { ...s, ...editForm, cover_image: finalImageUrl }
          : s
      ));

      toast({ title: "Updated", description: "Service details and image updated successfully" });

      // Reset the "Edit Mode"
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }

      const userId = session.user.id;

      // Fetch all data in parallel
      const [pRes, ppRes, subRes, servRes, bookRes, reviewRes] = await Promise.all([
        supabase.from("profiles").select("full_name, avatar_url").eq("id", userId).single(),
        supabase.from("provider_profiles").select("business_name, tagline, average_rating").eq("user_id", userId).single(),
        supabase.from("subscriptions").select("*").eq("provider_id", userId).single(),
        supabase.from("services").select(`id, title, short_description, price, cover_image, location_name, is_active, categories(name, icon), service_images(image_url)`).eq("provider_id", userId).order("created_at", { ascending: false }),
        supabase.from("bookings").select(`id, status, total_amount, created_at, services(title), whatsapp_number, customer:profiles!bookings_customer_id_fkey(full_name, avatar_url)`).eq("provider_id", userId).order("created_at", { ascending: false }),
        // ADD THIS: Fetch all ratings for this provider
        supabase.from("reviews").select("rating").eq("provider_id", userId)
      ]);

      setProfile(pRes.data);
      setProviderProfile(ppRes.data);
      setSubscription(subRes.data);
      setServices(servRes.data || []);
      setBookings(bookRes.data as unknown as Booking[] || []);

      // CALCULATE LIVE RATING
      if (reviewRes.data && reviewRes.data.length > 0) {
        const total = reviewRes.data.length;
        const sum = reviewRes.data.reduce((acc, r) => acc + (r.rating || 0), 0);
        setCalculatedRating(Number((sum / total).toFixed(1)));
        setTotalReviewCount(total);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => ({
    totalServices: services.length,
    totalBookings: bookings.length,
    totalRevenue: bookings.filter(b => b.status === "completed").reduce((sum, b) => sum + Number(b.total_amount || 0), 0),
    // UPDATE THIS LINE:
    rating: calculatedRating,
    reviewCount: totalReviewCount
  }), [services, bookings, calculatedRating, totalReviewCount]);
  // Paste this inside your export default function ProviderDashboard() { ... }
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

      // 1. Delete the images from the 'service_images' table first
      const { error: imgError } = await supabase
        .from("service_images")
        .delete()
        .eq("service_id", id);

      if (imgError) throw imgError;

      // 2. Now delete the service from the 'services' table
      const { error: srvError } = await supabase
        .from("services")
        .delete()
        .eq("id", id);

      if (srvError) throw srvError;

      // 3. If we got here, it's actually deleted! Update the UI.
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


  // When opening the modal, fill the form with the service data
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
    <div className="min-h-screen bg-slate-100/50 pb-20">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b mb-8 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          {/* Left: Branding */}
          <div className="flex items-center gap-4">
            <div className="bg-primary text-white w-10 h-10 rounded-xl flex items-center justify-center font-black shadow-lg shadow-primary/20">
              {providerProfile?.business_name?.[0] || profile?.full_name?.[0] || "P"}
            </div>
            <div className="hidden sm:block">
              <h1 className="font-black text-slate-900 leading-none tracking-tight">
                {providerProfile?.business_name || profile?.full_name}
              </h1>
              <Badge variant="outline" className="mt-1 text-[9px] uppercase border-primary/20 text-primary py-0 px-1">
                Provider Dashboard
              </Badge>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {/* Primary Action - Always visible on desktop */}
            <Button
              size="sm"
              onClick={() => navigate("/provider/services/new")}
              className="rounded-full px-4 h-10 font-bold hidden md:flex gap-2"
            >
              <Plus className="w-4 h-4" /> New Service
            </Button>

            {/* The Unified Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-full h-12 gap-2 px-2 pr-4 border-slate-200 hover:bg-slate-50 transition-all">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <Menu className="w-4 h-4 text-slate-600" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl shadow-2xl border-slate-100 mt-2">
                <DropdownMenuLabel className="p-3">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Navigation</p>
                </DropdownMenuLabel>

                <DropdownMenuItem onClick={() => navigate("/")} className="rounded-xl p-3 cursor-pointer">
                  <Home className="w-4 h-4 mr-3 text-slate-500" /> <span className="font-medium">Public Home</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => navigate("/explore")} className="rounded-xl p-3 cursor-pointer">
                  <Search className="w-4 h-4 mr-3 text-slate-500" /> <span className="font-medium">Explore Services</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-2" />

                <DropdownMenuLabel className="p-3 pt-1">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Account</p>
                </DropdownMenuLabel>

                <DropdownMenuItem onClick={() => navigate("/edit-profile")} className="rounded-xl p-3 cursor-pointer">
                  <Settings className="w-4 h-4 mr-3 text-slate-500" /> <span className="font-medium">Edit Profile</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => navigate("/about")} className="rounded-xl p-3 cursor-pointer">
                  <Briefcase className="w-4 h-4 mr-3 text-slate-500" /> <span className="font-medium">About HommieGo</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-2" />

                <DropdownMenuItem
                  onClick={() => setShowLogoutPopup(true)}
                  className="rounded-xl p-3 cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600"
                >
                  <LogOut className="w-4 h-4 mr-3" /> <span className="font-bold">Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
      <div className="container mx-auto px-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Total Reviews",
              val: stats.reviewCount,
              icon: MessageSquare,
              color: "text-emerald-600"
            },
            {
              label: "Avg Rating",
              val: stats.rating > 0 ? `${stats.rating} / 5` : "No ratings",
              icon: Star,
              color: "text-orange-500"
            },
            {
              label: "My Services",
              val: stats.totalServices,
              icon: Briefcase,
              color: "text-blue-600"
            },
            {
              label: "Bookings",
              val: stats.totalBookings,
              icon: Calendar,
              color: "text-purple-600"
            },
          ].map((s, i) => (
            <Card key={i} className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-slate-50 ${s.color}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">{s.label}</p>
                  <p className="text-xl font-black text-slate-900">{s.val}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Tabs defaultValue="services" className="space-y-6">
          <TabsList className="bg-white border p-1 h-12 w-full justify-start overflow-x-auto">
            <TabsTrigger value="services" className="px-6">My Services</TabsTrigger>
            <TabsTrigger value="bookings" className="px-6">Bookings</TabsTrigger>
            <TabsTrigger value="subscription" className="px-6">Subscription</TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="space-y-4">
            {services.length === 0 ? (
              <Card className="p-12 text-center border-dashed">
                <Briefcase className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-medium">No services listed</h3>
                <Button className="mt-4" onClick={() => navigate("/provider/services/new")}>Create Service</Button>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {services.map((service) => (
                  <Card key={service.id} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow">
                    <div className="relative h-48">
                      <img
                        src={service.cover_image || service.service_images?.[0]?.image_url}
                        className="w-full h-full object-cover"
                        alt=""
                      />
                      <Badge className={`absolute top-3 right-3 ${service.is_active ? 'bg-green-500' : 'bg-slate-500'}`}>
                        {service.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <CardContent className="p-5">
                      <h3 className="font-bold text-lg mb-1 line-clamp-1">{service.title}</h3>
                      <div className="flex items-center text-xs text-muted-foreground mb-4">
                        <MapPin className="w-3 h-3 mr-1" /> {service.location_name}
                      </div>
                      <div className="flex justify-between items-end mb-6">
                        <div>
                          <p className="text-[10px] uppercase text-muted-foreground font-bold">Booking Price</p>
                          <p className="text-lg font-bold text-primary">KES {Number(service.price).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase text-muted-foreground font-bold">Category</p>
                          <p className="text-sm font-medium">{service.categories?.name}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => setViewingService(service)}>
                          <Eye className="w-4 h-4 mr-2" /> View
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => toggleService(service.id, !!service.is_active)}>
                          {service.is_active ? 'Disable' : 'Enable'}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" disabled={deletingId === service.id} onClick={() => deleteService(service.id)}>
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
              <Card className="p-12 text-center border-dashed text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <Calendar className="w-10 h-10 opacity-20" />
                  <p>No bookings found yet.</p>
                </div>
              </Card>
            ) : (
              <div className="grid gap-6">
                {bookings.map((booking) => (
                  <Card key={booking.id} className="border-none shadow-md rounded-[2.5rem] overflow-hidden bg-white">
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row">

                        {/* LEFT SIDE: CUSTOMER IDENTITY ONLY */}
                        <div className="p-8 bg-slate-50/50 md:w-64 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col items-center justify-center">
                          <div className="relative mb-4">
                            <div className="h-24 w-24 rounded-[2rem] bg-white shadow-xl flex items-center justify-center overflow-hidden border-4 border-white">
                              {booking.customer.avatar_url ? (
                                <img src={booking.customer.avatar_url} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-3xl font-black text-primary">{booking.customer.full_name[0]}</span>
                              )}
                            </div>
                          </div>
                          <h4 className="font-black text-slate-900 text-center text-lg leading-tight">
                            {booking.customer.full_name}
                          </h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Customer</p>
                        </div>

                        {/* RIGHT SIDE: BOOKING DETAILS */}
                        <div className="p-8 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex flex-col sm:flex-row justify-between items-start mb-8 gap-4">
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Service Requested</p>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{booking.services?.title}</h3>
                              </div>
                              <div className="sm:text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Revenue</p>
                                <p className="text-3xl font-black text-emerald-600">KES {booking.total_amount.toLocaleString()}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                              {/* Time Detail */}
                              <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2">
                                  <Calendar className="w-3 h-3 text-primary" /> Appointment Date
                                </p>
                                <p className="font-bold text-slate-700">
                                  {booking.scheduled_at ? new Date(booking.scheduled_at).toLocaleString('en-GB', {
                                    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                                  }) : "Not Scheduled"}
                                </p>
                              </div>

                              {/* Notes Detail */}
                              <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2">
                                  <MessageSquare className="w-3 h-3 text-primary" /> Instructions
                                </p>
                                <p className="text-slate-600 italic text-sm line-clamp-2">
                                  {booking.notes ? `"${booking.notes}"` : "No specific notes provided."}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* BOTTOM ACTION BAR */}
                          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                            <Badge className={`uppercase text-[10px] font-black px-4 py-1.5 rounded-full ${booking.status === 'confirmed' ? 'bg-blue-500' :
                              booking.status === 'completed' ? 'bg-emerald-500' : 'bg-slate-200 text-slate-500'
                              }`}>
                              {booking.status}
                            </Badge>

                            {/* CHAT ACTION: ONLY SHOW IF CONFIRMED OR COMPLETED */}
                            {(booking.status === 'confirmed' || booking.status === 'completed') ? (
                              <Button
                                onClick={() => {
                                  // Format number: remove leading 0 and add 254
                                  const rawNumber = booking.whatsapp_number || "";

                                  if (!rawNumber) {
                                    toast({
                                      title: "No WhatsApp Number",
                                      description: "Customer has no WhatsApp number saved.",
                                      variant: "destructive",
                                    });
                                    return;
                                  }

                                  const cleanNum = rawNumber.startsWith("0")
                                    ? `254${rawNumber.substring(1)}`
                                    : rawNumber;
                                  const message = encodeURIComponent(`Hello, I am the professional from HommieGo regarding your booking for ${booking.services?.title}.`);
                                  window.open(`https://wa.me/${cleanNum}?text=${message}`, '_blank');
                                }}
                                className="rounded-xl font-bold gap-2 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200"
                              >
                                <Smartphone className="w-4 h-4" />
                                WhatsApp Customer
                              </Button>
                            ) : (
                              <div className="flex items-center gap-2 text-slate-400 italic">
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
            <Card className="max-w-md border-none shadow-sm">
              <CardHeader>
                <CardTitle>Plan Details</CardTitle>
                <CardDescription>Manage your provider subscription and billing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                  <span className="font-medium">Status</span>
                  <Badge className="bg-green-500 capitalize">{subscription?.status || 'Inactive'}</Badge>
                </div>
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                  <span className="font-medium">Current Plan</span>
                  <span className="font-bold uppercase text-primary">{subscription?.plan || 'None'}</span>
                </div>
                <Button className="w-full">Upgrade Plan</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      {/* FULL DETAILS MODAL */}
      <Dialog open={!!viewingService} onOpenChange={() => { setViewingService(null); setIsEditing(false); }}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
          {viewingService && (
            <>
              <div className="h-64 w-full relative group">
                {/* Show image preview if chosen, otherwise show existing image */}
                <img
                  src={imagePreview || viewingService.cover_image}
                  className="w-full h-full object-cover"
                  alt="Service"
                />

                {isEditing && (
                  <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
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
                  <Badge className="absolute top-4 right-4 bg-primary">{viewingService.categories?.name}</Badge>
                )}
              </div>

              <div className="p-8">
                <DialogHeader className="mb-6">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="space-y-2 flex-1 w-full">
                      {isEditing ? (
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-slate-400 uppercase">Service Title</Label>
                          <Input
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            className="h-12 text-xl font-bold rounded-xl border-primary/20 focus:border-primary"
                          />
                        </div>
                      ) : (
                        <DialogTitle className="text-3xl font-black text-slate-900 leading-tight">
                          {viewingService.title}
                        </DialogTitle>
                      )}

                      <div className="flex items-center gap-2 text-slate-500 font-medium">
                        <MapPin className="w-4 h-4 text-primary" />
                        {isEditing ? (
                          <Input
                            value={editForm.location_name}
                            onChange={(e) => setEditForm({ ...editForm, location_name: e.target.value })}
                            className="h-9 rounded-lg border-slate-200"
                            placeholder="Location"
                          />
                        ) : (
                          <span>{viewingService.location_name || "Location not set"}</span>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 min-w-[150px] text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Price (KES)</p>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editForm.price}
                          onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                          className="h-10 text-center font-bold text-primary rounded-xl border-primary/20"
                        />
                      ) : (
                        <p className="text-2xl font-black text-primary">KES {viewingService.price?.toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-4">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-primary" /> Service Description
                  </h4>
                  {isEditing ? (
                    <Textarea
                      value={editForm.short_description}
                      onChange={(e) => setEditForm({ ...editForm, short_description: e.target.value })}
                      className="rounded-2xl min-h-[120px] p-4 bg-slate-50/50 border-slate-200 focus:border-primary"
                      placeholder="Describe what you offer..."
                    />
                  ) : (
                    <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                      <p className="text-slate-600 leading-relaxed italic">
                        "{viewingService.short_description || "No description provided."}"
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-10 flex gap-3">
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
                        className="flex-1 rounded-2xl h-14 font-bold border-slate-200"
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
                        className="flex-1 rounded-2xl h-14 font-bold border-slate-200"
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
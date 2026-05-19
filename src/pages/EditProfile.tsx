import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Camera, User, MapPin, Globe, Mail, Phone, Info } from "lucide-react";
import { HommieLoader } from "@/components/HommieLoader";
// --- TYPE INTERFACE ---
interface Profile {
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
}

export default function EditProfile() {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<Profile>({
        full_name: "", username: "", email: "", phone_number: "",
        avatar_url: "", cover_image_url: "", bio: "",
        country: "", city: "", address: "",
    });

    // For Image Uploads
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    async function fetchProfile() {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            if (error) throw error;
            if (data) setProfile(data);
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    async function uploadAvatar(userId: string) {
        if (!avatarFile) return profile.avatar_url;

        const fileExt = avatarFile.name.split(".").pop();
        const fileName = `${userId}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        // Upload to 'avatars' bucket
        const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(filePath, avatarFile);

        if (uploadError) throw uploadError;

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from("avatars")
            .getPublicUrl(filePath);

        return publicUrl;
    }

    async function updateProfile() {
        try {
            setSaving(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Handle Image Upload first if a new one is selected
            const finalAvatarUrl = await uploadAvatar(user.id);

            // 2. Update Database
            const { error } = await supabase
                .from("profiles")
                .update({
                    ...profile,
                    avatar_url: finalAvatarUrl,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", user.id);

            if (error) throw error;

            toast({ title: "Success", description: "Your profile has been updated." });
        } catch (err: any) {
            toast({ title: "Update failed", description: err.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <HommieLoader />;

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            <Navbar />

            <div className="max-w-4xl mx-auto pt-32 px-4">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-center gap-8 mb-10">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-white">
                            {avatarPreview || profile.avatar_url ? (
                                <img src={avatarPreview || profile.avatar_url || ""} className="w-full h-full object-cover" alt="Profile" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                                    <User size={48} />
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-1 right-1 bg-primary text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
                        >
                            <Camera size={18} />
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImagePick} />
                    </div>

                    <div className="text-center md:text-left">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Account Settings</h1>
                        <p className="text-slate-500 font-medium">Manage your public profile and contact details</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                    {/* Section 1: Basic Info */}
                    <Card className="rounded-xl border-none shadow-sm overflow-hidden">
                        <div className="bg-slate-900 p-2 flex items-center gap-2 text-white">
                            <Info size={18} className="text-primary" />
                            <span className="font-bold uppercase text-xs tracking-widest">Personal Details</span>
                        </div>
                        <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                    <Input
                                        value={profile.full_name || ""}
                                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                        className="pl-10 h-12 rounded-2xl bg-slate-50 border-none focus-visible:ring-primary"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Username</label>
                                <Input
                                    value={profile.username || ""}
                                    onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                                    className="h-12 rounded-2xl bg-slate-50 border-none focus-visible:ring-primary font-medium"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase ml-1 text-primary">Email Address (Primary)</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                    <Input
                                        disabled
                                        value={profile.email || ""}
                                        className="pl-10 h-12 rounded-2xl bg-slate-100 border-none opacity-60"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                    <Input
                                        value={profile.phone_number || ""}
                                        onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
                                        className="pl-10 h-12 rounded-2xl bg-slate-50 border-none"
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Short Bio</label>
                                <Textarea
                                    rows={4}
                                    placeholder="Tell customers a bit about yourself..."
                                    value={profile.bio || ""}
                                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                    className="rounded-2xl bg-slate-50 border-none p-4"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Section 2: Location */}
                    <Card className="rounded-xl border-none shadow-sm overflow-hidden">
                        <div className="bg-slate-900 p-2 flex items-center gap-2 text-white">
                            <MapPin size={18} className="text-primary" />
                            <span className="font-bold uppercase text-xs tracking-widest">Location Info</span>
                        </div>
                        <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Country</label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                    <Input
                                        value={profile.country || ""}
                                        onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                                        className="pl-10 h-12 rounded-2xl bg-slate-50 border-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase ml-1">City</label>
                                <Input
                                    value={profile.city || ""}
                                    onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                                    className="h-12 rounded-2xl bg-slate-50 border-none"
                                />
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Full Address</label>
                                <Input
                                    value={profile.address || ""}
                                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                                    className="h-12 rounded-2xl bg-slate-50 border-none"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action Button */}
                    <div className="flex gap-4">
                        <Button
                            onClick={updateProfile}
                            disabled={saving}
                            className="flex-1 h-16 rounded-[2rem] text-lg font-black shadow-xl shadow-primary/20 transition-all active:scale-95"
                        >
                            {saving ? <Loader2 className="animate-spin mr-2" /> : null}
                            Save All Changes
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => window.history.back()}
                            className="h-16 px-10 rounded-[2rem] font-bold border-slate-200"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
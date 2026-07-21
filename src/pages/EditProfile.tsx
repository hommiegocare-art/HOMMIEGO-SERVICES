import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
    Loader2,
    Camera,
    User,
    MapPin,
    Globe,
    Mail,
    Phone,
    Info,
    Heart,
    Frown,
    AlertTriangle,
    Save,
    ArrowLeft,
    Trash2,
    BadgeCheck,
    Shield,
    Stethoscope,
    Users,
    Sparkles,
    Eye,
    EyeOff,
    Building2,
    Clock,
    CheckCircle,
    XCircle
} from "lucide-react";
import { HommieLoader } from "@/components/HommieLoader";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

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
    role: string | null;
    is_verified: boolean;
    is_active: boolean;
    is_banned: boolean;
    last_seen_at: string | null;
    created_at: string;
    updated_at: string;
}

export default function EditProfile() {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isProvider, setIsProvider] = useState(false);
    const [isPatient, setIsPatient] = useState(false);

    const [profile, setProfile] = useState<Profile>({
        full_name: "", username: "", email: "", phone_number: "",
        avatar_url: "", cover_image_url: "", bio: "",
        country: "", city: "", address: "", role: "",
        is_verified: false, is_active: true, is_banned: false,
        last_seen_at: null, created_at: "", updated_at: ""
    });

    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteStep, setDeleteStep] = useState<"confirm" | "goodbye" | "deleting">("confirm");
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    async function deleteAccount() {
        try {
            setDeleting(true);
            setDeleteStep("deleting");

            const response = await supabase.functions.invoke("delete-user");
            const { data, error } = response;

            if (error) {
                let customMessage = "Failed to delete account.";
                try {
                    const errorData = await error.context.json();
                    customMessage = errorData?.error || error.message || customMessage;
                } catch {
                    customMessage = error.message || customMessage;
                }
                throw new Error(customMessage);
            }

            if (!data?.success) {
                throw new Error(data?.error || "Your account could not be deleted.");
            }

            setDeleteStep("goodbye");
            await new Promise(resolve => setTimeout(resolve, 3000));

            toast({
                title: "Account Deleted",
                description: data.message || "Your account has been permanently deleted.",
            });

            await supabase.auth.signOut();
            window.location.href = "/";

        } catch (err: any) {
            console.error("Delete account error:", err);
            toast({
                title: "Unable to Delete Account",
                description: err.message || "Something went wrong while deleting your account.",
                variant: "destructive",
            });
            setDeleteStep("confirm");
        } finally {
            setDeleting(false);
        }
    }

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
            if (data) {
                setProfile(data);
                setUserRole(data.role);
                setIsProvider(data.role === 'provider' || data.role === 'medical_provider');
                setIsPatient(data.role === 'patient' || data.role === 'client' || data.role === 'user' || !data.role);
            }
        } catch (err: any) {
            console.error("Error fetching profile:", err);
            toast({
                title: "Error",
                description: "Failed to load profile data",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }

    const handleImagePick = useCallback((e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
        const file = e.target.files?.[0];
        if (file) {
            if (type === 'avatar') {
                setAvatarFile(file);
                setAvatarPreview(URL.createObjectURL(file));
            } else {
                setCoverFile(file);
                setCoverPreview(URL.createObjectURL(file));
            }
        }
    }, []);

    async function uploadImage(file: File): Promise<string> {
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            if (!response.ok) throw new Error("Cloudinary upload failed");

            const data = await response.json();
            return data.secure_url;
        } catch (error) {
            console.error("Upload error:", error);
            throw new Error("Failed to upload image.");
        }
    }

    async function updateProfile() {
        try {
            setSaving(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            let finalAvatarUrl = profile.avatar_url;
            let finalCoverUrl = profile.cover_image_url;

            if (avatarFile) {
                finalAvatarUrl = await uploadImage(avatarFile);
            }
            if (coverFile) {
                finalCoverUrl = await uploadImage(coverFile);
            }

            const { error: profileError } = await supabase
                .from("profiles")
                .update({
                    full_name: profile.full_name,
                    username: profile.username,
                    phone_number: profile.phone_number,
                    bio: profile.bio,
                    country: profile.country,
                    city: profile.city,
                    address: profile.address,
                    avatar_url: finalAvatarUrl,
                    cover_image_url: finalCoverUrl,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", user.id);

            if (profileError) throw profileError;

            toast({
                title: "Profile Updated",
                description: "Your profile changes have been saved successfully.",
                variant: "default"
            });
            setAvatarFile(null);
            setCoverFile(null);
        } catch (err: any) {
            toast({
                title: "Update Failed",
                description: err.message || "Something went wrong. Please try again.",
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <HommieLoader />;

    const getProfileTitle = () => {
        if (isProvider) return "Provider Profile";
        if (isPatient) return "Patient Profile";
        return "My Profile";
    };

    const getProfileSubtitle = () => {
        if (isProvider) return "Manage your professional practice information";
        if (isPatient) return "Manage your personal account information";
        return "Manage your account settings";
    };

    const getRoleIcon = () => {
        if (isProvider) return <Stethoscope className="w-4 h-4 text-primary" />;
        if (isPatient) return <Users className="w-4 h-4 text-primary" />;
        return <User className="w-4 h-4 text-primary" />;
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-24 transition-colors duration-300">
            <Navbar />

            <div className="w-full px-0 pt-20 md:pt-24">
                <div className="max-w-4xl mx-auto px-4 md:px-6">

                    {/* Back Button */}
                    <Button
                        variant="ghost"
                        className="mb-4 -ml-2 text-zinc-600 dark:text-zinc-400 gap-2 rounded-2xl"
                        onClick={() => window.history.back()}
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </Button>

                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
                        {/* Cover Image */}
                        <div className="relative w-full h-32 md:h-40 rounded-3xl overflow-hidden bg-gradient-to-r from-primary/20 to-blue-500/20 dark:from-primary/30 dark:to-blue-500/30">
                            {coverPreview || profile.cover_image_url ? (
                                <img
                                    src={coverPreview || profile.cover_image_url || ""}
                                    className="w-full h-full object-cover"
                                    alt="Cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <div className="text-center">
                                        <Building2 className="w-8 h-8 text-zinc-400 dark:text-zinc-500 mx-auto" />
                                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Cover Image</p>
                                    </div>
                                </div>
                            )}
                            <button
                                onClick={() => coverInputRef.current?.click()}
                                className="absolute bottom-3 right-3 bg-primary text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
                                title="Change cover image"
                            >
                                <Camera size={16} />
                            </button>
                            <input
                                type="file"
                                ref={coverInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => handleImagePick(e, 'cover')}
                            />
                        </div>

                        {/* Avatar */}
                        <div className="relative -mt-16 md:-mt-12 group">
                            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-white dark:border-zinc-950 shadow-xl bg-white dark:bg-zinc-800">
                                {avatarPreview || profile.avatar_url ? (
                                    <img src={avatarPreview || profile.avatar_url || ""} className="w-full h-full object-cover" alt="Profile" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-500">
                                        <User size={40} />
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 bg-primary text-white p-1.5 md:p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
                                title="Change profile picture"
                            >
                                <Camera size={14} className="md:w-4 md:h-4" />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => handleImagePick(e, 'avatar')}
                            />
                        </div>

                        <div className="text-center md:text-left md:ml-2">
                            <div className="flex items-center justify-center md:justify-start gap-2">
                                {getRoleIcon()}
                                <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                                    {getProfileTitle()}
                                </h1>
                            </div>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">{getProfileSubtitle()}</p>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-1.5">
                                {profile.is_verified && (
                                    <BadgeCheck className="w-3.5 h-3.5 text-emerald-500" />
                                )}
                                <span className="text-[10px] md:text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                                    {profile.is_verified ? "Verified Account" : "Unverified Account"}
                                </span>
                                {profile.is_active ? (
                                    <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                                        <CheckCircle className="w-3 h-3" /> Active
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-[10px] text-red-600 dark:text-red-400">
                                        <XCircle className="w-3 h-3" /> Inactive
                                    </span>
                                )}
                            </div>
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-400 mt-1">
                                Role: <span className="font-bold text-primary uppercase">{profile.role || 'client'}</span>
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {/* Section 1: Basic Information */}
                        <Card className="border border-zinc-100 dark:border-transparent shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 transition-colors">
                            <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 dark:from-primary/20 dark:to-blue-500/20 p-4 flex items-center gap-2 border-b border-zinc-100 dark:border-transparent">
                                <Info size={16} className="text-primary" />
                                <span className="font-bold uppercase text-[10px] md:text-xs tracking-widest text-zinc-700 dark:text-zinc-300">
                                    {isProvider ? "Professional Information" : "Personal Information"}
                                </span>
                            </div>
                            <CardContent className="p-4 md:p-6 grid grid-cols-1 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] md:text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase ml-1">
                                        Full Name <span className="text-primary font-normal">*</span>
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                                        <Input
                                            value={profile.full_name || ""}
                                            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                            placeholder={isProvider ? "Dr. Jane Mwangi" : "Jane Mwangi"}
                                            className="pl-9 h-11 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-transparent dark:text-white dark:placeholder:text-zinc-500 focus-visible:ring-primary text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] md:text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase ml-1">
                                        Username <span className="text-primary font-normal">*</span>
                                    </label>
                                    <Input
                                        value={profile.username || ""}
                                        onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                                        placeholder={isProvider ? "drjanemwangi" : "janemwangi"}
                                        className="h-11 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-transparent dark:text-white focus-visible:ring-primary font-medium text-sm"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] md:text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase ml-1">
                                        Email Address <span className="text-primary font-normal">*</span>
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                                        <Input
                                            disabled
                                            value={profile.email || ""}
                                            className="pl-9 h-11 rounded-2xl bg-zinc-100 dark:bg-zinc-700 border-zinc-200 dark:border-transparent opacity-60 dark:text-zinc-400 text-sm"
                                        />
                                    </div>
                                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 ml-1">
                                        Verified email - contact support to change
                                    </p>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] md:text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase ml-1">
                                        Phone Number <span className="text-primary font-normal">*</span>
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                                        <Input
                                            value={profile.phone_number || ""}
                                            onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
                                            placeholder="+254 700 000 000"
                                            className="pl-9 h-11 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-transparent dark:text-white text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] md:text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase ml-1">
                                        {isProvider ? "Professional Bio" : "About You"}
                                    </label>
                                    <Textarea
                                        rows={3}
                                        placeholder={isProvider ?
                                            "Describe your experience, specializations, and healthcare philosophy..." :
                                            "Tell us a bit about yourself..."
                                        }
                                        value={profile.bio || ""}
                                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                        className="rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-transparent p-4 dark:text-white dark:placeholder:text-zinc-500 text-sm min-h-[80px]"
                                    />
                                    <div className="flex justify-between items-center">
                                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 ml-1">
                                            {isProvider ? "Help patients understand your qualifications" : "Tell others about yourself"}
                                        </p>
                                        <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
                                            {profile.bio?.length || 0}/500
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Section: Location */}
                        <Card className="border border-zinc-100 dark:border-transparent shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 transition-colors">
                            <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 dark:from-primary/20 dark:to-blue-500/20 p-4 flex items-center gap-2 border-b border-zinc-100 dark:border-transparent">
                                <MapPin size={16} className="text-primary" />
                                <span className="font-bold uppercase text-[10px] md:text-xs tracking-widest text-zinc-700 dark:text-zinc-300">
                                    {isProvider ? "Practice Location" : "Location"}
                                </span>
                            </div>
                            <CardContent className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] md:text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase ml-1">
                                        Country <span className="text-primary font-normal">*</span>
                                    </label>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                                        <Input
                                            value={profile.country || ""}
                                            onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                                            placeholder="Kenya"
                                            className="pl-9 h-11 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-transparent dark:text-white text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] md:text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase ml-1">
                                        City <span className="text-primary font-normal">*</span>
                                    </label>
                                    <Input
                                        value={profile.city || ""}
                                        onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                                        placeholder="Nairobi"
                                        className="h-11 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-transparent dark:text-white text-sm"
                                    />
                                </div>

                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="text-[10px] md:text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase ml-1">
                                        {isProvider ? "Practice Address" : "Residential Address"}
                                    </label>
                                    <Input
                                        value={profile.address || ""}
                                        onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                                        placeholder={isProvider ? "123 Medical Plaza, Westlands, Nairobi" : "123 Home Street, Estate, Nairobi"}
                                        className="h-11 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-transparent dark:text-white text-sm"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Account Status Section */}
                        <Card className="border border-zinc-100 dark:border-transparent shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 transition-colors">
                            <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 dark:from-primary/20 dark:to-blue-500/20 p-4 flex items-center gap-2 border-b border-zinc-100 dark:border-transparent">
                                <Shield size={16} className="text-primary" />
                                <span className="font-bold uppercase text-[10px] md:text-xs tracking-widest text-zinc-700 dark:text-zinc-300">
                                    Account Status
                                </span>
                            </div>
                            <CardContent className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl">
                                    <BadgeCheck className={`w-5 h-5 ${profile.is_verified ? 'text-emerald-500' : 'text-zinc-400'}`} />
                                    <div>
                                        <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Verification Status</p>
                                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                                            {profile.is_verified ? "✓ Verified Account" : "Unverified Account"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl">
                                    <Clock className="w-5 h-5 text-zinc-400" />
                                    <div>
                                        <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Member Since</p>
                                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                                            {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl">
                                    <Shield className="w-5 h-5 text-zinc-400" />
                                    <div>
                                        <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Account Role</p>
                                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-bold text-primary">
                                            {profile.role || 'Client'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl">
                                    {profile.is_active ? (
                                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-red-500" />
                                    )}
                                    <div>
                                        <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Account Status</p>
                                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                                            {profile.is_active ? "Active" : "Inactive"}
                                            {profile.is_banned && " (Banned)"}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3 mt-2">
                            <Button
                                onClick={updateProfile}
                                disabled={saving}
                                className="w-full h-12 rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 hover:shadow-xl transition-all active:scale-95"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="animate-spin mr-2" size={18} />
                                        Saving Changes...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Profile Changes
                                    </>
                                )}
                            </Button>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => window.history.back()}
                                    className="flex-1 h-11 rounded-2xl font-medium border-2 border-zinc-200 dark:border-transparent dark:text-zinc-300 dark:hover:bg-zinc-800 hover:bg-zinc-50 transition-all text-sm"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Cancel
                                </Button>

                                <Button
                                    variant="destructive"
                                    onClick={() => setShowDeleteModal(true)}
                                    className="flex-1 h-11 rounded-2xl font-medium bg-rose-600 hover:bg-rose-700 transition-all text-sm"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Account
                                </Button>
                            </div>

                            <div className="mt-1.5 flex items-center justify-center gap-2">
                                <Shield className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                                    Fields marked with <span className="text-primary font-bold">*</span> are required
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Modal */}
            <Dialog open={showDeleteModal} onOpenChange={(open) => {
                if (!deleting) {
                    setShowDeleteModal(open);
                    if (!open) setDeleteStep("confirm");
                }
            }}>
                <DialogContent className="sm:max-w-[420px] w-[95vw] rounded-3xl p-0 overflow-hidden border-0 shadow-2xl dark:bg-zinc-900 transition-colors">
                    {deleteStep === "confirm" && (
                        <>
                            <div className="bg-rose-50 dark:bg-rose-950/30 p-6 text-center">
                                <div className="w-14 h-14 mx-auto rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center mb-3">
                                    <Frown className="w-7 h-7 text-rose-600 dark:text-rose-400" />
                                </div>
                                <DialogTitle className="text-xl font-black text-rose-700 dark:text-rose-400 mb-1">
                                    Confirm Account Deletion
                                </DialogTitle>
                                <DialogDescription className="text-rose-600/80 dark:text-rose-300/80 text-sm leading-relaxed">
                                    This action cannot be undone
                                </DialogDescription>
                            </div>

                            <div className="p-6 space-y-3">
                                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-3 flex gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-0.5">Permanent Deletion</p>
                                        <p className="text-xs text-amber-700 dark:text-amber-400/80 leading-relaxed">
                                            All your {isProvider ? 'medical practice data' : 'personal data'} and profile information will be permanently removed.
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-3 text-center">
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">You will lose access to:</p>
                                    <div className="flex justify-center gap-3 text-xs font-medium text-zinc-400 dark:text-zinc-500">
                                        <span>📋 Records</span>
                                        <span>📅 Appointments</span>
                                        <span>⭐ Reviews</span>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-1">
                                    <Button
                                        variant="outline"
                                        className="flex-1 h-10 rounded-2xl font-medium text-sm"
                                        onClick={() => {
                                            setShowDeleteModal(false);
                                            setDeleteStep("confirm");
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        className="flex-1 h-10 rounded-2xl font-medium text-sm bg-rose-600 hover:bg-rose-700"
                                        onClick={deleteAccount}
                                        disabled={deleting}
                                    >
                                        <Trash2 className="w-4 h-4 mr-1.5" />
                                        Delete Permanently
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}

                    {deleteStep === "deleting" && (
                        <div className="p-10 text-center space-y-4">
                            <div className="relative w-16 h-16 mx-auto">
                                <div className="absolute inset-0 rounded-full border-4 border-rose-100 dark:border-rose-900 border-t-rose-500 animate-spin" />
                                <div className="absolute inset-2 rounded-full bg-rose-50 dark:bg-rose-950 flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 text-rose-500 animate-pulse" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">
                                    Deleting Account...
                                </h3>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                    Please wait while we process your request.
                                </p>
                            </div>
                        </div>
                    )}

                    {deleteStep === "goodbye" && (
                        <div className="p-10 text-center space-y-4 animate-in fade-in zoom-in duration-500">
                            <div className="w-16 h-16 mx-auto rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center">
                                <Heart className="w-8 h-8 text-rose-500 dark:text-rose-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-2">
                                    We'll Miss You
                                </h3>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-3">
                                    Your account has been deleted. Thank you for being part of HommieCare Medical.
                                </p>
                                <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">
                                    Redirecting...
                                </p>
                            </div>
                            <div className="flex justify-center gap-1.5">
                                {[0, 1, 2].map((i) => (
                                    <div
                                        key={i}
                                        className="w-1.5 h-1.5 rounded-full bg-rose-300 dark:bg-rose-600 animate-bounce"
                                        style={{ animationDelay: `${i * 0.15}s` }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
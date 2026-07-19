import { useEffect, useState, useRef } from "react";
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
    Users
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
}

export default function EditProfile() {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isProvider, setIsProvider] = useState(false);
    const [isPatient, setIsPatient] = useState(false);

    const [profile, setProfile] = useState<Profile>({
        full_name: "", username: "", email: "", phone_number: "",
        avatar_url: "", cover_image_url: "", bio: "",
        country: "", city: "", address: "", role: ""
    });

    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
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

            // Get profile with role
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

    const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    async function uploadAvatar() {
        if (!avatarFile) return profile.avatar_url;

        try {
            const formData = new FormData();
            formData.append("file", avatarFile);
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
            throw new Error("Failed to upload profile picture.");
        }
    }

    async function updateProfile() {
        try {
            setSaving(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const finalAvatarUrl = await uploadAvatar();

            // Update ONLY the profiles table
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
        <div className="min-h-screen bg-white dark:bg-zinc-950 pb-16 transition-colors duration-300">
            <Navbar />

            <div className="w-full px-0 pt-28 md:pt-32 md:px-4 max-w-4xl mx-auto">
                {/* Header Section */}
                <div className="px-4 md:px-0 flex flex-col md:flex-row items-center gap-6 mb-8">
                    <div className="relative group">
                        <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white dark:border-slate-700 shadow-xl bg-white dark:bg-slate-800">
                            {avatarPreview || profile.avatar_url ? (
                                <img src={avatarPreview || profile.avatar_url || ""} className="w-full h-full object-cover" alt="Profile" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500">
                                    <User size={48} />
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-0 right-0 bg-primary text-white p-2 md:p-2.5 rounded-full shadow-lg hover:scale-110 transition-transform"
                            title="Change profile picture"
                        >
                            <Camera size={16} className="md:w-[18px] md:h-[18px]" />
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImagePick} />
                    </div>

                    <div className="text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-2">
                            {getRoleIcon()}
                            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                {getProfileTitle()}
                            </h1>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{getProfileSubtitle()}</p>
                        <div className="flex items-center justify-center md:justify-start gap-2 mt-1.5">
                            <BadgeCheck className="w-3.5 h-3.5 text-primary" />
                            <span className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500 font-medium">
                                {isProvider ? "Verified Healthcare Provider" : isPatient ? "Verified Patient" : "Verified User"}
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-1">
                            Role: <span className="font-bold text-primary uppercase">{profile.role || 'client'}</span>
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:gap-4">
                    {/* Section 1: Basic Information */}
                    <Card className="rounded-none md:rounded-xl border-0 md:border border-slate-200 dark:border-slate-800 shadow-none md:shadow-sm overflow-hidden dark:bg-gray-950 transition-colors">
                        <div className="bg-slate-900 dark:bg-slate-800 p-3 md:p-4 flex items-center gap-2 text-white">
                            <Info size={16} className="text-primary" />
                            <span className="font-bold uppercase text-[10px] md:text-xs tracking-widest">
                                {isProvider ? "Professional Information" : "Personal Information"}
                            </span>
                        </div>
                        <CardContent className="p-4 md:p-8 grid grid-cols-1 gap-4 md:gap-6">
                            <div className="space-y-1.5 md:space-y-2">
                                <label className="text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">
                                    Full Name <span className="text-primary font-normal">*</span>
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 md:top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
                                    <Input
                                        value={profile.full_name || ""}
                                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                        placeholder={isProvider ? "Dr. Jane Mwangi" : "Jane Mwangi"}
                                        className="pl-9 md:pl-10 h-10 md:h-11 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500 focus-visible:ring-primary text-sm md:text-base"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 ml-1">
                                    {isProvider ? "Your professional name" : "Your full legal name"}
                                </p>
                            </div>

                            <div className="space-y-1.5 md:space-y-2">
                                <label className="text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">
                                    Username <span className="text-primary font-normal">*</span>
                                </label>
                                <Input
                                    value={profile.username || ""}
                                    onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                                    placeholder={isProvider ? "drjanemwangi" : "janemwangi"}
                                    className="h-10 md:h-11 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 dark:text-white focus-visible:ring-primary font-medium text-sm md:text-base"
                                />
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 ml-1">
                                    Your unique username for the platform
                                </p>
                            </div>

                            <div className="space-y-1.5 md:space-y-2">
                                <label className="text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">
                                    Email Address <span className="text-primary font-normal">*</span>
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 md:top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
                                    <Input
                                        disabled
                                        value={profile.email || ""}
                                        className="pl-9 md:pl-10 h-10 md:h-11 rounded-xl md:rounded-2xl bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-700 opacity-60 dark:text-slate-400 text-sm md:text-base"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 ml-1">
                                    Verified email - contact support to change
                                </p>
                            </div>

                            <div className="space-y-1.5 md:space-y-2">
                                <label className="text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">
                                    Phone Number <span className="text-primary font-normal">*</span>
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 md:top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
                                    <Input
                                        value={profile.phone_number || ""}
                                        onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
                                        placeholder="+254 700 000 000"
                                        className="pl-9 md:pl-10 h-10 md:h-11 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 dark:text-white text-sm md:text-base"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 ml-1">
                                    {isProvider ? "Contact number for patients" : "Contact number for appointments"}
                                </p>
                            </div>

                            <div className="space-y-1.5 md:space-y-2">
                                <label className="text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">
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
                                    className="rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 p-3 md:p-4 dark:text-white dark:placeholder:text-slate-500 text-sm md:text-base min-h-[80px] md:min-h-[100px]"
                                />
                                <div className="flex justify-between items-center">
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 ml-1">
                                        {isProvider ? "Help patients understand your qualifications" : "Tell others about yourself"}
                                    </p>
                                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                                        {profile.bio?.length || 0}/500
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Section: Location */}
                    <Card className="rounded-none md:rounded-xl border-0 md:border border-slate-200 dark:border-slate-800 shadow-none md:shadow-sm overflow-hidden dark:bg-gray-950 transition-colors">
                        <div className="bg-slate-900 dark:bg-slate-800 p-3 md:p-4 flex items-center gap-2 text-white">
                            <MapPin size={16} className="text-primary" />
                            <span className="font-bold uppercase text-[10px] md:text-xs tracking-widest">
                                {isProvider ? "Practice Location" : "Location"}
                            </span>
                        </div>
                        <CardContent className="p-4 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            <div className="space-y-1.5 md:space-y-2">
                                <label className="text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">
                                    Country <span className="text-primary font-normal">*</span>
                                </label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-2.5 md:top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
                                    <Input
                                        value={profile.country || ""}
                                        onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                                        placeholder="Kenya"
                                        className="pl-9 md:pl-10 h-10 md:h-11 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 dark:text-white text-sm md:text-base"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5 md:space-y-2">
                                <label className="text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">
                                    City <span className="text-primary font-normal">*</span>
                                </label>
                                <Input
                                    value={profile.city || ""}
                                    onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                                    placeholder="Nairobi"
                                    className="h-10 md:h-11 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 dark:text-white text-sm md:text-base"
                                />
                            </div>

                            <div className="md:col-span-2 space-y-1.5 md:space-y-2">
                                <label className="text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">
                                    {isProvider ? "Practice Address" : "Residential Address"}
                                </label>
                                <Input
                                    value={profile.address || ""}
                                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                                    placeholder={isProvider ? "123 Medical Plaza, Westlands, Nairobi" : "123 Home Street, Estate, Nairobi"}
                                    className="h-10 md:h-11 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 dark:text-white text-sm md:text-base"
                                />
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 ml-1">
                                    {isProvider ? "Your primary practice location" : "Your current residential address"}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="px-4 md:px-0 flex flex-col gap-2 md:gap-3 mt-4">
                        <Button
                            onClick={updateProfile}
                            disabled={saving}
                            className="w-full h-11 md:h-12 rounded-xl md:rounded-2xl text-sm md:text-base font-bold shadow-lg shadow-primary/20 hover:shadow-xl transition-all active:scale-95"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="animate-spin mr-2" size={18} />
                                    Saving Changes...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 md:w-[18px] md:h-[18px] mr-2" />
                                    Save Profile Changes
                                </>
                            )}
                        </Button>

                        <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                            <Button
                                variant="outline"
                                onClick={() => window.history.back()}
                                className="flex-1 h-10 md:h-11 rounded-xl md:rounded-2xl font-medium border-2 border-slate-200 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 hover:bg-slate-50 transition-all text-sm"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Cancel
                            </Button>

                            <Button
                                variant="destructive"
                                onClick={() => setShowDeleteModal(true)}
                                className="flex-1 h-10 md:h-11 rounded-xl md:rounded-2xl font-medium bg-rose-600 hover:bg-rose-700 transition-all text-sm"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Account
                            </Button>
                        </div>

                        <div className="mt-1.5 flex items-center justify-center gap-2">
                            <Shield className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                Fields marked with <span className="text-primary font-bold">*</span> are required
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Modal - Keep as is */}
            <Dialog open={showDeleteModal} onOpenChange={(open) => {
                if (!deleting) {
                    setShowDeleteModal(open);
                    if (!open) setDeleteStep("confirm");
                }
            }}>
                <DialogContent className="sm:max-w-[420px] w-[95vw] rounded-3xl md:rounded-2xl p-0 overflow-hidden border-none shadow-2xl dark:bg-gray-950 transition-colors">
                    {deleteStep === "confirm" && (
                        <>
                            <div className="bg-rose-50 dark:bg-rose-950/50 p-6 md:p-8 text-center">
                                <div className="w-14 h-14 md:w-16 md:h-16 mx-auto rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center mb-3">
                                    <Frown className="w-7 h-7 md:w-8 md:h-8 text-rose-600 dark:text-rose-400" />
                                </div>
                                <DialogTitle className="text-xl md:text-2xl font-black text-rose-700 dark:text-rose-400 mb-1">
                                    Confirm Account Deletion
                                </DialogTitle>
                                <DialogDescription className="text-rose-600/80 dark:text-rose-300/80 text-sm leading-relaxed">
                                    This action cannot be undone
                                </DialogDescription>
                            </div>

                            <div className="p-5 md:p-6 space-y-3">
                                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3 flex gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-0.5">Permanent Deletion</p>
                                        <p className="text-xs text-amber-700 dark:text-amber-400/80 leading-relaxed">
                                            All your {isProvider ? 'medical practice data' : 'personal data'} and profile information will be permanently removed.
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">You will lose access to:</p>
                                    <div className="flex justify-center gap-3 text-xs font-medium text-slate-400 dark:text-slate-500">
                                        <span>📋 Records</span>
                                        <span>📅 Appointments</span>
                                        <span>⭐ Reviews</span>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-1">
                                    <Button
                                        variant="outline"
                                        className="flex-1 h-10 rounded-xl font-medium text-sm"
                                        onClick={() => {
                                            setShowDeleteModal(false);
                                            setDeleteStep("confirm");
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        className="flex-1 h-10 rounded-xl font-medium text-sm bg-rose-600 hover:bg-rose-700"
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
                        <div className="p-8 md:p-10 text-center space-y-4">
                            <div className="relative w-16 h-16 mx-auto">
                                <div className="absolute inset-0 rounded-full border-4 border-rose-100 dark:border-rose-900 border-t-rose-500 animate-spin" />
                                <div className="absolute inset-2 rounded-full bg-rose-50 dark:bg-rose-950 flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 text-rose-500 animate-pulse" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                                    Deleting Account...
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Please wait while we process your request.
                                </p>
                            </div>
                        </div>
                    )}

                    {deleteStep === "goodbye" && (
                        <div className="p-8 md:p-10 text-center space-y-4 animate-in fade-in zoom-in duration-500">
                            <div className="w-16 h-16 mx-auto rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center">
                                <Heart className="w-8 h-8 text-rose-500 dark:text-rose-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
                                    We'll Miss You
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                                    Your account has been deleted. Thank you for being part of HommieCare Medical.
                                </p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 italic">
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
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Camera, User, MapPin, Globe, Mail, Phone, Info, Heart, Frown, AlertTriangle } from "lucide-react";
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

    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    // NEW: Custom Delete Modal State
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

            const { data, error } = await supabase.functions.invoke("delete-user");

            // HANDLE FUNCTION ERRORS
            if (error) {
                throw new Error(error.message || "Failed to delete account.");
            }

            // HANDLE CUSTOM SERVER ERRORS
            if (!data?.success) {
                throw new Error(
                    data?.error ||
                    "Your account could not be deleted."
                );
            }

            // Show goodbye message briefly
            setDeleteStep("goodbye");

            // Wait 3 seconds so they see the emotional message
            await new Promise(resolve => setTimeout(resolve, 3000));

            // SUCCESS MESSAGE
            toast({
                title: "Account Deleted",
                description:
                    data.message ||
                    "Your account has been permanently deleted. We'll miss you! 💔",
            });

            // LOGOUT USER
            await supabase.auth.signOut();

            // REDIRECT HOME
            window.location.href = "/";

        } catch (err: any) {
            console.error("Delete account error:", err);

            toast({
                title: "Unable to Delete Account",
                description:
                    err.message ||
                    "Something went wrong while deleting your account.",
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

    // --- NEW CLOUDINARY UPLOAD FUNCTION ---
    async function uploadAvatar() {
        // If the user didn't pick a new photo, just return the old URL
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
            return data.secure_url; // This is the new Cloudinary link
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

            // 1. Upload to Cloudinary (or get old URL)
            const finalAvatarUrl = await uploadAvatar();

            // 2. Update Supabase Database with the new link
            const { error } = await supabase
                .from("profiles")
                .update({
                    full_name: profile.full_name,
                    username: profile.username,
                    phone_number: profile.phone_number,
                    bio: profile.bio,
                    country: profile.country,
                    city: profile.city,
                    address: profile.address,
                    avatar_url: finalAvatarUrl, // Saving the Cloudinary link here
                    updated_at: new Date().toISOString(),
                })
                .eq("id", user.id);

            if (error) throw error;

            toast({ title: "Success", description: "Your profile has been updated." });
            setAvatarFile(null); // Clear the file after success
        } catch (err: any) {
            toast({ title: "Update failed", description: err.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <HommieLoader />;

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-zinc-950 pb-24 transition-colors duration-300">
            <Navbar />

            <div className="max-w-4xl mx-auto pt-32 px-4">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-center gap-8 mb-10">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-slate-700 shadow-xl bg-white dark:bg-slate-800">
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
                            className="absolute bottom-1 right-1 bg-primary text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
                        >
                            <Camera size={18} />
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImagePick} />
                    </div>

                    <div className="text-center md:text-left">
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Account Settings</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Manage your public profile and contact details</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                    {/* Section 1: Basic Info */}
                    <Card className="rounded-xl border-none shadow-sm overflow-hidden dark:bg-gray-950 transition-colors">
                        <div className="bg-slate-900 dark:bg-slate-800 p-2 flex items-center gap-2 text-white">
                            <Info size={18} className="text-primary" />
                            <span className="font-bold uppercase text-xs tracking-widest">Personal Details</span>
                        </div>
                        <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
                                    <Input
                                        value={profile.full_name || ""}
                                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                        className="pl-10 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none dark:text-white dark:placeholder:text-slate-500 focus-visible:ring-primary"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Username</label>
                                <Input
                                    value={profile.username || ""}
                                    onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                                    className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none dark:text-white focus-visible:ring-primary font-medium"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1 text-primary">Email Address (Primary)</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
                                    <Input
                                        disabled
                                        value={profile.email || ""}
                                        className="pl-10 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700 border-none opacity-60 dark:text-slate-400"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
                                    <Input
                                        value={profile.phone_number || ""}
                                        onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
                                        className="pl-10 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Short Bio</label>
                                <Textarea
                                    rows={4}
                                    placeholder="Tell customers a bit about yourself..."
                                    value={profile.bio || ""}
                                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                    className="rounded-2xl bg-slate-50 dark:bg-slate-800 border-none p-4 dark:text-white dark:placeholder:text-slate-500"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Section 2: Location */}
                    <Card className="rounded-xl border-none shadow-sm overflow-hidden dark:bg-gray-950 transition-colors">
                        <div className="bg-slate-900 dark:bg-slate-800 p-2 flex items-center gap-2 text-white">
                            <MapPin size={18} className="text-primary" />
                            <span className="font-bold uppercase text-xs tracking-widest">Location Info</span>
                        </div>
                        <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Country</label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
                                    <Input
                                        value={profile.country || ""}
                                        onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                                        className="pl-10 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">City</label>
                                <Input
                                    value={profile.city || ""}
                                    onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                                    className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none dark:text-white"
                                />
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Full Address</label>
                                <Input
                                    value={profile.address || ""}
                                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                                    className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none dark:text-white"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action Button */}
                    <div className="flex gap-4 flex-wrap">
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
                            className="h-16 px-10 rounded-[2rem] font-bold border-slate-200 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            Cancel
                        </Button>

                        <Button
                            variant="destructive"
                            onClick={() => setShowDeleteModal(true)}
                            className="h-16 rounded-[2rem] font-bold"
                        >
                            Delete Account
                        </Button>
                    </div>
                </div>
            </div>

            {/* CUSTOM EMOTIONAL DELETE MODAL */}
            <Dialog open={showDeleteModal} onOpenChange={(open) => {
                if (!deleting) {
                    setShowDeleteModal(open);
                    if (!open) setDeleteStep("confirm");
                }
            }}>
                <DialogContent className="sm:max-w-[440px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl dark:bg-gray-950 transition-colors">
                    {/* STEP 1: CONFIRMATION */}
                    {deleteStep === "confirm" && (
                        <>
                            {/* Header with emotional icon */}
                            <div className="bg-rose-50 dark:bg-rose-950/50 p-8 text-center">
                                <div className="w-20 h-20 mx-auto rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center mb-4">
                                    <Frown className="w-10 h-10 text-rose-600 dark:text-rose-400" />
                                </div>
                                <DialogTitle className="text-2xl font-black text-rose-700 dark:text-rose-400 mb-2">
                                    Wait! Don't Go 💔
                                </DialogTitle>
                                <DialogDescription className="text-rose-600/80 dark:text-rose-300/80 text-sm leading-relaxed">
                                    We'd hate to see you leave. Is there anything we can do to make things better?
                                </DialogDescription>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex gap-3">
                                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-1">This action is permanent</p>
                                        <p className="text-xs text-amber-700 dark:text-amber-400/80 leading-relaxed">
                                            All your bookings, reviews, favorites, and profile data will be permanently erased. There's no undo button.
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-center">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Things you'll lose:</p>
                                    <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500">
                                        <span>📋 All Bookings</span>
                                        <span>⭐ Your Reviews</span>
                                        <span>❤️ Saved Services</span>
                                        <span>👤 Profile Data</span>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1 h-12 rounded-2xl font-bold border-slate-200 dark:border-slate-700 dark:text-slate-300"
                                        onClick={() => {
                                            setShowDeleteModal(false);
                                            setDeleteStep("confirm");
                                        }}
                                    >
                                        Keep My Account
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        className="flex-1 h-12 rounded-2xl font-bold bg-rose-600 hover:bg-rose-700"
                                        onClick={deleteAccount}
                                        disabled={deleting}
                                    >
                                        Delete Forever
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* STEP 2: DELETING / LOADING */}
                    {deleteStep === "deleting" && (
                        <div className="p-10 text-center space-y-6">
                            <div className="relative w-20 h-20 mx-auto">
                                <div className="absolute inset-0 rounded-full border-4 border-rose-100 dark:border-rose-900 border-t-rose-500 animate-spin" />
                                <div className="absolute inset-2 rounded-full bg-rose-50 dark:bg-rose-950 flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 text-rose-500 animate-pulse" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                    Deleting Your Account...
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Please wait while we process your request.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: GOODBYE MESSAGE */}
                    {deleteStep === "goodbye" && (
                        <div className="p-10 text-center space-y-6 animate-in fade-in zoom-in duration-500">
                            <div className="w-20 h-20 mx-auto rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center">
                                <Heart className="w-10 h-10 text-rose-500 dark:text-rose-400" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">
                                    We'll Miss You! 🥺
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                                    Your account has been deleted. Thank you for being part of the HommieGo community.
                                    If you ever change your mind, we'll welcome you back with open arms.
                                </p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                                    Redirecting you home...
                                </p>
                            </div>
                            <div className="flex justify-center gap-1">
                                {[0, 1, 2].map((i) => (
                                    <div
                                        key={i}
                                        className="w-2 h-2 rounded-full bg-rose-300 dark:bg-rose-600 animate-bounce"
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
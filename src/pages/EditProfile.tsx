import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/contexts/WorkspaceContext";
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
    XCircle,
    Building,
    Home,
    Briefcase,
    ChevronDown,
    ChevronRight,
    Award,
    Target,
    Zap,
    UserPlus,
    UserMinus,
    Calendar,
    Baby,
    Plus,
    Minus,
    Edit,
    FileText,
    ClipboardCheck,
    Syringe,
    Pill,
    HeartPulse,
    Brain,
    Activity,
    Thermometer,
    Bone,
    Scissors,
    Bandage,
    Droplets,
    Microscope,
    Smile,
    ShieldCheck,
    UserCheck,
    GraduationCap,
    BookOpen,
    Star,
    TrendingUp,
    BarChart3
} from "lucide-react";
import { HommieLoader } from "@/components/HommieLoader";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    current_workspace_id: string | null;
}

interface FamilyMember {
    id: string;
    full_name: string;
    relationship: string;
    date_of_birth: string;
    gender: string;
    phone: string;
    email: string;
    notes: string;
    user_id: string | null;
}

interface Workspace {
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
    role: string;
}

// Provider-specific interface
interface ProviderProfile {
    professional_title: string;
    license_number: string;
    license_type: string;
    specialties: string[];
    years_experience: number;
    bio: string;
    verification_status: string;
}

export default function EditProfile() {
    const { toast } = useToast();
    const { currentWorkspace, workspaces, switchWorkspace, loadWorkspaces } = useWorkspace();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isProvider, setIsProvider] = useState(false);
    const [isPatient, setIsPatient] = useState(false);
    const [userWorkspaces, setUserWorkspaces] = useState<Workspace[]>([]);
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
    const [showWorkspaceSelector, setShowWorkspaceSelector] = useState(false);
    const [workspaceLoading, setWorkspaceLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("profile");

    // Family-specific state
    const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
    const [showAddMember, setShowAddMember] = useState(false);
    const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

    // Provider-specific state
    const [providerProfile, setProviderProfile] = useState<ProviderProfile>({
        professional_title: "",
        license_number: "",
        license_type: "",
        specialties: [],
        years_experience: 0,
        bio: "",
        verification_status: "pending"
    });
    const [specialtyInput, setSpecialtyInput] = useState("");

    const [profile, setProfile] = useState<Profile>({
        full_name: "", username: "", email: "", phone_number: "",
        avatar_url: "", cover_image_url: "", bio: "",
        country: "", city: "", address: "", role: "",
        is_verified: false, is_active: true, is_banned: false,
        last_seen_at: null, created_at: "", updated_at: "",
        current_workspace_id: null
    });

    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteStep, setDeleteStep] = useState<"confirm" | "goodbye" | "deleting">("confirm");
    const [deleting, setDeleting] = useState(false);

    // Get workspace type
    const workspaceType = currentWorkspace?.type || "individual";
    const isFamily = workspaceType === "family";
    const isOrganization = workspaceType === "organization";
    const isAgency = workspaceType === "agency";
    const isIndividual = workspaceType === "individual";

    useEffect(() => {
        fetchProfile();
        fetchUserWorkspaces();
        if (isFamily) {
            fetchFamilyMembers();
        }
        if (isIndividual) {
            fetchProviderProfile();
        }
    }, [currentWorkspace]);

    // Get workspace icon
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

    // Get workspace-specific edit title
    const getEditTitle = () => {
        switch (workspaceType) {
            case 'family':
                return 'Family Profile';
            case 'individual':
                return 'Provider Profile';
            case 'organization':
                return 'Organization Profile';
            case 'agency':
                return 'Agency Profile';
            default:
                return 'My Profile';
        }
    };

    // Get workspace-specific edit subtitle
    const getEditSubtitle = () => {
        switch (workspaceType) {
            case 'family':
                return 'Manage your family members and care preferences';
            case 'individual':
                return 'Manage your professional practice and credentials';
            case 'organization':
                return 'Manage your organization details and staff';
            case 'agency':
                return 'Manage your agency and provider network';
            default:
                return 'Manage your account settings';
        }
    };

    // Get workspace-specific sections
    const getWorkspaceSections = () => {
        switch (workspaceType) {
            case 'family':
                return [
                    { id: 'profile', label: 'Profile', icon: User },
                    { id: 'members', label: 'Family Members', icon: Users },
                    { id: 'preferences', label: 'Care Preferences', icon: Heart }
                ];
            case 'individual':
                return [
                    { id: 'profile', label: 'Profile', icon: User },
                    { id: 'professional', label: 'Professional Details', icon: Stethoscope },
                    { id: 'credentials', label: 'Credentials', icon: ShieldCheck }
                ];
            case 'organization':
                return [
                    { id: 'profile', label: 'Profile', icon: User },
                    { id: 'organization', label: 'Organization Details', icon: Building2 },
                    { id: 'staff', label: 'Staff Management', icon: Users }
                ];
            case 'agency':
                return [
                    { id: 'profile', label: 'Profile', icon: User },
                    { id: 'agency', label: 'Agency Details', icon: Briefcase },
                    { id: 'providers', label: 'Provider Network', icon: Users }
                ];
            default:
                return [
                    { id: 'profile', label: 'Profile', icon: User }
                ];
        }
    };

    // Fetch family members
    async function fetchFamilyMembers() {
        if (!currentWorkspace) return;
        try {
            const { data, error } = await supabase
                .from("family_members")
                .select("*")
                .eq("workspace_id", currentWorkspace.id)
                .order("created_at", { ascending: true });

            if (error) throw error;
            setFamilyMembers(data || []);
        } catch (error) {
            console.error("Error fetching family members:", error);
        }
    }

    // Fetch provider profile
    async function fetchProviderProfile() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from("provider_profiles")
                .select("*")
                .eq("user_id", user.id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            if (data) {
                setProviderProfile({
                    professional_title: data.professional_title || "",
                    license_number: data.license_number || "",
                    license_type: data.license_type || "",
                    specialties: data.specialties || [],
                    years_experience: data.years_experience || 0,
                    bio: data.bio || "",
                    verification_status: data.verification_status || "pending"
                });
            }
        } catch (error) {
            console.error("Error fetching provider profile:", error);
        }
    }

    // Add family member
    async function addFamilyMember(member: Omit<FamilyMember, 'id'>) {
        if (!currentWorkspace) return;
        try {
            const { data, error } = await supabase
                .from("family_members")
                .insert({
                    ...member,
                    workspace_id: currentWorkspace.id
                })
                .select()
                .single();

            if (error) throw error;
            setFamilyMembers([...familyMembers, data]);
            setShowAddMember(false);
            toast({
                title: "Family Member Added",
                description: `${member.full_name} has been added to your family.`,
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to add family member",
                variant: "destructive"
            });
        }
    }

    // Delete family member
    async function deleteFamilyMember(id: string) {
        try {
            const { error } = await supabase
                .from("family_members")
                .delete()
                .eq("id", id);

            if (error) throw error;
            setFamilyMembers(familyMembers.filter(m => m.id !== id));
            toast({
                title: "Member Removed",
                description: "Family member has been removed.",
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to remove family member",
                variant: "destructive"
            });
        }
    }

    // Update provider profile
    async function updateProviderProfile() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from("provider_profiles")
                .upsert({
                    user_id: user.id,
                    professional_title: providerProfile.professional_title,
                    license_number: providerProfile.license_number,
                    license_type: providerProfile.license_type,
                    specialties: providerProfile.specialties,
                    years_experience: providerProfile.years_experience,
                    bio: providerProfile.bio,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
            toast({
                title: "Professional Profile Updated",
                description: "Your professional details have been saved.",
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update professional profile",
                variant: "destructive"
            });
        }
    }

    async function fetchUserWorkspaces() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: workspaceMembers, error } = await supabase
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
                .eq("user_id", user.id)
                .eq("status", "active");

            if (error) throw error;

            if (workspaceMembers) {
                const wsData = workspaceMembers
                    .map(wm => ({
                        ...wm.workspaces,
                        role: wm.role
                    }))
                    .filter(Boolean) as Workspace[];
                setUserWorkspaces(wsData);

                if (wsData.length > 0) {
                    const current = wsData.find(w => w.id === currentWorkspace?.id);
                    setSelectedWorkspaceId(current?.id || wsData[0].id);
                }
            }
        } catch (error) {
            console.error("Error fetching workspaces:", error);
        }
    }

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
                if (data.current_workspace_id) {
                    setSelectedWorkspaceId(data.current_workspace_id);
                }
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

    async function handleWorkspaceSwitch(workspaceId: string) {
        setWorkspaceLoading(true);
        try {
            await switchWorkspace(workspaceId);
            setSelectedWorkspaceId(workspaceId);
            setShowWorkspaceSelector(false);
            toast({
                title: "Workspace Switched",
                description: "Your active workspace has been updated.",
            });
        } catch (error) {
            console.error("Error switching workspace:", error);
            toast({
                title: "Error",
                description: "Failed to switch workspace",
                variant: "destructive"
            });
        } finally {
            setWorkspaceLoading(false);
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

            const updateData: any = {
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
            };

            if (selectedWorkspaceId) {
                updateData.current_workspace_id = selectedWorkspaceId;
            }

            const { error: profileError } = await supabase
                .from("profiles")
                .update(updateData)
                .eq("id", user.id);

            if (profileError) throw profileError;

            // Update provider profile if individual
            if (isIndividual) {
                await updateProviderProfile();
            }

            if (selectedWorkspaceId && selectedWorkspaceId !== profile.current_workspace_id) {
                await switchWorkspace(selectedWorkspaceId);
            }

            toast({
                title: "Profile Updated",
                description: "Your profile changes have been saved successfully.",
                variant: "default"
            });
            setAvatarFile(null);
            setCoverFile(null);
            await loadWorkspaces();
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

    // Render Family Members section
    const renderFamilyMembers = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Family Members</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Manage your family members who receive care
                    </p>
                </div>
                <Button
                    size="sm"
                    className="rounded-xl gap-1"
                    onClick={() => setShowAddMember(true)}
                >
                    <UserPlus className="w-4 h-4" />
                    Add Member
                </Button>
            </div>

            {familyMembers.length === 0 ? (
                <div className="text-center py-8 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl">
                    <Users className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
                    <p className="text-zinc-500 dark:text-zinc-400">No family members added yet</p>
                    <p className="text-sm text-zinc-400 dark:text-zinc-500">Add your family members to start managing their care</p>
                    <Button
                        variant="outline"
                        className="mt-4 rounded-xl"
                        onClick={() => setShowAddMember(true)}
                    >
                        <Plus className="w-4 h-4 mr-1" />
                        Add First Family Member
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {familyMembers.map((member) => (
                        <div key={member.id} className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-transparent">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                        {member.full_name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-zinc-900 dark:text-white">{member.full_name}</p>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{member.relationship}</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full h-8 w-8 p-0"
                                    onClick={() => deleteFamilyMember(member.id)}
                                >
                                    <UserMinus className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                                {member.date_of_birth && (
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(member.date_of_birth).toLocaleDateString()}
                                    </div>
                                )}
                                {member.gender && (
                                    <div className="flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        {member.gender}
                                    </div>
                                )}
                                {member.phone && (
                                    <div className="flex items-center gap-1">
                                        <Phone className="w-3 h-3" />
                                        {member.phone}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Member Dialog */}
            {showAddMember && (
                <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
                    <DialogContent className="rounded-3xl p-6 max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <UserPlus className="w-5 h-5 text-primary" />
                                Add Family Member
                            </DialogTitle>
                            <DialogDescription>
                                Add a family member who will receive care
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target as HTMLFormElement);
                            addFamilyMember({
                                full_name: formData.get('full_name') as string,
                                relationship: formData.get('relationship') as string,
                                date_of_birth: formData.get('date_of_birth') as string,
                                gender: formData.get('gender') as string,
                                phone: formData.get('phone') as string,
                                email: formData.get('email') as string || '',
                                notes: formData.get('notes') as string || '',
                                user_id: null
                            });
                        }}>
                            <div className="space-y-4">
                                <div>
                                    <Label className="text-xs font-bold uppercase text-zinc-500">Full Name *</Label>
                                    <Input name="full_name" placeholder="Mother, Father, Child..." required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs font-bold uppercase text-zinc-500">Relationship *</Label>
                                        <Input name="relationship" placeholder="Mother, Father, Son..." required />
                                    </div>
                                    <div>
                                        <Label className="text-xs font-bold uppercase text-zinc-500">Gender</Label>
                                        <Select name="gender">
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="male">Male</SelectItem>
                                                <SelectItem value="female">Female</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs font-bold uppercase text-zinc-500">Date of Birth</Label>
                                    <Input name="date_of_birth" type="date" />
                                </div>
                                <div>
                                    <Label className="text-xs font-bold uppercase text-zinc-500">Phone</Label>
                                    <Input name="phone" placeholder="+254 700 000 000" />
                                </div>
                                <div>
                                    <Label className="text-xs font-bold uppercase text-zinc-500">Email</Label>
                                    <Input name="email" type="email" placeholder="email@example.com" />
                                </div>
                                <div>
                                    <Label className="text-xs font-bold uppercase text-zinc-500">Notes</Label>
                                    <Textarea name="notes" placeholder="Any special care notes..." rows={2} />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setShowAddMember(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1 rounded-xl">
                                    <Plus className="w-4 h-4 mr-1" />
                                    Add Member
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );

    // Render Professional Details section (Provider)
    const renderProfessionalDetails = () => (
        <div className="space-y-4">
            <div>
                <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Professional Details</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Update your professional credentials and specialties</p>
            </div>

            <div className="space-y-4">
                <div>
                    <Label className="text-xs font-bold uppercase text-zinc-500">Professional Title</Label>
                    <Input
                        value={providerProfile.professional_title}
                        onChange={(e) => setProviderProfile({ ...providerProfile, professional_title: e.target.value })}
                        placeholder="Registered Nurse, Clinical Officer, etc."
                        className="rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-transparent"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label className="text-xs font-bold uppercase text-zinc-500">License Number</Label>
                        <Input
                            value={providerProfile.license_number}
                            onChange={(e) => setProviderProfile({ ...providerProfile, license_number: e.target.value })}
                            placeholder="NCK-12345"
                            className="rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-transparent"
                        />
                    </div>
                    <div>
                        <Label className="text-xs font-bold uppercase text-zinc-500">License Type</Label>
                        <Input
                            value={providerProfile.license_type}
                            onChange={(e) => setProviderProfile({ ...providerProfile, license_type: e.target.value })}
                            placeholder="Nursing, Medical, etc."
                            className="rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-transparent"
                        />
                    </div>
                </div>

                <div>
                    <Label className="text-xs font-bold uppercase text-zinc-500">Specialties</Label>
                    <div className="flex gap-2 mt-1">
                        <Input
                            placeholder="Wound Care, Home Nursing..."
                            value={specialtyInput}
                            onChange={(e) => setSpecialtyInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && specialtyInput.trim()) {
                                    setProviderProfile({
                                        ...providerProfile,
                                        specialties: [...providerProfile.specialties, specialtyInput.trim()]
                                    });
                                    setSpecialtyInput('');
                                }
                            }}
                            className="rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-transparent"
                        />
                        <Button
                            size="sm"
                            onClick={() => {
                                if (specialtyInput.trim()) {
                                    setProviderProfile({
                                        ...providerProfile,
                                        specialties: [...providerProfile.specialties, specialtyInput.trim()]
                                    });
                                    setSpecialtyInput('');
                                }
                            }}
                            className="rounded-xl"
                        >
                            Add
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {providerProfile.specialties.map((spec, idx) => (
                            <Badge key={idx} className="bg-primary/10 text-primary flex items-center gap-1">
                                {spec}
                                <button
                                    onClick={() => setProviderProfile({
                                        ...providerProfile,
                                        specialties: providerProfile.specialties.filter((_, i) => i !== idx)
                                    })}
                                    className="hover:text-red-500"
                                >
                                    <XCircle className="w-3 h-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                </div>

                <div>
                    <Label className="text-xs font-bold uppercase text-zinc-500">Years of Experience</Label>
                    <Input
                        type="number"
                        value={providerProfile.years_experience || ''}
                        onChange={(e) => setProviderProfile({ ...providerProfile, years_experience: parseInt(e.target.value) || 0 })}
                        placeholder="5"
                        className="rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-transparent"
                    />
                </div>

                <div>
                    <Label className="text-xs font-bold uppercase text-zinc-500">Professional Bio</Label>
                    <Textarea
                        value={providerProfile.bio}
                        onChange={(e) => setProviderProfile({ ...providerProfile, bio: e.target.value })}
                        placeholder="Tell patients about your experience and approach to care..."
                        rows={3}
                        className="rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-transparent"
                    />
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-primary" />
                        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Verification Status</p>
                        <Badge className={`ml-auto ${providerProfile.verification_status === 'verified'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400'
                            }`}>
                            {providerProfile.verification_status === 'verified' ? '✓ Verified' : 'Pending Verification'}
                        </Badge>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        {providerProfile.verification_status === 'verified'
                            ? 'Your professional credentials have been verified.'
                            : 'Your credentials are being reviewed. This may take 24-48 hours.'}
                    </p>
                </div>
            </div>
        </div>
    );

    // Render Organization Details section
    const renderOrganizationDetails = () => (
        <div className="space-y-4">
            <div>
                <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Organization Details</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Manage your healthcare organization information</p>
            </div>

            <div className="space-y-4">
                <div>
                    <Label className="text-xs font-bold uppercase text-zinc-500">Organization Name</Label>
                    <Input
                        value={currentWorkspace?.name || ''}
                        placeholder="Embu Level 5 Hospital"
                        className="rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-transparent"
                        disabled
                    />
                </div>

                <div>
                    <Label className="text-xs font-bold uppercase text-zinc-500">Organization Type</Label>
                    <Input
                        value="Healthcare Organization"
                        className="rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-transparent"
                        disabled
                    />
                </div>

                <div>
                    <Label className="text-xs font-bold uppercase text-zinc-500">Registration Number</Label>
                    <Input
                        placeholder="REG-2024-001"
                        className="rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-transparent"
                    />
                </div>

                <div>
                    <Label className="text-xs font-bold uppercase text-zinc-500">Organization Description</Label>
                    <Textarea
                        placeholder="Describe your organization, services, and specialties..."
                        rows={3}
                        className="rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-transparent"
                    />
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Staff Management</p>
                        <Badge className="ml-auto bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                            Coming Soon
                        </Badge>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        Staff management features will be available in the next update.
                    </p>
                </div>
            </div>
        </div>
    );

    // Render Agency Details section
    const renderAgencyDetails = () => (
        <div className="space-y-4">
            <div>
                <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Agency Details</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Manage your healthcare agency</p>
            </div>

            <div className="space-y-4">
                <div>
                    <Label className="text-xs font-bold uppercase text-zinc-500">Agency Name</Label>
                    <Input
                        value={currentWorkspace?.name || ''}
                        placeholder="XYZ Home Nursing"
                        className="rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-transparent"
                        disabled
                    />
                </div>

                <div>
                    <Label className="text-xs font-bold uppercase text-zinc-500">Agency Type</Label>
                    <Input
                        value="Healthcare Agency"
                        className="rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-transparent"
                        disabled
                    />
                </div>

                <div>
                    <Label className="text-xs font-bold uppercase text-zinc-500">License Number</Label>
                    <Input
                        placeholder="AGY-2024-001"
                        className="rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-transparent"
                    />
                </div>

                <div>
                    <Label className="text-xs font-bold uppercase text-zinc-500">Service Areas</Label>
                    <Input
                        placeholder="Nairobi, Kiambu, Mombasa..."
                        className="rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-transparent"
                    />
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Provider Network</p>
                        <Badge className="ml-auto bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                            Coming Soon
                        </Badge>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        Manage your provider network and staff in the next update.
                    </p>
                </div>
            </div>
        </div>
    );

    if (loading) return <HommieLoader />;

    const sections = getWorkspaceSections();

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
                                <Badge className="bg-primary/10 text-primary border-0 flex items-center gap-1.5 rounded-full px-3 py-1">
                                    {getWorkspaceIcon(workspaceType)}
                                    <span className="text-xs font-bold uppercase">
                                        {workspaceType}
                                    </span>
                                </Badge>
                                <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                                    {getEditTitle()}
                                </h1>
                            </div>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">{getEditSubtitle()}</p>
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
                                Workspace: <span className="font-bold text-primary capitalize">{workspaceType}</span>
                            </p>
                        </div>
                    </div>

                    {/* Workspace Selector */}
                    {userWorkspaces.length > 0 && (
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                                    <Building2 className="w-4 h-4" />
                                    Active Workspace
                                </h3>
                                {userWorkspaces.length > 1 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs gap-1"
                                        onClick={() => setShowWorkspaceSelector(!showWorkspaceSelector)}
                                    >
                                        {showWorkspaceSelector ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                        Switch Workspace
                                    </Button>
                                )}
                            </div>

                            {showWorkspaceSelector ? (
                                <div className="space-y-2">
                                    {userWorkspaces.map((ws) => {
                                        const isActive = selectedWorkspaceId === ws.id;
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
                                                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                                                                Role: {ws.role}
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
                                <div className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-transparent">
                                    {currentWorkspace && (
                                        <>
                                            {getWorkspaceIcon(currentWorkspace.type)}
                                            <div className="flex-1">
                                                <p className="font-medium text-sm text-zinc-900 dark:text-white">
                                                    {currentWorkspace.name}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                                        {getWorkspaceTypeLabel(currentWorkspace.type)}
                                                    </span>
                                                    <Badge className={`text-[10px] ${currentWorkspace.verification_status === 'verified'
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                                                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400'
                                                        }`}>
                                                        {currentWorkspace.verification_status === 'verified' ? '✓ Verified' : 'Pending'}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <Badge className="bg-primary/20 text-primary text-[10px]">
                                                Active
                                            </Badge>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Workspace-Specific Content */}
                    <Tabs defaultValue="profile" className="w-full" onValueChange={setActiveTab}>
                        <TabsList className="w-full bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-2xl mb-6 overflow-x-auto flex-nowrap">
                            {sections.map((section) => (
                                <TabsTrigger
                                    key={section.id}
                                    value={section.id}
                                    className="flex-1 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-sm whitespace-nowrap text-xs md:text-sm py-2.5"
                                >
                                    <section.icon className="w-4 h-4 mr-1.5" />
                                    {section.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {/* Profile Tab (Common for all) */}
                        <TabsContent value="profile">
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-4">
                                    {/* Profile Form */}
                                    <Card className="border border-zinc-100 dark:border-transparent shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-zinc-900">
                                        <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 dark:from-primary/20 dark:to-blue-500/20 p-4 flex items-center gap-2 border-b border-zinc-100 dark:border-transparent">
                                            <User size={16} className="text-primary" />
                                            <span className="font-bold uppercase text-[10px] md:text-xs tracking-widest text-zinc-700 dark:text-zinc-300">
                                                Basic Information
                                            </span>
                                        </div>
                                        <CardContent className="p-4 md:p-6 grid grid-cols-1 gap-4">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] md:text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase ml-1">
                                                    Full Name <span className="text-primary font-normal">*</span>
                                                </Label>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                                                    <Input
                                                        value={profile.full_name || ""}
                                                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                                        placeholder={isIndividual ? "Dr. Jane Mwangi" : "Jane Mwangi"}
                                                        className="pl-9 h-11 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-transparent dark:text-white dark:placeholder:text-zinc-500 focus-visible:ring-primary text-sm"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] md:text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase ml-1">
                                                    Username <span className="text-primary font-normal">*</span>
                                                </Label>
                                                <Input
                                                    value={profile.username || ""}
                                                    onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                                                    placeholder={isIndividual ? "drjanemwangi" : "janemwangi"}
                                                    className="h-11 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-transparent dark:text-white focus-visible:ring-primary font-medium text-sm"
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] md:text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase ml-1">
                                                    Email Address <span className="text-primary font-normal">*</span>
                                                </Label>
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
                                                <Label className="text-[10px] md:text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase ml-1">
                                                    Phone Number <span className="text-primary font-normal">*</span>
                                                </Label>
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
                                                <Label className="text-[10px] md:text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase ml-1">
                                                    Bio / About
                                                </Label>
                                                <Textarea
                                                    rows={3}
                                                    placeholder={isIndividual ?
                                                        "Describe your experience, specializations, and healthcare philosophy..." :
                                                        isFamily ?
                                                            "Tell us about your family and care needs..." :
                                                            "Tell us about your organization..."
                                                    }
                                                    value={profile.bio || ""}
                                                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                                    className="rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-transparent p-4 dark:text-white dark:placeholder:text-zinc-500 text-sm min-h-[80px]"
                                                />
                                                <div className="flex justify-between items-center">
                                                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 ml-1">
                                                        {isIndividual ? "Help patients understand your qualifications" :
                                                            isFamily ? "Share about your family's care needs" :
                                                                "Describe your organization"}
                                                    </p>
                                                    <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
                                                        {profile.bio?.length || 0}/500
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Location Fields */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] md:text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase ml-1">
                                                        Country <span className="text-primary font-normal">*</span>
                                                    </Label>
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
                                                    <Label className="text-[10px] md:text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase ml-1">
                                                        City <span className="text-primary font-normal">*</span>
                                                    </Label>
                                                    <Input
                                                        value={profile.city || ""}
                                                        onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                                                        placeholder="Nairobi"
                                                        className="h-11 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-transparent dark:text-white text-sm"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] md:text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase ml-1">
                                                    Address
                                                </Label>
                                                <Input
                                                    value={profile.address || ""}
                                                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                                                    placeholder={isIndividual ? "123 Medical Plaza, Westlands, Nairobi" : "123 Home Street, Estate, Nairobi"}
                                                    className="h-11 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-transparent dark:text-white text-sm"
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Account Status Card */}
                                    <Card className="border border-zinc-100 dark:border-transparent shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-zinc-900">
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
                                                    <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Workspace Type</p>
                                                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-bold text-primary">
                                                        {workspaceType}
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
                                </div>
                            </div>
                        </TabsContent>

                        {/* Family Members Tab */}
                        {isFamily && (
                            <TabsContent value="members">
                                {renderFamilyMembers()}
                            </TabsContent>
                        )}

                        {/* Professional Details Tab */}
                        {isIndividual && (
                            <TabsContent value="professional">
                                {renderProfessionalDetails()}
                            </TabsContent>
                        )}

                        {/* Organization Details Tab */}
                        {isOrganization && (
                            <TabsContent value="organization">
                                {renderOrganizationDetails()}
                            </TabsContent>
                        )}

                        {/* Agency Details Tab */}
                        {isAgency && (
                            <TabsContent value="agency">
                                {renderAgencyDetails()}
                            </TabsContent>
                        )}
                    </Tabs>

                    {/* Save Button */}
                    <div className="mt-6 flex flex-col gap-3">
                        <Button
                            onClick={updateProfile}
                            disabled={saving || workspaceLoading}
                            className="w-full h-12 rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 hover:shadow-xl transition-all active:scale-95"
                        >
                            {saving || workspaceLoading ? (
                                <>
                                    <Loader2 className="animate-spin mr-2" size={18} />
                                    {workspaceLoading ? 'Switching Workspace...' : 'Saving Changes...'}
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save All Changes
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
                                            All your {isIndividual ? 'professional data' : isFamily ? 'family data' : 'organization data'} and profile information will be permanently removed.
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-3 text-center">
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">You will lose access to:</p>
                                    <div className="flex justify-center gap-3 text-xs font-medium text-zinc-400 dark:text-zinc-500">
                                        <span>📋 Records</span>
                                        <span>📅 Appointments</span>
                                        <span>⭐ Reviews</span>
                                        <span>🏢 Workspace</span>
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
import { useEffect, useState, useCallback, useMemo, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
    User,
    Mail,
    Phone,
    Calendar,
    Droplet,
    Pill,
    Activity,
    FileText,
    HeartPulse,
    Syringe,
    AlertTriangle,
    Shield,
    Save,
    ArrowLeft,
    Edit,
    Eye,
    Lock,
    BadgeCheck,
    Hospital,
    CreditCard,
    Languages,
    Stethoscope,
    Users,
    Clock,
    ClipboardList,
    Plus,
    CheckCircle,
    XCircle,
    Printer,
    Key,
    Unlock,
    Loader2,
    Search,
    ChevronRight,
    Filter,
    Fingerprint,
    Sparkles,
    UserCircle,
    Menu,
    X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Lazy load heavy components
const MedicalHistory = lazy(() => import("@/components/MedicalProfile").then(m => ({ default: m.MedicalHistory })));
const VisitHistory = lazy(() => import("@/components/VisitHistory").then(m => ({ default: m.VisitHistory })));

// =============================================
// SKELETON LOADER - Native Android Style
// =============================================

const SkeletonLoader = () => (
    <div className="w-full px-0 animate-pulse">
        {/* Profile Header Skeleton */}
        <div className="px-4 md:px-6 pt-4 pb-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700"></div>
                <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-700 rounded-lg"></div>
            </div>
            <div className="flex flex-wrap gap-2">
                <div className="h-6 w-20 bg-zinc-200 dark:bg-zinc-700 rounded-full"></div>
                <div className="h-6 w-24 bg-zinc-200 dark:bg-zinc-700 rounded-full"></div>
                <div className="h-6 w-20 bg-zinc-200 dark:bg-zinc-700 rounded-full"></div>
            </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="px-4 md:px-6">
            <div className="flex gap-2 mb-6">
                <div className="h-10 w-24 bg-zinc-200 dark:bg-zinc-700 rounded-lg"></div>
                <div className="h-10 w-24 bg-zinc-200 dark:bg-zinc-700 rounded-lg"></div>
                <div className="h-10 w-24 bg-zinc-200 dark:bg-zinc-700 rounded-lg"></div>
            </div>
        </div>

        {/* Cards Skeleton */}
        <div className="px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl p-4 h-48">
                        <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-700 rounded mb-3"></div>
                        <div className="space-y-3">
                            <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-700 rounded"></div>
                            <div className="h-4 w-3/4 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
                            <div className="h-4 w-1/2 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

// =============================================
// INTERFACES
// =============================================

interface PatientData {
    id: string;
    full_name: string;
    email: string | null;
    phone_number: string | null;
    pin_code: string | null;
    pin_verified: boolean;
    date_of_birth: string | null;
    gender: string | null;
    blood_type: string | null;
    allergies: string[] | null;
    chronic_conditions: string[] | null;
    current_medications: string[] | null;
    medical_history: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    emergency_contact_relation: string | null;
    insurance_provider: string | null;
    insurance_policy_number: string | null;
    insurance_expiry: string | null;
    preferred_payment_method: string | null;
    preferred_language: string | null;
    preferred_hospital: string | null;
    assigned_provider_id: string | null;
    special_needs: string | null;
    notes: string | null;
    consent_to_contact: boolean;
    consent_to_share_data: boolean;
    created_at: string;
    updated_at: string;
    last_visit_date: string | null;
}

interface Profile {
    full_name: string | null;
    role: string | null;
    avatar_url: string | null;
}

// =============================================
// MAIN COMPONENT - Native Android Edge-to-Edge
// =============================================

export default function MedicalProfile() {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();

    // State
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isProvider, setIsProvider] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isPatientViewingOwn, setIsPatientViewingOwn] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [patientData, setPatientData] = useState<PatientData | null>(null);
    const [providerProfile, setProviderProfile] = useState<Profile | null>(null);

    // Patient list
    const [patients, setPatients] = useState<PatientData[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showPatientList, setShowPatientList] = useState(false);
    const [patientListLoading, setPatientListLoading] = useState(false);

    // PIN
    const [showPinDialog, setShowPinDialog] = useState(false);
    const [pinInput, setPinInput] = useState("");
    const [pinError, setPinError] = useState("");
    const [isPinVerified, setIsPinVerified] = useState(false);
    const [showPinSetup, setShowPinSetup] = useState(false);
    const [newPin, setNewPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");
    const [pinSetupError, setPinSetupError] = useState("");

    // Cache key for SWR-like caching
    const getCacheKey = useCallback((id: string) => `patient_${id}`, []);

    // =============================================
    // FETCH FUNCTIONS WITH CACHING
    // =============================================

    const fetchUserRole = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast({
                    title: "Authentication Required",
                    description: "Please log in to view medical profiles.",
                    variant: "destructive"
                });
                navigate("/auth");
                return;
            }
            setCurrentUserId(user.id);

            const { data: profileData } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single();

            setUserRole(profileData?.role || null);
            setIsProvider(profileData?.role === 'provider' || profileData?.role === 'admin');
            setIsAdmin(profileData?.role === 'admin');
        } catch (err: any) {
            console.error("Error fetching user role:", err);
        }
    }, [navigate, toast]);

    const fetchPatientList = useCallback(async () => {
        try {
            setPatientListLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Check cache first
            const cacheKey = 'patients_list';
            const cached = sessionStorage.getItem(cacheKey);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Date.now() - parsed.timestamp < 30000) { // 30s cache
                    setPatients(parsed.data);
                    setPatientListLoading(false);
                    return;
                }
            }

            const { data, error } = await supabase
                .from("patients")
                .select("*")
                .order("full_name", { ascending: true });

            if (error) throw error;

            // Cache the result
            sessionStorage.setItem(cacheKey, JSON.stringify({
                data: data || [],
                timestamp: Date.now()
            }));

            setPatients(data || []);
        } catch (err: any) {
            console.error("Error fetching patients:", err);
            toast({
                title: "Error",
                description: err.message || "Failed to load patients",
                variant: "destructive"
            });
        } finally {
            setPatientListLoading(false);
        }
    }, [toast]);

    const fetchMedicalProfile = useCallback(async () => {
        try {
            setLoading(true);
            setIsPinVerified(false);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const targetPatientId = patientId || user.id;
            const isOwnProfile = targetPatientId === user.id;

            if (isOwnProfile) {
                setIsPatientViewingOwn(true);
                setIsPinVerified(true);
            }

            // Check cache
            const cacheKey = getCacheKey(targetPatientId);
            const cached = sessionStorage.getItem(cacheKey);
            if (cached && !isProvider) {
                const parsed = JSON.parse(cached);
                if (Date.now() - parsed.timestamp < 60000) { // 1min cache for patients
                    setPatientData(parsed.data);
                    setLoading(false);
                    return;
                }
            }

            const { data: patientData, error: patientError } = await supabase
                .from("patients")
                .select("*")
                .eq("id", targetPatientId)
                .single();

            if (patientError) {
                if (patientError.code === 'PGRST116') {
                    await initializePatientRecord(targetPatientId);
                    const { data: newData, error: newError } = await supabase
                        .from("patients")
                        .select("*")
                        .eq("id", targetPatientId)
                        .single();

                    if (newError) throw newError;
                    setPatientData(newData);
                    // Cache the new data
                    sessionStorage.setItem(cacheKey, JSON.stringify({
                        data: newData,
                        timestamp: Date.now()
                    }));
                } else {
                    throw patientError;
                }
                setLoading(false);
                return;
            }

            setPatientData(patientData);

            // Cache the data
            sessionStorage.setItem(cacheKey, JSON.stringify({
                data: patientData,
                timestamp: Date.now()
            }));

            if (patientData.assigned_provider_id) {
                const { data: providerData } = await supabase
                    .from("profiles")
                    .select("full_name, role, avatar_url")
                    .eq("id", patientData.assigned_provider_id)
                    .single();

                if (providerData) {
                    setProviderProfile(providerData);
                }
            }

            // Provider PIN verification logic
            if (isProvider && !isOwnProfile && !isAdmin) {
                if (!patientData.pin_code) {
                    toast({
                        title: "PIN Required",
                        description: "This patient hasn't set a medical PIN yet.",
                        variant: "destructive",
                        duration: 6000,
                    });
                    setIsPinVerified(false);
                } else if (patientData.pin_verified) {
                    setIsPinVerified(true);
                } else {
                    setIsPinVerified(false);
                    setShowPinDialog(true);
                }
            }

            setShowPatientList(false);

        } catch (err: any) {
            console.error("Error fetching medical profile:", err);
            toast({
                title: "Error",
                description: err.message || "Failed to load medical profile",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }, [patientId, isProvider, isAdmin, toast, getCacheKey]);

    const initializePatientRecord = useCallback(async (userId: string) => {
        try {
            const { data: profileData } = await supabase
                .from("profiles")
                .select("full_name, email, phone_number")
                .eq("id", userId)
                .single();

            const { error } = await supabase
                .from("patients")
                .insert({
                    id: userId,
                    full_name: profileData?.full_name || "",
                    email: profileData?.email || "",
                    phone_number: profileData?.phone_number || "",
                    preferred_language: "English",
                    consent_to_contact: true,
                    consent_to_share_data: false
                });

            if (error) throw error;

            toast({
                title: "Medical Record Created",
                description: "A medical record has been created for this patient.",
            });
        } catch (err) {
            console.error("Error initializing patient record:", err);
        }
    }, [toast]);

    // =============================================
    // SAVE FUNCTIONS
    // =============================================

    const saveMedicalProfile = useCallback(async () => {
        try {
            setSaving(true);

            if (!patientData) return;

            const { error } = await supabase
                .from("patients")
                .update({
                    date_of_birth: patientData.date_of_birth,
                    gender: patientData.gender,
                    blood_type: patientData.blood_type,
                    allergies: patientData.allergies || [],
                    chronic_conditions: patientData.chronic_conditions || [],
                    current_medications: patientData.current_medications || [],
                    medical_history: patientData.medical_history,
                    emergency_contact_name: patientData.emergency_contact_name,
                    emergency_contact_phone: patientData.emergency_contact_phone,
                    emergency_contact_relation: patientData.emergency_contact_relation,
                    insurance_provider: patientData.insurance_provider,
                    insurance_policy_number: patientData.insurance_policy_number,
                    insurance_expiry: patientData.insurance_expiry,
                    preferred_payment_method: patientData.preferred_payment_method,
                    preferred_language: patientData.preferred_language,
                    preferred_hospital: patientData.preferred_hospital,
                    special_needs: patientData.special_needs,
                    notes: patientData.notes,
                    consent_to_contact: patientData.consent_to_contact,
                    consent_to_share_data: patientData.consent_to_share_data,
                    updated_at: new Date().toISOString()
                })
                .eq("id", patientData.id);

            if (error) throw error;

            // Invalidate cache
            sessionStorage.removeItem(getCacheKey(patientData.id));

            toast({
                title: "Medical Profile Updated",
                description: "The patient's medical information has been saved successfully.",
                variant: "default"
            });

            setIsEditing(false);

        } catch (err: any) {
            console.error("Error saving medical profile:", err);
            toast({
                title: "Update Failed",
                description: err.message || "Failed to save medical profile",
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    }, [patientData, toast, getCacheKey]);

    const savePin = useCallback(async () => {
        try {
            setPinSetupError("");

            if (newPin.length < 4 || newPin.length > 6) {
                setPinSetupError("PIN must be 4-6 digits");
                return;
            }

            if (newPin !== confirmPin) {
                setPinSetupError("PINs do not match");
                return;
            }

            if (!patientData) return;

            const { error } = await supabase
                .from("patients")
                .update({
                    pin_code: newPin,
                    pin_verified: false
                })
                .eq("id", patientData.id);

            if (error) throw error;

            const updatedData = { ...patientData, pin_code: newPin, pin_verified: false };
            setPatientData(updatedData);

            // Update cache
            sessionStorage.setItem(getCacheKey(patientData.id), JSON.stringify({
                data: updatedData,
                timestamp: Date.now()
            }));

            setNewPin("");
            setConfirmPin("");
            setShowPinSetup(false);

            toast({
                title: "PIN Created",
                description: "Your medical PIN has been set. A healthcare provider must verify it during your next visit.",
            });

        } catch (err: any) {
            console.error("Error saving PIN:", err);
            toast({
                title: "Error",
                description: err.message || "Failed to save PIN",
                variant: "destructive"
            });
        }
    }, [newPin, confirmPin, patientData, toast, getCacheKey]);

    const verifyPin = useCallback(async () => {
        try {
            if (!patientData) return;

            if (pinInput === patientData.pin_code) {
                const { error } = await supabase
                    .from("patients")
                    .update({
                        pin_verified: true,
                        verified_by: currentUserId,
                        verification_date: new Date().toISOString()
                    })
                    .eq("id", patientData.id);

                if (error) throw error;

                const updatedData = { ...patientData, pin_verified: true };
                setPatientData(updatedData);
                setIsPinVerified(true);
                setShowPinDialog(false);
                setPinInput("");
                setPinError("");

                // Update cache
                sessionStorage.setItem(getCacheKey(patientData.id), JSON.stringify({
                    data: updatedData,
                    timestamp: Date.now()
                }));

                toast({
                    title: "PIN Verified ✓",
                    description: "Patient identity has been successfully verified.",
                });
            } else {
                setPinError("Invalid PIN. Please try again.");
            }
        } catch (err: any) {
            console.error("Error verifying PIN:", err);
            toast({
                title: "Verification Failed",
                description: err.message || "Failed to verify PIN",
                variant: "destructive"
            });
        }
    }, [pinInput, patientData, currentUserId, toast, getCacheKey]);

    // =============================================
    // EFFECTS
    // =============================================

    useEffect(() => {
        fetchUserRole();
    }, [fetchUserRole]);

    useEffect(() => {
        if (userRole) {
            if (patientId) {
                fetchMedicalProfile();
            } else if (isProvider || isAdmin) {
                fetchPatientList();
                setShowPatientList(true);
            } else {
                fetchMedicalProfile();
            }
        }
    }, [patientId, userRole, isProvider, isAdmin, fetchMedicalProfile, fetchPatientList]);

    // =============================================
    // UTILITY FUNCTIONS
    // =============================================

    const canEdit = useCallback(() => {
        if ((isProvider || isAdmin) && isPinVerified) return true;
        return false;
    }, [isProvider, isAdmin, isPinVerified]);

    const canView = useCallback(() => {
        if (isPatientViewingOwn) return true;
        if ((isProvider || isAdmin) && isPinVerified) return true;
        return false;
    }, [isPatientViewingOwn, isProvider, isAdmin, isPinVerified]);

    const getAge = useCallback((dob: string | null) => {
        if (!dob) return "N/A";
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }, []);

    const getInitials = useCallback((name: string) => {
        return name ? name.split(" ").map(n => n[0]).join("").toUpperCase() : "U";
    }, []);

    const filteredPatients = useMemo(() => {
        return patients.filter(p =>
            p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.phone_number?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [patients, searchTerm]);

    // =============================================
    // RENDER - PATIENT LIST (Provider/Admin View)
    // =============================================

    if (showPatientList && (isProvider || isAdmin)) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-16 transition-colors duration-200">
                <Navbar />

                <div className="w-full px-0 pt-16 md:pt-20">
                    {/* Header - Edge to Edge */}
                    <div className="px-4 md:px-6 pt-4 pb-2 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center justify-between max-w-6xl mx-auto">
                            <div>
                                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                    <Users className="w-6 h-6 text-primary" />
                                    Patients
                                </h1>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                    {patients.length} patients total
                                </p>
                            </div>
                            <Button
                                className="gap-2 rounded-xl shadow-lg shadow-primary/20"
                                onClick={() => navigate("/patients/register")}
                            >
                                <Plus className="w-4 h-4" />
                                Register
                            </Button>
                        </div>
                    </div>

                    {/* Search - Edge to Edge */}
                    <div className="px-4 md:px-6 pt-4 pb-2">
                        <div className="max-w-6xl mx-auto relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                            <Input
                                placeholder="Search patients by name, email, or phone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 h-12 rounded-2xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 shadow-sm focus:shadow-md transition-shadow"
                            />
                        </div>
                    </div>

                    {/* Patient List - Edge to Edge */}
                    <div className="px-4 md:px-6 pt-2 pb-4">
                        <div className="max-w-6xl mx-auto space-y-3">
                            {patientListLoading ? (
                                <>
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="animate-pulse">
                                            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-14 h-14 rounded-full bg-zinc-200 dark:bg-zinc-700"></div>
                                                    <div className="flex-1 space-y-2">
                                                        <div className="h-5 w-48 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
                                                        <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
                                                    </div>
                                                    <div className="h-8 w-16 bg-zinc-200 dark:bg-zinc-700 rounded-lg"></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            ) : filteredPatients.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="w-20 h-20 mx-auto bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                                        <Users className="w-10 h-10 text-zinc-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
                                        {searchTerm ? "No patients found" : "No patients"}
                                    </h3>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                                        {searchTerm
                                            ? `No patients match "${searchTerm}"`
                                            : "Start by registering your first patient."}
                                    </p>
                                    {!searchTerm && (
                                        <Button
                                            onClick={() => navigate("/patients/register")}
                                            className="mt-4 rounded-xl"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Register Patient
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                filteredPatients.map((patient) => (
                                    <div
                                        key={patient.id}
                                        className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.98]"
                                        onClick={() => {
                                            setShowPatientList(false);
                                            navigate(`/medical-profile/${patient.id}`);
                                        }}
                                    >
                                        <div className="flex items-center gap-4">
                                            <Avatar className="w-14 h-14 border-2 border-zinc-100 dark:border-zinc-700">
                                                <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                                                    {getInitials(patient.full_name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-semibold text-zinc-900 dark:text-white">
                                                        {patient.full_name}
                                                    </h3>
                                                    {patient.pin_verified ? (
                                                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs gap-1 rounded-full">
                                                            <CheckCircle className="w-3 h-3" />
                                                            Verified
                                                        </Badge>
                                                    ) : patient.pin_code ? (
                                                        <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs gap-1 rounded-full">
                                                            <AlertTriangle className="w-3 h-3" />
                                                            Unverified
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-zinc-400 border-zinc-300 text-xs gap-1 rounded-full">
                                                            <Key className="w-3 h-3" />
                                                            No PIN
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                                    {patient.email && (
                                                        <span className="flex items-center gap-1">
                                                            <Mail className="w-3 h-3" />
                                                            {patient.email}
                                                        </span>
                                                    )}
                                                    {patient.phone_number && (
                                                        <span className="flex items-center gap-1">
                                                            <Phone className="w-3 h-3" />
                                                            {patient.phone_number}
                                                        </span>
                                                    )}
                                                    {patient.date_of_birth && (
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {getAge(patient.date_of_birth)} yrs
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-zinc-400" />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // =============================================
    // RENDER - LOADING STATE
    // =============================================

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
                <Navbar />
                <div className="w-full px-0 pt-16 md:pt-20 max-w-6xl mx-auto">
                    <SkeletonLoader />
                </div>
            </div>
        );
    }

    // =============================================
    // RENDER - PIN REQUIRED (Provider View)
    // =============================================

    if (isProvider && !isPatientViewingOwn && !isAdmin && patientData && !isPinVerified) {
        if (!patientData.pin_code) {
            return (
                <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
                    <Navbar />
                    <div className="w-full px-0 pt-16 md:pt-20 max-w-4xl mx-auto">
                        <div className="px-4 md:px-6">
                            <div className="bg-amber-50 dark:bg-amber-950/20 rounded-3xl p-8 md:p-12 text-center border border-amber-200 dark:border-amber-800">
                                <div className="w-24 h-24 mx-auto bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
                                    <Key className="w-12 h-12 text-amber-600 dark:text-amber-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-amber-800 dark:text-amber-300">
                                    PIN Required
                                </h2>
                                <p className="text-amber-700 dark:text-amber-400 max-w-md mx-auto mt-2">
                                    This patient hasn't set a medical PIN yet. Please ask them to set one in their profile.
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowPatientList(true);
                                        fetchPatientList();
                                        navigate("/medical-profile");
                                    }}
                                    className="mt-6 gap-2 rounded-xl"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back to Patients
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (patientData.pin_code && !patientData.pin_verified) {
            return (
                <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
                    <Navbar />
                    <div className="w-full px-0 pt-16 md:pt-20 max-w-4xl mx-auto">
                        <div className="px-4 md:px-6">
                            <div className="bg-primary/5 dark:bg-primary/5 rounded-3xl p-8 md:p-12 text-center border border-primary/20">
                                <div className="w-24 h-24 mx-auto bg-primary/20 rounded-full flex items-center justify-center mb-4">
                                    <Fingerprint className="w-12 h-12 text-primary" />
                                </div>
                                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                                    Verify Patient PIN
                                </h2>
                                <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mt-2">
                                    Enter the patient's PIN to verify their identity and access their medical records.
                                </p>
                                <div className="w-full max-w-xs mx-auto space-y-4 mt-6">
                                    <Input
                                        type="password"
                                        placeholder="Enter 4-6 digit PIN"
                                        maxLength={6}
                                        value={pinInput}
                                        onChange={(e) => {
                                            setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6));
                                            setPinError("");
                                        }}
                                        className="text-center text-2xl font-mono tracking-widest h-14 rounded-xl"
                                        autoFocus
                                    />
                                    {pinError && (
                                        <p className="text-sm text-red-500">{pinError}</p>
                                    )}
                                    <div className="flex gap-3 justify-center">
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setShowPatientList(true);
                                                fetchPatientList();
                                                navigate("/medical-profile");
                                            }}
                                            className="rounded-xl"
                                        >
                                            Back
                                        </Button>
                                        <Button
                                            onClick={verifyPin}
                                            className="gap-2 rounded-xl shadow-lg shadow-primary/20"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Verify PIN
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
    }

    // =============================================
    // RENDER - NO PATIENT DATA
    // =============================================

    if (!patientData) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
                <Navbar />
                <div className="w-full px-0 pt-16 md:pt-20 max-w-4xl mx-auto">
                    <div className="px-4 md:px-6">
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 md:p-12 text-center border border-zinc-100 dark:border-zinc-800">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                                    <AlertTriangle className="w-10 h-10 text-amber-500" />
                                </div>
                                <h2 className="text-2xl font-bold text-zinc-700 dark:text-zinc-300">
                                    No Medical Record Found
                                </h2>
                                <p className="text-zinc-500 dark:text-zinc-400">
                                    This patient has not been registered in the medical system yet.
                                </p>
                                {(isProvider || isAdmin) && (
                                    <Button
                                        onClick={() => {
                                            if (patientId) {
                                                initializePatientRecord(patientId);
                                                fetchMedicalProfile();
                                            }
                                        }}
                                        className="mt-2 rounded-xl"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Register Patient
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // =============================================
    // RENDER - ACCESS DENIED
    // =============================================

    if (!canView()) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
                <Navbar />
                <div className="w-full px-0 pt-16 md:pt-20 max-w-4xl mx-auto">
                    <div className="px-4 md:px-6">
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 md:p-12 text-center border border-zinc-100 dark:border-zinc-800">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                                    <Lock className="w-10 h-10 text-red-500" />
                                </div>
                                <h2 className="text-2xl font-bold text-zinc-700 dark:text-zinc-300">
                                    Access Denied
                                </h2>
                                <p className="text-zinc-500 dark:text-zinc-400">
                                    You do not have permission to view this medical record.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // =============================================
    // RENDER - MAIN PROFILE VIEW (Edge to Edge)
    // =============================================

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20 transition-colors duration-200">
            <Navbar />

            <div className="w-full px-0 pt-16 md:pt-20 max-w-6xl mx-auto">
                {/* Header - Edge to Edge */}
                <div className="px-4 md:px-6 pt-4 pb-2 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                {(isProvider || isAdmin) && !isPatientViewingOwn ? (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setShowPatientList(true);
                                            fetchPatientList();
                                            navigate("/medical-profile");
                                        }}
                                        className="gap-1 -ml-2 rounded-xl"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        All Patients
                                    </Button>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => navigate(-1)}
                                        className="gap-1 -ml-2 rounded-xl"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Back
                                    </Button>
                                )}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
                                    Medical Profile
                                </h1>
                                {isPinVerified && isProvider && !isPatientViewingOwn && (
                                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 gap-1 rounded-full">
                                        <CheckCircle className="w-3 h-3" />
                                        PIN Verified
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap mt-1">
                                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                    {patientData.full_name}
                                </p>
                                {patientData.pin_code && patientData.pin_verified ? (
                                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 gap-1 rounded-full text-xs">
                                        <CheckCircle className="w-3 h-3" />
                                        PIN Verified
                                    </Badge>
                                ) : patientData.pin_code ? (
                                    <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300 rounded-full text-xs">
                                        <AlertTriangle className="w-3 h-3" />
                                        PIN Not Verified
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="gap-1 text-zinc-400 border-zinc-300 rounded-full text-xs">
                                        <Key className="w-3 h-3" />
                                        No PIN
                                    </Badge>
                                )}
                                {patientData.blood_type && (
                                    <Badge variant="outline" className="gap-1 rounded-full text-xs">
                                        <Droplet className="w-3 h-3" />
                                        {patientData.blood_type}
                                    </Badge>
                                )}
                                {patientData.date_of_birth && (
                                    <Badge variant="outline" className="gap-1 rounded-full text-xs">
                                        <Calendar className="w-3 h-3" />
                                        {getAge(patientData.date_of_birth)} yrs
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {isProvider && !isPatientViewingOwn && patientData.pin_code && !patientData.pin_verified && isPinVerified === false && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 rounded-xl"
                                    onClick={() => setShowPinDialog(true)}
                                >
                                    <Shield className="w-4 h-4" />
                                    Verify PIN
                                </Button>
                            )}
                            {isPatientViewingOwn && !patientData.pin_code && (
                                <Button
                                    size="sm"
                                    className="gap-2 rounded-xl shadow-lg shadow-primary/20"
                                    onClick={() => setShowPinSetup(true)}
                                >
                                    <Key className="w-4 h-4" />
                                    Set PIN
                                </Button>
                            )}
                            {isPatientViewingOwn && patientData.pin_code && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 rounded-xl"
                                    onClick={() => setShowPinSetup(true)}
                                >
                                    <Key className="w-4 h-4" />
                                    Change PIN
                                </Button>
                            )}
                            {canEdit() && !isPatientViewingOwn && (
                                <Button
                                    size="sm"
                                    className="gap-2 rounded-xl"
                                    onClick={() => setIsEditing(!isEditing)}
                                >
                                    {isEditing ? (
                                        <>
                                            <Eye className="w-4 h-4" />
                                            View
                                        </>
                                    ) : (
                                        <>
                                            <Edit className="w-4 h-4" />
                                            Edit
                                        </>
                                    )}
                                </Button>
                            )}
                            <Button variant="outline" size="sm" className="gap-2 rounded-xl">
                                <Printer className="w-4 h-4" />
                                Print
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Tabs - Edge to Edge */}
                <div className="px-4 md:px-6 pt-4">
                    <Tabs defaultValue="medical" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 gap-1 bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-2xl mb-6">
                            <TabsTrigger value="medical" className="gap-2 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-sm">
                                <HeartPulse className="w-4 h-4" />
                                <span className="hidden sm:inline">Medical</span>
                            </TabsTrigger>
                            <TabsTrigger value="emergency" className="gap-2 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-sm">
                                <AlertTriangle className="w-4 h-4" />
                                <span className="hidden sm:inline">Emergency</span>
                            </TabsTrigger>
                            <TabsTrigger value="insurance" className="gap-2 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-sm">
                                <CreditCard className="w-4 h-4" />
                                <span className="hidden sm:inline">Insurance</span>
                            </TabsTrigger>
                            <TabsTrigger value="visits" className="gap-2 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-sm">
                                <Stethoscope className="w-4 h-4" />
                                <span className="hidden sm:inline">Visits</span>
                            </TabsTrigger>
                            <TabsTrigger value="nursing" className="gap-2 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-sm">
                                <ClipboardList className="w-4 h-4" />
                                <span className="hidden sm:inline">Notes</span>
                            </TabsTrigger>
                        </TabsList>

                        {/* ===== MEDICAL TAB ===== */}
                        <TabsContent value="medical" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Personal Information Card */}
                                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 md:p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <User className="w-5 h-5 text-primary" />
                                        <h3 className="font-semibold text-zinc-900 dark:text-white">Personal Information</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Full Name</label>
                                            <p className="font-medium text-zinc-900 dark:text-white">{patientData.full_name}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Email</label>
                                            <p className="text-zinc-700 dark:text-zinc-300">{patientData.email || "Not provided"}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Phone</label>
                                            <p className="text-zinc-700 dark:text-zinc-300">{patientData.phone_number || "Not provided"}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Date of Birth</label>
                                            {isEditing ? (
                                                <Input
                                                    type="date"
                                                    value={patientData.date_of_birth || ""}
                                                    onChange={(e) => setPatientData({ ...patientData, date_of_birth: e.target.value || null })}
                                                    className="mt-1 rounded-xl border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                                                />
                                            ) : (
                                                <p className="text-zinc-700 dark:text-zinc-300">
                                                    {patientData.date_of_birth ? new Date(patientData.date_of_birth).toLocaleDateString() : "Not provided"}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Gender</label>
                                            {isEditing ? (
                                                <select
                                                    value={patientData.gender || ""}
                                                    onChange={(e) => setPatientData({ ...patientData, gender: e.target.value || null })}
                                                    className="w-full mt-1 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 dark:text-white px-3 focus:outline-none focus:ring-2 focus:ring-primary"
                                                >
                                                    <option value="">Select gender</option>
                                                    <option value="male">Male</option>
                                                    <option value="female">Female</option>
                                                    <option value="other">Other</option>
                                                    <option value="prefer_not_to_say">Prefer not to say</option>
                                                </select>
                                            ) : (
                                                <p className="text-zinc-700 dark:text-zinc-300 capitalize">{patientData.gender || "Not provided"}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Blood Type</label>
                                            {isEditing ? (
                                                <select
                                                    value={patientData.blood_type || ""}
                                                    onChange={(e) => setPatientData({ ...patientData, blood_type: e.target.value || null })}
                                                    className="w-full mt-1 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 dark:text-white px-3 focus:outline-none focus:ring-2 focus:ring-primary"
                                                >
                                                    <option value="">Select blood type</option>
                                                    <option value="A+">A+</option>
                                                    <option value="A-">A-</option>
                                                    <option value="B+">B+</option>
                                                    <option value="B-">B-</option>
                                                    <option value="AB+">AB+</option>
                                                    <option value="AB-">AB-</option>
                                                    <option value="O+">O+</option>
                                                    <option value="O-">O-</option>
                                                    <option value="unknown">Unknown</option>
                                                </select>
                                            ) : (
                                                <p className="text-zinc-700 dark:text-zinc-300">{patientData.blood_type || "Not provided"}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Preferred Language</label>
                                            {isEditing ? (
                                                <select
                                                    value={patientData.preferred_language || "English"}
                                                    onChange={(e) => setPatientData({ ...patientData, preferred_language: e.target.value })}
                                                    className="w-full mt-1 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 dark:text-white px-3 focus:outline-none focus:ring-2 focus:ring-primary"
                                                >
                                                    <option value="English">English</option>
                                                    <option value="Swahili">Swahili</option>
                                                    <option value="Kikuyu">Kikuyu</option>
                                                    <option value="Luo">Luo</option>
                                                    <option value="Kalenjin">Kalenjin</option>
                                                    <option value="Kamba">Kamba</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            ) : (
                                                <p className="text-zinc-700 dark:text-zinc-300">{patientData.preferred_language || "English"}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Allergies & Conditions Card */}
                                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 md:p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                                        <h3 className="font-semibold text-zinc-900 dark:text-white">Allergies & Conditions</h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Allergies</label>
                                            {isEditing ? (
                                                <Input
                                                    value={patientData.allergies?.join(", ") || ""}
                                                    onChange={(e) => setPatientData({
                                                        ...patientData,
                                                        allergies: e.target.value.split(",").map(item => item.trim()).filter(Boolean)
                                                    })}
                                                    placeholder="Penicillin, Peanuts, Latex, etc."
                                                    className="mt-1 rounded-xl border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                                                />
                                            ) : (
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {patientData.allergies && patientData.allergies.length > 0 ? (
                                                        patientData.allergies.map((allergy, i) => (
                                                            <Badge key={i} variant="destructive" className="text-xs rounded-full">
                                                                {allergy}
                                                            </Badge>
                                                        ))
                                                    ) : (
                                                        <p className="text-zinc-500 dark:text-zinc-400 text-sm">No known allergies</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Chronic Conditions</label>
                                            {isEditing ? (
                                                <Input
                                                    value={patientData.chronic_conditions?.join(", ") || ""}
                                                    onChange={(e) => setPatientData({
                                                        ...patientData,
                                                        chronic_conditions: e.target.value.split(",").map(item => item.trim()).filter(Boolean)
                                                    })}
                                                    placeholder="Diabetes, Hypertension, Asthma, etc."
                                                    className="mt-1 rounded-xl border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                                                />
                                            ) : (
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {patientData.chronic_conditions && patientData.chronic_conditions.length > 0 ? (
                                                        patientData.chronic_conditions.map((condition, i) => (
                                                            <Badge key={i} variant="secondary" className="text-xs rounded-full">
                                                                {condition}
                                                            </Badge>
                                                        ))
                                                    ) : (
                                                        <p className="text-zinc-500 dark:text-zinc-400 text-sm">No chronic conditions</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Current Medications</label>
                                            {isEditing ? (
                                                <Input
                                                    value={patientData.current_medications?.join(", ") || ""}
                                                    onChange={(e) => setPatientData({
                                                        ...patientData,
                                                        current_medications: e.target.value.split(",").map(item => item.trim()).filter(Boolean)
                                                    })}
                                                    placeholder="Metformin 500mg, Lisinopril 10mg, etc."
                                                    className="mt-1 rounded-xl border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                                                />
                                            ) : (
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {patientData.current_medications && patientData.current_medications.length > 0 ? (
                                                        patientData.current_medications.map((med, i) => (
                                                            <Badge key={i} className="text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                                                {med}
                                                            </Badge>
                                                        ))
                                                    ) : (
                                                        <p className="text-zinc-500 dark:text-zinc-400 text-sm">No current medications</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Medical History - Full Width */}
                                <div className="md:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl p-4 md:p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <FileText className="w-5 h-5 text-indigo-500" />
                                        <h3 className="font-semibold text-zinc-900 dark:text-white">Medical History</h3>
                                    </div>
                                    {isEditing ? (
                                        <Textarea
                                            value={patientData.medical_history || ""}
                                            onChange={(e) => setPatientData({ ...patientData, medical_history: e.target.value })}
                                            placeholder="Previous surgeries, hospitalizations, major illnesses, family history, etc."
                                            className="min-h-[120px] rounded-xl border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                                        />
                                    ) : (
                                        <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                                            {patientData.medical_history || "No medical history recorded"}
                                        </p>
                                    )}
                                </div>

                                {/* Special Needs & Notes - Full Width */}
                                <div className="md:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl p-4 md:p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <ClipboardList className="w-5 h-5 text-purple-500" />
                                        <h3 className="font-semibold text-zinc-900 dark:text-white">Special Needs & Notes</h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Special Needs</label>
                                            {isEditing ? (
                                                <Textarea
                                                    value={patientData.special_needs || ""}
                                                    onChange={(e) => setPatientData({ ...patientData, special_needs: e.target.value })}
                                                    placeholder="Wheelchair access, interpreter needed, dietary restrictions, etc."
                                                    className="mt-1 min-h-[80px] rounded-xl border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                                                />
                                            ) : (
                                                <p className="text-zinc-700 dark:text-zinc-300 mt-1">
                                                    {patientData.special_needs || "No special needs recorded"}
                                                </p>
                                            )}
                                        </div>
                                        {(isProvider || isAdmin) && (
                                            <div>
                                                <label className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Provider Notes</label>
                                                {isEditing ? (
                                                    <Textarea
                                                        value={patientData.notes || ""}
                                                        onChange={(e) => setPatientData({ ...patientData, notes: e.target.value })}
                                                        placeholder="Internal notes for healthcare providers..."
                                                        className="mt-1 min-h-[80px] rounded-xl border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                                                    />
                                                ) : (
                                                    <p className="text-zinc-700 dark:text-zinc-300 mt-1">
                                                        {patientData.notes || "No provider notes"}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* ===== EMERGENCY TAB ===== */}
                        <TabsContent value="emergency">
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 md:p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <AlertTriangle className="w-5 h-5 text-red-500" />
                                    <h3 className="font-semibold text-zinc-900 dark:text-white">Emergency Contact</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Contact Name</label>
                                        {isEditing ? (
                                            <Input
                                                value={patientData.emergency_contact_name || ""}
                                                onChange={(e) => setPatientData({ ...patientData, emergency_contact_name: e.target.value || null })}
                                                placeholder="John Doe"
                                                className="mt-1 rounded-xl border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                                            />
                                        ) : (
                                            <p className="text-zinc-700 dark:text-zinc-300 mt-1">{patientData.emergency_contact_name || "Not provided"}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Phone Number</label>
                                        {isEditing ? (
                                            <Input
                                                value={patientData.emergency_contact_phone || ""}
                                                onChange={(e) => setPatientData({ ...patientData, emergency_contact_phone: e.target.value || null })}
                                                placeholder="+254 722 000 000"
                                                className="mt-1 rounded-xl border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                                            />
                                        ) : (
                                            <p className="text-zinc-700 dark:text-zinc-300 mt-1">{patientData.emergency_contact_phone || "Not provided"}</p>
                                        )}
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Relationship</label>
                                        {isEditing ? (
                                            <Input
                                                value={patientData.emergency_contact_relation || ""}
                                                onChange={(e) => setPatientData({ ...patientData, emergency_contact_relation: e.target.value || null })}
                                                placeholder="Spouse, Parent, Sibling, etc."
                                                className="mt-1 rounded-xl border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                                            />
                                        ) : (
                                            <p className="text-zinc-700 dark:text-zinc-300 mt-1">{patientData.emergency_contact_relation || "Not provided"}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* ===== INSURANCE TAB ===== */}
                        <TabsContent value="insurance">
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 md:p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <CreditCard className="w-5 h-5 text-emerald-500" />
                                    <h3 className="font-semibold text-zinc-900 dark:text-white">Insurance & Payment</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Insurance Provider</label>
                                        {isEditing ? (
                                            <Input
                                                value={patientData.insurance_provider || ""}
                                                onChange={(e) => setPatientData({ ...patientData, insurance_provider: e.target.value || null })}
                                                placeholder="AAR, Jubilee, NHIF, etc."
                                                className="mt-1 rounded-xl border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                                            />
                                        ) : (
                                            <p className="text-zinc-700 dark:text-zinc-300 mt-1">{patientData.insurance_provider || "Not provided"}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Policy Number</label>
                                        {isEditing ? (
                                            <Input
                                                value={patientData.insurance_policy_number || ""}
                                                onChange={(e) => setPatientData({ ...patientData, insurance_policy_number: e.target.value || null })}
                                                placeholder="INS-12345-6789"
                                                className="mt-1 rounded-xl border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                                            />
                                        ) : (
                                            <p className="text-zinc-700 dark:text-zinc-300 mt-1">{patientData.insurance_policy_number || "Not provided"}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Insurance Expiry</label>
                                        {isEditing ? (
                                            <Input
                                                type="date"
                                                value={patientData.insurance_expiry || ""}
                                                onChange={(e) => setPatientData({ ...patientData, insurance_expiry: e.target.value || null })}
                                                className="mt-1 rounded-xl border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                                            />
                                        ) : (
                                            <p className="text-zinc-700 dark:text-zinc-300 mt-1">
                                                {patientData.insurance_expiry ? new Date(patientData.insurance_expiry).toLocaleDateString() : "Not provided"}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Preferred Payment</label>
                                        {isEditing ? (
                                            <select
                                                value={patientData.preferred_payment_method || ""}
                                                onChange={(e) => setPatientData({ ...patientData, preferred_payment_method: e.target.value || null })}
                                                className="w-full mt-1 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 dark:text-white px-3 focus:outline-none focus:ring-2 focus:ring-primary"
                                            >
                                                <option value="">Select payment method</option>
                                                <option value="m-pesa">M-Pesa</option>
                                                <option value="insurance">Insurance</option>
                                                <option value="cash">Cash</option>
                                                <option value="credit_card">Credit Card</option>
                                            </select>
                                        ) : (
                                            <p className="text-zinc-700 dark:text-zinc-300 capitalize mt-1">
                                                {patientData.preferred_payment_method ? patientData.preferred_payment_method.replace('_', ' ') : "Not provided"}
                                            </p>
                                        )}
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Preferred Hospital</label>
                                        {isEditing ? (
                                            <Input
                                                value={patientData.preferred_hospital || ""}
                                                onChange={(e) => setPatientData({ ...patientData, preferred_hospital: e.target.value || null })}
                                                placeholder="Kenyatta National Hospital, Aga Khan, etc."
                                                className="mt-1 rounded-xl border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                                            />
                                        ) : (
                                            <p className="text-zinc-700 dark:text-zinc-300 mt-1">{patientData.preferred_hospital || "Not provided"}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* ===== VISITS TAB ===== */}
                        <TabsContent value="visits">
                            <Suspense fallback={<SkeletonLoader />}>
                                <VisitHistory
                                    patientId={patientData.id}
                                    isProvider={isProvider}
                                    isAdmin={isAdmin}
                                    isPinVerified={isPinVerified}
                                    canEdit={canEdit()}
                                />
                            </Suspense>
                        </TabsContent>

                        {/* ===== NURSING NOTES TAB ===== */}
                        <TabsContent value="nursing">
                            <Suspense fallback={<SkeletonLoader />}>
                                <MedicalHistory
                                    patientId={patientData.id}
                                    isProvider={isProvider}
                                    isAdmin={isAdmin}
                                    isPinVerified={isPinVerified}
                                    canEdit={canEdit()}
                                />
                            </Suspense>
                        </TabsContent>
                    </Tabs>

                    {/* Save Button */}
                    {isEditing && (
                        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 p-4 z-50">
                            <div className="max-w-6xl mx-auto flex gap-3">
                                <Button
                                    onClick={saveMedicalProfile}
                                    disabled={saving}
                                    className="flex-1 gap-2 rounded-2xl h-12 shadow-lg shadow-primary/20"
                                >
                                    {saving ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Save className="w-5 h-5" />
                                    )}
                                    Save Profile
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsEditing(false);
                                        fetchMedicalProfile();
                                    }}
                                    className="gap-2 rounded-2xl h-12"
                                >
                                    <XCircle className="w-5 h-5" />
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Consent Footer */}
                    <div className="mt-6 bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                        <div className="flex flex-col md:flex-row justify-between text-xs text-zinc-400 dark:text-zinc-500 gap-2">
                            <div className="flex items-center gap-2">
                                <Shield className="w-3 h-3" />
                                <span>Consent to Contact: {patientData.consent_to_contact ? "✅ Yes" : "❌ No"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Shield className="w-3 h-3" />
                                <span>Consent to Share Data: {patientData.consent_to_share_data ? "✅ Yes" : "❌ No"}</span>
                            </div>
                            <div>
                                <span>Updated: {new Date(patientData.updated_at).toLocaleDateString()}</span>
                            </div>
                            {patientData.last_visit_date && (
                                <div>
                                    <span>Last Visit: {new Date(patientData.last_visit_date).toLocaleDateString()}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* PIN Verification Dialog */}
            <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
                <DialogContent className="sm:max-w-md rounded-3xl border-0 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Shield className="w-5 h-5 text-primary" />
                            Verify Patient PIN
                        </DialogTitle>
                        <DialogDescription>
                            Enter the patient's PIN to verify their identity.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Input
                                type="password"
                                value={pinInput}
                                onChange={(e) => {
                                    setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6));
                                    setPinError("");
                                }}
                                placeholder="Enter 4-6 digit PIN"
                                maxLength={6}
                                className="text-center text-2xl font-mono tracking-widest h-14 rounded-xl"
                                autoFocus
                            />
                            {pinError && (
                                <p className="text-sm text-red-500 mt-2">{pinError}</p>
                            )}
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200 dark:border-amber-800">
                            <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Verifying the PIN confirms you are authorized for this patient.
                            </p>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => {
                            setShowPinDialog(false);
                            setPinInput("");
                            setPinError("");
                            setShowPatientList(true);
                            fetchPatientList();
                            navigate("/medical-profile");
                        }} className="rounded-xl">
                            Cancel
                        </Button>
                        <Button onClick={verifyPin} className="gap-2 rounded-xl shadow-lg shadow-primary/20">
                            <CheckCircle className="w-4 h-4" />
                            Verify PIN
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* PIN Setup Dialog */}
            <Dialog open={showPinSetup} onOpenChange={setShowPinSetup}>
                <DialogContent className="sm:max-w-md rounded-3xl border-0 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Key className="w-5 h-5 text-primary" />
                            {patientData?.pin_code ? "Change PIN" : "Set PIN"}
                        </DialogTitle>
                        <DialogDescription>
                            {patientData?.pin_code
                                ? "Create a new 4-6 digit PIN for medical verification."
                                : "Create a 4-6 digit PIN to verify your identity during medical visits."
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">New PIN (4-6 digits)</label>
                            <Input
                                type="password"
                                value={newPin}
                                onChange={(e) => {
                                    setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6));
                                    setPinSetupError("");
                                }}
                                placeholder="Enter 4-6 digit PIN"
                                maxLength={6}
                                className="mt-2 text-center text-2xl font-mono tracking-widest h-14 rounded-xl"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Confirm PIN</label>
                            <Input
                                type="password"
                                value={confirmPin}
                                onChange={(e) => {
                                    setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6));
                                    setPinSetupError("");
                                }}
                                placeholder="Confirm your PIN"
                                maxLength={6}
                                className="mt-2 text-center text-2xl font-mono tracking-widest h-14 rounded-xl"
                            />
                        </div>
                        {pinSetupError && (
                            <p className="text-sm text-red-500">{pinSetupError}</p>
                        )}
                        <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-xl border border-blue-200 dark:border-blue-800">
                            <p className="text-xs text-blue-700 dark:text-blue-400 flex items-center gap-1">
                                <Shield className="w-3 h-3" />
                                Your PIN is used to verify your identity during medical visits.
                            </p>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => {
                            setShowPinSetup(false);
                            setNewPin("");
                            setConfirmPin("");
                            setPinSetupError("");
                        }} className="rounded-xl">
                            Cancel
                        </Button>
                        <Button onClick={savePin} className="gap-2 rounded-xl shadow-lg shadow-primary/20">
                            <CheckCircle className="w-4 h-4" />
                            {patientData?.pin_code ? "Update PIN" : "Set PIN"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
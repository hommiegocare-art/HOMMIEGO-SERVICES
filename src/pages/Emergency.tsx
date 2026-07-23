import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import {
    Phone,
    MapPin,
    Clock,
    Shield,
    AlertCircle,
    Heart,
    Users,
    MessageCircle,
    Navigation,
    Star,
    CheckCircle,
    ArrowLeft,
    PhoneCall,
    Mail,
    Share2,
    Ambulance,
    Stethoscope,
    Award,
    Eye,
    EyeOff,
    Filter,
    X,
    Loader2,
    Building2,
    User,
    Briefcase
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Types
interface EmergencyContact {
    id: string;
    workspace_id: string;
    user_id: string;
    full_name: string;
    professional_title: string | null;
    phone_number: string;
    alternate_phone: string | null;
    email: string | null;
    specialty: string | null;
    years_experience: number | null;
    location: string | null;
    latitude: number | null;
    longitude: number | null;
    is_available: boolean;
    availability_hours: any;
    response_time: string;
    emergency_types: string[];
    verification_status: string;
    created_at: string;
    updated_at: string;
    workspaces?: {
        name: string;
        type: string;
        verification_status: string;
    };
    profiles?: {
        full_name: string;
        avatar_url: string | null;
    };
    provider_profiles?: {
        average_rating: number | null;
        total_reviews: number | null;
        business_name: string | null;
        professional_title: string | null;
    };
}

const Emergency = () => {
    const navigate = useNavigate();
    const { currentWorkspace, workspaces } = useWorkspace();
    const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
    const [loading, setLoading] = useState(true);
    const [countdown, setCountdown] = useState(0);
    const [isCalling, setIsCalling] = useState(false);
    const [selectedContact, setSelectedContact] = useState<EmergencyContact | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [filterByWorkspace, setFilterByWorkspace] = useState<string | null>(null);
    const [filterBySpecialty, setFilterBySpecialty] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [myEmergencyContact, setMyEmergencyContact] = useState<EmergencyContact | null>(null);
    const [showMyContactForm, setShowMyContactForm] = useState(false);

    const emergencyNumber = "0704473503";

    // Emergency contacts data (fallback if no database data)
    const fallbackContacts = [
        {
            name: "Emergency Response Team",
            number: emergencyNumber,
            type: "Medical Emergency",
            icon: Ambulance,
            color: "bg-red-500"
        },
        {
            name: "Nursing Hotline",
            number: emergencyNumber,
            type: "24/7 Nursing Support",
            icon: Heart,
            color: "bg-blue-500"
        },
        {
            name: "Doctor On Call",
            number: emergencyNumber,
            type: "Medical Consultation",
            icon: Users,
            color: "bg-green-500"
        }
    ];

    // Fetch user role
    useEffect(() => {
        const fetchUserRole = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", user.id)
                    .single();
                setUserRole(profile?.role || null);
            }
        };
        fetchUserRole();
    }, []);

    // Fetch emergency contacts
    const fetchEmergencyContacts = useCallback(async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            // Build query
            let query = supabase
                .from("emergency_contacts")
                .select(`
                    *,
                    workspaces:workspace_id (name, type, verification_status),
                    profiles:user_id (full_name, avatar_url),
                    provider_profiles:user_id (average_rating, total_reviews, business_name, professional_title)
                `)
                .eq("is_available", true)
                .eq("verification_status", "verified");

            // Apply filters
            if (filterByWorkspace) {
                query = query.eq("workspace_id", filterByWorkspace);
            }
            if (filterBySpecialty) {
                query = query.contains("emergency_types", [filterBySpecialty]);
            }

            // Order by rating
            query = query.order("created_at", { ascending: false });

            const { data, error } = await query;

            if (error) {
                console.error("Error fetching emergency contacts:", error);
                setEmergencyContacts([]);
            } else {
                setEmergencyContacts(data || []);
            }

            // Fetch user's own emergency contact if they are a provider
            if (user) {
                const { data: myContact } = await supabase
                    .from("emergency_contacts")
                    .select("*")
                    .eq("user_id", user.id)
                    .single();

                setMyEmergencyContact(myContact || null);
            }

        } catch (error) {
            console.error("Error:", error);
            setEmergencyContacts([]);
        } finally {
            setLoading(false);
        }
    }, [filterByWorkspace, filterBySpecialty]);

    useEffect(() => {
        fetchEmergencyContacts();
    }, [fetchEmergencyContacts]);

    const handleEmergencyCall = (number: string) => {
        setIsCalling(true);
        setCountdown(3);

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    window.location.href = `tel:${number}`;
                    setIsCalling(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleSMS = (number: string) => {
        const message = encodeURIComponent(
            "HELP! I need immediate medical assistance from HommieCare. Please call me back urgently."
        );
        window.location.href = `sms:${number}?body=${message}`;
    };

    const shareLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const mapsUrl = `https://maps.google.com/maps?q=${latitude},${longitude}`;
                    if (navigator.share) {
                        navigator.share({
                            title: "My Emergency Location",
                            text: "I need emergency medical assistance. Here is my location:",
                            url: mapsUrl
                        });
                    } else {
                        window.open(mapsUrl, "_blank");
                    }
                },
                () => {
                    alert("Unable to get location. Please share your location manually.");
                }
            );
        } else {
            alert("Geolocation is not supported by your browser");
        }
    };

    // Get unique specialties for filter
    const specialties = Array.from(
        new Set(emergencyContacts.flatMap(c => c.emergency_types || []))
    );

    // Get workspace type label
    const getWorkspaceTypeLabel = (type: string) => {
        switch (type) {
            case 'individual':
                return 'Independent Provider';
            case 'family':
                return 'Family Care';
            case 'organization':
                return 'Healthcare Organization';
            case 'agency':
                return 'Healthcare Agency';
            default:
                return 'Healthcare Provider';
        }
    };

    // Get workspace icon
    const getWorkspaceIcon = (type: string) => {
        switch (type) {
            case 'individual':
                return <User className="w-4 h-4" />;
            case 'family':
                return <Users className="w-4 h-4" />;
            case 'organization':
                return <Building2 className="w-4 h-4" />;
            case 'agency':
                return <Briefcase className="w-4 h-4" />;
            default:
                return <Building2 className="w-4 h-4" />;
        }
    };

    // Quick action buttons
    const quickActions = [
        {
            icon: Phone,
            label: "Call Emergency",
            color: "bg-red-500 hover:bg-red-600",
            action: () => {
                const contact = emergencyContacts[0];
                if (contact) {
                    handleEmergencyCall(contact.phone_number);
                } else {
                    handleEmergencyCall(emergencyNumber);
                }
            }
        },
        {
            icon: MessageCircle,
            label: "SMS Help",
            color: "bg-blue-500 hover:bg-blue-600",
            action: () => {
                const contact = emergencyContacts[0];
                if (contact) {
                    handleSMS(contact.phone_number);
                } else {
                    handleSMS(emergencyNumber);
                }
            }
        },
        {
            icon: Navigation,
            label: "Share Location",
            color: "bg-green-500 hover:bg-green-600",
            action: shareLocation
        },
        {
            icon: Star,
            label: "Quick Book",
            color: "bg-purple-500 hover:bg-purple-600",
            action: () => navigate("/explore")
        }
    ];

    return (
        <div className="min-h-screen flex flex-col relative">
            {/* Background Image */}
            <div
                className="fixed inset-0 z-0 pointer-events-none"
                style={{
                    backgroundImage: "url('/Ambulance.png')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    opacity: 0.28,
                }}
            />

            {/* Dark overlay */}
            <div className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-b from-white/50 via-white/30 to-white/50 dark:from-zinc-950/70 dark:via-zinc-950/50 dark:to-zinc-950/70" />

            <Navbar />

            <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col pt-24 sm:pt-28 pb-8">

                {/* Header */}
                <div className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-b-2xl sm:rounded-2xl p-4 sm:p-6 -mx-4 sm:mx-0 mt-0 sm:mt-4 shadow-xl backdrop-blur-sm bg-opacity-95">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-6 h-6 animate-pulse" />
                            <h1 className="text-xl font-bold">Emergency</h1>
                        </div>
                        <button className="p-2 hover:bg-white/20 rounded-full transition-colors">
                            <Share2 className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="mt-4 text-center">
                        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                            <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse" />
                            <span className="text-sm font-semibold">24/7 Emergency Support Available</span>
                        </div>
                    </div>
                </div>

                {/* Emergency Number Banner */}
                <div className="mt-4 sm:mt-6 bg-white/95 dark:bg-zinc-800/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-red-200 dark:border-red-800 p-4 sm:p-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Emergency Hotline</p>
                            <h2 className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400">{emergencyNumber}</h2>
                            <p className="text-xs text-gray-400 dark:text-gray-500">Available 24/7 for immediate assistance</p>
                        </div>
                        <Button
                            onClick={() => handleEmergencyCall(emergencyNumber)}
                            className={`h-16 w-16 rounded-full ${isCalling ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-red-600 hover:bg-red-700'
                                } shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center flex-shrink-0`}
                        >
                            {isCalling ? (
                                <>
                                    <span className="text-xs font-bold">{countdown}</span>
                                    <span className="text-[8px]">Calling...</span>
                                </>
                            ) : (
                                <PhoneCall className="w-8 h-8 text-white" />
                            )}
                        </Button>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-6">
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Quick Actions</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {quickActions.map((action, index) => (
                            <button
                                key={index}
                                onClick={action.action}
                                className={`${action.color} text-white rounded-2xl p-4 flex flex-col items-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg backdrop-blur-sm`}
                            >
                                <action.icon className="w-6 h-6" />
                                <span className="text-xs font-semibold text-center leading-tight">{action.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Provider's Emergency Contact Form - Only for Providers */}
                {userRole === 'provider' && !myEmergencyContact && (
                    <div className="mt-6 bg-amber-50 dark:bg-amber-950/20 rounded-2xl p-4 border border-amber-200 dark:border-amber-800">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                <AlertCircle className="w-5 h-5 text-amber-600" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-sm text-amber-800 dark:text-amber-300">Add Yourself to Emergency Contacts</h4>
                                <p className="text-xs text-amber-600 dark:text-amber-400">
                                    Help patients find you in emergencies. Add your emergency contact details.
                                </p>
                            </div>
                            <Button
                                size="sm"
                                onClick={() => setShowMyContactForm(true)}
                                className="bg-amber-600 hover:bg-amber-700 text-white"
                            >
                                Add Now
                            </Button>
                        </div>
                    </div>
                )}

                {/* Filters - Show if there are contacts */}
                {emergencyContacts.length > 0 && (
                    <div className="mt-6">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Emergency Providers</h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowFilters(!showFilters)}
                                className="text-xs gap-1"
                            >
                                <Filter className="w-3 h-3" />
                                {showFilters ? 'Hide Filters' : 'Show Filters'}
                            </Button>
                        </div>

                        {showFilters && (
                            <div className="bg-white/95 dark:bg-zinc-800/95 rounded-2xl p-4 mb-4 shadow-md border border-gray-200 dark:border-zinc-700">
                                <div className="flex flex-wrap gap-3">
                                    {/* Workspace Filter */}
                                    <div className="flex-1 min-w-[150px]">
                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Workspace</label>
                                        <select
                                            className="w-full mt-1 p-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                                            value={filterByWorkspace || ''}
                                            onChange={(e) => setFilterByWorkspace(e.target.value || null)}
                                        >
                                            <option value="">All Workspaces</option>
                                            {workspaces.map((ws) => (
                                                <option key={ws.id} value={ws.id}>{ws.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Specialty Filter */}
                                    <div className="flex-1 min-w-[150px]">
                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Emergency Type</label>
                                        <select
                                            className="w-full mt-1 p-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                                            value={filterBySpecialty || ''}
                                            onChange={(e) => setFilterBySpecialty(e.target.value || null)}
                                        >
                                            <option value="">All Types</option>
                                            {specialties.map((spec) => (
                                                <option key={spec} value={spec}>{spec}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="self-end"
                                        onClick={() => {
                                            setFilterByWorkspace(null);
                                            setFilterBySpecialty(null);
                                        }}
                                    >
                                        <X className="w-3 h-3 mr-1" />
                                        Clear
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Emergency Contacts List */}
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : emergencyContacts.length > 0 ? (
                            <div className="space-y-3">
                                {emergencyContacts.map((contact) => (
                                    <Card
                                        key={contact.id}
                                        className="border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer bg-white/95 dark:bg-zinc-800/95 backdrop-blur-sm hover:scale-[1.02]"
                                        onClick={() => setSelectedContact(contact)}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center text-white flex-shrink-0">
                                                    <Stethoscope className="w-6 h-6" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h4 className="font-bold text-gray-900 dark:text-white">
                                                            {contact.full_name}
                                                        </h4>
                                                        {contact.verification_status === 'verified' && (
                                                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                                                        )}
                                                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px]">
                                                            {contact.is_available ? 'Available' : 'Unavailable'}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                                        {contact.professional_title || 'Healthcare Provider'}
                                                    </p>
                                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                                        {contact.workspaces && (
                                                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                                {getWorkspaceIcon(contact.workspaces.type)}
                                                                {contact.workspaces.name}
                                                            </span>
                                                        )}
                                                        <span className="text-xs text-gray-400">•</span>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {contact.response_time || 'Immediate'}
                                                        </span>
                                                        {contact.location && (
                                                            <>
                                                                <span className="text-xs text-gray-400">•</span>
                                                                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                                    <MapPin className="w-3 h-3" />
                                                                    {contact.location}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                    {contact.emergency_types && contact.emergency_types.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {contact.emergency_types.slice(0, 3).map((type) => (
                                                                <Badge key={type} className="bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 text-[10px]">
                                                                    {type}
                                                                </Badge>
                                                            ))}
                                                            {contact.emergency_types.length > 3 && (
                                                                <Badge className="bg-gray-50 text-gray-500 text-[10px]">
                                                                    +{contact.emergency_types.length - 3}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-2 flex-shrink-0">
                                                    <Button
                                                        size="sm"
                                                        className="h-8 px-3 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEmergencyCall(contact.phone_number);
                                                        }}
                                                    >
                                                        <PhoneCall className="w-3 h-3 mr-1" />
                                                        Call
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 px-3 rounded-full text-xs"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSMS(contact.phone_number);
                                                        }}
                                                    >
                                                        <MessageCircle className="w-3 h-3 mr-1" />
                                                        SMS
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-white/95 dark:bg-zinc-800/95 rounded-2xl">
                                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-zinc-700 flex items-center justify-center mx-auto mb-3">
                                    <Ambulance className="w-8 h-8 text-gray-400" />
                                </div>
                                <h4 className="font-bold text-gray-700 dark:text-gray-300">No Emergency Contacts Available</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Please use the emergency hotline above for immediate assistance.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Emergency Instructions */}
                <div className="mt-6 mb-8">
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">What to Do</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/95 dark:bg-zinc-800/95 backdrop-blur-sm rounded-2xl p-4 shadow-md">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-2">
                                <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h4 className="font-bold text-sm text-gray-900 dark:text-white">Call First</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Call emergency number immediately</p>
                        </div>
                        <div className="bg-white/95 dark:bg-zinc-800/95 backdrop-blur-sm rounded-2xl p-4 shadow-md">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-2">
                                <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <h4 className="font-bold text-sm text-gray-900 dark:text-white">Share Location</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Share for faster response</p>
                        </div>
                        <div className="bg-white/95 dark:bg-zinc-800/95 backdrop-blur-sm rounded-2xl p-4 shadow-md">
                            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-2">
                                <Users className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <h4 className="font-bold text-sm text-gray-900 dark:text-white">Stay Calm</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Stay with patient, keep calm</p>
                        </div>
                        <div className="bg-white/95 dark:bg-zinc-800/95 backdrop-blur-sm rounded-2xl p-4 shadow-md">
                            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-2">
                                <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h4 className="font-bold text-sm text-gray-900 dark:text-white">Stay Safe</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Ensure safety while waiting</p>
                        </div>
                    </div>
                </div>

                {/* Bottom Navigation */}
                <div className="mt-auto block sm:hidden bg-white/95 dark:bg-zinc-800/95 backdrop-blur-sm border-t border-gray-200 dark:border-zinc-700 -mx-4 px-4 py-3">
                    <div className="flex justify-around">
                        <button className="flex flex-col items-center text-gray-400 hover:text-red-500 transition-colors">
                            <Phone className="w-5 h-5" />
                            <span className="text-[10px]">Call</span>
                        </button>
                        <button className="flex flex-col items-center text-gray-400 hover:text-red-500 transition-colors">
                            <Heart className="w-5 h-5" />
                            <span className="text-[10px]">Help</span>
                        </button>
                        <button
                            onClick={() => navigate("/")}
                            className="flex flex-col items-center text-red-500"
                        >
                            <AlertCircle className="w-6 h-6" />
                            <span className="text-[10px] font-bold">Emergency</span>
                        </button>
                        <button className="flex flex-col items-center text-gray-400 hover:text-red-500 transition-colors">
                            <MessageCircle className="w-5 h-5" />
                            <span className="text-[10px]">Message</span>
                        </button>
                        <button className="flex flex-col items-center text-gray-400 hover:text-red-500 transition-colors">
                            <Users className="w-5 h-5" />
                            <span className="text-[10px]">Contact</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Floating Emergency Button - Mobile */}
            <div className="fixed bottom-20 right-4 z-50 block sm:hidden">
                <Button
                    onClick={() => {
                        const contact = emergencyContacts[0];
                        if (contact) {
                            handleEmergencyCall(contact.phone_number);
                        } else {
                            handleEmergencyCall(emergencyNumber);
                        }
                    }}
                    className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 animate-pulse"
                >
                    <PhoneCall className="w-8 h-8 text-white" />
                </Button>
            </div>

            {/* Contact Detail Modal */}
            {selectedContact && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center text-white">
                                    <Stethoscope className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                                        {selectedContact.full_name}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {selectedContact.professional_title || 'Healthcare Provider'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedContact(null)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl">
                                <Phone className="w-5 h-5 text-primary" />
                                <div>
                                    <p className="text-xs text-gray-500">Phone</p>
                                    <p className="font-medium">{selectedContact.phone_number}</p>
                                </div>
                            </div>

                            {selectedContact.alternate_phone && (
                                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl">
                                    <Phone className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">Alternate Phone</p>
                                        <p className="font-medium">{selectedContact.alternate_phone}</p>
                                    </div>
                                </div>
                            )}

                            {selectedContact.email && (
                                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl">
                                    <Mail className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">Email</p>
                                        <p className="font-medium">{selectedContact.email}</p>
                                    </div>
                                </div>
                            )}

                            {selectedContact.location && (
                                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl">
                                    <MapPin className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">Location</p>
                                        <p className="font-medium">{selectedContact.location}</p>
                                    </div>
                                </div>
                            )}

                            {selectedContact.specialty && (
                                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl">
                                    <Award className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">Specialty</p>
                                        <p className="font-medium">{selectedContact.specialty}</p>
                                    </div>
                                </div>
                            )}

                            {selectedContact.years_experience && (
                                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl">
                                    <Clock className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">Experience</p>
                                        <p className="font-medium">{selectedContact.years_experience} years</p>
                                    </div>
                                </div>
                            )}

                            {selectedContact.emergency_types && selectedContact.emergency_types.length > 0 && (
                                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl">
                                    {selectedContact.emergency_types.map((type) => (
                                        <Badge key={type} className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                            {type}
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            <div className="flex gap-3 mt-4">
                                <Button
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                    onClick={() => {
                                        handleEmergencyCall(selectedContact.phone_number);
                                        setSelectedContact(null);
                                    }}
                                >
                                    <PhoneCall className="w-4 h-4 mr-2" />
                                    Call Now
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => {
                                        handleSMS(selectedContact.phone_number);
                                        setSelectedContact(null);
                                    }}
                                >
                                    <MessageCircle className="w-4 h-4 mr-2" />
                                    SMS
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Emergency Contact Form Modal - For Providers */}
            {showMyContactForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">Add Emergency Contact</h3>
                            <button
                                onClick={() => setShowMyContactForm(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Add your emergency contact details so patients can reach you in emergencies.
                        </p>

                        <form className="space-y-4" onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target as HTMLFormElement);

                            const { data: { user } } = await supabase.auth.getUser();
                            if (!user) return;

                            const contactData = {
                                user_id: user.id,
                                workspace_id: currentWorkspace?.id || '',
                                full_name: formData.get('full_name') as string,
                                professional_title: formData.get('professional_title') as string,
                                phone_number: formData.get('phone_number') as string,
                                alternate_phone: formData.get('alternate_phone') as string || null,
                                email: formData.get('email') as string || null,
                                specialty: formData.get('specialty') as string || null,
                                years_experience: parseInt(formData.get('years_experience') as string) || null,
                                location: formData.get('location') as string || null,
                                emergency_types: (formData.get('emergency_types') as string)?.split(',').map(s => s.trim()) || ['Medical Emergency'],
                                is_available: true,
                                verification_status: 'pending'
                            };

                            const { error } = await supabase
                                .from('emergency_contacts')
                                .insert(contactData);

                            if (error) {
                                alert('Error adding emergency contact: ' + error.message);
                            } else {
                                alert('Emergency contact added successfully! Waiting for verification.');
                                setShowMyContactForm(false);
                                fetchEmergencyContacts();
                            }
                        }}>
                            <div>
                                <label className="text-sm font-medium">Full Name *</label>
                                <input
                                    type="text"
                                    name="full_name"
                                    required
                                    className="w-full mt-1 p-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">Professional Title</label>
                                <input
                                    type="text"
                                    name="professional_title"
                                    placeholder="Registered Nurse, Clinical Officer, etc."
                                    className="w-full mt-1 p-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">Phone Number *</label>
                                <input
                                    type="tel"
                                    name="phone_number"
                                    required
                                    placeholder="+254 700 000 000"
                                    className="w-full mt-1 p-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">Alternate Phone</label>
                                <input
                                    type="tel"
                                    name="alternate_phone"
                                    placeholder="+254 700 000 000"
                                    className="w-full mt-1 p-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    className="w-full mt-1 p-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">Specialty</label>
                                <input
                                    type="text"
                                    name="specialty"
                                    placeholder="Critical Care, Emergency Medicine, etc."
                                    className="w-full mt-1 p-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">Years of Experience</label>
                                <input
                                    type="number"
                                    name="years_experience"
                                    min="0"
                                    className="w-full mt-1 p-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">Location</label>
                                <input
                                    type="text"
                                    name="location"
                                    placeholder="Nairobi, Kenya"
                                    className="w-full mt-1 p-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">Emergency Types (comma separated)</label>
                                <input
                                    type="text"
                                    name="emergency_types"
                                    placeholder="Medical Emergency, Accident, Critical Care"
                                    className="w-full mt-1 p-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                                />
                            </div>

                            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white">
                                Add Emergency Contact
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Emergency;
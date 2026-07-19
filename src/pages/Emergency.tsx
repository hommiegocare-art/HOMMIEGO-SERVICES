import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    Ambulance
} from "lucide-react";

const Emergency = () => {
    const navigate = useNavigate();
    const [countdown, setCountdown] = useState(0);
    const [isCalling, setIsCalling] = useState(false);
    const emergencyNumber = "0704473503";

    // Pre-loaded emergency contacts
    const emergencyContacts = [
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

    // Quick action buttons
    const quickActions = [
        {
            icon: Phone,
            label: "Call Emergency",
            color: "bg-red-500 hover:bg-red-600",
            action: () => handleEmergencyCall()
        },
        {
            icon: MessageCircle,
            label: "SMS Help",
            color: "bg-blue-500 hover:bg-blue-600",
            action: () => handleSMS()
        },
        {
            icon: Navigation,
            label: "Share Location",
            color: "bg-green-500 hover:bg-green-600",
            action: () => shareLocation()
        },
        {
            icon: Star,
            label: "Quick Book",
            color: "bg-purple-500 hover:bg-purple-600",
            action: () => navigate("/explore")
        }
    ];

    const handleEmergencyCall = () => {
        setIsCalling(true);
        setCountdown(3);

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    window.location.href = `tel:${emergencyNumber}`;
                    setIsCalling(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleSMS = () => {
        const message = encodeURIComponent(
            "HELP! I need immediate medical assistance from HommieCare. Please call me back urgently."
        );
        window.location.href = `sms:${emergencyNumber}?body=${message}`;
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

    return (
        <div className="min-h-screen flex flex-col relative">
            {/* Background Image - Emergency Ambulance */}
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

            {/* Dark overlay for better readability on mobile */}
            <div className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-b from-white/50 via-white/30 to-white/50 dark:from-zinc-950/70 dark:via-zinc-950/50 dark:to-zinc-950/70" />

            <Navbar />

            {/* Container with max-width on desktop, full width on mobile */}
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
                            onClick={handleEmergencyCall}
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

                {/* Emergency Contacts */}
                <div className="mt-6">
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Emergency Contacts</h3>
                    <div className="space-y-3">
                        {emergencyContacts.map((contact, index) => (
                            <Card
                                key={index}
                                className="border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer bg-white/95 dark:bg-zinc-800/95 backdrop-blur-sm"
                                onClick={() => {
                                    window.location.href = `tel:${contact.number}`;
                                }}
                            >
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className={`${contact.color} w-12 h-12 rounded-full flex items-center justify-center text-white flex-shrink-0`}>
                                        <contact.icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">{contact.name}</h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{contact.type}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-sm font-semibold text-red-600 dark:text-red-400">{contact.number}</p>
                                        <span className="text-xs text-green-500 flex items-center justify-end gap-1">
                                            <CheckCircle className="w-3 h-3" />
                                            Available
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

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

                {/* Bottom Navigation - Only on mobile */}
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

            {/* Floating Emergency Button - Only on mobile */}
            <div className="fixed bottom-20 right-4 z-50 block sm:hidden">
                <Button
                    onClick={handleEmergencyCall}
                    className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 animate-pulse"
                >
                    <PhoneCall className="w-8 h-8 text-white" />
                </Button>
            </div>
        </div>
    );
};

export default Emergency;
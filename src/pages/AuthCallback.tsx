import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, Sparkles, ArrowRight, Heart } from "lucide-react";

export default function AuthCallback() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [statusMessage, setStatusMessage] = useState("Preparing your dashboard...");
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const handleAuth = async () => {
            try {
                // Get role from URL
                const role =
                    searchParams.get("role") === "provider"
                        ? "provider"
                        : "client";

                setProgress(20);
                setStatusMessage("Verifying your identity...");

                // Get logged in user
                const {
                    data: { session },
                } = await supabase.auth.getSession();

                if (!session?.user) {
                    setStatusMessage("Session expired. Redirecting...");
                    setTimeout(() => navigate("/auth"), 1000);
                    return;
                }

                const user = session.user;
                setProgress(50);
                setStatusMessage("Setting up your profile...");

                // Save/update profile
                await supabase.from("profiles").upsert({
                    id: user.id,
                    email: user.email,
                    role: role,
                    full_name: user.user_metadata.full_name || "",
                });

                setProgress(80);
                setStatusMessage(
                    role === "provider"
                        ? "Loading your professional dashboard..."
                        : "Loading your personalized dashboard..."
                );

                // Brief delay for cute animation
                await new Promise((resolve) => setTimeout(resolve, 800));

                setProgress(100);
                setStatusMessage(
                    role === "provider"
                        ? "Ready to manage your services! ✨"
                        : "Ready to discover amazing services! ✨"
                );

                // Redirect user after showing completion
                setTimeout(() => {
                    navigate(`/dashboard/${role}`);
                }, 600);
            } catch (error) {
                console.error(error);
                setStatusMessage("Something went wrong. Redirecting...");
                setTimeout(() => navigate("/auth"), 1500);
            }
        };

        handleAuth();
    }, [navigate, searchParams]);

    const role = searchParams.get("role") === "provider" ? "provider" : "client";
    const roleLabel = role === "provider" ? "Professional" : "Client";

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary/5 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                {/* Main Card */}
                <div className="bg-white dark:bg-gray-950 rounded-[2.5rem] shadow-2xl shadow-slate-200/60 dark:shadow-slate-950/60 border border-slate-100 dark:border-slate-800 p-8 md:p-10 text-center transition-colors duration-300">

                    {/* Logo / Icon Section */}
                    <div className="relative mb-8">
                        <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center relative">
                            <ShieldCheck className="w-10 h-10 text-primary" />
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center animate-pulse">
                                <Sparkles className="w-3 h-3 text-white" />
                            </div>
                        </div>
                    </div>

                    {/* Welcome Message */}
                    <div className="mb-6">
                        <div className="inline-flex items-center gap-2 bg-primary/5 dark:bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
                            <Sparkles className="w-3 h-3" />
                            {roleLabel} Portal
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-2">
                            Welcome to HommieGo
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            {role === "provider"
                                ? "Your professional journey starts here"
                                : "Your service discovery starts here"}
                        </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary to-blue-500 rounded-full transition-all duration-700 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-medium">
                            {progress}% Complete
                        </p>
                    </div>

                    {/* Status Message */}
                    <div className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-300 min-h-[24px]">
                        {progress < 100 ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                <span className="text-sm font-medium">{statusMessage}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-500">
                                <span className="text-lg">✅</span>
                                <span className="text-sm font-bold text-primary">{statusMessage}</span>
                            </div>
                        )}
                    </div>

                    {/* Decorative Dots */}
                    <div className="flex justify-center gap-1.5 mt-8">
                        {[0, 1, 2].map((i) => (
                            <div
                                key={i}
                                className={`w-2 h-2 rounded-full transition-all duration-500 ${progress > i * 33
                                    ? "bg-primary scale-100"
                                    : "bg-slate-200 dark:bg-slate-700 scale-75"
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-6">
                    <div className="flex items-center justify-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                        <Heart className="w-3 h-3 text-rose-400" />
                        <span>Secured by HommieGo</span>
                        <ArrowRight className="w-3 h-3" />
                    </div>
                </div>
            </div>
        </div>
    );
}
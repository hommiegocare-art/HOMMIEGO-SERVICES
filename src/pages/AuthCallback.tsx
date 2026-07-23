import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, Sparkles, ArrowRight, Heart } from "lucide-react";

export default function AuthCallback() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [statusMessage, setStatusMessage] = useState("Preparing your dashboard...");
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleAuth = async () => {
            try {
                // Get role from URL (if provided)
                const roleParam = searchParams.get("role");
                const workspaceParam = searchParams.get("workspace") as
                    'individual' | 'family' | 'organization' | 'agency' | null;

                setProgress(10);
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
                setProgress(30);
                setStatusMessage("Setting up your profile...");

                // Get user metadata
                const fullName = user.user_metadata?.full_name ||
                    user.user_metadata?.name ||
                    user.email?.split('@')[0] ||
                    'User';

                // 1. Check if profile exists, if not create it
                const { data: existingProfile, error: profileCheckError } = await supabase
                    .from("profiles")
                    .select("id, role, current_workspace_id")
                    .eq("id", user.id)
                    .maybeSingle();

                if (profileCheckError && profileCheckError.code !== 'PGRST116') {
                    console.error('Profile check error:', profileCheckError);
                }

                setProgress(50);
                setStatusMessage("Checking your workspace...");

                // 2. If no profile exists, create one
                if (!existingProfile) {
                    const { error: insertError } = await supabase
                        .from("profiles")
                        .insert({
                            id: user.id,
                            email: user.email,
                            role: roleParam === "provider" ? "provider" : "client",
                            full_name: fullName,
                            phone_number: user.user_metadata?.phone_number || "",
                            city: user.user_metadata?.city || "",
                            country: user.user_metadata?.country || "Kenya",
                            is_active: true,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        });

                    if (insertError) {
                        console.error('Profile insert error:', insertError);
                        throw new Error("Failed to create profile");
                    }
                }

                setProgress(60);
                setStatusMessage("Loading your workspaces...");

                // 3. Check if user has workspaces
                const { data: workspaceMembers, error: workspaceError } = await supabase
                    .from("workspace_members")
                    .select(`
                        workspace_id,
                        role,
                        workspaces!inner (
                            id,
                            name,
                            type,
                            slug,
                            verification_status
                        )
                    `)
                    .eq("user_id", user.id)
                    .eq("status", "active");

                if (workspaceError) {
                    console.error('Workspace error:', workspaceError);
                }

                setProgress(75);
                setStatusMessage("Finalizing setup...");

                // 4. Determine where to redirect
                const hasWorkspaces = workspaceMembers && workspaceMembers.length > 0;

                if (!hasWorkspaces) {
                    // User has no workspace → redirect to onboarding with role
                    setProgress(90);
                    setStatusMessage("Setting up your workspace...");

                    // Store the role in localStorage for the onboarding flow
                    const userRole = roleParam === "provider" ? "provider" : "client";
                    localStorage.setItem('onboarding_role', userRole);
                    localStorage.setItem('onboarding_email', user.email || '');
                    localStorage.setItem('onboarding_full_name', fullName);

                    setTimeout(() => {
                        navigate("/auth?mode=onboarding&step=role");
                    }, 500);
                    return;
                }

                setProgress(100);
                setStatusMessage("Ready to go! ✨");

                // 5. User has workspaces - get the current/primary one
                const primaryWorkspace = workspaceMembers[0];
                const userWorkspaceType = primaryWorkspace.workspaces.type;

                // Update profile with current workspace
                await supabase
                    .from("profiles")
                    .update({
                        current_workspace_id: primaryWorkspace.workspace_id
                    })
                    .eq("id", user.id);

                // Store workspace info in localStorage for quick access
                localStorage.setItem('currentWorkspaceId', primaryWorkspace.workspace_id);
                localStorage.setItem('currentWorkspaceType', userWorkspaceType);

                // Redirect to appropriate dashboard
                setTimeout(() => {
                    const dashboardPath = userWorkspaceType === 'individual'
                        ? '/dashboard/provider'
                        : `/dashboard/${userWorkspaceType}`;
                    navigate(dashboardPath);
                }, 600);

            } catch (error: any) {
                console.error('Auth callback error:', error);
                setError(error.message || "Authentication failed");
                setStatusMessage("Something went wrong. Redirecting...");

                setTimeout(() => {
                    navigate("/auth?mode=signin");
                }, 2000);
            }
        };

        handleAuth();
    }, [navigate, searchParams]);

    // If there's an error, show it
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary/5 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-950 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-8 md:p-10 text-center max-w-md">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
                        <ShieldCheck className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                        Authentication Error
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                        {error}
                    </p>
                    <button
                        onClick={() => navigate("/auth")}
                        className="w-full py-3 px-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors"
                    >
                        Return to Login
                    </button>
                </div>
            </div>
        );
    }

    // Determine role for display
    const roleParam = searchParams.get("role");
    const roleLabel = roleParam === "provider" ? "Professional" : "Client";

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
                            Welcome to HommieCare
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            {roleParam === "provider"
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
                        <span>Secured by HommieCare</span>
                        <ArrowRight className="w-3 h-3" />
                    </div>
                </div>
            </div>
        </div>
    );
}
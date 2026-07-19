import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  User,
  Briefcase,
  Mail,
  Lock,
  Phone,
  MapPin,
  Loader2,
  ShieldCheck,
  ChevronLeft
} from "lucide-react";

const backgrounds = [
  "/background1.png",
  "/background2.png",
  "/background3.png",
  "/background4.png",
  "/background5.png",
  "/background6.png",
];

export default function Auth() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "signin";
  const roleParam = searchParams.get("role");
  const [showGoogleRoleModal, setShowGoogleRoleModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(mode === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedRole, setSelectedRole] = useState<"client" | "provider">(
    roleParam === "provider" ? "provider" : "client"
  );
  const [phoneNumber, setPhoneNumber] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentBg, setCurrentBg] = useState(0);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: roleData } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .maybeSingle();
        const userRole = roleData?.role || "client";
        navigate(`/dashboard/${userRole}`);
      }
    };
    checkUser();
  }, [navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % backgrounds.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        const { data: roleData } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .maybeSingle();
        const userRole = roleData?.role || "client";
        navigate(`/dashboard/${userRole}`);
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleGoogleLogin = async (role: "client" | "provider") => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?role=${role}`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Google Login Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const { data: roleData, error: roleError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user?.id)
        .single();

      if (roleError) {
        console.error("Error fetching role:", roleError);
      }

      const userRole = roleData?.role || "client";

      toast({
        title: "Welcome back!",
        description: "Successfully signed in.",
      });

      navigate(`/dashboard/${userRole}`);
    } catch (error: any) {
      toast({
        title: "Authentication Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard/${selectedRole}`,
          data: {
            full_name: fullName,
            role: selectedRole,
            phone_number: phoneNumber,
            city: location,
          },
        },
      });

      if (error) throw error;

      if (data.user && data.session === null) {
        toast({
          title: "Registration successful!",
          description: "Please check your email to confirm your account.",
        });
        setIsLoading(false);
        return;
      }

      toast({
        title: "Account created successfully",
        description: "Welcome to HommieCare!",
      });

      navigate(`/dashboard/${selectedRole}`);
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Full screen overlay - covers everything including navbar and bottom nav */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden p-0 m-0">
        {/* Background */}
        <div className="absolute inset-0">
          {backgrounds.map((bg, index) => (
            <div
              key={bg}
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[2s] ease-in-out ${index === currentBg ? "opacity-100" : "opacity-0"
                }`}
              style={{ backgroundImage: `url(${bg})` }}
            />
          ))}
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[2px]" />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full h-full flex items-center justify-center px-3 py-3">
          <Card className="w-full max-w-md h-full max-h-[95vh] flex flex-col bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-none shadow-2xl animate-in fade-in zoom-in duration-500 overflow-hidden">
            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4">
              {/* HOME BUTTON */}
              <div className="mb-3 flex justify-start">
                <Button
                  variant="ghost"
                  onClick={() => navigate("/")}
                  className="group text-black dark:text-white transition-all pl-1 h-8 text-xs"
                >
                  <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                  Back
                </Button>
              </div>

              <div className="text-center mb-4">
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-3 shadow-xl shadow-primary/30">
                  <ShieldCheck className="text-white w-6 h-6" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {isSignUp ? "Create Account" : "Welcome Back"}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs">
                  {isSignUp
                    ? "Join HommieCare to access professional services"
                    : "Enter your credentials to access your dashboard"}
                </p>

                <div className="relative my-3">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200 dark:border-slate-700"></span>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase">
                    <span className="bg-white dark:bg-gray-950 px-2 text-slate-500 dark:text-slate-400">Or continue with</span>
                  </div>
                </div>

                {/* Google Button */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-10 text-sm font-semibold flex items-center justify-center gap-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-700 dark:text-slate-300"
                  onClick={() => setShowGoogleRoleModal(true)}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </Button>
              </div>

              <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-2">
                {isSignUp && (
                  <>
                    {/* Role Selection Cards */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedRole("client")}
                        className={`relative flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-300 ${selectedRole === "client"
                          ? "border-primary bg-primary/5 dark:bg-primary/10 ring-1 ring-primary shadow-sm"
                          : "border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-600"
                          }`}
                      >
                        <User className={`w-5 h-5 mb-1 ${selectedRole === "client" ? "text-primary" : "text-slate-400 dark:text-slate-500"}`} />
                        <span className={`text-xs font-semibold ${selectedRole === "client" ? "text-primary" : "text-slate-700 dark:text-slate-300"}`}>Client</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedRole("provider")}
                        className={`relative flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-300 ${selectedRole === "provider"
                          ? "border-primary bg-primary/5 dark:bg-primary/10 ring-1 ring-primary shadow-sm"
                          : "border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-600"
                          }`}
                      >
                        <Briefcase className={`w-5 h-5 mb-1 ${selectedRole === "provider" ? "text-primary" : "text-slate-400 dark:text-slate-500"}`} />
                        <span className={`text-xs font-semibold ${selectedRole === "provider" ? "text-primary" : "text-slate-700 dark:text-slate-300"}`}>Provider</span>
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="fullName" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">Full Name</Label>
                      <div className="relative group">
                        <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-500 group-focus-within:text-primary transition-colors" />
                        <Input
                          id="fullName"
                          className="pl-9 h-9 bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm"
                          placeholder="Jackline Mildred"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="phoneNumber" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">Phone</Label>
                        <div className="relative group">
                          <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-500 group-focus-within:text-primary transition-colors" />
                          <Input
                            id="phoneNumber"
                            className="pl-9 h-9 bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm"
                            type="tel"
                            placeholder="+254 700..."
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="location" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">Location</Label>
                        <div className="relative group">
                          <MapPin className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-500 group-focus-within:text-primary transition-colors" />
                          <Input
                            id="location"
                            className="pl-9 h-9 bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm"
                            placeholder="Nairobi"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">Email Address</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-500 group-focus-within:text-primary transition-colors" />
                    <Input
                      id="email"
                      className="pl-9 h-9 bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-500 group-focus-within:text-primary transition-colors" />
                    <Input
                      id="password"
                      className="pl-9 h-9 bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-10 text-sm font-bold transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98] mt-1"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Please wait...
                    </>
                  ) : isSignUp ? (
                    "Create Account"
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>

              <div className="mt-4 text-center border-t border-slate-100 dark:border-slate-800 pt-3">
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-xs font-semibold text-primary hover:text-primary/70 dark:hover:text-primary/80 transition-colors"
                >
                  {isSignUp
                    ? "Already have an account? Sign in"
                    : "Don't have an account? Join the community"}
                </button>
              </div>
            </div>
          </Card>

          {/* Google Role Modal */}
          {showGoogleRoleModal && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="w-[90%] max-w-sm rounded-3xl bg-white dark:bg-gray-950 p-5 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Continue with Google
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Choose how you want to use HommieCare
                  </p>
                </div>

                <div className="space-y-2.5">
                  <button
                    onClick={() => handleGoogleLogin("client")}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 p-3 text-left hover:border-primary dark:hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                          Continue as Client
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Hire trusted service providers
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleGoogleLogin("provider")}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 p-3 text-left hover:border-primary dark:hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                        <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                          Continue as Provider
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Offer services and earn money
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                <button
                  onClick={() => setShowGoogleRoleModal(false)}
                  className="w-full mt-3 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
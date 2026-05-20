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
// 1. Define your images (ensure the extensions .jpg/.png match your files in /public)
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

  const [isSignUp, setIsSignUp] = useState(mode === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  // Updated "customer" to "client"
  const [selectedRole, setSelectedRole] = useState<"client" | "provider">(
    roleParam === "provider" ? "provider" : "client"
  );
  const [phoneNumber, setPhoneNumber] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // 2. State for the slideshow
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

  // 3. Effect to cycle backgrounds every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % backgrounds.length);
    }, 5000); // Changes every 5 seconds
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
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Fetch the role
      const { data: roleData, error: roleError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user?.id)
        .single();

      if (roleError) {
        console.error("Error fetching role:", roleError);
        // If profile isn't found yet, default to client or show error
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
      setIsLoading(false); // This MUST run to stop the "Please wait"
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

      // Check if the user needs to confirm their email
      if (data.user && data.session === null) {
        toast({
          title: "Registration successful!",
          description: "Please check your email to confirm your account.",
        });
        setIsLoading(false);
        return; // Stop here, they need to verify email first
      }

      // If we reach here, user is auto-confirmed/logged in
      toast({
        title: "Account created successfully",
        description: "Welcome to HommieGo!",
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
    <div className="relative min-h-screen flex flex-col items-center justify-start md:justify-center overflow-y-scroll overflow-x-hidden no-scrollbar px-4 py-6 md:py-10">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        {backgrounds.map((bg, index) => (
          <div
            key={bg}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[2s]] ease-in-out ${index === currentBg ? "opacity-100" : "opacity-0"
              }`}
            style={{ backgroundImage: `url(${bg})` }}
          />
        ))}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md pb-24 md:pb-0">
        <Card className="w-full p-4 md:p-6 shadow-2xl border-none bg-white/95 backdrop-blur-md animate-in fade-in zoom-in duration-500">
          {/* HOME BUTTON - Positioned above the card for a cleaner look */}
          <div className="mb-4 flex justify-start">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="group text-black transition-all pl-2"
            >
              <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Button>
          </div>
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary/30">
              <ShieldCheck className="text-white w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {isSignUp ? "Create an Account" : "Welcome Back"}
            </h1>
            <p className="text-slate-500 mt-2 text-sm">
              {isSignUp
                ? "Join HommieGo to access professional services"
                : "Enter your credentials to access your dashboard"}
            </p>
          </div>

          <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-2">
            {isSignUp && (
              <>
                {/* Role Selection Cards */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRole("client")}
                    className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-300 ${selectedRole === "client"
                      ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                      : "border-slate-100 bg-white hover:border-slate-200"
                      }`}
                  >
                    <User className={`w-6 h-6 mb-2 ${selectedRole === "client" ? "text-primary" : "text-slate-400"}`} />
                    <span className={`text-sm font-semibold ${selectedRole === "client" ? "text-primary" : "text-slate-700"}`}>Client</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole("provider")}
                    className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-300 ${selectedRole === "provider"
                      ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                      : "border-slate-100 bg-white hover:border-slate-200"
                      }`}
                  >
                    <Briefcase className={`w-6 h-6 mb-2 ${selectedRole === "provider" ? "text-primary" : "text-slate-400"}`} />
                    <span className={`text-sm font-semibold ${selectedRole === "provider" ? "text-primary" : "text-slate-700"}`}>Provider</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">Full Name</Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <Input
                      id="fullName"
                      className="pl-10 bg-slate-50/50 border-slate-200 focus:bg-white transition-all"
                      placeholder="Jackline Mildred"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="phoneNumber" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">Phone</Label>
                    <div className="relative group">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                      <Input
                        id="phoneNumber"
                        className="pl-10 bg-slate-50/50 border-slate-200"
                        type="tel"
                        placeholder="+254 700..."
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="location" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">Location</Label>
                    <div className="relative group">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                      <Input
                        id="location"
                        className="pl-10 bg-slate-50/50 border-slate-200"
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
              <Label htmlFor="email" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">Email Address</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                <Input
                  id="email"
                  className="pl-10 bg-slate-50/50 border-slate-200 focus:bg-white"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">Password</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                <Input
                  id="password"
                  className="pl-10 bg-slate-50/50 border-slate-200 focus:bg-white"
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
              className="w-full h-12 text-sm font-bold transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98] mt-2"
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
                "Sign In to HommieGo"
              )}
            </Button>
          </form>

          <div className="mt-8 text-center border-t border-slate-100 pt-2">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm font-semibold text-primary hover:text-primary/70 transition-colors"
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Join the community"}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
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
  ShieldCheck
} from "lucide-react";

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

      const { data: roleData } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user?.id)
        .maybeSingle();
      const userRole = roleData?.role || "client";

      toast({
        title: "Welcome back!",
        description: "Successfully signed in to your account.",
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
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            phone_number: phoneNumber,
            city: location,
            role: selectedRole,
          })
          .eq("id", data.user.id);

        if (profileError) console.error("Profile update error:", profileError);

        if (selectedRole === "provider") {
          const trialEndDate = new Date();
          trialEndDate.setMonth(trialEndDate.getMonth() + 6);

          await supabase
            .from("subscriptions")
            .insert({
              provider_id: data.user.id,
              plan: "trial",
              status: "active",
              end_date: trialEndDate.toISOString(),
            });
        }
      }

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
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
      <Card className="w-full max-w-md p-8 shadow-xl border-t-4 border-t-primary animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
            <ShieldCheck className="text-white w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {isSignUp ? "Create an Account" : "Welcome Back"}
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            {isSignUp
              ? "Join HommieGo to access professional services"
              : "Enter your credentials to access your dashboard"}
          </p>
        </div>

        <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-5">
          {isSignUp && (
            <>
              {/* Role Selection Cards */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole("client")}
                  className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 ${selectedRole === "client"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-slate-100 bg-white hover:border-slate-200"
                    }`}
                >
                  <User className={`w-6 h-6 mb-2 ${selectedRole === "client" ? "text-primary" : "text-slate-400"}`} />
                  <span className={`text-sm font-semibold ${selectedRole === "client" ? "text-primary" : "text-slate-600"}`}>Client</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole("provider")}
                  className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 ${selectedRole === "provider"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-slate-100 bg-white hover:border-slate-200"
                    }`}
                >
                  <Briefcase className={`w-6 h-6 mb-2 ${selectedRole === "provider" ? "text-primary" : "text-slate-400"}`} />
                  <span className={`text-sm font-semibold ${selectedRole === "provider" ? "text-primary" : "text-slate-600"}`}>Provider</span>
                </button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-xs font-bold uppercase tracking-wider text-slate-500">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="fullName"
                    className="pl-10"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-xs font-bold uppercase tracking-wider text-slate-500">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="phoneNumber"
                    className="pl-10"
                    type="tel"
                    placeholder="+254 700 000 000"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-xs font-bold uppercase tracking-wider text-slate-500">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="location"
                    className="pl-10"
                    placeholder="Nairobi, Kenya"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="email"
                className="pl-10"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-500">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="password"
                className="pl-10"
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
            className="w-full h-11 text-sm font-semibold transition-all shadow-md active:scale-[0.98]"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : isSignUp ? (
              "Create Account"
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "Don't have an account? Create one"}
          </button>
        </div>
      </Card>
    </div>
  );
}
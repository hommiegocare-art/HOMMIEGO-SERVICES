import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload } from "lucide-react";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "signin";
  const roleParam = searchParams.get("role");

  const [isSignUp, setIsSignUp] = useState(mode === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedRole, setSelectedRole] = useState<"customer" | "provider">(roleParam === "provider" ? "provider" : "customer");
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
        const userRole = roleData?.role || "customer";
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
        const userRole = roleData?.role || "customer";
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

      // Get user role to redirect correctly
      const { data: roleData } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user?.id)
        .maybeSingle();
      const userRole = roleData?.role || "customer";

      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });

      navigate(`/dashboard/${userRole}`);
    } catch (error: any) {
      toast({
        title: "Error signing in",
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
      const redirectUrl = `${window.location.origin}/`;

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

      // Add role to user_roles table and update profile
      if (data.user) {

        // Update profile with additional info
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            phone_number: phoneNumber,
            city: location,
            role: selectedRole,
          })
          .eq("id", data.user.id);

        if (profileError) console.error("Error updating profile:", profileError);

        // Create subscription for providers
        if (selectedRole === "provider") {
          const trialEndDate = new Date();
          trialEndDate.setMonth(trialEndDate.getMonth() + 6);

          const { error: subError } = await supabase
            .from("subscriptions")
            .insert({
              provider_id: data.user.id,
              plan: "trial",
              status: "active",
              end_date: trialEndDate.toISOString(),
            });

          if (subError) console.error("Error creating subscription:", subError);
        }
      }

      toast({
        title: "Account created!",
        description: "Welcome to HommieGo!",
      });

      navigate(`/dashboard/${selectedRole}`);
    } catch (error: any) {
      toast({
        title: "Error creating account",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/20 p-4">
      <Card className="w-full max-w-md p-8 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">
            {isSignUp ? "Join HommieGo" : "Welcome Back"}
          </h1>
          <p className="text-muted-foreground">
            {isSignUp
              ? "Create your account to get started"
              : "Sign in to your account"}
          </p>
        </div>

        <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
          {isSignUp && (
            <>
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="role">Join as</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRole("customer")}
                    className={`p-4 rounded-lg border-2 transition-all ${selectedRole === "customer"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                      }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">👤</div>
                      <div className="font-semibold">Customer</div>
                      <div className="text-xs text-muted-foreground">Book services</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole("provider")}
                    className={`p-4 rounded-lg border-2 transition-all ${selectedRole === "provider"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                      }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">🧰</div>
                      <div className="font-semibold">Provider</div>
                      <div className="text-xs text-muted-foreground">Offer services</div>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="+254 700 000 000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  type="text"
                  placeholder="Nairobi, Kenya"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-primary-dark"
            disabled={isLoading}
          >
            {isLoading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-primary hover:underline"
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </button>
        </div>
      </Card>
    </div>
  );
}

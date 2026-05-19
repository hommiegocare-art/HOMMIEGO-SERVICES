import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, DollarSign, Briefcase, Star, MessageSquare } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);

      // Fetch profile
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
      } else {
        setProfile(profileData);
      }

      // Fetch user role
      setUserRole(profileData?.role || null);
      setIsLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed out",
        description: "You've been successfully signed out.",
      });
      navigate("/");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              Welcome back, {profile?.full_name || "User"} 👋
            </h1>
            <p className="text-muted-foreground">
              Role: {profile?.role?.charAt(0).toUpperCase() + profile?.role?.slice(1)}
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>

        {userRole === "provider" ? (
          <Tabs defaultValue="bookings" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="services">My Services</TabsTrigger>
              <TabsTrigger value="earnings">Earnings</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
            </TabsList>

            <TabsContent value="bookings" className="space-y-4">
              <h2 className="text-2xl font-bold">Booking Requests</h2>
              <div className="grid gap-4">
                {[1, 2].map((i) => (
                  <Card key={i} className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">Client Name {i}</h3>
                        <p className="text-sm text-muted-foreground">Wedding Photography</p>
                        <p className="text-sm mt-2">Date: Dec {15 + i}, 2024</p>
                        <p className="text-sm">Location: Nairobi</p>
                        <p className="text-lg font-bold mt-2 text-primary">KES 25,000</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">Reject</Button>
                        <Button size="sm">Accept</Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="services" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">My Services</h2>
                <Button>Add Service</Button>
              </div>
              <p className="text-muted-foreground">Your uploaded services will appear here</p>
            </TabsContent>

            <TabsContent value="earnings" className="space-y-4">
              <h2 className="text-2xl font-bold">Earnings Overview</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="p-6">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-8 h-8 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Earnings</p>
                      <p className="text-2xl font-bold">KES 125,000</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-8 h-8 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Completed Jobs</p>
                      <p className="text-2xl font-bold">24</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center gap-3">
                    <Star className="w-8 h-8 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Average Rating</p>
                      <p className="text-2xl font-bold">4.8 ⭐</p>
                    </div>
                  </div>
                </Card>
              </div>
              <Card className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10">
                <h3 className="text-lg font-semibold mb-2">Subscription Status</h3>
                <p className="text-sm text-green-600 font-semibold">✓ 6 Months Free Trial Active</p>
                <p className="text-sm text-muted-foreground mt-1">Expires in 5 months, 12 days</p>
              </Card>
            </TabsContent>

            <TabsContent value="messages" className="space-y-4">
              <h2 className="text-2xl font-bold">Messages</h2>
              <div className="grid gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-4 hover:bg-accent/50 cursor-pointer transition-colors">
                    <div className="flex items-center gap-4">
                      <MessageSquare className="w-10 h-10 text-primary" />
                      <div className="flex-1">
                        <h3 className="font-semibold">Client {i}</h3>
                        <p className="text-sm text-muted-foreground">Last message: 2 hours ago</p>
                      </div>
                      <div className="w-3 h-3 bg-primary rounded-full" />
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6 bg-gradient-to-br from-card to-secondary/10">
              <h3 className="text-lg font-semibold mb-2">Your Profile</h3>
              <p className="text-muted-foreground">
                {profile?.city || "No location set"}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {profile?.phone_number || "No phone number"}
              </p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-card to-secondary/10">
              <h3 className="text-lg font-semibold mb-2">My Bookings</h3>
              <p className="text-3xl font-bold text-primary">0</p>
              <p className="text-sm text-muted-foreground">Total bookings</p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-card to-secondary/10">
              <h3 className="text-lg font-semibold mb-2">Messages</h3>
              <p className="text-3xl font-bold text-primary">0</p>
              <p className="text-sm text-muted-foreground">Unread messages</p>
            </Card>
          </div>
        )}

        <div className="mt-8">
          <Card className="p-8 text-center bg-gradient-to-br from-card to-secondary/10">
            <h2 className="text-2xl font-bold mb-4">
              🎉 Dashboard Coming Soon!
            </h2>
            <p className="text-muted-foreground mb-6">
              We're building an amazing {profile?.role} dashboard with all the features you need.
              Stay tuned!
            </p>
            <Button
              className="bg-gradient-to-r from-primary to-primary-dark"
              onClick={() => navigate("/explore")}
            >
              Explore Services
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

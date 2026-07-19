import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, Briefcase, DollarSign, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth");
        return;
      }

      // Check if user has admin role
      const { data: roleData } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (roleData?.role !== "admin") {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);
      setIsLoading(false);
    };

    checkAdmin();
  }, [navigate, toast]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/20 pb-20">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard </h1>
            <p className="text-muted-foreground">Manage HommieCare platform</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <Users className="w-8 h-8 text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Total Users</p>
            <p className="text-2xl font-bold">1,234</p>
          </Card>
          <Card className="p-6">
            <Briefcase className="w-8 h-8 text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Active Providers</p>
            <p className="text-2xl font-bold">456</p>
          </Card>
          <Card className="p-6">
            <DollarSign className="w-8 h-8 text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold">KES 2.5M</p>
          </Card>
          <Card className="p-6">
            <TrendingUp className="w-8 h-8 text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Growth</p>
            <p className="text-2xl font-bold">+15%</p>
          </Card>
        </div>

        <Tabs defaultValue="providers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="providers">Providers</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="ads">Advertisements</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="providers" className="space-y-4">
            <h2 className="text-2xl font-bold">Pending Provider Approvals</h2>
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">Provider {i}</h3>
                      <p className="text-sm text-muted-foreground">Photography • Nairobi</p>
                      <p className="text-sm mt-2">Rate: KES 5,000/service</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">Reject</Button>
                      <Button size="sm">Approve</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <h2 className="text-2xl font-bold">Pending Service Approvals</h2>
            <p className="text-muted-foreground">Service moderation coming soon...</p>
          </TabsContent>

          <TabsContent value="ads" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Manage Advertisements</h2>
              <Button>Upload New Ad</Button>
            </div>
            <p className="text-muted-foreground">Ad management coming soon...</p>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <h2 className="text-2xl font-bold">Platform Analytics</h2>
            <p className="text-muted-foreground">Detailed analytics coming soon...</p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

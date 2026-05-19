import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ProviderOnboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: "",
    serviceType: "",
    description: "",
    rate: "",
    locationName: "",
  });

  const serviceTypes = [
    "Photography",
    "Car Hire",
    "Machine Rentals",
    "Event Planning",
    "Catering",
    "Beauty & Makeup",
    "Home Cleaning",
    "Tutoring",
    "Repairs & Maintenance",
    "Other",
  ];

  const handleLocationDetect = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          toast({
            title: "Location detected",
            description: `Lat: ${position.coords.latitude.toFixed(2)}, Lng: ${position.coords.longitude.toFixed(2)}`,
          });
        },
        () => {
          toast({
            title: "Location access denied",
            description: "Please enter your location manually.",
            variant: "destructive",
          });
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Update profile with provider details
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: formData.businessName,
          bio: formData.description,
          city: formData.locationName,
          role: "provider",
          phone_number: formData.rate,
        })
        .eq("id", session.user.id);

      if (profileError) throw profileError;



      toast({
        title: "Profile submitted successfully!",
        description: "Your provider profile has been approved. Welcome to HommieGo!",
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 py-8 px-4 pb-24">
      <div className="container max-w-2xl mx-auto">
        <Card className="p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Become a Provider</h1>
            <p className="text-muted-foreground">
              Fill in your details to start offering services on HommieGo
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business or Full Name *</Label>
              <Input
                id="businessName"
                required
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                placeholder="e.g., Wambui Photography"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceType">Service Type *</Label>
              <Select
                value={formData.serviceType}
                onValueChange={(value) => setFormData({ ...formData, serviceType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">About Your Service *</Label>
              <Textarea
                id="description"
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your services, experience, and what makes you unique..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rate">Rate per Service (KES) *</Label>
              <Input
                id="rate"
                type="number"
                required
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                placeholder="e.g., 5000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <div className="flex gap-2">
                <Input
                  id="location"
                  required
                  value={formData.locationName}
                  onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                  placeholder="e.g., Nairobi, CBD"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLocationDetect}
                >
                  <MapPin className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Sample Images (Optional)</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Upload 3-5 images of your work (Coming soon)
                </p>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit for Approval
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

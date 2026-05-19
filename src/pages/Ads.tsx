import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, ImagePlus, Upload, ChevronDown, Trash2, Megaphone, ExternalLink, Eye
} from "lucide-react";
import { HommieLoader } from "@/components/HommieLoader";

// --- Types ---
interface Ad {
  id: string;
  title: string;
  caption: string | null;
  image_url: string;
  link: string | null;
  created_at: string;
  is_active: boolean;
}

export default function CreateAd() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form State
  const [loading, setLoading] = useState(false);
  const [adsLoading, setAdsLoading] = useState(true);
  const [showPanel, setShowPanel] = useState(false);
  const [ads, setAds] = useState<Ad[]>([]);

  // Field State
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [link, setLink] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchAllAds(); // Changed from fetchMyAds
  }, []);
  // Use this function for your Homepage/Public view
  async function fetchAllAds() {
    setAdsLoading(true);
    try {
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .eq("is_active", true) // Show all active ads regardless of who made them
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAds(data || []);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setAdsLoading(false);
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  }

  async function uploadImage(file: File) {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `ads/${fileName}`;

    const { error } = await supabase.storage
      .from("ad-images")
      .upload(filePath, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from("ad-images")
      .getPublicUrl(filePath);

    return publicUrl;
  }

  async function handleCreateAd(e: React.FormEvent) {
    e.preventDefault();
    if (!image) {
      toast({ title: "Image required", description: "Please upload an ad banner.", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }

      const imageUrl = await uploadImage(image);

      const { error } = await supabase
        .from("ads")
        .insert({
          user_id: session.user.id,
          title,
          caption,
          link,
          image_url: imageUrl,
          is_active: true, // This ensures it appears on the homepage for everyone
        });

      if (error) throw error;

      toast({ title: "Ad Published!", description: "Your advertisement is now visible to everyone." });

      // Reset Form
      setTitle(""); setCaption(""); setLink(""); setImage(null); setPreview(null);
      setShowPanel(false);
      fetchAllAds();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function deleteAd(id: string) {
    if (!confirm("Are you sure? This will remove the ad from the public homepage.")) return;
    const { error } = await supabase.from("ads").delete().eq("id", id);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }
    setAds(prev => prev.filter(ad => ad.id !== id));
    toast({ title: "Ad Deleted" });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto">

          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Ad Manager</h1>
              <p className="text-slate-500 mt-1">Promote your business on the HommieGo homepage</p>
            </div>
            <Button
              size="lg"
              onClick={() => setShowPanel(!showPanel)}
              className="rounded-xl shadow-lg shadow-primary/20 gap-2 px-8"
            >
              <Megaphone className="w-5 h-5" />
              {showPanel ? "Close Panel" : "Create New Ad"}
              <ChevronDown className={`w-4 h-4 transition-transform ${showPanel ? "rotate-180" : ""}`} />
            </Button>
          </div>

          {/* Form Panel */}
          {showPanel && (
            <Card className="border-none shadow-xl rounded-xl overflow-hidden mb-2 animate-in slide-in-from-top-10 duration-500">
              <CardHeader className="bg-slate-900 text-white p-3">
                <CardTitle className="text-2xl">Advertisement Details</CardTitle>
                <CardDescription className="text-slate-400">Fill in the details to reach thousands of customers</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleCreateAd} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-base font-bold">Campaign Title</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Summer Special: 20% Off Plumbing"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className="h-12 rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="caption" className="text-base font-bold">Short Caption</Label>
                      <Textarea
                        id="caption"
                        placeholder="Describe your offer in one sentence..."
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        className="rounded-xl min-h-[100px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="link" className="text-base font-bold">External Link (Optional)</Label>
                      <Input
                        id="link"
                        placeholder="https://yourwebsite.com"
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        className="h-12 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-base font-bold">Ad Banner (Recommended: 1200x400)</Label>
                    <label className="relative group cursor-pointer border-2 border-dashed border-slate-200 rounded-[2rem] h-[280px] flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 hover:border-primary transition-all overflow-hidden">
                      {preview ? (
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center">
                          <div className="bg-white p-4 rounded-full shadow-sm inline-block mb-3 group-hover:scale-110 transition-transform">
                            <ImagePlus className="w-8 h-8 text-primary" />
                          </div>
                          <p className="font-bold text-slate-700">Click to upload image</p>
                          <p className="text-xs text-slate-400 mt-1">PNG, JPG or WEBP</p>
                        </div>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    </label>
                    <Button type="submit" disabled={loading} className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20">
                      {loading ? <Loader2 className="animate-spin mr-2" /> : <Upload className="mr-2" />}
                      Publish Live Now
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* List of Ads */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Eye className="w-6 h-6 text-slate-400" />
              Your Active Campaigns
            </h2>

            {adsLoading ? (
              <div className="flex justify-center py-20">if (loading) return <HommieLoader /></div>
            ) : ads.length === 0 ? (
              <Card className="border-dashed bg-transparent p-20 text-center">
                <Megaphone className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-400">No advertisements yet</h3>
                <p className="text-slate-400 max-w-xs mx-auto mt-2">Create your first ad to start reaching users on the platform.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ads.map((ad) => (
                  <Card key={ad.id} className="group overflow-hidden rounded-[2rem] border-none shadow-sm hover:shadow-xl transition-all duration-300">
                    <div className="relative h-48">
                      <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute top-4 right-4 flex gap-2">
                        <Badge className="bg-green-500 border-none px-3 py-1">Active & Public</Badge>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h3 className="text-xl font-bold line-clamp-1">{ad.title}</h3>
                          <p className="text-slate-500 text-sm mt-1 line-clamp-2">{ad.caption || "No caption provided."}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteAd(ad.id)}
                          className="text-slate-300 hover:text-destructive hover:bg-destructive/10 rounded-xl"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                      <div className="mt-6 flex items-center justify-between border-t pt-4">
                        <div className="text-xs text-slate-400">Created: {new Date(ad.created_at).toLocaleDateString()}</div>
                        {ad.link && (
                          <a href={ad.link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm font-bold text-primary hover:underline">
                            <ExternalLink className="w-4 h-4" /> Destination
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
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
    // 1. Create the Form Data
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

    // 2. Send to Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error("Failed to upload ad banner to Cloudinary");
    }

    // 3. Get the URL back
    const data = await response.json();
    return data.secure_url;
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <Navbar />

      <div className="pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto">

          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Ad Manager</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Promote your business on the HommieGo homepage</p>
            </div>
            <Button
              size="lg"
              onClick={() => setShowPanel(!showPanel)}
              className="
rounded-xl shadow-lg shadow-primary/20 gap-2 px-8
dark:shadow-primary/10
"
            >
              <Megaphone className="w-5 h-5" />
              {showPanel ? "Close Panel" : "Create New Ad"}
              <ChevronDown className={`w-4 h-4 transition-transform ${showPanel ? "rotate-180" : ""}`} />
            </Button>
          </div>

          {/* Form Panel */}
          {showPanel && (
            <Card className="
border border-slate-200 dark:border-slate-800
bg-white dark:bg-slate-900
shadow-xl rounded-xl overflow-hidden mb-2
animate-in slide-in-from-top-10 duration-500
">
              <CardHeader className="bg-slate-900 dark:bg-slate-950 text-white p-3 border-b border-slate-800">
                <CardTitle className="text-2xl">Advertisement Details</CardTitle>
                <CardDescription className="text-slate-400 dark:text-slate-500">Fill in the details to reach thousands of customers</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleCreateAd} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-base font-bold text-slate-900 dark:text-white">Campaign Title</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Summer Special: 20% Off Plumbing"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className="
h-12 rounded-xl
bg-white dark:bg-slate-800
border-slate-200 dark:border-slate-700
text-slate-900 dark:text-white
placeholder:text-slate-400 dark:placeholder:text-slate-500
"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="caption" className="text-base font-bold text-slate-900 dark:text-white">Short Caption</Label>
                      <Textarea
                        id="caption"
                        placeholder="Describe your offer in one sentence..."
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        className="
rounded-xl min-h-[100px]
bg-white dark:bg-slate-800
border-slate-200 dark:border-slate-700
text-slate-900 dark:text-white
placeholder:text-slate-400 dark:placeholder:text-slate-500
"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="link" className="text-base font-bold text-slate-900 dark:text-white">External Link (Optional)</Label>
                      <Input
                        id="link"
                        placeholder="https://yourwebsite.com or /explore" // Added /explore as a hint
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        className="
h-12 rounded-xl
bg-white dark:bg-slate-800
border-slate-200 dark:border-slate-700
text-slate-900 dark:text-white
placeholder:text-slate-400 dark:placeholder:text-slate-500
"
                      />
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">Include http:// for external websites</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-base font-bold text-slate-900 dark:text-white">Ad Banner (Recommended: 1200x400)</Label>
                    <label className="
relative group cursor-pointer border-2 border-dashed
border-slate-200 dark:border-slate-700
rounded-[2rem] h-[280px]
flex flex-col items-center justify-center
bg-slate-50 dark:bg-slate-900
hover:bg-slate-100 dark:hover:bg-slate-800
hover:border-primary
transition-all overflow-hidden
">
                      {preview ? (
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center">
                          <div className="
bg-white dark:bg-slate-800
p-4 rounded-full shadow-sm inline-block mb-3
group-hover:scale-110 transition-transform
">
                            <ImagePlus className="w-8 h-8 text-primary" />
                          </div>
                          <p className="font-bold text-slate-700 dark:text-slate-200">Click to upload image</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">PNG, JPG or WEBP</p>
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
            <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <Eye className="w-6 h-6 text-slate-400 dark:text-slate-500" />
              Your Active Campaigns
            </h2>

            {adsLoading ? (
              <div className="flex justify-center py-20">
                <HommieLoader />
              </div>
            ) : ads.length === 0 ? (
              <Card className="
border-dashed
border-slate-200 dark:border-slate-700
bg-transparent dark:bg-slate-900/30
p-20 text-center
">
                <Megaphone className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-500 dark:text-slate-300">No advertisements yet</h3>
                <p className="text-slate-400 dark:text-slate-500 max-w-xs mx-auto mt-2">Create your first ad to start reaching users on the platform.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ads.map((ad) => (
                  <Card
                    key={ad.id}
                    className="
    group overflow-hidden rounded-[2rem]
    bg-white dark:bg-slate-900
    border border-slate-200 dark:border-slate-800
    shadow-sm hover:shadow-xl
    dark:hover:shadow-black/20
    transition-all duration-300
  "
                  >
                    <div className="relative h-48">
                      <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute top-4 right-4 flex gap-2">
                        <Badge className="bg-green-500 border-none px-3 py-1">Active & Public</Badge>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h3 className="text-xl font-bold line-clamp-1 text-slate-900 dark:text-white">{ad.title}</h3>
                          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 line-clamp-2">{ad.caption || "No caption provided."}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteAd(ad.id)}
                          className="
text-slate-300 dark:text-slate-600
hover:text-destructive
hover:bg-destructive/10
rounded-xl
"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                      <div className="mt-6 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4">
                        <div className="text-xs text-slate-400 dark:text-slate-500">Created: {new Date(ad.created_at).toLocaleDateString()}</div>
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
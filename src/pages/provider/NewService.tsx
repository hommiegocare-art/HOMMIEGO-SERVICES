import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, ImagePlus, ArrowLeft, Check, MapPin, DollarSign, Briefcase } from "lucide-react";

interface Category {
    id: string;
    name: string;
    icon?: string | null;
}

export default function NewService() {
    const BOOKING_FEE = "200";
    const navigate = useNavigate();
    const { toast } = useToast();

    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    // Inside NewService component
    const [pricingType, setPricingType] = useState("fixed"); // Default to fixed
    // Form State
    const [title, setTitle] = useState("");
    const [shortDescription, setShortDescription] = useState("");
    const [description, setDescription] = useState("");
    // Change this line:
    const [price, setPrice] = useState(BOOKING_FEE);
    const [locationName, setLocationName] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [images, setImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);

    useEffect(() => {
        fetchCategories();
    }, []);

    async function fetchCategories() {
        const { data, error } = await supabase.from("categories").select("id, name, icon").order("name");
        if (!error) setCategories(data || []);
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        const newFiles = Array.from(files);
        setImages(newFiles);
        setPreviews(newFiles.map(file => URL.createObjectURL(file)));
    };

    const uploadImage = async (file: File) => {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `services/${fileName}`;

        const { error } = await supabase.storage.from("service-images").upload(filePath, file);
        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage.from("service-images").getPublicUrl(filePath);
        return publicUrl;
    };

    const handleCreateService = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCategory) {
            toast({ title: "Category required", description: "Please pick a category for your service.", variant: "destructive" });
            return;
        }

        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { navigate("/auth"); return; }

            let uploadedImages: string[] = [];
            if (images.length > 0) {
                uploadedImages = await Promise.all(images.map(img => uploadImage(img)));
            }

            const { data: service, error } = await supabase.from("services").insert({
                provider_id: session.user.id,
                category_id: selectedCategory,
                title,
                short_description: shortDescription,
                description,
                price: Number(price),
                pricing_type: pricingType, // ADD THIS LINE
                location_name: locationName,
                cover_image: uploadedImages[0] || null,
                is_active: true,
            }).select().single();

            if (error) throw error;

            if (uploadedImages.length > 0 && service) {
                const imageRows = uploadedImages.map(url => ({ service_id: service.id, image_url: url }));
                await supabase.from("service_images").insert(imageRows);
            }

            toast({ title: "Service Published!", description: "Your service is now live on the platform." });
            navigate("/dashboard/provider");
        } catch (error: any) {
            toast({ title: "Creation failed", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            <div className="container mx-auto px-4 pt-2">

                {/* Navigation & Title Header */}
                <div className="max-w-2xl mx-auto mb-2 flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full bg-white shadow-sm border">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">List New Service</h1>
                        <p className="text-slate-500">Share your expertise with the community.</p>
                    </div>
                </div>

                <div className="max-w-2xl mx-auto">
                    <form onSubmit={handleCreateService} className="space-y-8">

                        {/* BLOCK 1: General Info */}
                        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
                            <div className="bg-slate-900 p-2 flex items-center gap-3">
                                <Briefcase className="text-primary w-6 h-6" />
                                <h2 className="text-white font-bold text-lg">Service Details</h2>
                            </div>
                            <CardContent className="p-2 space-y-2">
                                <div className="space-y-2">
                                    <Label className="font-bold text-slate-700">Service Title</Label>
                                    <Input
                                        placeholder="e.g. Professional Home Cleaning"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                        className="h-12 rounded-xl border-slate-200"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="font-bold text-slate-700">Summary</Label>
                                    <Input
                                        placeholder="One-liner that appears in search results"
                                        value={shortDescription}
                                        onChange={(e) => setShortDescription(e.target.value)}
                                        required
                                        className="h-12 rounded-xl border-slate-200"
                                    />
                                </div>

                                {/* Price and Location - Vertical Stack */}

                                <div className="space-y-6">
                                    {/* Price Section */}
                                    <div className="space-y-3">
                                        <Label className="font-bold text-slate-700 flex items-center gap-2">
                                            <DollarSign className="w-4 h-4 text-primary" />
                                            Standard Booking Fee (KES)
                                        </Label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                                            <Input
                                                type="number"
                                                className="pl-10 h-12 rounded-xl border-slate-200 bg-slate-100 font-bold text-slate-900 cursor-not-allowed"
                                                value={price}
                                                readOnly
                                            />
                                        </div>
                                    </div>

                                    {/* NEW: PRICING TYPE SELECTION */}
                                    <div className="space-y-3">
                                        <Label className="font-bold text-slate-700">How is your total service charged?</Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setPricingType("fixed")}
                                                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${pricingType === "fixed" ? "border-primary bg-primary/5" : "border-slate-100 bg-white"
                                                    }`}
                                            >
                                                <span className={`font-bold ${pricingType === "fixed" ? "text-primary" : "text-slate-600"}`}>Fixed</span>
                                                <span className="text-[10px] text-slate-400">Set final price</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPricingType("negotiable")}
                                                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${pricingType === "negotiable" ? "border-primary bg-primary/5" : "border-slate-100 bg-white"
                                                    }`}
                                            >
                                                <span className={`font-bold ${pricingType === "negotiable" ? "text-primary" : "text-slate-600"}`}>Negotiable</span>
                                                <span className="text-[10px] text-slate-400">Price varies per job</span>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-bold text-slate-700">Service Location</Label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                                            <Input
                                                placeholder="e.g. Westlands, Nairobi"
                                                className="pl-10 h-12 rounded-xl border-slate-200"
                                                value={locationName}
                                                onChange={(e) => setLocationName(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* SMART DESCRIPTION CHECKLIST */}
                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <Label className="font-bold text-slate-700">Detailed Description</Label>
                                            <span className="text-[10px] text-slate-400 font-medium italic">Make sure to explain your total charges here.</span>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${description.length > 100 ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                            {description.length} chars
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Textarea
                                            placeholder="Describe your service... e.g. 'My total fee is KES 2000. I bring my own vacuum. Transport to Westlands is free, but KES 300 elsewhere...'"
                                            className="min-h-[250px] rounded-xl p-4 border-slate-200 focus:ring-primary md:col-span-1 shadow-inner bg-white"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            required
                                        />

                                        {/* THE SMART CHECKLIST BOX */}
                                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <Check className="w-3 h-3" /> Booking Transparency Checklist
                                            </h4>

                                            <ul className="space-y-3">
                                                {[
                                                    {
                                                        label: "Mention your Total Price/Rate",
                                                        check: description.toLowerCase().match(/kes|price|cost|charge|total|amount/i),
                                                        tip: "Remind customers the KES 200 is just a booking fee."
                                                    },
                                                    {
                                                        label: "Transport/Fare details",
                                                        check: description.toLowerCase().match(/transport|fare|travel|distance|km/i),
                                                        tip: "Is transport included or extra?"
                                                    },
                                                    {
                                                        label: "Tools/Materials provided",
                                                        check: description.toLowerCase().match(/tool|equipment|material|machine|soap/i),
                                                        tip: "Do you bring everything needed?"
                                                    },
                                                    {
                                                        label: "Service Duration (Hours/Days)",
                                                        check: description.toLowerCase().match(/hour|day|time|duration|mins/i),
                                                        tip: "How long does the job take?"
                                                    },
                                                    {
                                                        label: "Years of Experience",
                                                        check: description.toLowerCase().match(/year|experience|expert|qualified/i),
                                                        tip: "Build trust with your history."
                                                    },
                                                    {
                                                        label: "Min. 100 characters",
                                                        check: description.length >= 100,
                                                        tip: ""
                                                    }
                                                ].map((item, idx) => (
                                                    <li key={idx} className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2 text-xs font-bold">
                                                            {item.check ? (
                                                                <div className="bg-green-500 rounded-full p-0.5 text-white shadow-sm">
                                                                    <Check className="w-3 h-3" />
                                                                </div>
                                                            ) : (
                                                                <div className="bg-slate-200 rounded-full w-4 h-4 flex-shrink-0" />
                                                            )}
                                                            <span className={item.check ? "text-slate-900" : "text-slate-400"}>
                                                                {item.label}
                                                            </span>
                                                        </div>
                                                        {!item.check && item.tip && (
                                                            <span className="text-[10px] text-slate-400 ml-6 italic">{item.tip}</span>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>

                                            <div className="bg-blue-600 p-4 rounded-xl text-white shadow-md shadow-blue-100">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <DollarSign className="w-3 h-3" />
                                                    <span className="text-[10px] font-black uppercase">Provider Tip</span>
                                                </div>
                                                <p className="text-[11px] leading-relaxed font-medium">
                                                    "Customers are <span className="underline">more likely</span> to pay the KES 200 booking fee if they know exactly what the final balance will be."
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* BLOCK 2: Images Gallery */}
                        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
                            <div className="bg-slate-900 p-2 flex items-center gap-3">
                                <ImagePlus className="text-primary w-6 h-6" />
                                <h2 className="text-white font-bold text-lg">Service Gallery</h2>
                            </div>
                            <CardContent className="p-2">
                                <label className="border-2 border-dashed border-slate-200 rounded-xl p-2 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-all hover:border-primary group">
                                    <div className="bg-primary/10 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform">
                                        <Upload className="w-8 h-8 text-primary" />
                                    </div>
                                    <p className="font-bold text-slate-700">Add Photos</p>
                                    <p className="text-xs text-slate-400 mt-1 text-center">Click to browse your gallery</p>
                                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                                </label>

                                {previews.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                                        {previews.map((src, i) => (
                                            <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                                                <img src={src} className="w-full h-full object-cover" alt="" />
                                                {i === 0 && (
                                                    <Badge className="absolute top-1 left-1 text-[10px] bg-primary text-white border-none shadow-md">
                                                        Main
                                                    </Badge>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* BLOCK 3: Category Selection */}
                        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
                            <div className="bg-slate-900 p-2 flex items-center gap-3">
                                <Check className="text-primary w-6 h-6" />
                                <h2 className="text-white font-bold text-lg">Category</h2>
                            </div>
                            <CardContent className="p-2">
                                <div className="mb-4">
                                    <Label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Select One</Label>
                                </div>

                                {/* Categories list - Single Column List */}
                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setSelectedCategory(cat.id)}
                                            className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all group ${selectedCategory === cat.id
                                                ? 'border-primary bg-primary/5 shadow-inner'
                                                : 'border-slate-50 bg-slate-50/50 hover:border-slate-200'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div
                                                    className={`w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center text-sm shadow-sm overflow-hidden flex-shrink-0 ${selectedCategory === cat.id
                                                        ? "bg-primary text-white"
                                                        : "bg-white"
                                                        }`}
                                                >
                                                    <span className="truncate">
                                                        {cat.icon || "🛠️"}
                                                    </span>
                                                </div>
                                                <span
                                                    className={`font-bold text-base break-words text-left leading-tight ${selectedCategory === cat.id
                                                        ? "text-primary"
                                                        : "text-slate-600"
                                                        }`}
                                                >
                                                    {cat.name}
                                                </span>
                                            </div>
                                            {selectedCategory === cat.id && (
                                                <div className="bg-primary p-1 rounded-full text-white">
                                                    <Check className="w-4 h-4" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Submission Block */}
                        <div className="pt-4 space-y-4">
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-16 rounded-[2rem] text-xl font-bold shadow-xl shadow-primary/20 transition-all active:scale-95"
                            >
                                {loading ? <Loader2 className="animate-spin mr-2 w-6 h-6" /> : <Upload className="mr-2 w-6 h-6" />}
                                Publish Live Now
                            </Button>
                            <p className="text-xs text-center text-slate-400 px-6 leading-relaxed">
                                By publishing, you confirm that your service details are accurate and comply with HommieGo's Professional Guidelines.
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
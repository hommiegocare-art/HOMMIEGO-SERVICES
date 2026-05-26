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
import { Loader2, Upload, ImagePlus, ArrowLeft, Check, MapPin, DollarSign, Briefcase, Clock, Zap } from "lucide-react";

interface Category {
    id: string;
    name: string;
    icon?: string | null;
}

export default function NewService() {
    // ADD THESE AT THE TOP (outside or inside the component)
    const REGULAR_BOOKING_FEE = "100";
    const PRIORITY_BOOKING_FEE = "300";

    // INSIDE THE COMPONENT:
    const [price, setPrice] = useState(""); // This stays empty for them to type
    const [regularFee] = useState(REGULAR_BOOKING_FEE); // Locked
    const [priorityFee] = useState(PRIORITY_BOOKING_FEE); // Locked
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
        // 1. Create a "Form" to send the image
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

        // 2. Send it to Cloudinary
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
                method: "POST",
                body: formData,
            }
        );

        if (!response.ok) {
            throw new Error("Failed to upload image to Cloudinary");
        }

        // 3. Get the web link (URL) of the uploaded image
        const data = await response.json();
        return data.secure_url; // This is the link we save to Supabase
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
                price: Number(price), // This saves your main service price
                regular_booking_fee: Number(regularFee), // ADD THIS
                priority_booking_fee: Number(priorityFee), // ADD THIS
                pricing_type: pricingType,
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
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 pb-20 transition-colors duration-300">
            <div className="container mx-auto px-4 pt-2">

                {/* Navigation & Title Header */}
                <div className="max-w-2xl mx-auto mb-2 flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full bg-white dark:bg-slate-800 shadow-sm border dark:border-slate-700">
                        <ArrowLeft className="w-5 h-5 dark:text-slate-300" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">List New Service</h1>
                        <p className="text-slate-500 dark:text-slate-400">Share your expertise with the community.</p>
                    </div>
                </div>

                <div className="max-w-2xl mx-auto">
                    <form onSubmit={handleCreateService} className="space-y-2">

                        {/* BLOCK 1: General Info */}
                        <Card className="border-none shadow-sm rounded-xl overflow-hidden dark:bg-slate-900 transition-colors">
                            <div className="bg-slate-900 dark:bg-slate-800 p-2 flex items-center gap-3">
                                <Briefcase className="text-primary w-6 h-6" />
                                <h2 className="text-white font-bold text-lg">Service Details</h2>
                            </div>
                            <CardContent className="p-2 space-y-2">
                                <div className="space-y-2">
                                    <Label className="font-bold text-slate-700 dark:text-slate-300">Service Title</Label>
                                    <Input
                                        placeholder="e.g. Professional Home Cleaning"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                        className="h-12 rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="font-bold text-slate-700 dark:text-slate-300">Summary</Label>
                                    <Input
                                        placeholder="One-liner that appears in search results"
                                        value={shortDescription}
                                        onChange={(e) => setShortDescription(e.target.value)}
                                        required
                                        className="h-12 rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                                    />
                                </div>

                                {/* Price and Location - Vertical Stack */}
                                <div className="space-y-6">
                                    {/* 1. Main Service Price - Now Editable! */}
                                    <div className="space-y-3">
                                        <Label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                            <DollarSign className="w-4 h-4 text-green-500" />
                                            Total Service Price (KES)
                                        </Label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                                            <Input
                                                type="number"
                                                placeholder="How much do you charge for the job?"
                                                className="pl-10 h-12 rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800"
                                                value={price}
                                                onChange={(e) => setPrice(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-400 italic pl-1">This is your total fee for the service.</p>
                                    </div>

                                    {/* 2. The Two Booking Fee Columns */}
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Locked Regular Fee */}
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold flex items-center gap-1 text-slate-500">
                                                <Clock className="w-3 h-3 text-blue-500" /> Regular Fee (Locked)
                                            </Label>
                                            <Input
                                                type="number"
                                                value={regularFee}
                                                readOnly // THIS LOCKS IT
                                                className="h-11 rounded-xl border-slate-200 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 cursor-not-allowed font-medium"
                                            />
                                        </div>

                                        {/* Locked Priority Fee */}
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold flex items-center gap-1 text-slate-500">
                                                <Zap className="w-3 h-3 text-orange-500" /> Priority Fee (Locked)
                                            </Label>
                                            <Input
                                                type="number"
                                                value={priorityFee}
                                                readOnly // THIS LOCKS IT
                                                className="h-11 rounded-xl border-slate-200 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 cursor-not-allowed font-medium"
                                            />
                                        </div>
                                    </div>
                                    {/* NEW: PRICING TYPE SELECTION */}
                                    <div className="space-y-3">
                                        <Label className="font-bold text-slate-700 dark:text-slate-300">How is your total service charged?</Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setPricingType("fixed")}
                                                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${pricingType === "fixed" ? "border-primary bg-primary/5 dark:bg-primary/10" : "border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800"
                                                    }`}
                                            >
                                                <span className={`font-bold ${pricingType === "fixed" ? "text-primary" : "text-slate-600 dark:text-slate-300"}`}>Fixed</span>
                                                <span className="text-[10px] text-slate-400 dark:text-slate-500">Set final price</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPricingType("negotiable")}
                                                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${pricingType === "negotiable" ? "border-primary bg-primary/5 dark:bg-primary/10" : "border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800"
                                                    }`}
                                            >
                                                <span className={`font-bold ${pricingType === "negotiable" ? "text-primary" : "text-slate-600 dark:text-slate-300"}`}>Negotiable</span>
                                                <span className="text-[10px] text-slate-400 dark:text-slate-500">Price varies per job</span>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-bold text-slate-700 dark:text-slate-300">Service Location</Label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400 dark:text-slate-500" />
                                            <Input
                                                placeholder="e.g. Westlands, Nairobi"
                                                className="pl-10 h-12 rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                                                value={locationName}
                                                onChange={(e) => setLocationName(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* SMART DESCRIPTION CHECKLIST */}
                                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <Label className="font-bold text-slate-700 dark:text-slate-300">Detailed Description</Label>
                                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium italic">Make sure to explain your total charges here.</span>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${description.length > 100 ? 'bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                                            {description.length} chars
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Textarea
                                            placeholder="Describe your service... e.g. 'My total fee is KES 2000. I bring my own vacuum. Transport to Westlands is free, but KES 300 elsewhere...'"
                                            className="min-h-[250px] rounded-xl p-4 border-slate-200 dark:border-slate-700 focus:ring-primary md:col-span-1 shadow-inner bg-white dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            required
                                        />

                                        {/* THE SMART CHECKLIST BOX */}
                                        <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-4">
                                            <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
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
                                                                <div className="bg-slate-200 dark:bg-slate-700 rounded-full w-4 h-4 flex-shrink-0" />
                                                            )}
                                                            <span className={item.check ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"}>
                                                                {item.label}
                                                            </span>
                                                        </div>
                                                        {!item.check && item.tip && (
                                                            <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-6 italic">{item.tip}</span>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>

                                            <div className="bg-blue-600 dark:bg-blue-700 p-4 rounded-xl text-white shadow-md shadow-blue-100 dark:shadow-blue-900/30">
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
                        <Card className="border-none shadow-sm rounded-xl overflow-hidden dark:bg-slate-900 transition-colors">
                            <div className="bg-slate-900 dark:bg-slate-800 p-2 flex items-center gap-3">
                                <ImagePlus className="text-primary w-6 h-6" />
                                <h2 className="text-white font-bold text-lg">Service Gallery</h2>
                            </div>
                            <CardContent className="p-2">
                                <label className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-2 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:border-primary group">
                                    <div className="bg-primary/10 dark:bg-primary/20 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform">
                                        <Upload className="w-8 h-8 text-primary" />
                                    </div>
                                    <p className="font-bold text-slate-700 dark:text-slate-300">Add Photos</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 text-center">Click to browse your gallery</p>
                                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                                </label>

                                {previews.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                                        {previews.map((src, i) => (
                                            <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm">
                                                <img src={src} className="w-full h-full object-cover" alt={`Preview ${i + 1}`} />
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
                        <Card className="border-none shadow-sm rounded-xl overflow-hidden dark:bg-slate-900 transition-colors">
                            <div className="bg-slate-900 dark:bg-slate-800 p-2 flex items-center gap-3">
                                <Check className="text-primary w-6 h-6" />
                                <h2 className="text-white font-bold text-lg">Category</h2>
                            </div>
                            <CardContent className="p-2">
                                <div className="mb-4">
                                    <Label className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Select One</Label>
                                </div>

                                {/* Categories list - Single Column List */}
                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar no-scrollbar">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setSelectedCategory(cat.id)}
                                            className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all group ${selectedCategory === cat.id
                                                ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-inner'
                                                : 'border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 hover:border-slate-200 dark:hover:border-slate-700'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div
                                                    className={`w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center text-sm shadow-sm overflow-hidden flex-shrink-0 ${selectedCategory === cat.id
                                                        ? "bg-primary text-white"
                                                        : "bg-white dark:bg-slate-700"
                                                        }`}
                                                >
                                                    <span className="truncate">
                                                        {cat.icon || "🛠️"}
                                                    </span>
                                                </div>
                                                <span
                                                    className={`font-bold text-base break-words text-left leading-tight ${selectedCategory === cat.id
                                                        ? "text-primary"
                                                        : "text-slate-600 dark:text-slate-300"
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
                            <p className="text-xs text-center text-slate-400 dark:text-slate-500 px-6 leading-relaxed">
                                By publishing, you confirm that your service details are accurate and comply with HommieGo's Professional Guidelines.
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
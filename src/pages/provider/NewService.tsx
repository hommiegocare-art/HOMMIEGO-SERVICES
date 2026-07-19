import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
    Loader2,
    Upload,
    ImagePlus,
    ArrowLeft,
    Check,
    MapPin,
    DollarSign,
    Briefcase,
    Clock,
    Zap,
    Stethoscope,
    HeartHandshake,
    ShieldCheck,
    FileText,
    Users,
    Award,
    Sparkles
} from "lucide-react";

interface Category {
    id: string;
    name: string;
    icon?: string | null;
}

export default function NewService() {
    // Booking Fees
    const REGULAR_BOOKING_FEE = "100";
    const PRIORITY_BOOKING_FEE = "300";

    const [price, setPrice] = useState("");
    const [regularFee] = useState(REGULAR_BOOKING_FEE);
    const [priorityFee] = useState(PRIORITY_BOOKING_FEE);
    const navigate = useNavigate();
    const { toast } = useToast();

    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [pricingType, setPricingType] = useState("fixed");

    // Form State
    const [title, setTitle] = useState("");
    const [shortDescription, setShortDescription] = useState("");
    const [description, setDescription] = useState("");
    const [locationName, setLocationName] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [images, setImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = useCallback(async () => {
        const { data, error } = await supabase.from("categories").select("id, name, icon").order("name");
        if (!error) setCategories(data || []);
    }, []);

    const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        const newFiles = Array.from(files);
        setImages(newFiles);
        setPreviews(newFiles.map(file => URL.createObjectURL(file)));
    }, []);

    const uploadImage = useCallback(async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

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

        const data = await response.json();
        return data.secure_url;
    }, []);

    const handleCreateService = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCategory) {
            toast({
                title: "Category required",
                description: "Please select a medical service category for your listing.",
                variant: "destructive"
            });
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
                regular_booking_fee: Number(regularFee),
                priority_booking_fee: Number(priorityFee),
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

            toast({
                title: "Healthcare Service Published!",
                description: "Your medical service is now live and available for patients to book."
            });
            navigate("/dashboard/provider");
        } catch (error: any) {
            toast({
                title: "Creation failed",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }, [selectedCategory, images, title, shortDescription, description, price, regularFee, priorityFee, pricingType, locationName, navigate, toast, uploadImage]);

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-24 transition-colors duration-300">
            <div className="w-full px-0 pt-20 md:pt-24">
                <div className="max-w-2xl mx-auto px-4 md:px-6">

                    {/* Navigation & Title Header */}
                    <div className="mb-4 flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(-1)}
                            className="rounded-2xl bg-white dark:bg-zinc-800 shadow-sm border border-zinc-100 dark:border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-700/50"
                        >
                            <ArrowLeft className="w-5 h-5 dark:text-zinc-300" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                                    List Medical Service
                                </h1>
                                <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold uppercase tracking-wider rounded-full">
                                    Healthcare
                                </Badge>
                            </div>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                Share your healthcare expertise with patients in need of professional care.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleCreateService} className="space-y-4">

                        {/* BLOCK 1: General Info */}
                        <Card className="border border-zinc-100 dark:border-transparent shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 transition-colors">
                            <div className="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 p-4 flex items-center gap-3 border-b border-zinc-100 dark:border-transparent">
                                <Stethoscope className="text-primary w-6 h-6" />
                                <h2 className="text-zinc-900 dark:text-white font-bold text-lg">Medical Service Details</h2>
                            </div>
                            <CardContent className="p-4 md:p-6 space-y-5">
                                <div className="space-y-2">
                                    <Label className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-primary" />
                                        Service Title
                                    </Label>
                                    <Input
                                        placeholder="e.g. Professional Home Nursing Care"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                        className="h-12 rounded-2xl border-zinc-200 dark:border-transparent dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-primary"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                                        <Users className="w-4 h-4 text-primary" />
                                        Short Summary
                                    </Label>
                                    <Input
                                        placeholder="Brief description for patients browsing services"
                                        value={shortDescription}
                                        onChange={(e) => setShortDescription(e.target.value)}
                                        required
                                        className="h-12 rounded-2xl border-zinc-200 dark:border-transparent dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-primary"
                                    />
                                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 italic">
                                        This appears in search results and service cards.
                                    </p>
                                </div>

                                {/* Price and Location */}
                                <div className="space-y-5 pt-2">
                                    {/* 1. Main Service Price */}
                                    <div className="space-y-2">
                                        <Label className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                                            <DollarSign className="w-4 h-4 text-emerald-500" />
                                            Total Service Fee (KES)
                                        </Label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 dark:text-zinc-500" />
                                            <Input
                                                type="number"
                                                placeholder="How much do you charge for the service?"
                                                className="pl-12 h-12 rounded-2xl border-zinc-200 dark:border-transparent dark:bg-zinc-800 dark:text-white focus:ring-2 focus:ring-primary"
                                                value={price}
                                                onChange={(e) => setPrice(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 italic pl-1">
                                            This is your total fee for the healthcare service.
                                        </p>
                                    </div>

                                    {/* 2. Booking Fees - Locked */}
                                    <div className="bg-primary/5 dark:bg-primary/10 p-4 rounded-2xl border border-primary/10 dark:border-primary/20">
                                        <div className="flex items-center gap-2 mb-3">
                                            <ShieldCheck className="w-4 h-4 text-primary" />
                                            <span className="text-xs font-bold text-primary uppercase tracking-wider">
                                                Platform Booking Fees (Fixed)
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <Label className="text-xs font-bold flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                                                    <Clock className="w-3 h-3 text-blue-500" /> Standard Booking
                                                </Label>
                                                <Input
                                                    type="number"
                                                    value={regularFee}
                                                    readOnly
                                                    className="h-10 rounded-2xl border-zinc-200 dark:border-transparent bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 cursor-not-allowed font-medium text-sm"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs font-bold flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                                                    <Zap className="w-3 h-3 text-orange-500" /> Priority Booking
                                                </Label>
                                                <Input
                                                    type="number"
                                                    value={priorityFee}
                                                    readOnly
                                                    className="h-10 rounded-2xl border-zinc-200 dark:border-transparent bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 cursor-not-allowed font-medium text-sm"
                                                />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2 text-center">
                                            These fees are set by HommieCare Kenya and are non-negotiable
                                        </p>
                                    </div>

                                    {/* Pricing Type */}
                                    <div className="space-y-2">
                                        <Label className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                                            <Award className="w-4 h-4 text-primary" />
                                            Pricing Structure
                                        </Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setPricingType("fixed")}
                                                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all ${pricingType === "fixed"
                                                    ? "border-primary bg-primary/5 dark:bg-primary/10"
                                                    : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                                                    }`}
                                            >
                                                <span className={`font-bold ${pricingType === "fixed" ? "text-primary" : "text-zinc-600 dark:text-zinc-300"}`}>
                                                    Fixed Price
                                                </span>
                                                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 text-center">
                                                    Set final price per service
                                                </span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPricingType("negotiable")}
                                                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all ${pricingType === "negotiable"
                                                    ? "border-primary bg-primary/5 dark:bg-primary/10"
                                                    : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                                                    }`}
                                            >
                                                <span className={`font-bold ${pricingType === "negotiable" ? "text-primary" : "text-zinc-600 dark:text-zinc-300"}`}>
                                                    Negotiable
                                                </span>
                                                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 text-center">
                                                    Price varies per patient
                                                </span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Location */}
                                    <div className="space-y-2">
                                        <Label className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-primary" />
                                            Service Location
                                        </Label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 dark:text-zinc-500" />
                                            <Input
                                                placeholder="e.g. Westlands, Nairobi (Areas you serve)"
                                                className="pl-12 h-12 rounded-2xl border-zinc-200 dark:border-transparent dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-primary"
                                                value={locationName}
                                                onChange={(e) => setLocationName(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Description */}
                                <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <Label className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-primary" />
                                                Detailed Description
                                            </Label>
                                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium italic">
                                                Explain your healthcare service in detail
                                            </span>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${description.length > 100
                                            ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500'
                                            }`}>
                                            {description.length} chars
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Textarea
                                            placeholder="Describe your healthcare service... e.g. 'I am a licensed nurse with 10 years of experience. I provide compassionate home nursing care including medication administration, wound care, and vital signs monitoring. My total fee is KES 2000 which includes travel within Nairobi...'"
                                            className="min-h-[250px] rounded-2xl p-4 border-zinc-200 dark:border-transparent focus:ring-2 focus:ring-primary shadow-inner bg-white dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500 md:col-span-1"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            required
                                        />

                                        {/* Medical Service Checklist */}
                                        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-5 rounded-2xl border border-zinc-100 dark:border-transparent space-y-4">
                                            <h4 className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                                <Check className="w-3 h-3" /> Medical Service Checklist
                                            </h4>

                                            <ul className="space-y-3">
                                                {[
                                                    {
                                                        label: "Medical License/Certification",
                                                        check: description.toLowerCase().match(/license|certified|registered|nurse|qualified|trained/i),
                                                        tip: "Patients trust licensed professionals"
                                                    },
                                                    {
                                                        label: "Years of Experience",
                                                        check: description.toLowerCase().match(/year|experience|expert|practicing|worked|served/i),
                                                        tip: "Share your professional background"
                                                    },
                                                    {
                                                        label: "Total Service Fee",
                                                        check: description.toLowerCase().match(/kes|price|cost|charge|total|amount|fee/i),
                                                        tip: "Be clear about the total cost"
                                                    },
                                                    {
                                                        label: "Travel/Transport Details",
                                                        check: description.toLowerCase().match(/transport|travel|distance|fare|location|area|deliver/i),
                                                        tip: "Specify if travel is included"
                                                    },
                                                    {
                                                        label: "Equipment & Materials",
                                                        check: description.toLowerCase().match(/equipment|tool|supply|material|kit|device|monitor/i),
                                                        tip: "What equipment do you provide?"
                                                    },
                                                    {
                                                        label: "Service Duration",
                                                        check: description.toLowerCase().match(/hour|minute|duration|time|visit|session|day/i),
                                                        tip: "How long does each visit take?"
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
                                                                <div className="bg-emerald-500 rounded-full p-0.5 text-white shadow-sm">
                                                                    <Check className="w-3 h-3" />
                                                                </div>
                                                            ) : (
                                                                <div className="bg-zinc-200 dark:bg-zinc-700 rounded-full w-4 h-4 flex-shrink-0" />
                                                            )}
                                                            <span className={item.check ? "text-zinc-900 dark:text-white" : "text-zinc-400 dark:text-zinc-500"}>
                                                                {item.label}
                                                            </span>
                                                        </div>
                                                        {!item.check && item.tip && (
                                                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 ml-6 italic">{item.tip}</span>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>

                                            <div className="bg-primary/5 dark:bg-primary/10 p-4 rounded-2xl border border-primary/10 dark:border-primary/20">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <HeartHandshake className="w-3 h-3 text-primary" />
                                                    <span className="text-[10px] font-black text-primary uppercase">Provider Tip</span>
                                                </div>
                                                <p className="text-[11px] leading-relaxed text-zinc-700 dark:text-zinc-300 font-medium">
                                                    "Patients are more likely to book when they understand your qualifications, experience, and total cost clearly."
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* BLOCK 2: Images Gallery */}
                        <Card className="border border-zinc-100 dark:border-transparent shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 transition-colors">
                            <div className="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 p-4 flex items-center gap-3 border-b border-zinc-100 dark:border-transparent">
                                <ImagePlus className="text-primary w-6 h-6" />
                                <h2 className="text-zinc-900 dark:text-white font-bold text-lg">Service Images</h2>
                            </div>
                            <CardContent className="p-4 md:p-6">
                                <label className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all hover:border-primary group">
                                    <div className="bg-primary/10 dark:bg-primary/20 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform">
                                        <Upload className="w-8 h-8 text-primary" />
                                    </div>
                                    <p className="font-bold text-zinc-700 dark:text-zinc-300">Upload Service Photos</p>
                                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 text-center">
                                        Showcase your healthcare service (max 5 images)
                                    </p>
                                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                                </label>

                                {previews.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                                        {previews.map((src, i) => (
                                            <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-700 shadow-sm">
                                                <img src={src} className="w-full h-full object-cover" alt={`Preview ${i + 1}`} />
                                                {i === 0 && (
                                                    <Badge className="absolute top-2 left-2 text-[10px] bg-primary text-white border-none shadow-md rounded-full">
                                                        Cover
                                                    </Badge>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* BLOCK 3: Category Selection */}
                        <Card className="border border-zinc-100 dark:border-transparent shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 transition-colors">
                            <div className="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 p-4 flex items-center gap-3 border-b border-zinc-100 dark:border-transparent">
                                <Stethoscope className="text-primary w-6 h-6" />
                                <h2 className="text-zinc-900 dark:text-white font-bold text-lg">Medical Category</h2>
                            </div>
                            <CardContent className="p-4 md:p-6">
                                <div className="mb-4">
                                    <Label className="text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                                        Select Your Healthcare Specialty
                                    </Label>
                                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">
                                        Choose the category that best describes your medical service
                                    </p>
                                </div>

                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar no-scrollbar">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setSelectedCategory(cat.id)}
                                            className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all group ${selectedCategory === cat.id
                                                ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-inner'
                                                : 'border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 hover:border-zinc-200 dark:hover:border-zinc-700'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div
                                                    className={`w-10 h-10 min-w-[40px] min-h-[40px] rounded-2xl flex items-center justify-center text-sm shadow-sm overflow-hidden flex-shrink-0 ${selectedCategory === cat.id
                                                        ? "bg-primary text-white"
                                                        : "bg-white dark:bg-zinc-700"
                                                        }`}
                                                >
                                                    <span className="truncate">
                                                        {cat.icon || "🏥"}
                                                    </span>
                                                </div>
                                                <span
                                                    className={`font-bold text-base break-words text-left leading-tight ${selectedCategory === cat.id
                                                        ? "text-primary"
                                                        : "text-zinc-600 dark:text-zinc-300"
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
                                className="w-full h-16 rounded-3xl text-xl font-bold shadow-xl shadow-primary/20 transition-all active:scale-95 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                            >
                                {loading ?
                                    <Loader2 className="animate-spin mr-2 w-6 h-6" /> :
                                    <HeartHandshake className="mr-2 w-6 h-6" />
                                }
                                Publish Medical Service
                            </Button>
                            <p className="text-xs text-center text-zinc-400 dark:text-zinc-500 px-6 leading-relaxed">
                                By publishing, you confirm that your medical credentials are valid and your service details are accurate.
                                <br className="hidden sm:block" />
                                <span className="font-bold text-primary">HommieCare Kenya</span> is committed to connecting patients with trusted healthcare professionals.
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
    Phone,
    Mail,
    MapPin,
    MessageCircle,
    Clock,
    Send,
    CheckCircle,
    Headphones,
    HelpCircle,
    User,
    Mail as MailIcon,
    FileText,
    Building2,
    Shield,
    ChevronRight,
    Facebook,
    Twitter,
    Instagram,
    Linkedin,
    Youtube,
    Ambulance,
    Loader2,
    Zap,
    ThumbsUp,
    Sparkles,
    Users,
    ArrowRight
} from "lucide-react";

interface FormData {
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
    category: string;
}

const Contact = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [formData, setFormData] = useState<FormData>({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
        category: "general",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [errors, setErrors] = useState<Partial<FormData>>({});

    const categories = [
        { value: "general", label: "General Inquiry" },
        { value: "booking", label: "Booking Support" },
        { value: "billing", label: "Billing & Payments" },
        { value: "technical", label: "Technical Support" },
        { value: "nurse", label: "Nurse Inquiry" },
        { value: "feedback", label: "Feedback" },
        { value: "emergency", label: "Emergency" },
        { value: "partnership", label: "Partnership" },
    ];

    const contactMethods = [
        {
            icon: Phone,
            label: "Call Us",
            details: "+254 704 473 503",
            sub: "Available 24/7",
            action: () => window.location.href = "tel:0704473503",
            color: "bg-green-500",
            responseTime: "Immediate"
        },
        {
            icon: Mail,
            label: "Email Us",
            details: "hommiegocare@gmail.com",
            sub: "Response within 24 hours",
            action: () => window.location.href = "mailto:hommiegocare@gmail.com",
            color: "bg-blue-500",
            responseTime: "24 hours"
        },
        {
            icon: MessageCircle,
            label: "Live Chat",
            details: "Available Soon",
            sub: "Chat with our team",
            action: () => {
                toast({
                    title: "Coming Soon",
                    description: "Live chat feature will be available soon!",
                });
            },
            color: "bg-purple-500",
            responseTime: "Coming Soon"
        },
        {
            icon: MapPin,
            label: "Visit Us",
            details: "Nairobi, Kenya",
            sub: "By appointment only",
            action: () => window.open("https://maps.google.com/maps?q=Nairobi,Kenya", "_blank"),
            color: "bg-red-500",
            responseTime: "By Appointment"
        }
    ];

    const supportHours = [
        { day: "Monday - Friday", hours: "7:00 AM - 9:00 PM" },
        { day: "Saturday", hours: "8:00 AM - 8:00 PM" },
        { day: "Sunday", hours: "9:00 AM - 6:00 PM" },
        { day: "Emergency", hours: "24/7 Support Available" },
    ];

    const quickLinks = [
        { label: "Help Center", path: "/help", icon: HelpCircle },
        { label: "Privacy Policy", path: "/privacy", icon: Shield },
        { label: "Terms of Service", path: "/terms", icon: FileText },
    ];

    const responseTimes = [
        { label: "Emergency", time: "Immediate", icon: Zap, color: "text-red-500" },
        { label: "Urgent", time: "Within 4 hours", icon: Sparkles, color: "text-amber-500" },
        { label: "Standard", time: "Within 24 hours", icon: Clock, color: "text-blue-500" },
        { label: "Feedback", time: "Within 48 hours", icon: ThumbsUp, color: "text-green-500" },
    ];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name as keyof FormData]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<FormData> = {};
        if (!formData.name.trim()) newErrors.name = "Name is required";
        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Email is invalid";
        }
        if (!formData.message.trim()) newErrors.message = "Message is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { error } = await supabase
                .from("contact_messages")
                .insert({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone || null,
                    subject: formData.subject || null,
                    category: formData.category,
                    message: formData.message,
                    status: 'pending',
                    priority: formData.category === 'emergency' ? 'emergency' : 'normal',
                    user_id: user?.id || null,
                    user_agent: navigator.userAgent,
                });

            if (error) throw error;

            setIsSubmitted(true);
            setFormData({
                name: "",
                email: "",
                phone: "",
                subject: "",
                message: "",
                category: "general",
            });

            toast({
                title: "Message Sent!",
                description: "Thank you for contacting HommieCare. We'll respond within 24 hours.",
            });

        } catch (error: any) {
            console.error("Error sending message:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to send message. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950 pb-16 transition-colors duration-300">
            <Navbar />

            {/* Main container - edge to edge on mobile */}
            <div className="w-full px-0 pt-24 md:pt-32 max-w-6xl mx-auto">

                {/* Hero Section - Edge to Edge */}
                <div className="w-full bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 dark:from-primary/10 dark:via-primary/5 dark:to-primary/10 py-12 md:py-16 px-4 md:px-6 mb-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex flex-col items-center text-center">
                            <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
                                <Headphones className="w-4 h-4" />
                                We're Here to Help
                            </div>
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
                                Get in <span className="text-primary">Touch</span>
                            </h1>
                            <p className="text-slate-600 dark:text-slate-300 max-w-2xl text-sm sm:text-base">
                                Have questions or need assistance? We'd love to hear from you. Reach out through any of our channels and we'll respond as quickly as possible.
                            </p>

                            {/* Response Time Indicators */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 w-full max-w-3xl">
                                {responseTimes.map((item) => (
                                    <div key={item.label} className="bg-white dark:bg-zinc-800 rounded-xl p-3 text-center shadow-sm border border-slate-100 dark:border-slate-700">
                                        <item.icon className={`w-5 h-5 mx-auto mb-1 ${item.color}`} />
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.label}</p>
                                        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{item.time}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Methods Grid - Edge to Edge */}
                <div className="px-4 md:px-6 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
                    {contactMethods.map((method, index) => (
                        <button
                            key={index}
                            onClick={method.action}
                            className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-center group border border-slate-100 dark:border-slate-700 active:scale-95"
                        >
                            <div className={`${method.color} w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300`}>
                                <method.icon className="w-6 h-6 text-white" />
                            </div>
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">{method.label}</h4>
                            <p className="text-xs font-semibold text-primary mt-1 truncate">{method.details}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{method.sub}</p>
                            {method.responseTime && (
                                <span className="inline-block mt-1.5 px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-bold rounded-full">
                                    {method.responseTime}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Contact Form and Info */}
                <div className="px-4 md:px-6 grid lg:grid-cols-3 gap-6 md:gap-8 mb-8">
                    {/* Contact Form - Full width on mobile */}
                    <div className="lg:col-span-2">
                        <Card className="border-0 bg-white dark:bg-zinc-800 shadow-lg rounded-2xl md:rounded-3xl overflow-hidden">
                            <CardContent className="p-5 sm:p-6 md:p-8">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <Mail className="w-5 h-5 text-primary" />
                                        Send Us a Message
                                    </h2>
                                    <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 dark:bg-zinc-900 px-3 py-1.5 rounded-full">
                                        <span className="inline-flex items-center gap-1">
                                            <span className="text-red-500">*</span> Required
                                        </span>
                                    </div>
                                </div>

                                {isSubmitted ? (
                                    <div className="text-center py-8">
                                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Message Sent! 🎉</h3>
                                        <p className="text-slate-500 dark:text-slate-400 mb-4 max-w-md mx-auto text-sm">
                                            Thank you for contacting HommieCare. Our team will respond to you within <strong className="text-primary">24 hours</strong> at <strong>{formData.email}</strong>.
                                        </p>
                                        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-3 mb-6 max-w-sm mx-auto border border-blue-100 dark:border-blue-800">
                                            <p className="text-xs text-blue-700 dark:text-blue-400 flex items-center gap-2 justify-center">
                                                <Clock className="w-4 h-4" />
                                                Response time: {formData.category === 'emergency' ? 'Immediate' : 'Within 24 hours'}
                                            </p>
                                        </div>
                                        <Button onClick={() => setIsSubmitted(false)} className="rounded-xl h-11">
                                            Send Another Message
                                        </Button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                                    Full Name <span className="text-red-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    <Input
                                                        name="name"
                                                        value={formData.name}
                                                        onChange={handleChange}
                                                        placeholder="John Doe"
                                                        className={`pl-10 h-11 rounded-xl ${errors.name ? 'border-red-500' : ''}`}
                                                    />
                                                </div>
                                                {errors.name && (
                                                    <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                                    Email <span className="text-red-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    <Input
                                                        name="email"
                                                        type="email"
                                                        value={formData.email}
                                                        onChange={handleChange}
                                                        placeholder="john@example.com"
                                                        className={`pl-10 h-11 rounded-xl ${errors.email ? 'border-red-500' : ''}`}
                                                    />
                                                </div>
                                                {errors.email && (
                                                    <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                                Phone Number
                                            </label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <Input
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    placeholder="+254 700 000 000"
                                                    className="pl-10 h-11 rounded-xl"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                                Subject
                                            </label>
                                            <Input
                                                name="subject"
                                                value={formData.subject}
                                                onChange={handleChange}
                                                placeholder="Brief subject of your message"
                                                className="h-11 rounded-xl"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                                Category
                                            </label>
                                            <select
                                                name="category"
                                                value={formData.category}
                                                onChange={handleChange}
                                                className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-zinc-900 px-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                            >
                                                {categories.map((cat) => (
                                                    <option key={cat.value} value={cat.value}>
                                                        {cat.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                                Message <span className="text-red-500">*</span>
                                            </label>
                                            <Textarea
                                                name="message"
                                                value={formData.message}
                                                onChange={handleChange}
                                                placeholder="Describe your inquiry or concern in detail..."
                                                rows={5}
                                                className={`resize-none rounded-xl ${errors.message ? 'border-red-500' : ''}`}
                                            />
                                            {errors.message && (
                                                <p className="text-xs text-red-500 mt-1">{errors.message}</p>
                                            )}
                                        </div>

                                        <Button
                                            type="submit"
                                            className="w-full h-12 rounded-xl text-base font-bold"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    Send Message
                                                    <Send className="ml-2 w-4 h-4" />
                                                </>
                                            )}
                                        </Button>

                                        <p className="text-xs text-center text-slate-400 dark:text-slate-500 mt-2">
                                            By submitting this form, you agree to our <button
                                                onClick={() => navigate("/privacy-policy")}
                                                className="text-primary hover:underline font-medium"
                                            >
                                                Privacy Policy
                                            </button>
                                        </p>
                                    </form>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar - Full width on mobile */}
                    <div className="space-y-4 md:space-y-6">
                        {/* Support Hours */}
                        <Card className="border-0 bg-white dark:bg-zinc-800 shadow-lg rounded-2xl md:rounded-3xl">
                            <CardContent className="p-5 md:p-6">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-primary" />
                                    Support Hours
                                </h3>
                                <div className="space-y-3">
                                    {supportHours.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center text-sm">
                                            <span className="text-slate-600 dark:text-slate-400">{item.day}</span>
                                            <span className="font-semibold text-slate-900 dark:text-white text-xs md:text-sm">{item.hours}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Emergency Support */}
                        <Card className="border-0 bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg rounded-2xl md:rounded-3xl">
                            <CardContent className="p-5 md:p-6 text-center">
                                <Ambulance className="w-12 h-12 mx-auto mb-3" />
                                <h3 className="text-lg md:text-xl font-bold mb-2">Emergency Support</h3>
                                <p className="text-white/90 text-sm mb-4">
                                    For immediate medical emergencies
                                </p>
                                <Button
                                    onClick={() => window.location.href = "tel:0704473503"}
                                    className="bg-white text-red-600 hover:bg-white/90 rounded-full px-6 md:px-8 h-11 md:h-12 text-sm md:text-base"
                                >
                                    <Phone className="w-4 h-4 mr-2" />
                                    Call Now: 0704473503
                                </Button>
                                <p className="text-white/80 text-xs mt-3">
                                    Available 24/7 for emergency nursing services
                                </p>
                            </CardContent>
                        </Card>

                        {/* Quick Links */}
                        <Card className="border-0 bg-white dark:bg-zinc-800 shadow-lg rounded-2xl md:rounded-3xl">
                            <CardContent className="p-5 md:p-6">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                                    Quick Links
                                </h3>
                                <div className="space-y-2">
                                    {quickLinks.map((link) => (
                                        <button
                                            key={link.path}
                                            onClick={() => navigate(link.path)}
                                            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-700/50 transition-colors group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <link.icon className="w-4 h-4 text-primary" />
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors">
                                                    {link.label}
                                                </span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Social Connect */}
                        <Card className="border-0 bg-white dark:bg-zinc-800 shadow-lg rounded-2xl md:rounded-3xl">
                            <CardContent className="p-5 md:p-6">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                                    Connect With Us
                                </h3>
                                <div className="flex gap-3 flex-wrap">
                                    <button className="w-10 h-10 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:scale-110 transition-transform active:scale-95">
                                        <Facebook className="w-5 h-5" />
                                    </button>
                                    <button className="w-10 h-10 rounded-full bg-[#1DA1F2] text-white flex items-center justify-center hover:scale-110 transition-transform active:scale-95">
                                        <Twitter className="w-5 h-5" />
                                    </button>
                                    <button className="w-10 h-10 rounded-full bg-[#E4405F] text-white flex items-center justify-center hover:scale-110 transition-transform active:scale-95">
                                        <Instagram className="w-5 h-5" />
                                    </button>
                                    <button className="w-10 h-10 rounded-full bg-[#0A66C2] text-white flex items-center justify-center hover:scale-110 transition-transform active:scale-95">
                                        <Linkedin className="w-5 h-5" />
                                    </button>
                                    <button className="w-10 h-10 rounded-full bg-[#FF0000] text-white flex items-center justify-center hover:scale-110 transition-transform active:scale-95">
                                        <Youtube className="w-5 h-5" />
                                    </button>
                                </div>
                                <p className="text-xs text-slate-400 mt-3">
                                    Follow us for updates, tips, and healthcare news
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Office Locations - Edge to Edge */}
                <div className="px-4 md:px-6">
                    <div className="bg-white dark:bg-zinc-800 rounded-2xl md:rounded-3xl shadow-lg p-5 sm:p-6 md:p-8 border border-slate-100 dark:border-slate-700">
                        <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-6 text-center">
                            Our <span className="text-primary">Offices</span>
                        </h2>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            {[
                                { city: "Nairobi", address: "Westlands, Nairobi", phone: "+254 704 473 503", email: "hommiegocare@gmail.com", icon: Building2 },
                                { city: "Mombasa", address: "Nyali, Mombasa", phone: "+254 704 473 503", email: "hommiegocare@gmail.com", icon: Building2 },
                                { city: "Kisumu", address: "Milimani, Kisumu", phone: "+254 704 473 503", email: "hommiegocare@gmail.com", icon: Building2 }
                            ].map((office, index) => (
                                <div key={index} className="text-center p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/50 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
                                    <office.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                                    <h4 className="font-bold text-slate-900 dark:text-white">{office.city}</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{office.address}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{office.phone}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 break-all">{office.email}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Response Commitment - Edge to Edge */}
                <div className="px-4 md:px-6 mt-6 md:mt-8">
                    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 dark:from-primary/20 dark:via-primary/10 dark:to-primary/20 rounded-2xl md:rounded-3xl p-5 md:p-6 text-center border border-primary/10">
                        <div className="flex items-center justify-center gap-2 text-primary mb-2">
                            <Clock className="w-5 h-5" />
                            <span className="font-bold">Our Response Commitment</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                            We aim to respond to all inquiries within <strong>24 hours</strong> during business days.
                            For emergency requests, please call our 24/7 hotline at <strong className="text-primary">0704473503</strong>.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-xs text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1 bg-white dark:bg-zinc-800 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-700">
                                <Zap className="w-3 h-3 text-red-500" />
                                Emergency: Immediate
                            </span>
                            <span className="flex items-center gap-1 bg-white dark:bg-zinc-800 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-700">
                                <Sparkles className="w-3 h-3 text-amber-500" />
                                Urgent: 4 hours
                            </span>
                            <span className="flex items-center gap-1 bg-white dark:bg-zinc-800 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-700">
                                <Clock className="w-3 h-3 text-blue-500" />
                                Standard: 24 hours
                            </span>
                        </div>
                    </div>
                </div>

                {/* Bottom spacing */}
                <div className="h-8"></div>
            </div>
        </div>
    );
};

export default Contact;
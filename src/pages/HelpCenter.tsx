import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
    Search,
    HelpCircle,
    MessageSquare,
    Phone,
    Mail,
    FileText,
    BookOpen,
    Shield,
    CreditCard,
    User,
    Calendar,
    Clock,
    Heart,
    Ambulance,
    ArrowRight,
    Users,
    Home,
    Building2,
    Baby,
    Activity,
    Pill,
    Stethoscope,
    AlertCircle,
    MessageCircle,
    ChevronDown,
    ChevronUp,
    ThumbsUp,
    ThumbsDown,
    LifeBuoy,
    FileQuestion,
    Eye,
    Clock as ClockIcon,
    CheckCircle,
    Star,
    Award,
    Globe,
    Lock,
    UserCheck
} from "lucide-react";

interface FAQItem {
    question: string;
    answer: string;
    category: string;
}

interface HelpArticle {
    id: number;
    title: string;
    description: string;
    icon: any;
    category: string;
    readTime: string;
}

const HelpCenter = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
    const [activeCategory, setActiveCategory] = useState("all");
    const [feedbackType, setFeedbackType] = useState<"helpful" | "not-helpful" | null>(null);

    // Categories
    const categories = [
        { id: "all", label: "All Topics", icon: BookOpen },
        { id: "getting-started", label: "Getting Started", icon: Home },
        { id: "bookings", label: "Bookings & Scheduling", icon: Calendar },
        { id: "payments", label: "Payments & Billing", icon: CreditCard },
        { id: "services", label: "Services & Care", icon: Heart },
        { id: "safety", label: "Safety & Trust", icon: Shield },
        { id: "account", label: "Account & Profile", icon: User },
    ];

    // Real Help Articles
    const articles: HelpArticle[] = [
        {
            id: 1,
            title: "Getting Started with HommieCare",
            description: "Complete guide to creating your account and booking your first home healthcare service in Kenya.",
            icon: Home,
            category: "getting-started",
            readTime: "5 min"
        },
        {
            id: 2,
            title: "How to Book a Nurse",
            description: "Step-by-step instructions to find, select, and book a licensed nurse for home care services.",
            icon: Calendar,
            category: "bookings",
            readTime: "4 min"
        },
        {
            id: 3,
            title: "Understanding Our Services",
            description: "Explore all home healthcare services including nursing, medication, wound care, and maternal care.",
            icon: Heart,
            category: "services",
            readTime: "6 min"
        },
        {
            id: 4,
            title: "Payment Methods & Pricing",
            description: "Learn about M-Pesa, card payments, and our transparent pricing structure for all services.",
            icon: CreditCard,
            category: "payments",
            readTime: "3 min"
        },
        {
            id: 5,
            title: "Provider Verification & Safety",
            description: "How we verify nurses and healthcare providers to ensure your family's safety.",
            icon: Shield,
            category: "safety",
            readTime: "5 min"
        },
        {
            id: 6,
            title: "Managing Your Account",
            description: "Update your profile, manage preferences, and access your booking history.",
            icon: User,
            category: "account",
            readTime: "3 min"
        },
        {
            id: 7,
            title: "Cancellation & Rescheduling Policy",
            description: "Understand our cancellation policy and how to reschedule your home care services.",
            icon: Clock,
            category: "bookings",
            readTime: "3 min"
        },
        {
            id: 8,
            title: "Emergency Care on HommieCare",
            description: "How to access emergency nursing services and what to do in urgent situations.",
            icon: Ambulance,
            category: "safety",
            readTime: "4 min"
        },
        {
            id: 9,
            title: "Services for New Mothers",
            description: "Specialized postnatal and newborn care services for new mothers in Kenya.",
            icon: Baby,
            category: "services",
            readTime: "4 min"
        },
        {
            id: 10,
            title: "Elderly Care Services",
            description: "Compassionate home care services for elderly adults and seniors.",
            icon: Users,
            category: "services",
            readTime: "4 min"
        },
    ];

    // Real FAQs
    const faqs: FAQItem[] = [
        {
            question: "What is HommieCare?",
            answer: "HommieCare is Kenya's trusted home healthcare marketplace connecting families with licensed nurses and healthcare professionals for in-home medical care. We provide professional nursing services, medication administration, wound care, maternal care, and elderly care right at your doorstep.",
            category: "getting-started"
        },
        {
            question: "How do I create an account?",
            answer: "You can create a HommieCare account by clicking 'Join Now' or 'Sign Up' on our homepage. Simply enter your email address, create a password, and fill in your basic information. You can also sign up using Google or Facebook for quick access.",
            category: "getting-started"
        },
        {
            question: "How do I book a nurse?",
            answer: "1. Search for the service you need (e.g., Home Nursing, Medication Administration)\n2. Browse through verified nurse profiles\n3. Select your preferred nurse based on experience, ratings, and availability\n4. Choose your preferred date and time\n5. Confirm and pay securely\n6. Receive confirmation and nurse details immediately",
            category: "bookings"
        },
        {
            question: "Are all nurses licensed?",
            answer: "Yes! Every nurse on our platform is fully licensed by the Nursing Council of Kenya. We verify licenses, conduct background checks, validate professional credentials, and perform in-person interviews before any provider joins HommieCare.",
            category: "safety"
        },
        {
            question: "How much do services cost?",
            answer: "Service costs vary based on the type of care needed, visit duration, and location. Each nurse sets their own rates, which are clearly displayed on their profile. We believe in complete transparency - what you see is what you pay. Additional services like specialized care may have different pricing.",
            category: "payments"
        },
        {
            question: "What payment methods do you accept?",
            answer: "We accept M-Pesa, credit/debit cards (Visa, Mastercard), and bank transfers. All payments are processed securely through our platform. You'll receive a receipt for every transaction.",
            category: "payments"
        },
        {
            question: "Can I choose my nurse?",
            answer: "Absolutely! You can view detailed nurse profiles including their qualifications, years of experience, specialization areas, ratings, and reviews from other families. Choose the healthcare professional that best matches your needs.",
            category: "bookings"
        },
        {
            question: "What services do you offer?",
            answer: "We offer a comprehensive range of home healthcare services including:\n• Home Nursing\n• Medication Administration\n• Wound Care & Dressing\n• Injection Services\n• Mother & Baby Care\n• Elderly Care\n• Post-Surgery Care\n• Health Monitoring\n• Oxygen Therapy\n• Catheter Care\n• Telehealth Consultations",
            category: "services"
        },
        {
            question: "Which areas do you serve?",
            answer: "We currently serve Nairobi, Kiambu, Mombasa, Kisumu, Nakuru, Eldoret, Thika, and surrounding areas. We're expanding to more counties across Kenya every month.",
            category: "getting-started"
        },
        {
            question: "Can I book same-day care?",
            answer: "Yes, we offer same-day booking for urgent care needs. Our platform shows real-time availability of nurses in your area. For the best selection, we recommend booking at least 24 hours in advance.",
            category: "bookings"
        },
        {
            question: "How are nurses verified?",
            answer: "Our verification process includes:\n1. License validation with Nursing Council of Kenya\n2. Identity verification with government ID\n3. Professional reference checks\n4. Background screening\n5. In-person interview and skills assessment\n6. Ongoing performance monitoring",
            category: "safety"
        },
        {
            question: "What if I need to cancel?",
            answer: "You can cancel or reschedule your booking up to 24 hours before the scheduled time for a full refund. Cancellations within 24 hours may incur a small fee. You can manage all bookings from your dashboard.",
            category: "bookings"
        },
        {
            question: "Is my medical information secure?",
            answer: "Yes! We take patient privacy seriously. All medical information is encrypted and stored securely. We comply with Kenya's Data Protection Act (2019) and handle all personal and medical information with the highest confidentiality.",
            category: "safety"
        },
        {
            question: "How do I leave a review?",
            answer: "After your service is completed, you'll receive a notification to rate and review your nurse. Your feedback helps other families make informed decisions and helps nurses maintain high quality standards.",
            category: "account"
        },
        {
            question: "Can I request the same nurse again?",
            answer: "Yes! You can book your preferred nurse again for recurring care needs. You can also save your favorite nurses to easily find them for future bookings.",
            category: "bookings"
        },
        {
            question: "What if I have a medical emergency?",
            answer: "For immediate medical emergencies, call our emergency hotline at 0704473503. We have nurses available 24/7 to respond to urgent care needs. For life-threatening emergencies, please call 999 first.",
            category: "safety"
        },
        {
            question: "How do I contact support?",
            answer: "You can reach us via:\n• Phone: 0704473503\n• Email: hommiegocare@gmail.com\n• Live Chat: Available on our website\n• Support Center: Visit /help\nOur support team is available 24/7 to assist you.",
            category: "account"
        },
    ];

    // Filter articles based on search and category
    const filteredArticles = articles.filter(article => {
        const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            article.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === "all" || article.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    // Filter FAQs based on search and category
    const filteredFaqs = faqs.filter(faq => {
        const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    // Quick Help Options
    const quickHelpOptions = [
        { icon: Phone, label: "Call Us", action: () => window.location.href = "tel:0704473503", color: "bg-green-500" },
        { icon: MessageCircle, label: "Live Chat", action: () => alert("Live chat support coming soon!"), color: "bg-blue-500" },
        { icon: Mail, label: "Email Support", action: () => window.location.href = "mailto:hommiegocare@gmail.com", color: "bg-purple-500" },
        { icon: FileText, label: "FAQs", action: () => document.getElementById("faq-section")?.scrollIntoView({ behavior: "smooth" }), color: "bg-orange-500" },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col">
            <Navbar />

            <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-12 flex-1">

                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
                        <LifeBuoy className="w-4 h-4" />
                        How can we help you?
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-4">
                        Help <span className="text-primary">Center</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
                        Everything you need to know about using HommieCare for home healthcare services in Kenya
                    </p>
                </div>

                {/* Search Bar */}
                <div className="max-w-2xl mx-auto mb-12">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <Input
                            placeholder="Search for help articles, FAQs, or topics..."
                            className="pl-12 py-6 text-base rounded-2xl shadow-lg border-0 bg-white dark:bg-zinc-800"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Button
                            className="absolute right-1 top-1/2 -translate-y-1/2 rounded-xl"
                            onClick={() => { }}
                        >
                            Search
                        </Button>
                    </div>
                </div>

                {/* Quick Help Options */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
                    {quickHelpOptions.map((option, index) => (
                        <button
                            key={index}
                            onClick={option.action}
                            className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-center group"
                        >
                            <div className={`${option.color} w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300`}>
                                <option.icon className="w-6 h-6 text-white" />
                            </div>
                            <h4 className="font-semibold text-slate-900 dark:text-white">{option.label}</h4>
                        </button>
                    ))}
                </div>

                {/* Categories */}
                <div className="mb-8">
                    <div className="flex flex-wrap gap-2 justify-center">
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => setActiveCategory(category.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${activeCategory === category.id
                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                    : "bg-white dark:bg-zinc-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-700"
                                    }`}
                            >
                                <category.icon className="w-4 h-4" />
                                {category.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Articles Grid */}
                <div className="mb-16">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                            {searchQuery ? "Search Results" : "Help Articles"}
                        </h2>
                        <span className="text-sm text-slate-500">{filteredArticles.length} articles</span>
                    </div>

                    {filteredArticles.length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredArticles.map((article) => (
                                <Card key={article.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-0 bg-white dark:bg-zinc-800">
                                    <CardContent className="p-6">
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                            <article.icon className="w-6 h-6" />
                                        </div>
                                        <h3 className="font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary transition-colors">
                                            {article.title}
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                            {article.description}
                                        </p>
                                        <div className="flex items-center justify-between text-xs text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <ClockIcon className="w-3 h-3" />
                                                {article.readTime} read
                                            </span>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                            <Button variant="ghost" className="text-primary p-0 h-auto hover:text-primary/80 group-hover:translate-x-1 transition-transform">
                                                Read Article <ArrowRight className="ml-1 w-4 h-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <FileQuestion className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No articles found</h3>
                            <p className="text-slate-500 dark:text-slate-400">Try adjusting your search or category filter</p>
                        </div>
                    )}
                </div>

                {/* FAQ Section */}
                <div id="faq-section" className="mb-16">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Frequently Asked Questions
                        </h2>
                        <span className="text-sm text-slate-500">{filteredFaqs.length} FAQs</span>
                    </div>

                    <div className="space-y-3">
                        {filteredFaqs.map((faq, index) => (
                            <Card key={index} className="border-0 bg-white dark:bg-zinc-800 shadow-sm hover:shadow-md transition-shadow duration-300">
                                <button
                                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-zinc-700/50 rounded-xl transition-colors"
                                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                                >
                                    <div className="flex items-start gap-3">
                                        <HelpCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                                        <span className="font-semibold text-slate-900 dark:text-white">{faq.question}</span>
                                    </div>
                                    {expandedFaq === index ?
                                        <ChevronUp className="w-5 h-5 text-primary flex-shrink-0" /> :
                                        <ChevronDown className="w-5 h-5 text-primary flex-shrink-0" />
                                    }
                                </button>
                                {expandedFaq === index && (
                                    <div className="px-6 pb-4 pl-14 text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                                        {faq.answer}
                                        <div className="mt-3 flex items-center gap-4">
                                            <span className="text-xs text-slate-400">Was this helpful?</span>
                                            <button
                                                onClick={() => setFeedbackType("helpful")}
                                                className={`p-1 rounded hover:bg-green-100 transition-colors ${feedbackType === "helpful" ? "text-green-600" : "text-slate-400"}`}
                                            >
                                                <ThumbsUp className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setFeedbackType("not-helpful")}
                                                className={`p-1 rounded hover:bg-red-100 transition-colors ${feedbackType === "not-helpful" ? "text-red-600" : "text-slate-400"}`}
                                            >
                                                <ThumbsDown className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Still Need Help */}
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 dark:from-primary/20 dark:via-primary/10 dark:to-primary/20 rounded-3xl p-8 text-center">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        Still Need Help?
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">
                        Our support team is here to assist you with any questions or concerns about your home healthcare needs
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <Button className="rounded-xl" onClick={() => window.location.href = "tel:0704473503"}>
                            <Phone className="w-4 h-4 mr-2" />
                            Call Us
                        </Button>
                        <Button variant="outline" className="rounded-xl" onClick={() => window.location.href = "mailto:hommiegocare@gmail.com"}>
                            <Mail className="w-4 h-4 mr-2" />
                            Email Us
                        </Button>
                        <Button variant="outline" className="rounded-xl" onClick={() => alert("Live chat support coming soon!")}>
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Live Chat
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HelpCenter;
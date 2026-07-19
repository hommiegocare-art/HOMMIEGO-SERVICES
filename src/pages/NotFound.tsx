import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HommieLoader } from "@/components/HommieLoader"; // Ensure this path is correct

const NotFound = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Artificial delay to show the professional loader
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // 1. YOUR CUSTOM LOADER CHECK
  if (loading) return <HommieLoader />;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white font-sans px-4 relative overflow-hidden">

      {/* Background Decorative Blurs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-md w-full text-center">

        {/* Animated Brand Icon */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-10 relative inline-block"
        >
          <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto rotate-12 shadow-sm border border-slate-100">
            <Search className="w-10 h-10 text-primary -rotate-12" />
          </div>
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute -bottom-2 -right-2 w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-slate-50"
          >
            <MapPin className="w-6 h-6 text-red-500" />
          </motion.div>
        </motion.div>

        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <span className="text-primary font-bold tracking-[0.2em] uppercase text-[10px] bg-primary/10 px-3 py-1 rounded-full">
            Error Code: 404
          </span>
          <h1 className="text-4xl font-black text-slate-900 mt-6 mb-4 tracking-tight">
            Page not found
          </h1>
          <p className="text-slate-500 text-base md:text-lg mb-10 leading-relaxed max-w-[320px] mx-auto">
            The page you're looking for doesn't exist or has been moved to a new location.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col gap-3"
        >
          <Button
            onClick={() => navigate("/")}
            className="h-14 rounded-2xl font-bold text-sm shadow-xl shadow-primary/10 hover:shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Homepage
          </Button>

          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="h-12 rounded-2xl font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </motion.div>
      </div>

      {/* Subtle Footer Branding */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center">
        <div className="flex items-center gap-2 opacity-20">
          <div className="h-px w-8 bg-slate-900" />
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-900">
            HommieCare
          </span>
          <div className="h-px w-8 bg-slate-900" />
        </div>
      </div>
    </div>
  );
};

export default NotFound;
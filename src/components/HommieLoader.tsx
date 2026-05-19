import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";

export const HommieLoader = () => {
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white">
            <div className="relative flex flex-col items-center">

                {/* --- LOGO ANIMATION GROUP --- */}
                <div className="relative mb-8">

                    {/* 1. Graduation Cap (Floating) */}
                    <motion.div
                        initial={{ y: 0 }}
                        animate={{ y: [-5, 5, -5] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -top-12 left-1/2 -translate-x-1/2 z-10 text-[#0B1623]"
                    >
                        <GraduationCap size={48} fill="currentColor" />
                    </motion.div>

                    {/* 2. Speed Lines (Sliding) */}
                    <div className="absolute -left-10 top-1/2 -translate-y-1/2 space-y-1.5">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                initial={{ x: -10, opacity: 0 }}
                                animate={{ x: [0, 15, 0], opacity: [0, 1, 0] }}
                                transition={{
                                    duration: 0.8,
                                    repeat: Infinity,
                                    delay: i * 0.15,
                                    ease: "easeInOut"
                                }}
                                className="h-1.5 w-8 bg-red-600 rounded-full"
                            />
                        ))}
                    </div>

                    {/* 3. The Heart (Beating) */}
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                        className="relative"
                    >
                        {/* SVG Heart Path to match your logo shape */}
                        <svg width="100" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                                fill="#DC2626"
                            />
                        </svg>

                        {/* 4. The "GO" in the Heart */}
                        <motion.span
                            animate={{ opacity: [1, 0.5, 1] }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                            className="absolute inset-0 flex items-center justify-center text-white font-black text-2xl tracking-tighter"
                        >
                            GO
                        </motion.span>
                    </motion.div>
                </div>

                {/* --- TEXT ANIMATION --- */}
                <div className="text-center">
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl font-black flex items-center tracking-tighter"
                    >
                        <span className="text-[#0B1623]">Hommie</span>
                        <span className="text-red-600">GO</span>
                    </motion.h2>

                    {/* Tagline Reveal */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-2 flex items-center gap-2"
                    >
                        <div className="h-[1px] w-4 bg-slate-200" />
                        Where Students Meet Experts
                        <div className="h-[1px] w-4 bg-slate-200" />
                    </motion.p>
                </div>

                {/* --- MODERN PROGRESS BAR --- */}
                <div className="mt-10 w-48 h-1 bg-slate-100 rounded-full overflow-hidden relative">
                    <motion.div
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 w-full bg-gradient-to-r from-transparent via-red-600 to-transparent"
                    />
                </div>

            </div>
        </div>
    );
};
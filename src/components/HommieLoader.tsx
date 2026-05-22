
import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";

export const HommieLoader = () => {
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-[#020817] transition-colors duration-500">
            {/* Background Glow Effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-red-500/10 dark:bg-red-500/20 blur-3xl rounded-full animate-pulse" />
                <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-primary/10 dark:bg-primary/20 blur-3xl rounded-full animate-pulse delay-700" />
            </div>

            <div className="relative flex flex-col items-center">

                {/* --- LOGO ANIMATION GROUP --- */}
                <div className="relative mb-8">

                    {/* Floating Cap */}
                    <motion.div
                        initial={{ y: 0 }}
                        animate={{ y: [-6, 6, -6] }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="absolute -top-14 left-1/2 -translate-x-1/2 z-20 text-slate-900 dark:text-white"
                    >
                        <GraduationCap
                            size={52}
                            className="drop-shadow-xl"
                            fill="currentColor"
                        />
                    </motion.div>

                    {/* Speed Lines */}
                    <div className="absolute -left-12 top-1/2 -translate-y-1/2 space-y-2">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{
                                    x: [0, 20, 0],
                                    opacity: [0, 1, 0]
                                }}
                                transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    delay: i * 0.15,
                                    ease: "easeInOut"
                                }}
                                className="h-1.5 w-10 rounded-full bg-gradient-to-r from-red-500 to-red-600 shadow-md"
                            />
                        ))}
                    </div>

                    {/* Glow Ring */}
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.15, 0.3]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="absolute inset-0 rounded-full bg-red-500 blur-2xl"
                    />

                    {/* Heart Animation */}
                    <motion.div
                        animate={{
                            scale: [1, 1.12, 1],
                        }}
                        transition={{
                            duration: 0.9,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="relative z-10"
                    >
                        <svg
                            width="110"
                            height="110"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="drop-shadow-2xl"
                        >
                            <path
                                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
                                2 5.42 4.42 3 7.5 3c1.74 0 3.41.81
                                4.5 2.09C13.09 3.81 14.76 3 16.5 3
                                19.58 3 22 5.42 22 8.5c0 3.78-3.4
                                6.86-8.55 11.54L12 21.35z"
                                fill="#DC2626"
                            />
                        </svg>

                        {/* GO Text */}
                        <motion.span
                            animate={{
                                opacity: [1, 0.7, 1],
                                scale: [1, 1.05, 1]
                            }}
                            transition={{
                                duration: 0.8,
                                repeat: Infinity
                            }}
                            className="absolute inset-0 flex items-center justify-center text-white font-black text-3xl tracking-tight"
                        >
                            GO
                        </motion.span>
                    </motion.div>
                </div>

                {/* --- BRAND TEXT --- */}
                <div className="text-center">
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-5xl font-black tracking-tight flex items-center"
                    >
                        <span className="text-slate-900 dark:text-white">
                            Hommie
                        </span>
                        <span className="text-red-600 dark:text-red-500">
                            GO
                        </span>
                    </motion.h2>

                    {/* Tagline */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="mt-3 flex items-center justify-center gap-3"
                    >
                        <div className="h-px w-6 bg-slate-300 dark:bg-slate-700" />

                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                            Where Students Meet Experts
                        </p>

                        <div className="h-px w-6 bg-slate-300 dark:bg-slate-700" />
                    </motion.div>
                </div>

                {/* --- PROGRESS BAR --- */}
                <div className="relative mt-10 w-56 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <motion.div
                        animate={{
                            x: ["-100%", "100%"]
                        }}
                        transition={{
                            duration: 1.4,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-red-500 to-transparent"
                    />
                </div>

                {/* Loading Text */}
                <motion.p
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity
                    }}
                    className="mt-5 text-sm font-semibold text-slate-500 dark:text-slate-400"
                >
                    Loading amazing experiences...
                </motion.p>
            </div>
        </div>
    );
};
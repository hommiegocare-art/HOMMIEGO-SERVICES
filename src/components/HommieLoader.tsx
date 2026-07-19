"use client";
import { useEffect, useState } from "react";

export function HommieLoader() {
    const [theme, setTheme] = useState<"light" | "dark">("light");
    const [displayedText, setDisplayedText] = useState("");
    const fullText = "HommieCare";

    useEffect(() => {
        const letters = fullText.split("");
        let currentIndex = 0;

        const typeNextLetter = () => {
            if (currentIndex < letters.length) {
                setDisplayedText(letters.slice(0, currentIndex + 1).join(""));
                currentIndex++;
                setTimeout(typeNextLetter, 150);
            }
        };

        typeNextLetter();

        return () => {
            currentIndex = letters.length;
        };
    }, []);

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme === "dark" || savedTheme === "light") {
            setTheme(savedTheme);
        }
    }, []);

    const borderColors =
        theme === "dark"
            ? "border-t-red-500 border-r-blue-500 border-b-red-500 border-l-blue-500"
            : "border-t-red-400 border-r-blue-400 border-b-red-400 border-l-blue-400";

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6 bg-white dark:bg-zinc-950 transition-colors duration-500">

            {/* Spinning Loader - Red & Blue Ambulance Colors */}
            <div className="relative flex items-center justify-center h-24 w-24">
                <div
                    className={`animate-spin rounded-full h-24 w-24 ${borderColors} border-8`}
                ></div>
            </div>

            {/* Animated Brand Name - Types "HommieCare" then stops */}
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent">
                    {displayedText}
                </span>
            </h1>

            {/* Small tagline - minimal */}
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium tracking-widest uppercase animate-pulse">
                Trusted Home Healthcare
            </p>
        </div>
    );
}
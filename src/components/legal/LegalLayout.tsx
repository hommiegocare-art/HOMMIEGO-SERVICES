// src/components/legal/LegalLayout.tsx
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export function LegalLayout({
    title,
    updated,
    intro,
    children,
}: {
    title: string;
    updated?: string;
    intro?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="border-b border-border/60">
                <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
                    <Link to="/">
                        <Logo size="md" />
                    </Link>
                    <Link
                        to="/"
                        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Back to home
                    </Link>
                </div>
            </header>

            <main className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                    {title}
                </h1>
                {updated && (
                    <p className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">
                        {updated}
                    </p>
                )}
                {intro && (
                    <p className="mt-6 text-base leading-relaxed text-muted-foreground">
                        {intro}
                    </p>
                )}

                <div className="mt-10 space-y-10">{children}</div>
            </main>

            <footer className="border-t border-border/60 py-8">
                <div className="mx-auto max-w-3xl px-6 text-center text-xs text-muted-foreground">
                    © {new Date().getFullYear()} HommieCare · Nairobi, Kenya
                </div>
            </footer>
        </div>
    );
}
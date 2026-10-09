// src/components/landing/Nav.tsx
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";

const LINKS = [
    { href: "#how", label: "How it works" },
    { href: "#services", label: "Services" },
    { href: "#trust", label: "Trust" },
    { href: "#faq", label: "FAQ" },
];

export function Nav() {
    return (
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6">
                <Link to="/" className="shrink-0">
                    <Logo size="md" />
                </Link>

                <nav className="hidden items-center gap-8 md:flex">
                    {LINKS.map((l) => (
                        <a
                            key={l.href}
                            href={l.href}
                            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            {l.label}
                        </a>
                    ))}
                </nav>

                <div className="flex shrink-0 items-center gap-2">
                    <Button asChild variant="ghost" size="sm">
                        <Link to="/auth?mode=login">Sign in</Link>
                    </Button>
                    <Button
                        asChild
                        size="sm"
                        className="whitespace-nowrap pr-4"
                    >
                        <Link to="/auth?mode=signup&role=client">Get started</Link>
                    </Button>
                </div>
            </div>
        </header>
    );
}
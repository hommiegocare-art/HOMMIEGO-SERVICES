// src/pages/Settings.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    LogOut,
    Moon,
    Sun,
    Trash2,
    Shield,
    FileText,
    HeartHandshake,
    Info,
    Mail,
    ChevronRight,
} from "lucide-react";

type Theme = "light" | "dark";

const THEME_KEY = "theme";

function readTheme(): Theme | null {
    if (typeof window === "undefined") return null;
    const v = window.localStorage.getItem(THEME_KEY);
    return v === "light" || v === "dark" ? v : null;
}

function applyTheme(theme: Theme | null) {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (theme === null) {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        root.classList.toggle("dark", prefersDark);
    } else {
        root.classList.toggle("dark", theme === "dark");
    }
}

export default function Settings() {
    const { user, loading: sessionLoading, signOut } = useSession();
    const navigate = useNavigate();
    const qc = useQueryClient();

    const [theme, setTheme] = useState<Theme | null>(null);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [signingOut, setSigningOut] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setTheme(readTheme());
    }, []);

    // Respect OS changes when no explicit theme is set
    useEffect(() => {
        if (theme !== null) return;
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const handler = () => applyTheme(null);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, [theme]);

    const setThemeAndPersist = (next: Theme | null) => {
        setTheme(next);
        if (next === null) {
            window.localStorage.removeItem(THEME_KEY);
        } else {
            window.localStorage.setItem(THEME_KEY, next);
        }
        applyTheme(next);
    };

    const onSignOut = async () => {
        setSigningOut(true);
        setError(null);
        try {
            await signOut();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Sign out failed");
            setSigningOut(false);
        }
    };

    const onDeleteAccount = async () => {
        if (!user) return;
        setDeleting(true);
        setError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No active session");

            const { data, error: fnErr } = await supabase.functions.invoke(
                "delete-account",
                {
                    headers: { Authorization: `Bearer ${session.access_token}` },
                },
            );

            if (fnErr) throw fnErr;
            if (!data?.success) throw new Error(data?.error ?? "Delete failed");

            await clearAppState(qc);
            navigate("/", { replace: true });
            window.location.assign("/");
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Delete failed");
            try {
                await supabase.auth.signOut({ scope: "local" });
            } catch {
                /* ignore */
            }
            setDeleting(false);
            setConfirmDelete(false);
        }
    };

    if (sessionLoading) return <PageSkeleton />;
    if (!user) {
        return (
            <main className="mx-auto max-w-3xl px-6 py-20 text-center">
                <h1 className="text-2xl font-semibold">Sign in required</h1>
            </main>
        );
    }

    const isDark = theme === "dark";
    const isSystem = theme === null;

    return (
        <main className="mx-auto max-w-2xl px-6 py-10">
            <header className="mb-6">
                <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Manage appearance and your account.
                </p>
            </header>

            {error && (
                <p className="mb-4 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                </p>
            )}

            {/* APPEARANCE */}
            <Card className="rounded-2xl">
                <CardHeader>
                    <CardTitle className="text-base font-medium">Appearance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <Label htmlFor="theme-switch" className="text-sm">
                                Dark mode
                            </Label>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {isSystem
                                    ? "Following your system setting."
                                    : isDark
                                        ? "Always dark."
                                        : "Always light."}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Sun className="h-4 w-4 text-muted-foreground" />
                            <Switch
                                id="theme-switch"
                                checked={isDark}
                                onCheckedChange={(checked) =>
                                    setThemeAndPersist(checked ? "dark" : "light")
                                }
                            />
                            <Moon className="h-4 w-4 text-muted-foreground" />
                        </div>
                    </div>
                    {!isSystem && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setThemeAndPersist(null)}
                        >
                            Use system setting
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* SESSION */}
            <Card className="mt-6 rounded-2xl">
                <CardHeader>
                    <CardTitle className="text-base font-medium">Session</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <Label className="text-sm">Sign out</Label>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                End this session on this device.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={onSignOut}
                            disabled={signingOut}
                        >
                            <LogOut className="mr-1.5 h-4 w-4" />
                            {signingOut ? "Signing out…" : "Sign out"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* LEGAL */}
            <Card className="mt-6 rounded-2xl">
                <CardHeader>
                    <CardTitle className="text-base font-medium">
                        Legal & support
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <ul className="divide-y divide-border/60">
                        <LegalRow
                            to="/legal/privacy"
                            icon={<Shield className="h-4 w-4" />}
                            label="Privacy policy"
                            hint="How we handle your data"
                        />
                        <LegalRow
                            to="/legal/terms"
                            icon={<FileText className="h-4 w-4" />}
                            label="Terms of service"
                            hint="Rules for using HommieCare"
                        />
                        <LegalRow
                            to="/legal/safety"
                            icon={<HeartHandshake className="h-4 w-4" />}
                            label="Safety & trust"
                            hint="How we keep both sides safe"
                        />
                        <LegalRow
                            to="/legal/about"
                            icon={<Info className="h-4 w-4" />}
                            label="About HommieCare"
                            hint="Who we are and why we built this"
                        />
                        <LegalRow
                            to="/legal/contact"
                            icon={<Mail className="h-4 w-4" />}
                            label="Contact us"
                            hint="Reach the team"
                        />
                    </ul>
                </CardContent>
            </Card>

            {/* DANGER ZONE */}
            <Card className="mt-6 rounded-2xl border-destructive/30">
                <CardHeader>
                    <CardTitle className="text-base font-medium text-destructive">
                        Danger zone
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <Label className="text-sm">Delete account</Label>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Permanently deletes your account and all data. Cannot be
                                undone.
                            </p>
                        </div>
                        <Button
                            variant="destructive"
                            onClick={() => setConfirmDelete(true)}
                            disabled={deleting}
                        >
                            <Trash2 className="mr-1.5 h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete your account?</DialogTitle>
                        <DialogDescription>
                            This permanently deletes your account and all associated data —
                            profile, services, bookings, and messages. This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setConfirmDelete(false)}
                            disabled={deleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={onDeleteAccount}
                            disabled={deleting}
                        >
                            {deleting ? "Deleting…" : "Delete permanently"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    );
}

function LegalRow({
    to,
    icon,
    label,
    hint,
}: {
    to: string;
    icon: React.ReactNode;
    label: string;
    hint: string;
}) {
    return (
        <li>
            <Link
                to={to}
                className="flex items-center gap-3 px-6 py-4 transition-colors hover:bg-muted/40"
            >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {icon}
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
        </li>
    );
}

async function clearAppState(qc: ReturnType<typeof useQueryClient>) {
    // 1. Cancel in-flight queries, then drop the entire cache
    try {
        await qc.cancelQueries();
    } catch {
        /* ignore */
    }
    qc.clear();

    // 2. Sign out the Supabase client globally
    try {
        await supabase.auth.signOut({ scope: "global" });
    } catch {
        try {
            await supabase.auth.signOut({ scope: "local" });
        } catch {
            /* ignore */
        }
    }

    // 3. Clear app-owned localStorage keys (keep theme)
    try {
        const toRemove: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
            const k = window.localStorage.key(i);
            if (!k) continue;
            if (k === "theme") continue;
            if (k.startsWith("sb-")) toRemove.push(k);
            if (k.startsWith("hommiecare:")) toRemove.push(k);
        }
        toRemove.forEach((k) => window.localStorage.removeItem(k));
    } catch {
        /* ignore */
    }

    // 4. Clear sessionStorage entirely
    try {
        window.sessionStorage.clear();
    } catch {
        /* ignore */
    }

    // 5. Drop service worker caches if present
    if ("caches" in window) {
        try {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
        } catch {
            /* ignore */
        }
    }
}

function PageSkeleton() {
    return (
        <main className="mx-auto max-w-2xl px-6 py-10">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="mt-6 h-32 rounded-2xl" />
            <Skeleton className="mt-6 h-24 rounded-2xl" />
            <Skeleton className="mt-6 h-24 rounded-2xl" />
        </main>
    );
}
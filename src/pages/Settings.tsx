// src/pages/Settings.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession, signOut } from "@/hooks/useSession";
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
    Bell,
    Loader2,
} from "lucide-react";
import {
    pushSupported,
    getPermission,
    isPushEnabled,
    enablePush,
    disablePush,
} from "@/lib/push";

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
    const { user, loading: sessionLoading } = useSession();
    const navigate = useNavigate();
    const qc = useQueryClient();

    const [theme, setTheme] = useState<Theme | null>(null);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [confirmSignOut, setConfirmSignOut] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [signingOut, setSigningOut] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ---- Push notification state ----
    const [pushOn, setPushOn] = useState(false);
    const [pushBusy, setPushBusy] = useState(false);
    const [pushErr, setPushErr] = useState<string | null>(null);
    const [permission, setPermission] = useState<
        NotificationPermission | "unsupported"
    >("default");

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

    // Load push state when user is available
    useEffect(() => {
        if (!user) return;
        setPermission(getPermission());
        if (pushSupported()) {
            isPushEnabled(user.id).then(setPushOn).catch(() => setPushOn(false));
        }
    }, [user]);

    const setThemeAndPersist = (next: Theme | null) => {
        setTheme(next);
        if (next === null) {
            window.localStorage.removeItem(THEME_KEY);
        } else {
            window.localStorage.setItem(THEME_KEY, next);
        }
        applyTheme(next);
    };

    const onTogglePush = async (next: boolean) => {
        if (!user) return;
        setPushBusy(true);
        setPushErr(null);
        try {
            if (next) {
                const r = await enablePush(user.id);
                if (!r.ok) {
                    setPushErr(r.reason ?? "Could not enable push notifications.");
                    setPermission(getPermission());
                    setPushBusy(false);
                    return;
                }
                setPushOn(true);
                setPermission(getPermission());
            } else {
                await disablePush(user.id);
                setPushOn(false);
            }
        } catch (e) {
            setPushErr(e instanceof Error ? e.message : "Something went wrong");
        } finally {
            setPushBusy(false);
        }
    };

    const onSignOut = async () => {
        setSigningOut(true);
        setError(null);
        try {
            // 1. Wipe React Query cache
            try {
                await qc.cancelQueries();
                qc.clear();
            } catch { /* ignore */ }

            // 2. signOut() wipes profile cache + localStorage + sessionStorage
            await signOut();

            // 3. Hard reset → brand-new app
            navigate("/", { replace: true });
            window.location.assign("/");
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Sign out failed");
            setSigningOut(false);
            setConfirmSignOut(false);
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
            } catch { /* ignore */ }
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
    const pushAvailable = pushSupported();

    return (
        <main className="mx-auto max-w-2xl px-6 py-10">
            <header className="mb-6">
                <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Manage appearance, notifications, and your account.
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

            {/* NOTIFICATIONS */}
            {pushAvailable && (
                <Card className="mt-6 rounded-2xl">
                    <CardHeader>
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                            <Bell className="h-4 w-4" /> Notifications
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <Label htmlFor="push-switch" className="text-sm">
                                    Push notifications
                                </Label>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    Alerts on this device when your health record or
                                    a patient you care for changes.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {pushBusy && (
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                )}
                                <Switch
                                    id="push-switch"
                                    checked={pushOn}
                                    disabled={pushBusy}
                                    onCheckedChange={onTogglePush}
                                />
                            </div>
                        </div>

                        {pushErr && (
                            <p className="text-xs text-destructive">{pushErr}</p>
                        )}

                        {permission === "denied" && (
                            <p className="text-xs text-muted-foreground">
                                Notifications are blocked for this site. Enable
                                them in your browser settings, then try again.
                            </p>
                        )}

                        {!pushOn && permission !== "denied" && (
                            <p className="text-xs text-muted-foreground">
                                Tip: On iPhone, add HommieCare to your Home
                                Screen first (Share → Add to Home Screen), then
                                turn this on.
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

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
                            onClick={() => setConfirmSignOut(true)}
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

            {/* SIGN OUT CONFIRM */}
            <Dialog open={confirmSignOut} onOpenChange={setConfirmSignOut}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Sign out?</DialogTitle>
                        <DialogDescription>
                            You'll need to sign back in to access your account.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setConfirmSignOut(false)}
                            disabled={signingOut}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={onSignOut}
                            disabled={signingOut}
                        >
                            {signingOut ? "Signing out…" : "Sign out"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DELETE CONFIRM */}
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
    try {
        await qc.cancelQueries();
    } catch { /* ignore */ }
    qc.clear();

    try {
        await supabase.auth.signOut({ scope: "global" });
    } catch {
        try {
            await supabase.auth.signOut({ scope: "local" });
        } catch { /* ignore */ }
    }

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
    } catch { /* ignore */ }

    try {
        window.sessionStorage.clear();
    } catch { /* ignore */ }

    if ("caches" in window) {
        try {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
        } catch { /* ignore */ }
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
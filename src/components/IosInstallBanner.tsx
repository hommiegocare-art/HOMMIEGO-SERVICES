// src/components/IosInstallBanner.tsx
import { useEffect, useState } from "react";
import { X, Share, Plus, Bell } from "lucide-react";

const DISMISS_KEY = "hommiecare:ios-install-banner-dismissed";
const DISMISS_DAYS = 30;

function isIos(): boolean {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent || "";
    // iOS 13+ iPad reports as "Macintosh", so check for touch too
    const iPhoneOrIPad = /iPhone|iPad|iPod/i.test(ua);
    const iPadAsMac = /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
    return iPhoneOrIPad || iPadAsMac;
}

function isSafari(): boolean {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent || "";
    // Safari on iOS does NOT include "CriOS"/"FxiOS"/"EdgiOS" — those are the chrome/firefox/edge variants
    const isRealSafari = /Safari/i.test(ua);
    const isNotOtherBrowser = !/CriOS|FxiOS|EdgiOS|OPiOS|mercury/i.test(ua);
    return isRealSafari && isNotOtherBrowser;
}

function isStandalone(): boolean {
    if (typeof window === "undefined") return false;
    // iOS Safari exposes navigator.standalone
    // Modern browsers expose display-mode: standalone
    const navStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone;
    if (navStandalone === true) return true;
    if (typeof window.matchMedia === "function") {
        return window.matchMedia("(display-mode: standalone)").matches;
    }
    return false;
}

function isDismissedRecently(): boolean {
    if (typeof window === "undefined") return false;
    try {
        const raw = window.localStorage.getItem(DISMISS_KEY);
        if (!raw) return false;
        const ts = Number(raw);
        if (!Number.isFinite(ts)) return false;
        const days = (Date.now() - ts) / (24 * 3600 * 1000);
        return days < DISMISS_DAYS;
    } catch {
        return false;
    }
}

function markDismissed() {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
        /* ignore */
    }
}

export function IosInstallBanner() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Only show after mount — avoids SSR/hydration mismatch
        if (!isIos()) return;
        if (!isSafari()) return;
        if (isStandalone()) return;
        if (isDismissedRecently()) return;
        setVisible(true);
    }, []);

    if (!visible) return null;

    const dismiss = () => {
        markDismissed();
        setVisible(false);
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[60] px-3 pb-3 lg:hidden pointer-events-none">
            <div
                className="max-w-md mx-auto pointer-events-auto rounded-2xl bg-primary text-primary-foreground shadow-xl px-4 py-3 animate-fade-in"
                style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
            >
                {/* Header */}
                <div className="flex items-start gap-3">
                    <span className="h-10 w-10 rounded-2xl bg-primary-foreground/15 inline-flex items-center justify-center shrink-0">
                        <Bell className="w-5 h-5" />
                    </span>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold">
                            Turn on notifications
                        </p>
                        <p className="text-xs opacity-85 mt-0.5">
                            Install HommieCare to your Home Screen to receive
                            alerts about your health and your child's vaccines.
                        </p>
                    </div>
                    <button
                        onClick={dismiss}
                        className="h-8 w-8 rounded-full inline-flex items-center justify-center shrink-0 active:bg-primary-foreground/10"
                        aria-label="Dismiss"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Steps */}
                <div className="mt-3 space-y-2">
                    <Step
                        n={1}
                        icon={<Share className="w-3.5 h-3.5" />}
                        text={
                            <>
                                Tap the <strong>Share</strong> button in Safari's
                                toolbar (square with an arrow).
                            </>
                        }
                    />
                    <Step
                        n={2}
                        icon={<Plus className="w-3.5 h-3.5" />}
                        text={
                            <>
                                Scroll down and tap{" "}
                                <strong>Add to Home Screen</strong>.
                            </>
                        }
                    />
                    <Step
                        n={3}
                        icon={<Bell className="w-3.5 h-3.5" />}
                        text={
                            <>
                                Open the new HommieCare icon, then go to{" "}
                                <strong>Settings → Notifications</strong> and
                                enable push.
                            </>
                        }
                    />
                </div>

                <button
                    onClick={dismiss}
                    className="mt-3 w-full h-10 rounded-2xl bg-primary-foreground/15 text-sm font-semibold active:bg-primary-foreground/25"
                >
                    Got it
                </button>
            </div>
        </div>
    );
}

function Step({
    n,
    icon,
    text,
}: {
    n: number;
    icon: React.ReactNode;
    text: React.ReactNode;
}) {
    return (
        <div className="flex items-start gap-2.5">
            <span className="h-6 w-6 rounded-full bg-primary-foreground/20 inline-flex items-center justify-center text-[11px] font-bold shrink-0">
                {n}
            </span>
            <span className="text-xs leading-snug flex-1 min-w-0">
                {text}
                <span className="inline-flex items-center gap-0.5 ml-1 opacity-70">
                    {icon}
                </span>
            </span>
        </div>
    );
}
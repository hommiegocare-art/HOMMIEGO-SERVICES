import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";
import { setUpdateFn, markUpdateAvailable } from "@/lib/pwaUpdate";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

const root = createRoot(rootElement);
root.render(<App />);

// Register the PWA service worker AFTER the initial render.
// We capture the updateSW handle and expose it via lib/pwaUpdate so any
// component (currently AppUpdateBanner) can trigger the update + reload.
if ("serviceWorker" in navigator) {
    const updateSW = registerSW({
        immediate: true,
        onRegisteredSW(_swUrl, registration) {
            // Poll the server for a new sw.js every 60 seconds while the app is
            // open. Without this, an open tab won't notice a new deploy until
            // the user reloads.
            if (!registration) return;
            setInterval(() => {
                registration.update().catch(() => {
                    /* ignore network errors */
                });
            }, 60_000);
        },
        onNeedRefresh() {
            // A new SW is waiting. Show the banner; do not reload automatically.
            markUpdateAvailable();
        },
        onOfflineReady() {
            console.log("PWA: ready to work offline.");
        },
    });

    setUpdateFn(async (reloadPage?: boolean) => {
        await updateSW(reloadPage ?? false);
    });
}
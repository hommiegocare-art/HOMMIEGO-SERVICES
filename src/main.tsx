import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from 'virtual:pwa-register';

const rootElement = document.getElementById("root");

if (!rootElement) throw new Error("Failed to find the root element");

// 1. Create the root
const root = createRoot(rootElement);

// 2. Render the App first
// This ensures that all hooks and providers (like TooltipProvider)
// initialize in a stable environment.
root.render(<App />);

// 3. Register the PWA Service Worker AFTER the initial render
// This prevents race conditions that cause the "Cannot read properties of null (reading 'useRef')" error.
if ('serviceWorker' in navigator) {
    registerSW({
        immediate: true,
        onNeedRefresh() {
            console.log("PWA: New content available, please refresh.");
        },
        onOfflineReady() {
            console.log("PWA: App is ready to work offline.");
        },
    });
}
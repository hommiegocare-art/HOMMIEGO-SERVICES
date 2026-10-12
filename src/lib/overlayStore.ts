// src/lib/overlayStore.ts
//
// A tiny global counter of how many overlays (modals, sheets, drawers)
// are currently open. Anything that renders a full-screen overlay calls
// useOverlayLock() and the ChatFab will hide automatically.

import { useEffect, useState } from "react";

let count = 0;
const listeners = new Set<(n: number) => void>();

export function incOverlay() {
    count += 1;
    listeners.forEach((fn) => fn(count));
}

export function decOverlay() {
    count = Math.max(0, count - 1);
    listeners.forEach((fn) => fn(count));
}

export function getOverlayCount() {
    return count;
}

export function useOverlayCount(): number {
    const [n, setN] = useState(count);
    useEffect(() => {
        const fn = (v: number) => setN(v);
        listeners.add(fn);
        // sync in case something opened between render and mount
        setN(count);
        return () => {
            listeners.delete(fn);
        };
    }, []);
    return n;
}

/**
 * Call this from any component that renders a full-screen overlay
 * (modal, sheet, drawer, dialog). Increments on mount, decrements
 * on unmount — ref-counted so nested overlays work correctly.
 */
export function useOverlayLock() {
    useEffect(() => {
        incOverlay();
        return () => {
            decOverlay();
        };
    }, []);
}
// src/hooks/useVisualViewportHeight.ts
import { useEffect, useState } from "react";

/**
 * Returns the current *visible* viewport height in px.
 * On mobile this shrinks when the soft keyboard opens.
 * On desktop it equals window.innerHeight.
 *
 * Also returns an `offsetTop` — how far the visual viewport is
 * scrolled relative to the layout viewport. Needed on iOS, where
 * the page can scroll when the keyboard opens.
 */
export function useVisualViewportHeight() {
    const [height, setHeight] = useState<number>(() => {
        if (typeof window === "undefined") return 0;
        return (
            window.visualViewport?.height ??
            window.innerHeight
        );
    });
    const [offsetTop, setOffsetTop] = useState<number>(() => {
        if (typeof window === "undefined") return 0;
        return window.visualViewport?.offsetTop ?? 0;
    });

    useEffect(() => {
        const vv = window.visualViewport;
        if (!vv) {
            const onResize = () => setHeight(window.innerHeight);
            window.addEventListener("resize", onResize);
            onResize();
            return () => window.removeEventListener("resize", onResize);
        }

        const update = () => {
            setHeight(vv.height);
            setOffsetTop(vv.offsetTop);
        };

        vv.addEventListener("resize", update);
        vv.addEventListener("scroll", update);
        update();

        return () => {
            vv.removeEventListener("resize", update);
            vv.removeEventListener("scroll", update);
        };
    }, []);

    return { height, offsetTop };
}
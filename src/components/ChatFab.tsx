// src/components/ChatFab.tsx
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { useChatList, totalUnread } from "@/hooks/useChatList";
import { cn } from "@/lib/utils";

// Routes where the FAB is allowed to appear.
// Everywhere else → hidden.
const SHOW_ON = ["/dashboard"];

export function ChatFab() {
    const { pathname } = useLocation();
    const { data } = useChatList();
    const unread = totalUnread(data);
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    const allowed = SHOW_ON.some(
        (p) => pathname === p || pathname.startsWith(p + "/")
    );

    if (!allowed) return null;
    if (!mounted) return null;

    return createPortal(
        <Link
            to="/chats"
            aria-label={unread > 0 ? `Chats, ${unread} unread` : "Chats"}
            className={cn(
                "fixed right-4 z-40",
                "bottom-20 lg:bottom-6",
                "flex h-14 w-14 items-center justify-center rounded-full",
                "bg-primary text-primary-foreground",
                "transition-colors active:opacity-90",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
        >
            <MessageCircle className="h-6 w-6" />
            {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                    {unread > 99 ? "99+" : unread}
                </span>
            )}
        </Link>,
        document.body
    );
}
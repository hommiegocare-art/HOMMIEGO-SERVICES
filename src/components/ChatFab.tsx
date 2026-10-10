// src/components/ChatFab.tsx
import { Link, useLocation } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { useChatList, totalUnread } from "@/hooks/useChatList";
import { cn } from "@/lib/utils";

export function ChatFab() {
    const { pathname } = useLocation();
    const { data } = useChatList();
    const unread = totalUnread(data);

    // Hide on the chat list itself and on the chat window.
    if (pathname.startsWith("/chats")) return null;

    return (
        <Link
            to="/chats"
            aria-label={unread > 0 ? `Chats, ${unread} unread` : "Chats"}
            className={cn(
                "fixed right-4 z-40",
                "bottom-24 lg:bottom-6", // clears the mobile bottom nav
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
        </Link>
    );
}
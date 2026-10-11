// src/components/TopBar.tsx
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { Logo } from "@/components/brand/Logo";
import { InitialsAvatar } from "@/components/brand/InitialsAvatar";

export function TopBar() {
    const { user, loading } = useSession();
    const navigate = useNavigate();

    const { data: unread = 0 } = useQuery({
        queryKey: ["notifications", "unread-count", user?.id],
        enabled: !!user,
        staleTime: 30_000,
        queryFn: async (): Promise<number> => {
            const { count, error } = await supabase
                .from("notifications")
                .select("id", { count: "exact", head: true })
                .eq("user_id", user!.id)
                .eq("is_read", false)
                .neq("type", "chat_message")
                .limit(1);
            if (error) return 0;
            return count ?? 0;
        },
    });

    return (
        <header className="sticky top-0 z-30 bg-background">
            <div className="max-w-6xl mx-auto h-14 px-2 sm:px-4 flex items-center justify-between">
                <Link
                    to="/dashboard"
                    className="inline-flex items-center"
                    aria-label="HommieCare home"
                >
                    <Logo size="sm" showIcon />
                </Link>

                <div className="flex items-center gap-0.5 sm:gap-1">
                    <button
                        onClick={() => navigate("/notifications")}
                        className="relative h-11 w-11 rounded-full flex items-center justify-center active:bg-muted transition-colors"
                        aria-label="Notifications"
                    >
                        <Bell className="w-5 h-5 text-foreground" />
                        {unread > 0 && (
                            <span className="absolute top-2 right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                                {unread > 9 ? "9+" : unread}
                            </span>
                        )}
                    </button>

                    <Link
                        to={user ? `/profile/${user.id}` : "/auth"}
                        className="h-11 w-11 rounded-full flex items-center justify-center active:bg-muted transition-colors"
                        aria-label="Profile"
                    >
                        {loading && !user ? (
                            /* First-ever load, nothing cached yet: shimmer */
                            <span className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                        ) : (
                            <InitialsAvatar
                                url={user?.avatar_url}
                                name={user?.display_name ?? "You"}
                                className="h-10 w-10"
                                textClassName="text-sm"
                            />
                        )}
                    </Link>
                </div>
            </div>
        </header>
    );
}
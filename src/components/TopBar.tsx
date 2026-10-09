// src/components/TopBar.tsx
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { Logo } from "@/components/brand/Logo";

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
                .limit(1);
            if (error) return 0;
            return count ?? 0;
        },
    });

    const initial = user?.display_name?.[0]?.toUpperCase() ?? "U";

    return (
        <header className="sticky top-0 z-30 bg-background">
            <div className="max-w-6xl mx-auto h-14 px-4 flex items-center justify-between">
                <Link
                    to="/dashboard"
                    className="inline-flex items-center"
                    aria-label="HommieCare home"
                >
                    <Logo size="sm" showIcon />
                </Link>

                <div className="flex items-center gap-1">
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
                        {user?.avatar_url ? (
                            <img
                                src={user.avatar_url}
                                alt=""
                                className="w-8 h-8 rounded-full object-cover"
                                draggable={false}
                            />
                        ) : loading && !user ? (
                            /* First-ever load, nothing cached yet: shimmer instead of letter */
                            <span className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                        ) : (
                            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-black flex items-center justify-center">
                                {initial}
                            </span>
                        )}
                    </Link>
                </div>
            </div>
        </header>
    );
}
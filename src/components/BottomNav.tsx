import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Search,
  PlusCircle,
  Calendar,
  User,
  LayoutDashboard,
  Plus,
  Settings,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const BottomNav = () => {
  const location = useLocation();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .maybeSingle();

        setUserRole(data?.role || null);
      }
    };

    fetchUserRole();
  }, []);

  // Scroll handler for bottom nav
  useEffect(() => {
    const controlBottomNav = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY === 0) {
        setIsVisible(true);
        setLastScrollY(currentScrollY);
        return;
      }

      if (currentScrollY > lastScrollY) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', controlBottomNav, { passive: true });

    return () => {
      window.removeEventListener('scroll', controlBottomNav);
    };
  }, [lastScrollY]);

  const isActive = useCallback((path: string) => location.pathname === path, [location.pathname]);

  const getNavItems = useCallback(() => {
    // PROVIDER NAVIGATION
    if (userRole === "provider") {
      return [
        { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard/provider" },
        { icon: Search, label: "Explore", path: "/explore" },
        { icon: PlusCircle, label: "New", path: "/provider/services/new", primary: true },
        { icon: Calendar, label: "Bookings", path: "/my-bookings" },
        { icon: Settings, label: "Profile", path: "/edit-profile" },
      ];
    }

    // ADMIN NAVIGATION
    if (userRole === "admin") {
      return [
        { icon: ShieldCheck, label: "Admin", path: "/dashboard/admin" },
        { icon: Search, label: "Explore", path: "/explore" },
        { icon: PlusCircle, label: "Ads", path: "/ads" },
        { icon: Home, label: "Home", path: "/" },
        { icon: User, label: "Settings", path: "/edit-profile" },
      ];
    }

    // CUSTOMER NAVIGATION
    return [
      { icon: Home, label: "Home", path: "/" },
      { icon: Search, label: "Explore", path: "/explore" },
      { icon: PlusCircle, label: "Bookings", path: "/my-bookings" },
      { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard/client" },
      { icon: Settings, label: "Profile", path: "/edit-profile" },
    ];
  }, [userRole]);

  const navItems = getNavItems();

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transition-all duration-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}>
      <nav className="
        bg-white/95 dark:bg-zinc-950/95
        backdrop-blur-xl
        rounded-t-3xl rounded-b-none
        shadow-[0_-8px_32px_rgba(0,0,0,0.08)]
        dark:shadow-[0_-8px_32px_rgba(0,0,0,0.6)]
        border-t-0 border-x-0 border-b-0
        dark:border-transparent
        transition-colors duration-300
        overflow-hidden
        safe-area-bottom
      ">
        <div className="flex items-center justify-around h-[72px] px-2">

          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            // PRIMARY CENTER BUTTON
            if (item.primary) {
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex flex-col items-center justify-center -mt-8"
                >
                  <div className="
                    w-14 h-14 rounded-2xl
                    bg-gradient-to-br from-primary to-primary/80
                    text-white
                    border-4 border-white dark:border-zinc-950
                    shadow-lg shadow-primary/40
                    flex items-center justify-center
                    transition-all duration-300
                    hover:scale-110
                    active:scale-95
                  ">
                    <Plus className="w-7 h-7 stroke-[2.5px]" />
                  </div>

                  <span
                    className={`text-[10px] font-bold mt-1 transition-colors
                      ${active
                        ? "text-primary"
                        : "text-zinc-500 dark:text-zinc-400"
                      }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  relative flex flex-col items-center justify-center flex-1 h-full
                  transition-all duration-300 group
                  ${active
                    ? "text-primary scale-105"
                    : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  }
                `}
              >
                {/* Active Glow */}
                {active && (
                  <div className="
                    absolute top-0
                    w-10 h-10
                    rounded-full
                    bg-primary/10 dark:bg-primary/20
                    blur-xl
                    -z-10
                  " />
                )}

                <Icon
                  className={`
                    w-5 h-5 transition-all duration-300
                    ${active
                      ? "stroke-[2.5px] text-primary"
                      : "stroke-[1.5px] group-hover:scale-110 group-hover:text-zinc-600 dark:group-hover:text-zinc-300"
                    }
                  `}
                />

                <span
                  className={`
                    text-[10px] font-semibold tracking-tight transition-all mt-0.5
                    ${active
                      ? "text-primary opacity-100"
                      : "text-zinc-500 dark:text-zinc-400 opacity-90 group-hover:text-zinc-700 dark:group-hover:text-zinc-300"
                    }
                  `}
                >
                  {item.label}
                </span>

                {/* Active Indicator Bar */}
                {active && (
                  <div className="
                    absolute -top-0.5
                    w-6 h-1
                    bg-primary
                    rounded-full
                    shadow-sm shadow-primary/50
                  " />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
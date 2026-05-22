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
  ShieldCheck
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const BottomNav = () => {
  const location = useLocation();
  const [userRole, setUserRole] = useState<string | null>(null);

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

  const isActive = (path: string) => location.pathname === path;

  const getNavItems = () => {
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
  };

  const navItems = getNavItems();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe
      bg-white/85 dark:bg-[#020817]/90
      backdrop-blur-xl
      border-t border-slate-200 dark:border-slate-800
      shadow-[0_-4px_20px_rgba(0,0,0,0.03)]
      dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)]
      transition-colors duration-300"
    >
      <div className="flex items-center justify-around h-20 px-2">

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
                  w-14 h-14 rounded-full
                  bg-primary
                  text-white
                  border-4 border-white dark:border-[#020817]
                  shadow-xl shadow-primary/30
                  flex items-center justify-center
                  transition-all duration-300
                  hover:scale-110
                  active:scale-95
                ">
                  <Plus className="w-8 h-8" />
                </div>

                <span
                  className={`text-[10px] font-bold mt-1 transition-colors
                    ${active
                      ? "text-primary"
                      : "text-slate-500 dark:text-slate-400"
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
                  ? "text-primary scale-110"
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                }
              `}
            >
              {/* Active Glow */}
              {active && (
                <div className="
                  absolute top-2
                  w-10 h-10
                  rounded-full
                  bg-primary/10 dark:bg-primary/20
                  blur-xl
                  -z-10
                " />
              )}

              <Icon
                className={`
                  w-6 h-6 mb-1 transition-all duration-300
                  ${active
                    ? "stroke-[3px]"
                    : "stroke-[2px] group-hover:scale-110"
                  }
                `}
              />

              <span
                className={`
                  text-[10px] font-bold tracking-tight transition-all
                  ${active
                    ? "opacity-100"
                    : "opacity-80"
                  }
                `}
              >
                {item.label}
              </span>

              {/* Active Dot */}
              {active && (
                <div className="
                  w-1.5 h-1.5
                  bg-primary
                  rounded-full
                  mt-1
                  animate-pulse
                  shadow-sm shadow-primary/50
                " />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
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
        { icon: PlusCircle, label: "New", path: "/provider/services/new", primary: true }, // Main action
        { icon: Calendar, label: "Bookings", path: "/dashboard/provider" }, // Usually a tab in dashboard
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

    // CUSTOMER NAVIGATION (Default)
    return [
      { icon: Home, label: "Home", path: "/" },
      { icon: Search, label: "Explore", path: "/explore" },
      { icon: PlusCircle, label: "Bookings", path: "/my-bookings" }, // Fixed to point to your new page
      { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard/customer" },
      { icon: Settings, label: "Profile", path: "/edit-profile" },
    ];
  };

  const navItems = getNavItems();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-t border-slate-100 md:hidden pb-safe">
      <div className="flex items-center justify-around h-20 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          // Special styling for the middle "Primary" button
          if (item.primary) {
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center justify-center -mt-8"
              >
                <div className="bg-primary w-14 h-14 rounded-full shadow-lg shadow-primary/40 flex items-center justify-center text-white mb-1 border-4 border-white">
                  <Plus className="w-8 h-8" />
                </div>
                <span className={`text-[10px] font-bold ${active ? "text-primary" : "text-slate-500"}`}>
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 ${active ? "text-primary scale-110" : "text-slate-400 hover:text-slate-600"
                }`}
            >
              <Icon className={`w-6 h-6 mb-1 ${active ? "stroke-[3px]" : "stroke-[2px]"}`} />
              <span className={`text-[10px] font-bold tracking-tight ${active ? "opacity-100" : "opacity-80"}`}>
                {item.label}
              </span>
              {active && (
                <div className="w-1 h-1 bg-primary rounded-full mt-1 animate-pulse" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
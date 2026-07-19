import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Menu,
  LogOut,
  User,
  LayoutDashboard,
  Settings,
  ChevronDown,
  Bell,
  Info,
  Megaphone,
  UserPen,
  Compass,
  Home,
  CalendarCheck,
  ArrowRight,
  RefreshCw,
  Heart,
  Phone,
  Ambulance,
  X,
  BookOpen,
  HelpCircle,
  Shield,
  Star,
  Mail,
  HeartPulse,
  Sparkles
} from "lucide-react";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "./theme-toggle";

export const Navbar = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    window.location.reload();
  }, []);

  useEffect(() => {
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkUser();
    });
    return () => subscription.unsubscribe();
  }, []);

  // Control navbar visibility - only when menu is closed
  useEffect(() => {
    // Don't auto-hide when menu is open
    if (isMenuOpen) {
      setIsVisible(true);
      return;
    }

    const controlNavbar = () => {
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

    window.addEventListener('scroll', controlNavbar, { passive: true });
    return () => window.removeEventListener('scroll', controlNavbar);
  }, [lastScrollY, isMenuOpen]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMenuOpen]);

  // Prevent body scroll when menu is open, but allow menu to scroll
  useEffect(() => {
    if (isMenuOpen) {
      // Only prevent scroll on body, not on the menu itself
      document.body.style.overflow = 'hidden';
      // Allow touch events on the menu
      if (menuRef.current) {
        menuRef.current.style.overflowY = 'auto';
        menuRef.current.style.webkitOverflowScrolling = 'touch';
      }
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const checkUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setUser(null);
      setProfile(null);
      return;
    }
    setUser(session.user);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name, avatar_url, role, username, email")
      .eq("id", session.user.id)
      .single();

    if (profileData) {
      setProfile(profileData);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    navigate("/");
    setIsMenuOpen(false);
  }, [navigate]);

  const getInitials = useCallback((name: string) => {
    return name ? name.split(" ").map(n => n[0]).join("").toUpperCase() : "U";
  }, []);

  // Navigation items - memoized
  const navItems = useMemo(() => [
    { icon: Home, label: "Home", path: "/" },
    { icon: Compass, label: "Explore", path: "/explore" },
    { icon: Info, label: "About", path: "/about" },
    { icon: Megaphone, label: "Ads", path: "/ads" },
  ], []);

  const userNavItems = useMemo(() => [
    { icon: LayoutDashboard, label: "Dashboard", path: `/dashboard/${profile?.role || 'customer'}` },
    { icon: CalendarCheck, label: "My Bookings", path: "/my-bookings" },
    { icon: UserPen, label: "Edit Profile", path: "/edit-profile" },
    { icon: HeartPulse, label: "Medical Profile", path: `/medical-profile` },
  ], [profile?.role]);

  const supportItems = useMemo(() => [
    { icon: HelpCircle, label: "Help Center", path: "/help" },
    { icon: Shield, label: "Privacy Policy", path: "/privacy-policy" },
    { icon: Mail, label: "Contact Us", path: "/contact" },
  ], []);

  return (
    <>
      {/* Overlay - Only for mobile menu, below dropdowns */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      <div className={`fixed top-3 left-3 right-3 z-50 transition-all duration-300 ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-24 opacity-0 pointer-events-none'
        }`}>
        <nav className="
          bg-white/90 dark:bg-zinc-950/90
          backdrop-blur-xl
          rounded-2xl
          shadow-[0_8px_32px_rgba(0,0,0,0.12)]
          dark:shadow-[0_8px_32px_rgba(0,0,0,0.6)]
          border border-white/20 dark:border-transparent
          transition-colors duration-300
          px-4 py-2
          relative
          z-50
        ">
          <div className="flex items-center justify-between">

            {/* LOGO */}
            <Link to="/" className="flex items-center gap-2 group">
              <img
                src="/pwa-192x192.png"
                alt="Logo"
                className="w-10 h-10 rounded-xl transition-transform duration-300 group-hover:scale-105"
              />
              <span className="text-xl font-black tracking-tight">
                <span className="text-zinc-900 dark:text-white">Hommie</span>
                <span className="text-primary">Care</span>
              </span>
            </Link>

            {/* DESKTOP NAV */}
            <div className="hidden md:flex items-center gap-1">
              {/* Emergency Button - Always visible */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/emergency")}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 font-bold rounded-xl"
              >
                <Ambulance className="w-4 h-4" />
                <span className="text-xs">Emergency</span>
              </Button>

              <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-700 mx-1" />

              <ThemeToggle />

              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 hover:text-primary rounded-xl"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="text-xs font-medium">Refresh</span>
              </Button>

              {/* Main Nav Items */}
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex items-center gap-2 px-3 py-2 font-semibold text-zinc-600 dark:text-zinc-300 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors text-sm"
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </Link>
              ))}

              {user ? (
                <div className="flex items-center gap-2 ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                    onClick={() => navigate("/notifications")}
                  >
                    <Bell className="w-5 h-5" />
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all outline-none">
                        <Avatar className="h-8 w-8 border-2 border-white dark:border-zinc-700 shadow-sm">
                          <AvatarImage src={profile?.avatar_url} />
                          <AvatarFallback className="bg-primary text-white font-bold text-xs">
                            {getInitials(profile?.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-left hidden lg:block">
                          <p className="text-sm font-bold text-zinc-900 dark:text-white leading-none">
                            {profile?.full_name?.split(" ")[0]}
                          </p>
                          <p className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                            {profile?.role || "User"}
                          </p>
                        </div>
                        <ChevronDown className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                      </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent className="w-64 mt-2 p-2 rounded-2xl shadow-xl border-zinc-100 dark:border-transparent bg-white dark:bg-zinc-900 z-[60]" align="end">
                      <DropdownMenuLabel className="p-3">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-bold leading-none text-zinc-900 dark:text-white">{profile?.full_name}</p>
                          <p className="text-xs leading-none text-zinc-500 dark:text-zinc-400">{profile?.email}</p>
                          <span className="inline-block mt-1 text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            {profile?.role || "User"}
                          </span>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />

                      {/* User Dashboard Items */}
                      {userNavItems.map((item) => (
                        <DropdownMenuItem
                          key={item.path}
                          onClick={() => navigate(item.path)}
                          className="cursor-pointer rounded-lg p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                        >
                          <item.icon className="mr-3 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                          <span className="text-zinc-700 dark:text-zinc-300">{item.label}</span>
                        </DropdownMenuItem>
                      ))}

                      <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />

                      {/* Support Items */}
                      <DropdownMenuLabel className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-3">
                        Support
                      </DropdownMenuLabel>
                      {supportItems.map((item) => (
                        <DropdownMenuItem
                          key={item.path}
                          onClick={() => navigate(item.path)}
                          className="cursor-pointer rounded-lg p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                        >
                          <item.icon className="mr-3 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                          <span className="text-zinc-700 dark:text-zinc-300">{item.label}</span>
                        </DropdownMenuItem>
                      ))}

                      <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
                      <DropdownMenuItem
                        onClick={() => setShowLogoutPopup(true)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg p-3 cursor-pointer"
                      >
                        <LogOut className="mr-3 h-4 w-4" />
                        <span>Sign Out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <div className="flex items-center gap-2 ml-2">
                  <Link to="/auth" className="text-sm font-bold text-zinc-600 dark:text-zinc-300 px-4 py-2 hover:text-primary rounded-xl">Sign In</Link>
                  <Link to="/auth?mode=signup">
                    <Button className="rounded-2xl px-5 py-2 text-sm font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                      Join Now
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* MOBILE CONTROLS */}
            <div className="flex items-center gap-2 md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/emergency")}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full"
              >
                <Ambulance className="w-5 h-5" />
              </Button>

              <ThemeToggle />

              <button
                className="p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-full transition-colors"
                onClick={handleRefresh}
                aria-label="Refresh page"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>

              <button
                className="p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-full transition-colors"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* MOBILE DRAWER - Native Android Style */}
          {isMenuOpen && (
            <div
              ref={menuRef}
              className="
                md:hidden mt-4 pb-6 space-y-1
                bg-white/95 dark:bg-zinc-950/95
                backdrop-blur-xl
                rounded-2xl
                border border-white/20 dark:border-transparent
                animate-in slide-in-from-top-4 duration-200
                max-h-[calc(100vh-160px)]
                overflow-y-auto
                overscroll-behavior-contain
                shadow-xl
                relative
                z-[55]
                [&::-webkit-scrollbar]:w-1
                [&::-webkit-scrollbar-track]:bg-transparent
                [&::-webkit-scrollbar-thumb]:bg-zinc-300
                dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700
                [&::-webkit-scrollbar-thumb]:rounded-full
              "
              onClick={(e) => e.stopPropagation()}
              style={{
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain'
              }}
            >
              {/* User Profile Header */}
              {user ? (
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 rounded-2xl mb-3">
                  <Avatar className="h-12 w-12 border-2 border-white dark:border-zinc-700">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="bg-primary text-white font-bold">
                      {getInitials(profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-bold text-zinc-900 dark:text-white">{profile?.full_name}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{profile?.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {profile?.role || "User"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 rounded-2xl mb-3">
                  <div>
                    <p className="font-bold text-zinc-900 dark:text-white">Welcome to HommieCare</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Sign in to access all features</p>
                  </div>
                </div>
              )}

              {/* Emergency Banner */}
              <div className="mx-2 mb-3">
                <Button
                  onClick={() => {
                    navigate("/emergency");
                    setIsMenuOpen(false);
                  }}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-2xl py-6 flex items-center justify-center gap-3 shadow-lg shadow-red-500/20"
                >
                  <Ambulance className="w-5 h-5" />
                  <span className="font-bold">Emergency Care</span>
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">24/7</span>
                </Button>
              </div>

              {/* Main Navigation */}
              <div className="px-2">
                <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider px-3 mb-2">Main</p>
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="flex items-center gap-3 p-3 font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-xl transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>

              {/* User Navigation (if logged in) */}
              {user && (
                <div className="px-2 mt-2">
                  <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider px-3 mb-2">Account</p>
                  {userNavItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="flex items-center gap-3 p-3 font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-xl transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <item.icon size={20} />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              )}

              {/* Support */}
              <div className="px-2 mt-2">
                <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider px-3 mb-2">Support</p>
                {supportItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="flex items-center gap-3 p-3 font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-xl transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>

              {/* Notifications - if logged in */}
              {user && (
                <Link
                  to="/notifications"
                  className="flex items-center gap-3 p-3 font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-xl transition-colors mx-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Bell size={20} />
                  <span>Notifications</span>
                </Link>
              )}

              {/* Auth Actions */}
              <div className="px-2 mt-3 pb-2">
                {user ? (
                  <Button
                    onClick={() => {
                      setShowLogoutPopup(true);
                      setIsMenuOpen(false);
                    }}
                    variant="destructive"
                    className="w-full rounded-2xl flex items-center justify-center gap-2"
                  >
                    <LogOut size={18} />
                    Sign Out
                  </Button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full rounded-2xl flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/auth?mode=signup" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" className="w-full rounded-2xl flex items-center justify-center gap-2">
                        Create Account
                        <ArrowRight size={18} />
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </nav>
      </div>

      {/* Logout Popup - Native Android Style */}
      {showLogoutPopup && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 w-[90%] max-w-md rounded-3xl shadow-2xl p-6 animate-in fade-in zoom-in-95 border border-zinc-100 dark:border-transparent">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
              <LogOut className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-center mb-2 text-zinc-900 dark:text-white">
              Confirm Logout
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-center mb-6">
              Are you sure you want to logout from your account?
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-2xl"
                onClick={() => setShowLogoutPopup(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-2xl bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20"
                onClick={() => {
                  setShowLogoutPopup(false);
                  handleLogout();
                }}
              >
                Yes, Logout
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
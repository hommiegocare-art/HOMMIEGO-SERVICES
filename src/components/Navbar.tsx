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
  RefreshCw
} from "lucide-react";
import { useEffect, useState } from "react";
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
  const [isRefreshing, setIsRefreshing] = useState(false); // Added for animation

  // Function to handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    window.location.reload();
  };
  useEffect(() => {
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkUser();
    });
    return () => subscription.unsubscribe();
  }, []);

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setUser(null);
      setProfile(null);
      return;
    }
    setUser(session.user);

    // Fetch full profile data including avatar and name
    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name, avatar_url, role, username, email")
      .eq("id", session.user.id)
      .single();

    if (profileData) {
      setProfile(profileData);
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };
  // Helper to get initials if no avatar
  const getInitials = (name: string) => {
    return name ? name.split(" ").map(n => n[0]).join("").toUpperCase() : "U";
  };

  return (
    <>

      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">

            {/* LOGO SECTION */}
            <Link to="/" className="flex items-center gap-2 group">
              <img
                src="/pwa-192x192.png"
                alt="Logo"
                className="w-12 h-12 rounded-xl transition-transform duration-300 group-hover:scale-105"
              />
              <span className="text-2xl font-black tracking-tight">
                <span className="text-foreground">Hommie</span>
                <span className="text-red-600">Go</span>
              </span>
            </Link>

            {/* DESKTOP MENU */}
            <div className="hidden md:flex items-center gap-8">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="flex items-center gap-2 text-slate-500 dark:text-slate-400 dark:text-slate-300 hover:text-primary"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="text-xs font-medium">Refresh</span>
              </Button>
              <Link to="/" className="flex items-center gap-3 p-3 font-semibold text-slate-600 dark:text-slate-300  rounded-xl transition-colors" onClick={() => setIsMenuOpen(false)}>
                <Home size={20} />
                <span>Home</span>
              </Link>
              <Link to="/explore" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">Explore</Link>
              <Link to="/about" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">About</Link>
              <Link to="/ads" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">Ads</Link>

              {user ? (
                <div className="flex items-center gap-4">
                  {/* Notification Bell (Optional) */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full text-slate-500 dark:text-slate-400 dark:text-slate-300"
                    onClick={() => navigate("/notifications")}
                  >
                    <Bell className="w-5 h-5" />
                  </Button>

                  {/* USER DROPDOWN */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-3 p-1 pr-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all outline-none">
                        <Avatar className="h-9 w-9 border-2 border-white dark:border-slate-700 shadow-sm">
                          <AvatarImage src={profile?.avatar_url} />
                          <AvatarFallback className="bg-primary text-white font-bold">
                            {getInitials(profile?.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-left hidden lg:block">
                          <p className="text-sm font-bold text-foreground leading-none">
                            {profile?.full_name?.split(" ")[0]}
                          </p>
                          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {profile?.role || "User"}
                          </p>
                        </div>
                        <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 dark:text-slate-400" />
                      </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent className="w-56 mt-2 p-2 rounded-2xl shadow-xl border-slate-100 dark:border-slate-800 bg-background" align="end">
                      <DropdownMenuLabel className="p-3">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-bold leading-none text-foreground">{profile?.full_name}</p>
                          <p className="text-xs leading-none text-slate-500 dark:text-slate-400 dark:text-slate-400">{profile?.email}</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />

                      <DropdownMenuItem onClick={() => navigate(`/dashboard/${profile?.role}`)} className="cursor-pointer rounded-lg p-3">
                        <LayoutDashboard className="mr-3 h-4 w-4 text-slate-500 dark:text-slate-400" />
                        <span>Dashboard</span>

                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => navigate("/my-bookings")} className="cursor-pointer rounded-lg p-3">
                        <User className="mr-3 h-4 w-4 text-slate-500 dark:text-slate-400" />
                        <span>My Bookings</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => navigate("/edit-profile")} className="cursor-pointer rounded-lg p-3">
                        <Settings className="mr-3 h-4 w-4 text-slate-500 dark:text-slate-400" />
                        <span>Edit Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => navigate("/ads")}
                        className="cursor-pointer rounded-lg p-3"
                      >
                        <Megaphone className="mr-3 h-4 w-4 text-slate-500 dark:text-slate-400" />
                        <span>Ads</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => navigate("/about")}
                        className="cursor-pointer rounded-lg p-3"
                      >
                        <Info className="mr-3 h-4 w-4 text-slate-500 dark:text-slate-400" />
                        <span>About</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => navigate("/notifications")}
                        className="cursor-pointer rounded-lg p-3"
                      >
                        <Bell className="mr-3 h-4 w-4 text-slate-500 dark:text-slate-400" />
                        <span>Notifications</span>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setShowLogoutPopup(true)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <LogOut className="mr-3 h-4 w-4" />
                        <span>Sign Out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/auth" className="text-sm font-bold text-slate-600 dark:text-slate-300 px-4 py-2 hover:text-primary">Sign In</Link>
                  <Link to="/auth?mode=signup">
                    <Button className="rounded-full px-6 font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                      Join Now
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* MOBILE MENU BUTTON */}

            <div className="flex items-center gap-2 md:hidden">
              {/* REFRESH BUTTON (Beside Menu for Phone) */}
              <button
                className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-full transition-colors"
                onClick={handleRefresh}
                aria-label="Refresh page"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>

              {/* MOBILE MENU BUTTON */}
              <button
                className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-full"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>

          </div>

          {/* MOBILE MENU */}
          {/* MOBILE MENU */}
          {isMenuOpen && (
            <div className="md:hidden mt-1 pb-28 space-y-2 bg-white dark:bg-slate-950 animate-in slide-in-from-top-4 duration-200 max-h-[calc(100vh-120px)] overflow-y-auto">
              {user && (
                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl mb-4">
                  <Avatar>
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback>{getInitials(profile?.full_name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-foreground">{profile?.full_name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase">{profile?.role}</p>
                  </div>
                  <ThemeToggle />
                </div>
              )}


              <Link to="/" className="flex items-center gap-3 p-3 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 rounded-xl transition-colors" onClick={() => setIsMenuOpen(false)}>
                <Home size={20} />
                <span>Home</span>
              </Link>

              <Link to="/explore" className="flex items-center gap-3 p-3 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 rounded-xl transition-colors" onClick={() => setIsMenuOpen(false)}>
                <Compass size={20} />
                <span>Explore</span>
              </Link>

              <Link to="/edit-profile" className="flex items-center gap-3 p-3 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 rounded-xl transition-colors" onClick={() => setIsMenuOpen(false)}>
                <UserPen size={20} />
                <span>Edit Profile</span>
              </Link>

              <Link to="/ads" className="flex items-center gap-3 p-3 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 rounded-xl transition-colors" onClick={() => setIsMenuOpen(false)}>
                <Megaphone size={20} />
                <span>Ads</span>
              </Link>

              <Link to="/notifications" className="flex items-center gap-3 p-3 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 rounded-xl transition-colors" onClick={() => setIsMenuOpen(false)}>
                <Bell size={20} />
                <span>Notifications</span>
              </Link>

              <Link to="/about" className="flex items-center gap-3 p-3 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 rounded-xl transition-colors" onClick={() => setIsMenuOpen(false)}>
                <Info size={20} />
                <span>About</span>
              </Link>


              {user ? (
                <>
                  <Link to={`/dashboard/${profile?.role}`} className="flex items-center gap-3 p-3 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 rounded-xl transition-colors" onClick={() => setIsMenuOpen(false)}>
                    <LayoutDashboard size={20} />
                    <span>Dashboard</span>
                  </Link>
                  <Link to="/my-bookings" className="flex items-center gap-3 p-3 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 rounded-xl transition-colors" onClick={() => setIsMenuOpen(false)}>
                    <CalendarCheck size={20} />
                    <span>My Bookings</span>
                  </Link>
                  <Button onClick={() => setShowLogoutPopup(true)} variant="destructive" className="w-full rounded-xl mt-4 flex items-center justify-center gap-2">
                    <LogOut size={18} />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Link to="/auth" onClick={() => setIsMenuOpen(false)} className="block">
                  <Button className="w-full rounded-xl flex items-center justify-center gap-2">
                    Get Started
                    <ArrowRight size={18} />
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>


      </nav >


      {/* Custom Logout Popup */}
      {
        showLogoutPopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-background w-[90%] max-w-md rounded-3xl shadow-2xl p-6 animate-in fade-in zoom-in-95">

              {/* Icon */}
              <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
                <LogOut className="w-8 h-8 text-red-600" />
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-center mb-2 text-foreground">
                Confirm Logout
              </h2>

              {/* Description */}
              <p className="text-muted-foreground text-center mb-6">
                Are you sure you want to logout from your account?
              </p>

              {/* Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => setShowLogoutPopup(false)}
                >
                  Cancel
                </Button>

                <Button
                  className="flex-1 rounded-xl bg-red-600 hover:bg-red-700"
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
        )
      }
    </>
  );
};
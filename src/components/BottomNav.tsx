// src/components/BottomNav.tsx
import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  HeartPulse,
  Compass,
  Users,
  CalendarCheck,
  User,
  Menu,
  Bell,
  Briefcase,
  Wallet,
  Award,
  Settings,
  BriefcaseBusiness,
  X,
} from "lucide-react";
import { useSession } from "@/hooks/useSession";

export function BottomNav() {
  const { user } = useSession();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const isCaregiver = user?.role === "caregiver";

  // Tabs — Health only for clients
  const TABS = isCaregiver
    ? [
      { to: "/dashboard", label: "Home", icon: Home },
      { to: "/explore", label: "Explore", icon: Compass },
      { to: "/connections", label: "Connect", icon: Users },
      { to: "/jobs", label: "Jobs", icon: BriefcaseBusiness },
    ]
    : [
      { to: "/dashboard", label: "Home", icon: Home },
      { to: "/health", label: "Health", icon: HeartPulse },
      { to: "/explore", label: "Explore", icon: Compass },
      { to: "/connections", label: "Connect", icon: Users },
    ];

  const MORE = [
    ...(isCaregiver
      ? [{ to: "/services", label: "Services", icon: Briefcase }]
      : [{ to: "/bookings", label: "Bookings", icon: CalendarCheck }]),

    { to: "/notifications", label: "Notifications", icon: Bell },

    ...(isCaregiver
      ? [
        { to: "/earnings", label: "Earnings", icon: Wallet },
        { to: "/cpd", label: "CPD", icon: Award },
      ]
      : []),

    { to: user ? `/profile/${user.id}` : "/auth", label: "Profile", icon: User },
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background lg:hidden border-t border-border">
        <div
          className="max-w-6xl mx-auto grid grid-cols-5"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {TABS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={label}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 h-14 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </NavLink>
          ))}
          <button
            onClick={() => setOpen(true)}
            className="flex flex-col items-center justify-center gap-1 h-14 transition-colors text-muted-foreground"
            aria-label="More"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      <MoreSheet open={open} onClose={() => setOpen(false)} items={MORE} />
    </>
  );
}

function MoreSheet({
  open,
  onClose,
  items,
}: {
  open: boolean;
  onClose: () => void;
  items: { to: string; label: string; icon: React.ComponentType<{ className?: string }> }[];
}) {
  const navigate = useNavigate();
  const [dragY, setDragY] = useState(0);
  const startY = useRef<number | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) setDragY(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const onPointerDown = (e: React.PointerEvent) => {
    startY.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (startY.current === null) return;
    const dy = Math.max(0, e.clientY - startY.current);
    setDragY(dy);
  };

  const onPointerUp = () => {
    if (dragY > 100) {
      onClose();
    } else {
      setDragY(0);
    }
    startY.current = null;
  };

  return (
    <div
      className={`fixed inset-0 z-50 lg:hidden ${open ? "pointer-events-auto" : "pointer-events-none"
        }`}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-foreground/40 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"
          }`}
      />

      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="More"
        className={`absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl shadow-xl transform transition-transform duration-250 ease-out ${open ? "translate-y-0" : "translate-y-full"
          }`}
        style={{
          transform: open ? `translateY(${dragY}px)` : "translateY(100%)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="pt-3 pb-2 flex justify-center cursor-grab active:cursor-grabbing touch-none">
          <span className="w-10 h-1.5 rounded-full bg-muted-foreground/30" />
        </div>

        <div className="flex items-center justify-between px-5 pb-3">
          <p className="text-sm font-semibold">More</p>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full inline-flex items-center justify-center text-muted-foreground active:bg-muted"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <ul className="px-3 pb-4">
          {items.map(({ to, label, icon: Icon }) => (
            <li key={label}>
              <button
                onClick={() => {
                  onClose();
                  navigate(to);
                }}
                className="w-full flex items-center gap-3 h-12 px-3 rounded-2xl active:bg-muted transition-colors text-left"
              >
                <span className="w-9 h-9 rounded-full bg-primary/10 text-primary inline-flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </span>
                <span className="text-sm font-medium">{label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { Sidebar } from "@/components/Sidebar";
import { useSession } from "@/hooks/useSession";

import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Explore from "@/pages/Explore";
import Connections from "@/pages/Connections";
import Bookings from "@/pages/Bookings";
import BookingDetail from "@/pages/BookingDetail";
import BookingNew from "@/pages/BookingNew";
import VisitNotes from "@/pages/VisitNotes";
import Services from "@/pages/Services";
import Cpd from "@/pages/Cpd";
import Earnings from "@/pages/Earnings";
import Settings from "@/pages/Settings";
import Profile from "@/pages/Profile";
import Notifications from "@/pages/Notifications";
import PrivacySettings from "@/pages/PrivacySettings";
import NotFound from "@/pages/NotFound";
import CaregiverMedicalExam from "@/pages/CaregiverMedicalExam";
import MedicalAuditPage from "@/pages/MedicalAuditPage";

import Privacy from "@/pages/legal/Privacy";
import Terms from "@/pages/legal/Terms";
import Safety from "@/pages/legal/Safety";
import About from "@/pages/legal/About";
import Contact from "@/pages/legal/Contact";
import { usePresence } from "./hooks/usePresence";
import { AppUpdateBanner } from "./components/AppUpdateBanner";
import MedicalRecordPage from "./pages/MedicalRecordPage";
import MyHealth from "./pages/MyHealth";
import LogEntry from "./pages/LogEntry";
import HealthPrint from "./pages/HealthPrint";
import { IosInstallBanner } from "./components/IosInstallBanner";

// 👇 NEW
import { useNotificationReactor } from "@/hooks/useNotificationReactor";
import { NotificationToastHost } from "@/components/notifications/NotificationToastHost";
import { unlockNotificationSound } from "@/lib/notificationSound";

// Chat module
import Chats from "@/pages/Chats";
import { ChatFab } from "@/components/ChatFab";
import ChatWindow from "./pages/ChatWindow";

// Admin / verification
import AdminVerifications from "@/pages/admin/AdminVerifications";
import AdminVerificationDetail from "@/pages/admin/AdminVerificationDetail";
import HealthInsights from "./pages/HealthInsights";
import Certificates from "./pages/Certificates";

// Hospital referral layer
import HospitalJoin from "./pages/HospitalJoin";
import ReferralNew from "./pages/ReferralNew";
import ReferralLanding from "./pages/ReferralLanding";
import Referrals from "./pages/Referrals";
import ReferralDashboard from "./pages/ReferralDashboard";
import CareTeamThread from "./pages/CareTeamThread";
import CareTeams from "./pages/CareTeams";
import { DashboardActionFab } from "./components/HospitalFab";

// 👇 NEW — unlock audio on the very first user gesture (browser autoplay policy)
if (typeof window !== "undefined") {
  const unlock = () => unlockNotificationSound();
  window.addEventListener("pointerdown", unlock, { once: true });
  window.addEventListener("keydown", unlock, { once: true });
}

const HOME_FOR: Record<"client" | "caregiver", string> = {
  client: "/dashboard",
  caregiver: "/jobs",
};

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const AUTH_ROUTES = ["/", "/auth", "/signup"];

function isAuthRoute(path: string) {
  return AUTH_ROUTES.some((p) => path === p || path.startsWith(p + "/"));
}

function isLegalRoute(path: string) {
  return path === "/legal" || path.startsWith("/legal/");
}

// SMS landing page — must render for signed-out users, so it counts as bare.
function isPublicReferralRoute(path: string) {
  return /^\/referral\/[^/]+$/.test(path);
}

// Full-screen routes that render their own chrome (own header + composer).
// Chat detail pages and the care team thread must NOT sit inside
// TopBar/BottomNav/main padding, otherwise h-[100dvh] overflows the viewport
// and the page scrolls.
// Full-screen routes that render their own chrome (own header + composer).
// On mobile, chat detail must be bare so the composer stays above the
// keyboard. On desktop (lg+) we want it inside the normal app shell so the
// Sidebar/TopBar stay visible, just like every other page.
function isBareAppRoute(path: string) {
  if (typeof window === "undefined") return /^\/chats\/[^/]+$/.test(path);
  const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
  if (isDesktop) return false; // never bare on desktop
  return /^\/chats\/[^/]+$/.test(path);
}

function Shell() {
  const { pathname } = useLocation();
  const { user, loading } = useSession();
  usePresence();
  useNotificationReactor();   // 👈 NEW

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-background">
        <TopBar />
        <main className="pb-24 lg:pb-8" />
      </div>
    );
  }

  // Logged-in users never see the marketing/auth surfaces.
  // Note: /legal/* is NOT an auth route, so signed-in users can still read it.
  if (user && isAuthRoute(pathname)) {
    const home =
      HOME_FOR[(user.role as "client" | "caregiver") ?? "client"] ?? "/dashboard";
    return <Navigate to={home} replace />;
  }

  // Bare routes render their own chrome (no Sidebar/TopBar/BottomNav).
  // Includes the marketing landing, auth, legal pages, and the public
  // SMS referral landing page.
  const bare =
    isAuthRoute(pathname) ||
    isLegalRoute(pathname) ||
    isPublicReferralRoute(pathname);

  if (bare) {
    return (
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/signup" element={<Auth />} />

        <Route path="/legal/privacy" element={<Privacy />} />
        <Route path="/legal/terms" element={<Terms />} />
        <Route path="/legal/safety" element={<Safety />} />
        <Route path="/legal/about" element={<About />} />
        <Route path="/legal/contact" element={<Contact />} />

        {/* Public SMS landing — reachable signed out. */}
        <Route path="/referral/:id" element={<ReferralLanding />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    );
  }

  // Full-screen chat + care team: no TopBar, no BottomNav, no main padding.
  // These pages render their own header + composer and own the viewport.
  if (isBareAppRoute(pathname)) {
    return (
      <Routes>
        <Route path="/chats/:connectionId" element={<ChatWindow />} />
        <Route path="/care-team/:threadId" element={<CareTeamThread />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    );
  }

  // Authenticated app shell.
  return (
    <div className="min-h-[100dvh] bg-background">
      <Sidebar />
      <div className="lg:pl-16">
        <TopBar />
        <main className="pb-24 lg:pb-8">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/health" element={<MyHealth />} />
            <Route path="/health/log" element={<LogEntry />} />
            <Route path="/health/print" element={<HealthPrint />} />
            <Route path="/health/print/:childId" element={<HealthPrint />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/connections" element={<Connections />} />
            <Route path="/health/insights" element={<HealthInsights />} />
            {/* Chat list — detail pages render bare (see isBareAppRoute). */}
            <Route path="/chats" element={<Chats />} />
            <Route path="/chats/:connectionId" element={<ChatWindow />} />
            {/* Medical */}
            <Route path="/medical/:clientId/exam/new" element={<CaregiverMedicalExam />} />
            <Route path="/medical/:clientId/exam/:visitId" element={<CaregiverMedicalExam />} />
            <Route path="/medical/:clientId/audit" element={<MedicalAuditPage />} />
            <Route path="/medical/:clientId/record" element={<MedicalRecordPage />} />

            <Route path="/bookings" element={<Bookings />} />
            <Route path="/bookings/new" element={<BookingNew />} />
            <Route path="/bookings/:id" element={<BookingDetail />} />
            <Route path="/bookings/:id/notes" element={<VisitNotes />} />
            <Route path="/care-teams" element={<CareTeams />} />
            {/* Hospital referral layer */}
            <Route path="/hospital/join" element={<HospitalJoin />} />
            <Route path="/referrals/new" element={<ReferralNew />} />
            <Route path="/referrals/dashboard" element={<ReferralDashboard />} />
            <Route path="/referrals" element={<Referrals />} />
            {/* /referral/:id is also registered in the bare block so
                signed-out users can view it. This entry handles the
                signed-in case without falling through to *. */}
            <Route path="/referral/:id" element={<ReferralLanding />} />
            <Route path="/care-team/:threadId" element={<CareTeamThread />} />

            <Route path="/services" element={<Services />} />
            <Route path="/cpd" element={<Cpd />} />
            <Route path="/certificates" element={<Certificates />} />
            <Route path="/earnings" element={<Earnings />} />
            <Route path="/jobs" element={<Bookings />} />

            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/privacy" element={<PrivacySettings />} />

            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:userId" element={<Profile />} />

            {/* Admin / verification — access gated inside the page components */}
            <Route path="/admin/verifications" element={<AdminVerifications />} />
            <Route
              path="/admin/verifications/:id"
              element={<AdminVerificationDetail />}
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <BottomNav />
        <ChatFab />
        <DashboardActionFab />
        <NotificationToastHost />   {/* 👈 NEW */}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <TooltipProvider>
        <Toaster />
        <AppUpdateBanner />
        <IosInstallBanner />
        <BrowserRouter>
          <Shell />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
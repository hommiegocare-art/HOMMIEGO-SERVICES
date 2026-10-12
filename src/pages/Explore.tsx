// src/pages/Explore.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  Search,
  Star,
  MapPin,
  Users,
  Heart,
  Home,
  Eye,
  MessageCircle,
  Clock,
  Award,
  X,
  ArrowRight,
  Loader2,
  Stethoscope,
  CalendarPlus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { VerifiedBadge } from "@/components/brand/VerifiedBadge";
import type {
  CaregiverDiscoveryRow,
  ClientDiscoveryRow,
} from "@/types/db";
import { InitialsAvatar } from "@/components/brand/InitialsAvatar";

const PAGE_SIZE = 24;

/* ---------- referral types + helpers ---------- */

type ReferralServiceType =
  | "home_nursing" | "wound_care" | "medication_admin" | "physiotherapy"
  | "elderly_care" | "postnatal" | "transport" | "lab_delivery" | "other";

type ReferralContext = {
  id: string;
  services_needed: ReferralServiceType[];
  urgency: string;
  hospital: { id: string; name: string; county: string | null } | null;
};

const SERVICE_MATCH_TOKENS: Record<ReferralServiceType, string[]> = {
  home_nursing: ["nursing", "home care", "home nursing", "elderly", "geriatric"],
  wound_care: ["wound", "wound care", "dressing"],
  medication_admin: ["medication", "meds", "injection", "iv"],
  physiotherapy: ["physio", "physiotherapy", "rehab", "mobility"],
  elderly_care: ["elderly", "geriatric", "senior", "home care"],
  postnatal: ["postnatal", "postpartum", "maternal", "newborn", "lactation"],
  transport: ["transport", "ambulance", "transfer"],
  lab_delivery: ["lab", "sample", "phlebotomy", "courier"],
  other: [],
};

function caregiverMatchesServices(
  row: CaregiverDiscoveryRow,
  services: ReferralServiceType[]
): number {
  if (services.length === 0) return 0;
  const specialties = (row.specialties ?? []).map((s) => s.toLowerCase());
  if (specialties.length === 0) return 0;
  const haystack = specialties.join(" | ");
  let hits = 0;
  for (const svc of services) {
    const tokens = SERVICE_MATCH_TOKENS[svc] ?? [];
    if (tokens.some((t) => haystack.includes(t))) hits += 1;
  }
  return hits;
}

function caregiverInCounty(
  row: CaregiverDiscoveryRow,
  county: string | null
): boolean {
  if (!county) return true;
  const target = county.toLowerCase();
  return (row.county ?? "").toLowerCase() === target;
}

async function fetchReferralContext(
  referralId: string
): Promise<ReferralContext | null> {
  const { data, error } = await supabase
    .from("referrals")
    .select(
      "id, services_needed, urgency, hospital:hospitals(id, name, county)"
    )
    .eq("id", referralId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as ReferralContext) ?? null;
}

/* ---------- fetch: caregivers (client view) ---------- */

async function fetchCaregivers(
  cursor: string | null,
  search: string
): Promise<{ rows: CaregiverDiscoveryRow[]; nextCursor: string | null }> {
  let q = supabase
    .from("caregiver_discovery_view")
    .select("*")
    .order("caregiver_id", { ascending: true })
    .limit(PAGE_SIZE);

  if (cursor) q = q.gt("caregiver_id", cursor);

  const s = search.trim().replace(/[,()]/g, " ");
  if (s) {
    q = q.or(`display_name.ilike.%${s}%,professional_title.ilike.%${s}%`);
  }

  const { data, error } = await q;
  if (error) throw error;
  const rows = (data ?? []) as CaregiverDiscoveryRow[];
  return {
    rows,
    nextCursor:
      rows.length === PAGE_SIZE ? rows[rows.length - 1].caregiver_id : null,
  };
}

/* ---------- fetch: clients (caregiver view) ---------- */

async function fetchClients(
  cursor: string | null,
  search: string
): Promise<{ rows: ClientDiscoveryRow[]; nextCursor: string | null }> {
  let q = supabase
    .from("client_discovery_view")
    .select("*")
    .order("client_id", { ascending: true })
    .limit(PAGE_SIZE);

  if (cursor) q = q.gt("client_id", cursor);

  const s = search.trim().replace(/[,()]/g, " ");
  if (s) {
    q = q.ilike("display_name", `%${s}%`);
  }

  const { data, error } = await q;
  if (error) throw error;
  const rows = (data ?? []) as ClientDiscoveryRow[];
  return {
    rows,
    nextCursor:
      rows.length === PAGE_SIZE ? rows[rows.length - 1].client_id : null,
  };
}

/* ---------- my connections ---------- */

type MyConnection = {
  id: string;
  client_id: string;
  caregiver_id: string;
  status: string;
};

async function fetchMyConnections(viewerId: string): Promise<MyConnection[]> {
  const { data, error } = await supabase
    .from("connections")
    .select("id, client_id, caregiver_id, status")
    .or(`client_id.eq.${viewerId},caregiver_id.eq.${viewerId}`)
    .is("deleted_at", null);
  if (error) throw error;
  return (data ?? []) as MyConnection[];
}

/* ---------- endorsement totals ---------- */

async function fetchEndorsementTotals(userIds: string[]) {
  if (userIds.length === 0) return new Map<string, number>();
  const { data, error } = await supabase
    .from("endorsement_totals")
    .select("endorsed_id, total_endorsements")
    .in("endorsed_id", userIds);
  if (error) return new Map<string, number>();
  return new Map(
    (data ?? []).map((r) => [r.endorsed_id, r.total_endorsements ?? 0])
  );
}

/* ---------- who endorsed me ---------- */

async function fetchEndorsedMeMap(viewerId: string) {
  const { data, error } = await supabase
    .from("endorsements")
    .select("endorser_id")
    .eq("endorsed_id", viewerId)
    .is("deleted_at", null)
    .limit(500);
  if (error) return new Map<string, number>();
  const counts = new Map<string, number>();
  for (const r of data ?? []) {
    const id = r.endorser_id as string;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

/* ---------- chat previews ---------- */

type Preview = {
  connection_id: string;
  body: string | null;
  created_at: string;
};

async function fetchLatestMessages(connectionIds: string[]) {
  if (connectionIds.length === 0) return new Map<string, Preview>();
  const { data, error } = await supabase
    .from("chat_messages")
    .select("connection_id, body, created_at")
    .in("connection_id", connectionIds)
    .order("created_at", { ascending: false })
    .limit(connectionIds.length * 3);
  if (error) return new Map<string, Preview>();
  const byConn = new Map<string, Preview>();
  for (const m of data ?? []) {
    if (!byConn.has(m.connection_id)) {
      byConn.set(m.connection_id, m as Preview);
    }
  }
  return byConn;
}

/* ---------- page ---------- */

export default function Explore() {
  const { user } = useSession();
  const navigate = useNavigate();
  const isCaregiver = user?.role === "caregiver";
  const [searchParams] = useSearchParams();
  const referralId = searchParams.get("referral");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sheetTarget, setSheetTarget] = useState<{
    targetId: string;
    connectionId: string;
    name: string;
    avatarUrl: string | null;
  } | null>(null);

  // Banner dismissal state — session-scoped, per referral id.
  const bannerKey = referralId ? `explore-banner-dismissed:${referralId}` : "";
  const [bannerDismissed, setBannerDismissed] = useState(false);
  useEffect(() => {
    if (!bannerKey) {
      setBannerDismissed(false);
      return;
    }
    try {
      setBannerDismissed(sessionStorage.getItem(bannerKey) === "1");
    } catch {
      setBannerDismissed(false);
    }
  }, [bannerKey]);

  const dismissBanner = () => {
    setBannerDismissed(true);
    if (bannerKey) {
      try {
        sessionStorage.setItem(bannerKey, "1");
      } catch {
        /* ignore */
      }
    }
  };

  // Referral context — only fetched when ?referral= is present.
  const referralQuery = useQuery({
    queryKey: ["explore", "referral", referralId],
    enabled: !!referralId && !!user,
    staleTime: 60_000,
    queryFn: () => fetchReferralContext(referralId!),
  });

  const referral = referralQuery.data ?? null;
  const referralActive = !!referral && !!referralId;

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const query = useInfiniteQuery({
    queryKey: ["explore", isCaregiver ? "clients" : "caregivers", search],
    enabled: !!user,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      isCaregiver
        ? fetchClients(pageParam, search)
        : fetchCaregivers(pageParam, search),
    getNextPageParam: (last) => last.nextCursor,
    staleTime: 2 * 60_000,
  });

  const { data: myConnections = [] } = useQuery({
    queryKey: ["connections", "mine", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: () => fetchMyConnections(user!.id),
  });

  const rows = useMemo(
    () => query.data?.pages.flatMap((p) => p.rows) ?? [],
    [query.data]
  );

  const targetIds = useMemo(
    () =>
      rows
        .map((r) =>
          isCaregiver
            ? (r as ClientDiscoveryRow).client_id
            : (r as CaregiverDiscoveryRow).caregiver_id
        )
        .filter(Boolean),
    [rows, isCaregiver]
  );

  const { data: endorsementTotals = new Map<string, number>() } = useQuery({
    queryKey: ["endorsements", "totals", targetIds.sort().join(",")],
    enabled: targetIds.length > 0,
    staleTime: 60_000,
    queryFn: () => fetchEndorsementTotals(targetIds),
  });

  const { data: endorsedMe = new Map<string, number>() } = useQuery({
    queryKey: ["endorsed-me", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: () => fetchEndorsedMeMap(user!.id),
  });

  const connByTarget = useMemo(() => {
    const map = new Map<string, { id: string; status: string }>();
    if (!user) return map;
    const rank = (s: string) =>
      s === "accepted" ? 3 : s === "pending" ? 2 : 1;
    for (const c of myConnections) {
      const otherId = c.client_id === user.id ? c.caregiver_id : c.client_id;
      const existing = map.get(otherId);
      if (!existing || rank(c.status) > rank(existing.status)) {
        map.set(otherId, { id: c.id, status: c.status });
      }
    }
    return map;
  }, [myConnections, user]);

  const acceptedConnectionIds = useMemo(
    () =>
      myConnections.filter((c) => c.status === "accepted").map((c) => c.id),
    [myConnections]
  );

  const { data: latestMessages = new Map<string, Preview>() } = useQuery({
    queryKey: ["chat", "previews", acceptedConnectionIds.sort().join(",")],
    enabled: acceptedConnectionIds.length > 0,
    staleTime: 30_000,
    queryFn: () => fetchLatestMessages(acceptedConnectionIds),
  });

  // ---------- referral-aware partitioning (caregiver view only) ----------

  const { connectedRows, recommendedRows, discoverRows } = useMemo(() => {
    const connected: (CaregiverDiscoveryRow | ClientDiscoveryRow)[] = [];
    const recommended: CaregiverDiscoveryRow[] = [];
    const discover: (CaregiverDiscoveryRow | ClientDiscoveryRow)[] = [];

    // When a referral is active AND the viewer is a client, we run the
    // recommendation logic. Otherwise we keep the exact current grouping.
    const runReferralSort =
      referralActive && !isCaregiver && !!referral;

    const county = referral?.hospital?.county ?? null;
    const services = referral?.services_needed ?? [];

    const scored: { row: CaregiverDiscoveryRow; score: number; inCounty: boolean }[] = [];

    for (const r of rows) {
      const id = isCaregiver
        ? (r as ClientDiscoveryRow).client_id
        : (r as CaregiverDiscoveryRow).caregiver_id;
      const conn = connByTarget.get(id);
      const isConnected = conn?.status === "accepted";

      if (isConnected) {
        connected.push(r);
        continue;
      }

      if (runReferralSort) {
        const cRow = r as CaregiverDiscoveryRow;
        const score = caregiverMatchesServices(cRow, services);
        const inCounty = caregiverInCounty(cRow, county);
        scored.push({ row: cRow, score, inCounty });
      } else {
        discover.push(r);
      }
    }

    if (runReferralSort) {
      // Sort: county match first, then service-hit count desc, then
      // natural order (caregiver_id asc, as returned by the view).
      scored.sort((a, b) => {
        if (a.inCounty !== b.inCounty) return a.inCounty ? -1 : 1;
        if (a.score !== b.score) return b.score - a.score;
        return a.row.caregiver_id.localeCompare(b.row.caregiver_id);
      });

      for (const s of scored) {
        if (s.score > 0 && s.inCounty) recommended.push(s.row);
        else discover.push(s.row);
      }
    }

    return {
      connectedRows: connected,
      recommendedRows: recommended,
      discoverRows: discover,
    };
  }, [rows, connByTarget, isCaregiver, referralActive, referral]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          query.hasNextPage &&
          !query.isFetchingNextPage
        ) {
          query.fetchNextPage();
        }
      },
      { rootMargin: "600px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [query]);

  const onConsult = (
    targetId: string,
    targetName: string,
    avatarUrl: string | null
  ) => {
    const existing = connByTarget.get(targetId);
    if (existing?.status === "accepted") {
      const isMobile =
        typeof window !== "undefined" &&
        window.matchMedia("(max-width: 767px)").matches;

      if (isMobile) {
        setSheetTarget({
          targetId,
          connectionId: existing.id,
          name: targetName,
          avatarUrl,
        });
      } else {
        navigate(`/chats/${existing.id}`);
      }
      return;
    }
    if (!existing) {
      navigate(`/profile/${targetId}?consult=1`);
      return;
    }
  };

  const onBookWithReferral = (caregiverId: string) => {
    navigate(`/bookings/new?caregiver=${caregiverId}&referral=${referralId}`);
  };

  const renderCard = (r: CaregiverDiscoveryRow | ClientDiscoveryRow) => {
    if (isCaregiver) {
      const c = r as ClientDiscoveryRow;
      return (
        <ClientCard
          key={c.client_id}
          c={c}
          conn={connByTarget.get(c.client_id) ?? null}
          endorsementCount={endorsementTotals.get(c.client_id) ?? 0}
          endorsedMeCount={endorsedMe.get(c.client_id) ?? 0}
          onConsult={onConsult}
        />
      );
    }
    const c = r as CaregiverDiscoveryRow;
    return (
      <CaregiverCard
        key={c.caregiver_id}
        c={c}
        conn={connByTarget.get(c.caregiver_id) ?? null}
        endorsementCount={endorsementTotals.get(c.caregiver_id) ?? 0}
        endorsedMeCount={endorsedMe.get(c.caregiver_id) ?? 0}
        onConsult={onConsult}
        referralId={referralActive ? referralId! : null}
        onBook={onBookWithReferral}
      />
    );
  };

  const hasAnyRows = rows.length > 0;

  return (
    <div className="max-w-6xl mx-auto px-2  sm:px-2  pb-6 sm:pb-8">
      <div className="sticky top-14 z-20 bg-background pt-2 pb-2 px-2 -mx-2 sm:pt-3 sm:pb-3 sm:px-0 sm:mx-0">
        {referralActive && !bannerDismissed && referral && (
          <ReferralBanner
            referral={referral}
            onDismiss={dismissBanner}
          />
        )}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={
              isCaregiver
                ? "Search clients by name"
                : "Search caregivers by name or title"
            }
            className="pl-9 h-11 rounded-2xl bg-muted border-0"
          />
        </div>
      </div>

      {query.isLoading ? (
        <GridSkeleton />
      ) : !hasAnyRows ? (
        <EmptyState isCaregiver={isCaregiver} hasFilters={!!search} />
      ) : (
        <>
          {connectedRows.length > 0 && (
            <section className="mb-4 sm:mb-5">
              <SectionLabel>
                {isCaregiver ? "My care circle" : "Your connections"}
              </SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                {connectedRows.map(renderCard)}
              </div>
            </section>
          )}

          {recommendedRows.length > 0 && (
            <section className="mb-4 sm:mb-5">
              <SectionLabel>Recommended for this referral</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 animate-fade-in">
                {recommendedRows.map(renderCard)}
              </div>
            </section>
          )}

          {discoverRows.length > 0 && (
            <section>
              {(connectedRows.length > 0 || recommendedRows.length > 0) && (
                <SectionLabel>
                  {recommendedRows.length > 0
                    ? "Other caregivers"
                    : "Discover more"}
                </SectionLabel>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 animate-fade-in">
                {discoverRows.map(renderCard)}
              </div>
            </section>
          )}

          <div ref={sentinelRef} className="h-10" />

          {query.isFetchingNextPage && (
            <p className="text-center text-xs text-muted-foreground py-4">
              Loading more…
            </p>
          )}
          {!query.hasNextPage && rows.length > 0 && (
            <p className="text-center text-xs text-muted-foreground py-6">
              That's everyone for now.
            </p>
          )}
        </>
      )}

      {sheetTarget && (
        <MessagePreviewDrawer
          target={sheetTarget}
          preview={latestMessages.get(sheetTarget.connectionId) ?? null}
          onClose={() => setSheetTarget(null)}
          onOpenChat={() => {
            const id = sheetTarget.connectionId;
            setSheetTarget(null);
            navigate(`/chats/${id}`);
          }}
        />
      )}
    </div>
  );
}

/* ---------- referral banner ---------- */

function ReferralBanner({
  referral,
  onDismiss,
}: {
  referral: ReferralContext;
  onDismiss: () => void;
}) {
  const serviceCount = referral.services_needed.length;
  const county = referral.hospital?.county;
  return (
    <div className="mb-2 rounded-2xl bg-primary/10 p-3 flex items-start gap-2 animate-fade-in">
      <Stethoscope className="w-4 h-4 text-primary shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-primary">
          Referred by {referral.hospital?.name ?? "your hospital"}
        </p>
        <p className="text-[11px] text-primary/80 mt-0.5">
          {serviceCount > 0
            ? `${serviceCount} recommended ${serviceCount === 1 ? "service" : "services"
            }${county ? ` in ${county}` : ""}.`
            : `Browse caregivers${county ? ` in ${county}` : ""}.`}
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="h-7 w-7 rounded-full inline-flex items-center justify-center active:bg-primary/20 transition-colors shrink-0"
      >
        <X className="w-3.5 h-3.5 text-primary" />
      </button>
    </div>
  );
}

/* ---------- pieces ---------- */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground mb-1.5 sm:mb-2 mt-1">
      {children}
    </p>
  );
}

/* ---------- meta strip: views + endorsements + endorsed-you ---------- */

function CardMeta({
  totalViews,
  endorsementCount,
  endorsedMeCount,
}: {
  totalViews?: number | null;
  endorsementCount: number;
  endorsedMeCount: number;
}) {
  const views = totalViews ?? 0;
  const hasViews = views > 0;
  const hasEndorsements = endorsementCount > 0;
  const hasEndorsedMe = endorsedMeCount > 0;

  if (!hasViews && !hasEndorsements && !hasEndorsedMe) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-2">
      {hasViews && (
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
          <Eye className="w-3 h-3" />
          {views.toLocaleString()}
        </span>
      )}
      {hasEndorsements && (
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
          <Award className="w-3 h-3" />
          {endorsementCount}
        </span>
      )}
      {hasEndorsedMe && (
        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
          <Award className="w-3 h-3" />
          Endorsed you
        </span>
      )}
    </div>
  );
}

/* ---------- card actions ---------- */

function CardActions({
  profileHref,
  targetId,
  targetName,
  avatarUrl,
  conn,
  onConsult,
  connected,
  referralId,
  onBook,
}: {
  profileHref: string;
  targetId: string;
  targetName: string;
  avatarUrl: string | null;
  conn: { id: string; status: string } | null;
  onConsult: (id: string, name: string, avatar: string | null) => void;
  connected?: boolean;
  referralId?: string | null;
  onBook?: (caregiverId: string) => void;
}) {
  const { user } = useSession();
  const isCaregiver = user?.role === "caregiver";
  const referralMode = !!referralId && !isCaregiver && !!onBook;

  const status = conn?.status;
  const accepted = status === "accepted";
  const pending = status === "pending";
  const disabled = pending;

  const label = pending
    ? "Pending"
    : accepted
      ? isCaregiver
        ? "Attend"
        : "Consult"
      : "Connect";

  const Icon = pending ? Clock : MessageCircle;

  return (
    <div className="mt-3 sm:mt-4 flex items-center justify-end gap-1.5 sm:gap-2">
      {connected && (
        <span className="mr-auto text-[11px] font-bold uppercase tracking-wider text-success">
          Connected
        </span>
      )}
      <Link
        to={profileHref}
        className="h-10 px-2  rounded-xl bg-muted text-foreground text-sm font-bold inline-flex items-center justify-center gap-1.5 active:bg-secondary transition-colors"
      >
        <Eye className="w-4 h-4" />
        View
      </Link>

      {referralMode ? (
        <button
          type="button"
          onClick={() => onBook!(targetId)}
          className="h-10 px-2  rounded-xl bg-primary text-primary-foreground text-sm font-bold inline-flex items-center justify-center gap-1.5 active:opacity-90 transition-opacity"
        >
          <CalendarPlus className="w-4 h-4" />
          Book
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onConsult(targetId, targetName, avatarUrl)}
          disabled={disabled}
          className="h-10 px-2  rounded-xl bg-primary text-primary-foreground text-sm font-bold inline-flex items-center justify-center gap-1.5 active:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon className="w-4 h-4" />
          {label}
        </button>
      )}
    </div>
  );
}

/* ---------- caregiver card ---------- */

function CaregiverCard({
  c,
  conn,
  endorsementCount,
  endorsedMeCount,
  onConsult,
  referralId,
  onBook,
}: {
  c: CaregiverDiscoveryRow;
  conn: { id: string; status: string } | null;
  endorsementCount: number;
  endorsedMeCount: number;
  onConsult: (id: string, name: string, avatar: string | null) => void;
  referralId?: string | null;
  onBook?: (caregiverId: string) => void;
}) {
  const location = [c.city, c.county].filter(Boolean).join(", ") || "Kenya";
  const rating =
    c.average_rating && c.average_rating > 0
      ? Number(c.average_rating).toFixed(1)
      : "New";
  const connected = conn?.status === "accepted";

  return (
    <div className="rounded-2xl bg-card p-3 sm:p-4 transition-colors">
      <div className="flex items-start gap-3">
        <InitialsAvatar
          url={c.avatar_url}
          name={c.display_name ?? "Caregiver"}
          online={c.is_available}
        />
        <div className="min-w-0 flex-1 pt-1">
          <div className="flex items-center gap-1">
            <Link
              to={`/profile/${c.caregiver_id}`}
              className="text-sm font-bold text-foreground truncate"
            >
              {c.display_name || "Caregiver"}
            </Link>
            <VerifiedBadge
              show={c.verification_status === "verified"}
              className="w-4 h-4 shrink-0"
            />
          </div>

          {c.professional_title && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {c.professional_title}
            </p>
          )}

          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Star className="w-3 h-3 fill-current text-primary" />
              <span className="font-semibold text-foreground">{rating}</span>
              {c.total_reviews != null && c.total_reviews > 0 && (
                <span>({c.total_reviews})</span>
              )}
            </span>
            <span className="inline-flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{location}</span>
            </span>
          </div>

          <CardMeta
            totalViews={c.total_views}
            endorsementCount={endorsementCount}
            endorsedMeCount={endorsedMeCount}
          />
        </div>
      </div>

      <CardActions
        profileHref={`/profile/${c.caregiver_id}`}
        targetId={c.caregiver_id}
        targetName={c.display_name ?? "Caregiver"}
        avatarUrl={c.avatar_url}
        conn={conn}
        onConsult={onConsult}
        connected={connected}
        referralId={referralId ?? null}
        onBook={onBook}
      />
    </div>
  );
}

/* ---------- client card ---------- */

function ClientCard({
  c,
  conn,
  endorsementCount,
  endorsedMeCount,
  onConsult,
}: {
  c: ClientDiscoveryRow;
  conn: { id: string; status: string } | null;
  endorsementCount: number;
  endorsedMeCount: number;
  onConsult: (id: string, name: string, avatar: string | null) => void;
}) {
  const location = [c.city, c.county].filter(Boolean).join(", ") || "Kenya";
  const isAnonymous = !c.display_name || c.display_name === "Anonymous";
  const connected = conn?.status === "accepted";

  return (
    <div className="rounded-2xl bg-card p-4 transition-colors">
      <div className="flex items-start gap-3">
        <InitialsAvatar
          url={c.avatar_url}
          name={c.display_name ?? "Anonymous"}
        />

        <div className="min-w-0 flex-1 pt-1">
          <div className="flex items-center gap-1">
            <Link
              to={`/profile/${c.client_id}`}
              className="text-sm font-bold text-foreground truncate"
            >
              {c.display_name || "Anonymous"}
            </Link>
            {isAnonymous && (
              <Heart className="w-3.5 h-3.5 text-primary shrink-0" />
            )}
          </div>

          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{location}</span>
            </span>
            {c.living_situation && (
              <span className="inline-flex items-center gap-1 truncate">
                <Home className="w-3 h-3 shrink-0" />
                <span className="truncate capitalize">
                  {c.living_situation.replace(/_/g, " ")}
                </span>
              </span>
            )}
          </div>

          {c.pref_languages && c.pref_languages.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {c.pref_languages.slice(0, 3).map((lang) => (
                <span
                  key={lang}
                  className="px-2 py-0.5 rounded-full bg-muted text-[11px] font-medium text-muted-foreground"
                >
                  {lang}
                </span>
              ))}
            </div>
          )}

          <CardMeta
            totalViews={c.total_views}
            endorsementCount={endorsementCount}
            endorsedMeCount={endorsedMeCount}
          />
        </div>
      </div>

      <CardActions
        profileHref={`/profile/${c.client_id}`}
        targetId={c.client_id}
        targetName={c.display_name ?? "Anonymous"}
        avatarUrl={c.avatar_url}
        conn={conn}
        onConsult={onConsult}
        connected={connected}
      />
    </div>
  );
}

/* ---------- message drawer ---------- */

function MessagePreviewDrawer({
  target,
  preview,
  onClose,
  onOpenChat,
}: {
  target: { targetId: string; connectionId: string; name: string; avatarUrl: string | null };
  preview: Preview | null;
  onClose: () => void;
  onOpenChat: () => void;
}) {
  const [dragY, setDragY] = useState(0);
  const startYRef = useRef<number | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const onPointerDown = (e: React.PointerEvent) => {
    startYRef.current = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (startYRef.current === null) return;
    setDragY(Math.max(0, e.clientY - startYRef.current));
  };
  const onPointerUp = () => {
    if (dragY > 100) onClose();
    else setDragY(0);
    startYRef.current = null;
  };

  const initial = target.name?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="fixed inset-0 z-50 bg-foreground/40 flex items-end justify-center">
      <div onClick={onClose} className="absolute inset-0" aria-hidden />
      <div
        className="relative w-full bg-background rounded-t-3xl max-h-[70vh] overflow-y-auto transition-transform"
        style={{
          transform: `translateY(${dragY}px)`,
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div
          className="pt-3 pb-2 flex justify-center cursor-grab active:cursor-grabbing touch-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <span className="w-10 h-1.5 rounded-full bg-muted-foreground/30" />
        </div>

        <div className="px-2  pb-3 flex items-center gap-3">
          <span className="h-12 w-12 rounded-full overflow-hidden bg-muted shrink-0 flex items-center justify-center">
            {target.avatarUrl ? (
              <img
                src={target.avatarUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-primary font-black">{initial}</span>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold truncate">{target.name}</p>
            <p className="text-xs text-muted-foreground">
              Tap to open the full chat
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full inline-flex items-center justify-center active:bg-muted"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-2  pb-5">
          {preview ? (
            <div className="rounded-2xl bg-card px-2  py-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                Last message
              </p>
              <p className="text-sm text-foreground line-clamp-3">
                {preview.body || "(attachment)"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-2">
                {new Date(preview.created_at).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl bg-muted px-2  py-6 text-center">
              <Loader2 className="w-5 h-5 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No messages yet — open the chat to say hello.
              </p>
            </div>
          )}

          <button
            onClick={onOpenChat}
            className="mt-4 w-full h-12 rounded-2xl bg-primary text-primary-foreground text-sm font-bold inline-flex items-center justify-center gap-2 active:opacity-90"
          >
            Open chat
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 -mx-2 px-2 sm:mx-0 sm:px-0">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-card p-4">
          <div className="flex items-start gap-3">
            <div className="h-20 w-20 rounded-full skeleton-shimmer shrink-0" />
            <div className="flex-1 space-y-2 pt-2">
              <div className="h-3 rounded skeleton-shimmer w-3/4" />
              <div className="h-2.5 rounded skeleton-shimmer w-1/2" />
              <div className="h-2.5 rounded skeleton-shimmer w-2/3" />
            </div>
          </div>
          <div className="flex gap-2 mt-4 justify-end">
            <div className="h-10 w-20 rounded-xl skeleton-shimmer" />
            <div className="h-10 w-24 rounded-xl skeleton-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  isCaregiver,
  hasFilters,
}: {
  isCaregiver: boolean;
  hasFilters: boolean;
}) {
  const subject = isCaregiver ? "clients" : "caregivers";
  return (
    <div className="py-16 text-center animate-fade-in">
      <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
      <p className="text-sm text-muted-foreground">
        {hasFilters
          ? `No ${subject} match your search.`
          : `No ${subject} are listed yet.`}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        {hasFilters ? "Try a different search." : "Check back soon."}
      </p>
    </div>
  );
}
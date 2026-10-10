// src/pages/Explore.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { VerifiedBadge } from "@/components/brand/VerifiedBadge";
import type {
  CaregiverDiscoveryRow,
  ClientDiscoveryRow,
} from "@/types/db";

const PAGE_SIZE = 24;

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

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sheetTarget, setSheetTarget] = useState<{
    targetId: string;
    connectionId: string;
    name: string;
    avatarUrl: string | null;
  } | null>(null);

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
    const rank = (s: string) => (s === "accepted" ? 3 : s === "pending" ? 2 : 1);
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
    () => myConnections.filter((c) => c.status === "accepted").map((c) => c.id),
    [myConnections]
  );

  const { data: latestMessages = new Map<string, Preview>() } = useQuery({
    queryKey: ["chat", "previews", acceptedConnectionIds.sort().join(",")],
    enabled: acceptedConnectionIds.length > 0,
    staleTime: 30_000,
    queryFn: () => fetchLatestMessages(acceptedConnectionIds),
  });

  const { connectedRows, discoverRows } = useMemo(() => {
    const connected: (CaregiverDiscoveryRow | ClientDiscoveryRow)[] = [];
    const discover: (CaregiverDiscoveryRow | ClientDiscoveryRow)[] = [];
    for (const r of rows) {
      const id = isCaregiver
        ? (r as ClientDiscoveryRow).client_id
        : (r as CaregiverDiscoveryRow).caregiver_id;
      const conn = connByTarget.get(id);
      if (conn?.status === "accepted") connected.push(r);
      else discover.push(r);
    }
    return { connectedRows: connected, discoverRows: discover };
  }, [rows, connByTarget, isCaregiver]);

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
      />
    );
  };

  const hasAnyRows = rows.length > 0;

  return (
    <div className="max-w-6xl mx-auto px-4 pb-8">
      <div className="sticky top-14 z-20 bg-background pt-3 pb-3">
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
        <EmptyState
          isCaregiver={isCaregiver}
          hasFilters={!!search}
        />
      ) : (
        <>
          {connectedRows.length > 0 && (
            <section className="mb-5">
              <SectionLabel>
                {isCaregiver ? "My care circle" : "Your connections"}
              </SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {connectedRows.map(renderCard)}
              </div>
            </section>
          )}

          {discoverRows.length > 0 && (
            <section>
              {connectedRows.length > 0 && (
                <SectionLabel>Discover more</SectionLabel>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-fade-in">
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

/* ---------- pieces ---------- */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground mb-2 mt-1">
      {children}
    </p>
  );
}

function Avatar({
  url,
  name,
  online,
}: {
  url: string | null;
  name: string;
  online?: boolean;
}) {
  const initial = name?.[0]?.toUpperCase() ?? "?";
  return (
    <div className="relative shrink-0">
      <div className="h-20 w-20 rounded-full overflow-hidden bg-muted">
        {url ? (
          <img
            src={url}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-black">
            {initial}
          </div>
        )}
      </div>
      {online && (
        <span
          className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-success"
          aria-label="Online"
        />
      )}
    </div>
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
}: {
  profileHref: string;
  targetId: string;
  targetName: string;
  avatarUrl: string | null;
  conn: { id: string; status: string } | null;
  onConsult: (id: string, name: string, avatar: string | null) => void;
  connected?: boolean;
}) {
  const { user } = useSession();
  const isCaregiver = user?.role === "caregiver";

  const status = conn?.status;
  const accepted = status === "accepted";
  const pending = status === "pending";

  // Pending → disabled
  const disabled = pending;

  // Label logic:
  //   no connection → "Connect"  (go to profile to send request)
  //   accepted      → caregiver: "Attend" · client: "Consult"  (open chat)
  //   pending       → "Pending"  (disabled)
  //   ended/declined/blocked → "Connect" (go to profile to reconnect)
  const label = pending
    ? "Pending"
    : accepted
      ? isCaregiver
        ? "Attend"
        : "Consult"
      : "Connect";

  const Icon = pending ? Clock : MessageCircle;

  return (
    <div className="mt-4 flex items-center justify-end gap-2">
      {connected && (
        <span className="mr-auto text-[11px] font-bold uppercase tracking-wider text-success">
          Connected
        </span>
      )}
      <Link
        to={profileHref}
        className="h-10 px-4 rounded-xl bg-muted text-foreground text-sm font-bold inline-flex items-center justify-center gap-1.5 active:bg-secondary transition-colors"
      >
        <Eye className="w-4 h-4" />
        View
      </Link>
      <button
        type="button"
        onClick={() => onConsult(targetId, targetName, avatarUrl)}
        disabled={disabled}
        className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-bold inline-flex items-center justify-center gap-1.5 active:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Icon className="w-4 h-4" />
        {label}
      </button>
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
}: {
  c: CaregiverDiscoveryRow;
  conn: { id: string; status: string } | null;
  endorsementCount: number;
  endorsedMeCount: number;
  onConsult: (id: string, name: string, avatar: string | null) => void;
}) {
  const location = [c.city, c.county].filter(Boolean).join(", ") || "Kenya";
  const rating =
    c.average_rating && c.average_rating > 0
      ? Number(c.average_rating).toFixed(1)
      : "New";
  const connected = conn?.status === "accepted";

  return (
    <div className="rounded-2xl bg-card p-4 transition-colors">
      <div className="flex items-start gap-3">
        <Avatar
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
        <Avatar url={c.avatar_url} name={c.display_name ?? "Anonymous"} />

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

        <div className="px-4 pb-3 flex items-center gap-3">
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

        <div className="px-4 pb-5">
          {preview ? (
            <div className="rounded-2xl bg-card px-4 py-4">
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
            <div className="rounded-2xl bg-muted px-4 py-6 text-center">
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
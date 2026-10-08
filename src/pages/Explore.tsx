// src/pages/Explore.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  Search,
  Star,
  BadgeCheck,
  MapPin,
  Users,
  Heart,
  Home,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import type {
  CaregiverDiscoveryRow,
  ClientDiscoveryRow,
} from "@/types/db";

const PAGE_SIZE = 24;

/* ---------- fetch: caregivers (client view) ---------- */

async function fetchCaregivers(
  cursor: string | null,
  search: string,
  onlineOnly: boolean
): Promise<{ rows: CaregiverDiscoveryRow[]; nextCursor: string | null }> {
  let q = supabase
    .from("caregiver_discovery_view")
    .select("*")
    .order("caregiver_id", { ascending: true })
    .limit(PAGE_SIZE);

  if (cursor) q = q.gt("caregiver_id", cursor);
  if (onlineOnly) q = q.eq("is_available", true);

  const s = search.trim().replace(/[,()]/g, " ");
  if (s) {
    q = q.or(
      `display_name.ilike.%${s}%,professional_title.ilike.%${s}%`
    );
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
    // Only display_name is searchable — other fields are privacy-gated
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

/* ---------- page ---------- */

export default function Explore() {
  const { user } = useSession();
  const isCaregiver = user?.role === "caregiver";

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [onlineOnly, setOnlineOnly] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const query = useInfiniteQuery({
    queryKey: ["explore", isCaregiver ? "clients" : "caregivers", search, onlineOnly],
    enabled: !!user,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      isCaregiver
        ? fetchClients(pageParam, search)
        : fetchCaregivers(pageParam, search, onlineOnly),
    getNextPageParam: (last) => last.nextCursor,
    staleTime: 2 * 60_000,
  });

  const rows = useMemo(
    () => query.data?.pages.flatMap((p) => p.rows) ?? [],
    [query.data]
  );

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

  return (
    <div className="max-w-6xl mx-auto px-4 pb-8">
      <div className="sticky top-14 z-20 bg-background pt-3 pb-3 space-y-3">
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

        {!isCaregiver && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
            <FilterChip
              active={onlineOnly}
              onClick={() => setOnlineOnly((v) => !v)}
            >
              Online now
            </FilterChip>
          </div>
        )}
      </div>

      {query.isLoading ? (
        <GridSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState
          isCaregiver={isCaregiver}
          hasFilters={!!search || onlineOnly}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 animate-fade-in">
            {isCaregiver
              ? (rows as ClientDiscoveryRow[]).map((c) => (
                <ClientCard key={c.client_id} c={c} />
              ))
              : (rows as CaregiverDiscoveryRow[]).map((c) => (
                <CaregiverCard key={c.caregiver_id} c={c} />
              ))}
          </div>

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
    </div>
  );
}

/* ---------- pieces ---------- */

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 h-11 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${active
        ? "bg-primary text-primary-foreground"
        : "bg-muted text-foreground"
        }`}
    >
      {children}
    </button>
  );
}

function CaregiverCard({ c }: { c: CaregiverDiscoveryRow }) {
  const location = [c.city, c.county].filter(Boolean).join(", ") || "Kenya";
  const initial = c.display_name?.[0]?.toUpperCase() ?? "C";

  return (
    <Link
      to={`/profile/${c.caregiver_id}`}
      className="rounded-2xl bg-card overflow-hidden active:bg-muted transition-colors"
    >
      <div className="aspect-square bg-muted relative">
        {c.avatar_url ? (
          <img
            src={c.avatar_url}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-black">
              {initial}
            </div>
          </div>
        )}

        {c.is_available && (
          <div className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-background text-xs font-semibold text-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Online
          </div>
        )}
      </div>

      <div className="p-3 space-y-1">
        <div className="flex items-start justify-between gap-1">
          <p className="text-sm font-bold text-foreground line-clamp-1 flex-1">
            {c.display_name || "Caregiver"}
          </p>
          {c.verification_status === "verified" && (
            <BadgeCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          )}
        </div>

        {c.professional_title && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {c.professional_title}
          </p>
        )}

        <div className="flex items-center gap-1 pt-1">
          <Star className="w-3 h-3 fill-current text-primary" />
          <span className="text-xs font-semibold text-foreground">
            {c.average_rating && c.average_rating > 0
              ? Number(c.average_rating).toFixed(1)
              : "New"}
          </span>
          {c.total_reviews != null && c.total_reviews > 0 && (
            <span className="text-xs text-muted-foreground">
              ({c.total_reviews})
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 pt-0.5">
          <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground truncate">
            {location}
          </span>
        </div>
      </div>
    </Link>
  );
}

function ClientCard({ c }: { c: ClientDiscoveryRow }) {
  const location = [c.city, c.county].filter(Boolean).join(", ") || "Kenya";
  const initial = c.display_name?.[0]?.toUpperCase() ?? "?";
  const isAnonymous = !c.display_name || c.display_name === "Anonymous";

  return (
    <Link
      to={`/profile/${c.client_id}`}
      className="rounded-2xl bg-card overflow-hidden active:bg-muted transition-colors"
    >
      <div className="aspect-square bg-muted relative">
        {c.avatar_url ? (
          <img
            src={c.avatar_url}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-black">
              {initial}
            </div>
          </div>
        )}

        {isAnonymous && (
          <div className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-background text-xs font-semibold text-foreground">
            <Heart className="w-3 h-3 text-primary" />
            Private
          </div>
        )}
      </div>

      <div className="p-3 space-y-1">
        <p className="text-sm font-bold text-foreground line-clamp-1">
          {c.display_name || "Anonymous"}
        </p>

        <div className="flex items-center gap-1 pt-0.5">
          <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground truncate">
            {location}
          </span>
        </div>

        {c.living_situation && (
          <div className="flex items-center gap-1 pt-0.5">
            <Home className="w-3 h-3 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground truncate capitalize">
              {c.living_situation.replace(/_/g, " ")}
            </span>
          </div>
        )}

        {c.pref_languages && c.pref_languages.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {c.pref_languages.slice(0, 2).map((lang) => (
              <span
                key={lang}
                className="px-2 py-0.5 rounded-full bg-muted text-xs font-medium text-muted-foreground"
              >
                {lang}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-card overflow-hidden">
          <div className="aspect-square skeleton-shimmer" />
          <div className="p-3 space-y-2">
            <div className="h-3 rounded skeleton-shimmer w-3/4" />
            <div className="h-2.5 rounded skeleton-shimmer w-1/2" />
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
          ? `No ${subject} match your filters.`
          : `No ${subject} are listed yet.`}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        {hasFilters
          ? "Try clearing the search or turning off 'Online now'."
          : "Check back soon."}
      </p>
    </div>
  );
}
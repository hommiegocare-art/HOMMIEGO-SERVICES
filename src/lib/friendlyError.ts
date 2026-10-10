// src/lib/friendlyError.ts
//
// Turns raw Supabase / Postgres errors into human-friendly messages.
// Falls back to a generic "Could not save. Please try again." for
// anything we don't recognise, so users never see SQL.

type PgError = {
    code?: string;
    message?: string;
    details?: string | null;
    hint?: string | null;
};

// ---- Field label map: DB column → human label ----
const FIELD_LABELS: Record<string, string> = {
    display_name: "Display name",
    legal_name: "Legal name",
    gender: "Sex",
    phone_number: "Phone number",
    county: "County",
    city: "City / Town",
    preferred_language: "Preferred language",
    avatar_url: "Profile photo",
    professional_title: "Professional title",
    bio: "Bio",
    years_experience: "Years of experience",
    specialties: "Specialties",
    languages: "Languages spoken",
    service_area_counties: "Service counties",
    license_number: "Registration number",
    title: "Title",
    short_description: "Short description",
    description: "Description",
    price: "Price",
    pricing_type: "Pricing type",
    duration_minutes: "Duration",
    category_id: "Category",
    cover_image: "Cover image",
    is_free_consultation: "Free consultation",
};

function labelFor(col: string): string {
    return FIELD_LABELS[col] ?? col.replace(/_/g, " ");
}

// Parse "column \"X\" of relation \"Y\"" out of a Postgres message
function extractColumn(message: string): string | null {
    const m = message.match(/column\s+"([^"]+)"/i);
    return m?.[1] ?? null;
}
function extractRelation(message: string): string | null {
    const m = message.match(/relation\s+"([^"]+)"/i);
    return m?.[1] ?? null;
}
function extractConstraint(message: string): string | null {
    const m = message.match(/constraint\s+"([^"]+)"/i);
    return m?.[1] ?? null;
}

/**
 * Returns a friendly string for any thrown error from Supabase.
 */
export function friendlyError(err: unknown): string {
    if (!err) return "Something went wrong. Please try again.";

    // Supabase wraps errors in a PostgrestError — code + message + details
    const e = err as PgError;
    const code = e.code ?? "";
    const msg = (e.message ?? "").toString();
    const lower = msg.toLowerCase();

    // ---------- 23502: NOT NULL violation ----------
    if (code === "23502" || lower.includes("violates not-null constraint")) {
        const col = extractColumn(msg);
        const label = col ? labelFor(col) : "A required field";
        return `${label} can't be empty. Please fill it in.`;
    }

    // ---------- 23505: unique violation ----------
    if (code === "23505" || lower.includes("duplicate key")) {
        if (lower.includes("caregiver_profiles") || lower.includes("license_number")) {
            return "That registration number is already in use.";
        }
        if (lower.includes("email")) {
            return "That email is already registered.";
        }
        if (lower.includes("phone")) {
            return "That phone number is already in use.";
        }
        return "This value already exists. Try a different one.";
    }

    // ---------- 23503: foreign key violation ----------
    if (code === "23503" || lower.includes("foreign key")) {
        return "We couldn't link this to the right record. Please refresh and try again.";
    }

    // ---------- 23514: check constraint ----------
    if (code === "23514" || lower.includes("violates check constraint")) {
        const constraint = extractConstraint(msg);
        if (constraint?.includes("years_experience")) {
            return "Years of experience must be between 0 and 60.";
        }
        if (constraint?.includes("price")) {
            return "Price must be a positive number.";
        }
        if (constraint?.includes("duration")) {
            return "Duration must be a positive number.";
        }
        return "One of the values doesn't match what's allowed. Please review your input.";
    }

    // ---------- 22001: value too long ----------
    if (code === "22001" || lower.includes("value too long")) {
        const col = extractColumn(msg);
        const label = col ? labelFor(col) : "One field";
        return `${label} is too long. Please shorten it.`;
    }

    // ---------- 22P02: invalid text representation ----------
    if (code === "22P02" || lower.includes("invalid input syntax")) {
        return "One of the values is in the wrong format. Please check and try again.";
    }

    // ---------- 42501: insufficient privilege / RLS ----------
    if (code === "42501" || lower.includes("permission denied") || lower.includes("row-level security")) {
        return "You don't have permission to save this. Try signing out and back in.";
    }

    // ---------- 42P01: relation does not exist (dev error) ----------
    if (code === "42P01") {
        return "We couldn't reach the server. Please try again in a moment.";
    }

    // ---------- Network / offline ----------
    if (lower.includes("network") || lower.includes("fetch")) {
        return "No connection. Check your internet and try again.";
    }

    // ---------- Auth ----------
    if (lower.includes("jwt") || lower.includes("token")) {
        return "Your session expired. Please sign in again.";
    }

    // ---------- Storage ----------
    if (lower.includes("payload too large") || lower.includes("entity too large")) {
        return "That file is too large. Try a smaller one.";
    }
    if (lower.includes("mime type") || lower.includes("invalid file type")) {
        return "That file type isn't supported. Try a different image or PDF.";
    }

    // ---------- Fallback ----------
    return "Could not save. Please check your details and try again.";
}
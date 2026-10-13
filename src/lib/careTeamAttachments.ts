// src/lib/careTeamAttachments.ts
//
// Legacy parser for messages that stored a single JSON blob (or a bare
// URL) in `care_team_messages.attachment_url` before the
// `care_team_attachments` table existed. New messages don't use this.
//
// Kept so old rows still render as a single attachment in the bubble.

export type LegacyAttachmentKind = "image" | "video" | "file";

export type LegacyAttachment = {
    kind: LegacyAttachmentKind;
    url: string;
    public_id?: string;
    width?: number;
    height?: number;
    bytes?: number;
    format?: string;
};

export function parseAttachment(
    raw: string | null
): LegacyAttachment | null {
    if (!raw) return null;

    // JSON blob (pre-table format)
    if (raw.startsWith("{")) {
        try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed.url === "string") {
                return {
                    kind: (parsed.kind as LegacyAttachmentKind) ?? "file",
                    url: parsed.url,
                    public_id: parsed.public_id,
                    width: parsed.width,
                    height: parsed.height,
                    bytes: parsed.bytes,
                    format: parsed.format,
                };
            }
        } catch {
            /* fall through */
        }
    }

    // Bare URL — infer kind from extension.
    const lower = raw.toLowerCase();
    let kind: LegacyAttachmentKind = "file";
    if (/\.(jpe?g|png|webp|gif|heic|heif|avif)(\?|$)/.test(lower)) {
        kind = "image";
    } else if (/\.(mp4|mov|webm|m4v|quicktime)(\?|$)/.test(lower)) {
        kind = "video";
    }
    return { kind, url: raw };
}
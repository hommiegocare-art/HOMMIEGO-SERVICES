// src/components/profile/EditProfileForm.tsx
import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, Loader2, Save, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { MultiSelect } from "@/components/ui/multi-select";
import { supabase } from "@/integrations/supabase/client";

import { uploadToCloudinary } from "@/lib/cloudinary";
import { ProfileMediaUploader } from "@/components/profile/ProfileMediaUploader";
import {
    KENYA_COUNTIES,
    KENYA_LANGUAGES,
    CAREGIVER_SPECIALTIES,
    PROFESSIONAL_TITLES,
    normalizePhone,
} from "@/lib/kenya";
import type { CaregiverProfile, ClientProfile } from "@/types/db";
import { useSession, refreshSession } from "@/hooks/useSession";

const LANGUAGE_LABELS = KENYA_LANGUAGES.map((l) => l.label);

// Sex values stored on profiles.gender (lowercase, matching the app's convention)
const SEX_OPTIONS: { value: string; label: string }[] = [
    { value: "female", label: "Female" },
    { value: "male", label: "Male" },
];

// Normalize whatever is in the DB to a known value ("female" | "male" | "")
function normalizeSex(v: string | null | undefined): string {
    const g = (v ?? "").toLowerCase().trim();
    if (g === "female" || g === "f") return "female";
    if (g === "male" || g === "m") return "male";
    return "";
}

function labelFromCode(code: string) {
    return KENYA_LANGUAGES.find((l) => l.code === code)?.label ?? "";
}
function codeFromLabel(label: string) {
    return KENYA_LANGUAGES.find((l) => l.label === label)?.code ?? "";
}

export function EditProfileForm({
    caregiver,
    client: _client,
    onDone,
}: {
    caregiver: CaregiverProfile | null;
    client: ClientProfile | null;
    onDone: () => void;
}) {
    const { user } = useSession();
    const qc = useQueryClient();
    const isCaregiver = user?.role === "caregiver";

    // ---- Profile fields ----
    const [displayName, setDisplayName] = useState(user?.display_name ?? "");
    const [legalName, setLegalName] = useState(user?.legal_name ?? "");
    const [sex, setSex] = useState<string>(normalizeSex(user?.gender));
    const [phone, setPhone] = useState(user?.phone_number ?? "");
    const [county, setCounty] = useState(user?.county ?? "");
    const [city, setCity] = useState(user?.city ?? "");
    const [language, setLanguage] = useState(user?.preferred_language ?? "en");
    const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? "");

    // ---- Caregiver fields ----
    const [professionalTitle, setProfessionalTitle] = useState(
        caregiver?.professional_title ?? ""
    );
    const [bio, setBio] = useState(caregiver?.bio ?? "");
    const [years, setYears] = useState(
        caregiver?.years_experience ? String(caregiver.years_experience) : "0"
    );
    const [specialties, setSpecialties] = useState<string[]>(
        caregiver?.specialties ?? []
    );
    const [languages, setLanguages] = useState<string[]>(() => {
        const codes = caregiver?.languages ?? ["en"];
        // migrate: if stored as "en"/"sw" codes → labels; if already labels, keep
        return codes.map((c) => labelFromCode(c) || c);
    });
    const [serviceCounties, setServiceCounties] = useState<string[]>(
        caregiver?.service_area_counties ?? []
    );

    const [uploading, setUploading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const save = useMutation({
        mutationFn: async () => {
            if (!user) return;

            // ---- profile update ----
            const { error: pErr } = await supabase
                .from("profiles")
                .update({
                    display_name: displayName.trim(),
                    legal_name: legalName.trim() || null,
                    gender: sex || null,                       // ← writes "female" | "male" | null
                    phone_number: normalizePhone(phone) || null,
                    county: county.trim() || null,
                    city: city.trim() || null,
                    preferred_language: language.trim() || "en",
                    avatar_url: avatarUrl || null,
                })
                .eq("id", user.id);
            if (pErr) throw pErr;

            // ---- caregiver update ----
            if (isCaregiver) {
                const langCodes = languages.length
                    ? languages.map((l) => codeFromLabel(l) || l)
                    : ["en"];

                const { error: cErr } = await supabase
                    .from("caregiver_profiles")
                    .update({
                        professional_title: professionalTitle.trim() || null,
                        bio: bio.trim() || null,
                        years_experience: Math.max(0, Math.min(60, Number(years) || 0)),
                        specialties,
                        languages: langCodes,
                        service_area_counties: serviceCounties,
                    })
                    .eq("user_id", user.id);
                if (cErr) throw cErr;
            }
        },
        onSuccess: async () => {
            await refreshSession();                              // ← rebuild the useSession cache
            qc.invalidateQueries({ queryKey: ["profile"] });
            qc.invalidateQueries({ queryKey: ["explore"] });
            // Sex change affects pregnancy visibility on the diary module
            qc.invalidateQueries({ queryKey: ["patient-sex"] });
            onDone();
        },
    });

    async function uploadAvatar(file: File) {
        if (!user) return;
        setUploading(true);
        try {
            const uploaded = await uploadToCloudinary(file, {
                folder: `hommiecare/${user.id}/avatar`,
                resourceType: "image",
            });
            setAvatarUrl(uploaded.url);
        } catch (e: any) {
            alert(e?.message ?? "Upload failed");
        } finally {
            setUploading(false);
        }
    }

    return (
        <div className="space-y-4 animate-fade-in">
            {/* ---------- Avatar ---------- */}
            <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-primary/10 overflow-hidden shrink-0">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl font-black text-primary">
                            {displayName?.[0]?.toUpperCase() ?? "U"}
                        </div>
                    )}
                </div>
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadAvatar(f);
                    }}
                />
                <Button
                    variant="secondary"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="rounded-2xl h-11"
                >
                    {uploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <>
                            <Upload className="w-4 h-4 mr-2" /> Change photo
                        </>
                    )}
                </Button>
            </div>

            {/* ---------- Basic fields ---------- */}
            <Field label="Display name">
                <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="h-11 rounded-2xl bg-muted border-0"
                />
            </Field>

            <Field label="Legal name (private)">
                <Input
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    placeholder="Shown to connected caregivers only"
                    className="h-11 rounded-2xl bg-muted border-0"
                />
            </Field>

            <Field label="Sex">
                <div className="flex gap-2">
                    {SEX_OPTIONS.map((o) => (
                        <button
                            key={o.value}
                            type="button"
                            onClick={() => setSex(o.value)}
                            className={`flex-1 h-11 rounded-2xl text-sm font-semibold transition-colors ${sex === o.value
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground active:bg-secondary"
                                }`}
                        >
                            {o.label}
                        </button>
                    ))}
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                    Used to show you the right health features. Cannot be blank.
                </p>
            </Field>

            <Field label="Phone">
                <Input
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onBlur={(e) => setPhone(normalizePhone(e.target.value))}
                    placeholder="0712 345 678"
                    className="h-11 rounded-2xl bg-muted border-0"
                />
            </Field>

            <div className="grid grid-cols-2 gap-3">
                <Field label="County">
                    <Combobox
                        options={KENYA_COUNTIES}
                        value={county}
                        onChange={setCounty}
                        placeholder="Select county"
                    />
                </Field>
                <Field label="City / Town">
                    <Input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Westlands"
                        className="h-11 rounded-2xl bg-muted border-0"
                    />
                </Field>
            </div>

            <Field label="Preferred language">
                <Combobox
                    options={LANGUAGE_LABELS}
                    value={labelFromCode(language)}
                    onChange={(label) => setLanguage(codeFromLabel(label) || "en")}
                    placeholder="Select language"
                />
            </Field>

            {/* ---------- Public media (caregivers only) ---------- */}
            {isCaregiver && (
                <div className="space-y-4 pt-2">
                    <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3">
                        <p className="text-sm font-medium">Profile photos</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Shown to clients browsing your profile. Clients see these first.
                        </p>
                    </div>

                    <ProfileMediaUploader
                        kind="gallery"
                        title="Gallery"
                        hint="Up to 5 photos — you at work, in uniform, or your practice setting."
                        accept="image/*"
                    />
                    <ProfileMediaUploader
                        kind="hospital"
                        title="Hospital / workplace photo"
                        hint="A photo of you at your workplace. A strong trust signal for clients."
                        accept="image/*"
                    />
                </div>
            )}

            {/* ---------- Caregiver professional fields ---------- */}
            {isCaregiver && (
                <>
                    <Field label="Professional title">
                        <Combobox
                            options={PROFESSIONAL_TITLES}
                            value={professionalTitle}
                            onChange={setProfessionalTitle}
                            placeholder="Select or type…"
                            allowCustom
                        />
                    </Field>

                    <Field label="Bio">
                        <Textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={4}
                            maxLength={400}
                            placeholder="A sentence or two about your practice."
                            className="rounded-2xl bg-muted border-0"
                        />
                        <p className="mt-1 text-right text-[11px] text-muted-foreground">
                            {bio.length}/400
                        </p>
                    </Field>

                    <Field label="Years of experience">
                        <Input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            max={60}
                            value={years}
                            onChange={(e) => setYears(e.target.value)}
                            className="h-11 rounded-2xl bg-muted border-0"
                        />
                    </Field>
                    <Field label="Registration number">
                        <div className="h-11 flex items-center rounded-2xl bg-muted px-3 text-sm text-foreground">
                            {caregiver?.license_number || "Issued on signup"}
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                            Auto-issued by HomieCare. Cannot be changed.
                        </p>
                    </Field>
                    <Field label="Specialties">
                        <MultiSelect
                            options={CAREGIVER_SPECIALTIES}
                            value={specialties}
                            onChange={setSpecialties}
                            placeholder="Select specialties"
                        />
                    </Field>

                    <Field label="Languages spoken">
                        <MultiSelect
                            options={LANGUAGE_LABELS}
                            value={languages}
                            onChange={setLanguages}
                            placeholder="Select languages"
                        />
                    </Field>

                    <Field label="Service counties">
                        <MultiSelect
                            options={KENYA_COUNTIES}
                            value={serviceCounties}
                            onChange={setServiceCounties}
                            placeholder="Select counties"
                        />
                    </Field>
                </>
            )}

            {/* ---------- Verification docs (caregivers only, private) ---------- */}
            {isCaregiver && (
                <div className="space-y-4 pt-2">
                    <div className="rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 flex items-start gap-3">
                        <ShieldCheck className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                        <div>
                            <p className="text-sm font-medium">Verification documents</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Private. Only reviewers can see these. They are never shown on
                                your public profile.
                            </p>
                        </div>
                    </div>

                    <ProfileMediaUploader
                        kind="id_front"
                        title="National ID — front"
                        hint="Clear photo of the front of your National ID."
                        accept="image/*,application/pdf"
                    />
                    <ProfileMediaUploader
                        kind="id_back"
                        title="National ID — back"
                        hint="Clear photo of the back of your National ID."
                        accept="image/*,application/pdf"
                    />
                    <ProfileMediaUploader
                        kind="passport"
                        title="Passport (optional)"
                        hint="Only if you have one and want extra verification."
                        accept="image/*,application/pdf"
                    />
                    <ProfileMediaUploader
                        kind="licence"
                        title="Professional licence"
                        hint="Nursing council, clinical officer, or medical board licence."
                        accept="image/*,application/pdf"
                    />
                    <ProfileMediaUploader
                        kind="certificate"
                        title="Training certificates"
                        hint="Any relevant certificates or qualifications."
                        accept="image/*,application/pdf"
                    />
                </div>
            )}

            {save.isError && (
                <div className="rounded-2xl bg-destructive/10 px-4 py-3">
                    <p className="text-sm text-destructive">
                        {(save.error as any)?.message ?? "Could not save"}
                    </p>
                </div>
            )}

            <div className="flex gap-3 pt-2">
                <Button
                    variant="secondary"
                    onClick={onDone}
                    className="flex-1 h-12 rounded-2xl"
                >
                    <X className="w-4 h-4 mr-2" /> Cancel
                </Button>
                <Button
                    onClick={() => save.mutate()}
                    disabled={save.isPending || !displayName.trim()}
                    className="flex-1 h-12 rounded-2xl"
                >
                    {save.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" /> Save
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}

function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <Label className="text-xs font-semibold text-muted-foreground">
                {label}
            </Label>
            <div className="mt-1">{children}</div>
        </div>
    );
}
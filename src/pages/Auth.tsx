// src/pages/Auth.tsx
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Loader2, User, Stethoscope } from "lucide-react";

type Role = "client" | "caregiver";

const KENYAN_PHONE = /^(?:\+254|0)(7|1)\d{8}$/;

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\s+/g, "").replace(/[-()]/g, "");
  if (!KENYAN_PHONE.test(digits)) return null;
  if (digits.startsWith("0")) return "+254" + digits.slice(1);
  return digits;
}

export default function Auth() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const isSignUp = params.get("mode") === "signup";
  const urlRole = params.get("role") as Role | null;

  const [role, setRole] = useState<Role>(urlRole ?? "client");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (urlRole && (urlRole === "client" || urlRole === "caregiver") && isSignUp) {
      setRole(urlRole);
    }
  }, [urlRole, isSignUp]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (isSignUp) {
      const normalized = normalizePhone(phone);
      if (!normalized) {
        setError("Enter a valid Kenyan phone number (07XX XXX XXX).");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
    }

    setBusy(true);
    try {
      if (isSignUp) {
        const normalized = normalizePhone(phone)!;
        const { error: signUpErr } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: fullName.trim(),
              legal_name: fullName.trim(),
              role,
              phone_number: normalized,
            },
          },
        });
        if (signUpErr) throw signUpErr;
        navigate("/dashboard", { replace: true });
      } else {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInErr) throw signInErr;
        navigate("/dashboard", { replace: true });
      }
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="max-w-md mx-auto p-5 pb-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground -ml-2 mb-6 h-11"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </Link>

        <h1 className="text-3xl font-black tracking-tight text-foreground">
          {isSignUp ? "Create your account" : "Welcome back"}
        </h1>
        <p className="text-sm text-muted-foreground mt-2 mb-7">
          {isSignUp
            ? "Choose how you'll use HommieCare."
            : "Sign in to continue."}
        </p>

        {isSignUp && (
          <div className="grid grid-cols-2 gap-2 mb-6">
            {(["client", "caregiver"] as Role[]).map((r) => {
              const active = role === r;
              const Icon = r === "client" ? User : Stethoscope;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`p-4 rounded-2xl text-left transition-colors ${active
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-foreground"
                    }`}
                >
                  <Icon
                    className={`w-5 h-5 mb-2 ${active ? "text-primary-foreground" : "text-primary"
                      }`}
                  />
                  <p className="text-sm font-semibold">
                    {r === "client" ? "I need care" : "I provide care"}
                  </p>
                  <p
                    className={`text-xs mt-0.5 ${active
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground"
                      }`}
                  >
                    {r === "client" ? "Book home visits" : "Nurse, therapist, etc."}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          {isSignUp && (
            <div>
              <Label className="text-xs font-semibold text-muted-foreground">
                Full name
              </Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Wanjiru"
                autoComplete="name"
                required
                className="mt-1 h-12 rounded-2xl bg-muted border-0"
              />
            </div>
          )}

          {isSignUp && (
            <div>
              <Label className="text-xs font-semibold text-muted-foreground">
                Phone (M-Pesa)
              </Label>
              <Input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0712 345 678"
                autoComplete="tel"
                required
                className="mt-1 h-12 rounded-2xl bg-muted border-0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                We'll use this for M-Pesa payments.
              </p>
            </div>
          )}

          <div>
            <Label className="text-xs font-semibold text-muted-foreground">
              Email
            </Label>
            <Input
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              className="mt-1 h-12 rounded-2xl bg-muted border-0"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-muted-foreground">
              Password
            </Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              required
              minLength={6}
              className="mt-1 h-12 rounded-2xl bg-muted border-0"
            />
          </div>

          {error && (
            <div className="rounded-2xl bg-destructive/10 px-4 py-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={busy}
            className="w-full h-12 rounded-2xl text-base font-semibold"
          >
            {busy ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isSignUp ? (
              "Create account"
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() =>
              navigate(
                isSignUp ? "/auth" : `/auth?mode=signup&role=${role}`
              )
            }
            className="text-sm text-primary font-semibold h-11"
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "New to HommieCare? Create an account"}
          </button>
        </div>
      </div>
    </div>
  );
}
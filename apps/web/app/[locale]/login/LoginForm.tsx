"use client";

import { Mail } from "lucide-react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import type { Dictionary, Locale } from "@pastescribe/i18n";
import { Alert, Button, Input } from "@pastescribe/ui";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Status =
  | "idle"
  | "sendingMagicLink"
  | "magicLinkSent"
  | "redirectingGoogle"
  | "signingInPassword";

function callbackUrl(locale: Locale): string {
  const next = encodeURIComponent(`/${locale}`);
  return `${window.location.origin}/auth/callback?next=${next}`;
}

/**
 * Formulário real (não mockado) de login — magic link, Google e senha
 * opcional. Sem client Supabase configurado (env vars ausentes), os
 * campos ficam visíveis mas desabilitados com um aviso explícito: nunca
 * finge uma sessão nem falha em silêncio (docs/DECISIONS.md, CLAUDE.md).
 */
export function LoginForm({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const supabase = getSupabaseBrowserClient();
  const isConfigured = supabase !== null;

  const [mode, setMode] = useState<"magic" | "password">("magic");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const a = dict.auth;
  const isBusy =
    status === "sendingMagicLink" || status === "redirectingGoogle" || status === "signingInPassword";

  // Erro do /auth/callback (link mágico ou OAuth inválido/expirado) chega
  // como query param — lido no client para não forçar a página inteira a
  // sair de SSG por causa de um caso de borda.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "auth_callback_failed") {
      setError(a.errorCallback);
    }
  }, [a.errorCallback]);

  async function handleMagicLinkSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setError(null);
    setStatus("sendingMagicLink");
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callbackUrl(locale) },
    });
    if (authError) {
      setError(authError.message || a.errorGeneric);
      setStatus("idle");
      return;
    }
    setStatus("magicLinkSent");
  }

  async function handleGoogleClick() {
    if (!supabase) return;
    setError(null);
    setStatus("redirectingGoogle");
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl(locale) },
    });
    if (authError) {
      setError(authError.message || a.errorGeneric);
      setStatus("idle");
    }
    // Sucesso: o browser é redirecionado pelo próprio supabase-js.
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setError(null);
    setStatus("signingInPassword");
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message || a.errorGeneric);
      setStatus("idle");
      return;
    }
    // Navegação completa: garante que o cookie de sessão gravado pelo
    // client seja lido pelo servidor no próximo request.
    window.location.href = `/${locale}`;
  }

  if (status === "magicLinkSent") {
    return (
      <Alert variant="success" title={a.magicLinkSentTitle}>
        {a.magicLinkSentBody.replace("{email}", email)}
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {!isConfigured ? <Alert variant="warning" title={a.notConfiguredTitle}>{a.notConfiguredBody}</Alert> : null}
      {error ? <Alert variant="error" title={error} /> : null}

      <Button
        type="button"
        variant="secondary"
        className="w-full justify-center"
        disabled={!isConfigured || isBusy}
        isLoading={status === "redirectingGoogle"}
        loadingLabel={a.magicLinkSending}
        onClick={handleGoogleClick}
      >
        {a.googleButton}
      </Button>

      <div className="flex items-center gap-3" role="separator" aria-orientation="horizontal">
        <span className="h-px flex-1 bg-outline-variant" aria-hidden="true" />
        <span className="text-xs font-semibold uppercase text-on-surface-variant">{a.dividerOr}</span>
        <span className="h-px flex-1 bg-outline-variant" aria-hidden="true" />
      </div>

      {mode === "magic" ? (
        <form className="flex flex-col gap-4" onSubmit={handleMagicLinkSubmit}>
          <Input
            type="email"
            label={a.emailLabel}
            placeholder={a.emailPlaceholder}
            autoComplete="email"
            required
            disabled={!isConfigured || isBusy}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Button
            type="submit"
            className="w-full justify-center"
            leadingIcon={<Mail className="size-4" aria-hidden="true" />}
            disabled={!isConfigured || isBusy}
            isLoading={status === "sendingMagicLink"}
            loadingLabel={a.magicLinkSending}
          >
            {a.magicLinkButton}
          </Button>
        </form>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={handlePasswordSubmit}>
          <Input
            type="email"
            label={a.emailLabel}
            placeholder={a.emailPlaceholder}
            autoComplete="email"
            required
            disabled={!isConfigured || isBusy}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Input
            type="password"
            label={a.passwordLabel}
            placeholder={a.passwordPlaceholder}
            autoComplete="current-password"
            required
            disabled={!isConfigured || isBusy}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <Button
            type="submit"
            className="w-full justify-center"
            disabled={!isConfigured || isBusy}
            isLoading={status === "signingInPassword"}
            loadingLabel={a.passwordSigningIn}
          >
            {a.passwordButton}
          </Button>
        </form>
      )}

      <button
        type="button"
        className="text-center text-sm font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:text-outline disabled:no-underline"
        disabled={!isConfigured || isBusy}
        onClick={() => {
          setError(null);
          setMode((current) => (current === "magic" ? "password" : "magic"));
        }}
      >
        {mode === "magic" ? a.passwordToggleShow : a.passwordToggleHide}
      </button>
    </div>
  );
}

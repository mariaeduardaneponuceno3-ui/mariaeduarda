"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import { authErrorMessage } from "../../lib/supabase/errors";

export default function LoginForm({ configured, callbackError }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(callbackError ? "Não foi possível confirmar seu e-mail. O link pode ter expirado. Tente criar a conta novamente para receber outro link." : "");
  const [message, setMessage] = useState("");

  async function submit(event) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    const signup = event.nativeEvent.submitter?.value === "signup";
    setError("");
    setMessage("");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Informe um e-mail válido.");
      return;
    }
    if (!password || (signup && password.length < 6)) {
      setError(signup ? "A senha deve ter pelo menos 6 caracteres." : "Informe sua senha.");
      return;
    }
    setPending(true);
    try {
      const supabase = createClient();
      const { data, error } = signup
        ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } })
        : await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.session) {
        router.replace("/");
        router.refresh();
      } else {
        setMessage("Verifique seu e-mail e acesse o link de confirmação para concluir o cadastro.");
      }
    } catch (error) {
      setError(authErrorMessage(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      {!configured && <p role="alert">Autenticação indisponível. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY para continuar.</p>}
      <label htmlFor="email">E-mail</label>
      <input id="email" name="email" type="email" autoComplete="email" required disabled={pending} />
      <label htmlFor="password">Senha</label>
      <input id="password" name="password" type="password" autoComplete="current-password" required disabled={pending} />
      <div className="acoes-login">
        <button type="submit" value="signin" disabled={!configured || pending}>Entrar</button>
        <button type="submit" value="signup" disabled={!configured || pending}>Criar conta</button>
      </div>
      {pending && <p role="status">Aguarde…</p>}
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
    </form>
  );
}

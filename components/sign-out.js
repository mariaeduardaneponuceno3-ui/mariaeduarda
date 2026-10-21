"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";
import { authErrorMessage } from "../lib/supabase/errors";

export default function SignOut() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function signOut() {
    setPending(true);
    setError("");
    try {
      const { error } = await createClient().auth.signOut();
      if (error) throw error;
      router.replace("/login");
      router.refresh();
    } catch (error) {
      setError(authErrorMessage(error));
    } finally {
      setPending(false);
    }
  }

  return <div><button onClick={signOut} disabled={pending}>{pending ? "Saindo…" : "Sair"}</button>{error && <p role="alert">{error}</p>}</div>;
}

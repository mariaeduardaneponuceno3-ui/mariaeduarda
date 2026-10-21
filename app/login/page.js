import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { getSupabaseConfig } from "../../lib/supabase/config";
import LoginForm from "./login-form";

export default async function Login({ searchParams }) {
  const supabase = createClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) redirect("/");
  }
  return <main className="pagina"><section className="caixa"><h1>Acesse sua conta</h1><p>Entre ou crie uma conta para usar o analisador.</p><LoginForm configured={Boolean(getSupabaseConfig())} callbackError={searchParams.erro === "confirmacao"} /></section></main>;
}

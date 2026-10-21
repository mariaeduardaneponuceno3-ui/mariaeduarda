import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";

export function createClient() {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Autenticação indisponível. Configure o Supabase para continuar.");
  return createBrowserClient(config.url, config.key);
}

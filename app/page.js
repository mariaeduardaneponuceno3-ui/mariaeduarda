import { redirect } from "next/navigation";
import { createClient } from "../lib/supabase/server";
import Analyzer from "../components/analyzer";
import SiteHeader from "../components/site-header";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = createClient();
  if (!supabase) redirect("/login");
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  return <><SiteHeader email={user.email} /><Analyzer /></>;
}

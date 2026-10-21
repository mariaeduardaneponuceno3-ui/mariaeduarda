import { redirect } from "next/navigation";
import { createClient } from "../lib/supabase/server";
import Analyzer from "../components/analyzer";
import SignOut from "../components/sign-out";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = createClient();
  if (!supabase) redirect("/login");
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  return <><header className="topo"><span>{user.email}</span><SignOut /></header><Analyzer /></>;
}

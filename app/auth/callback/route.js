import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const supabase = createClient();
  if (code && supabase) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return new NextResponse(null, { status: 303, headers: { Location: "/" } });
  }
  return new NextResponse(null, { status: 303, headers: { Location: "/login?erro=confirmacao" } });
}

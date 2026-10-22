import { desafio } from "../../../desafio";
import { avaliarRespostas, ErroIA } from "../../../lib/ia.mjs";
import { createClient } from "../../../lib/supabase/server";

export const runtime = "nodejs";

function texto(body, status = 200) {
  return new Response(body, { status, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}

export async function POST(request) {
  try {
    const supabase = createClient();
    if (!supabase) return texto("Entre na sua conta para avaliar suas respostas.", 403);
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return texto("Entre na sua conta para avaliar suas respostas.", 403);
    let valores;
    try { valores = await request.json(); } catch {
      return texto("Não foi possível ler os dados enviados. Envie um formulário válido.", 400);
    }
    return texto(await avaliarRespostas(desafio, valores, { chave: process.env.OPENROUTER_API_KEY }));
  } catch (error) {
    if (error instanceof ErroIA) {
      // No keys, provider response bodies, user answers, or email addresses in logs.
      console.error("[ia] Falha na avaliação", { status: error.status, codigo: error.codigo });
      return texto(error.message, error.status);
    }
    console.error("[ia] Falha interna na avaliação", { status: 500, codigo: "erro_interno" });
    return texto("Não foi possível concluir a análise. Tente novamente em alguns instantes.", 500);
  }
}

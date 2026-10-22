import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { formatarData } from "../../lib/historico.mjs";
import SiteHeader from "../../components/site-header";

export const dynamic = "force-dynamic";
const POR_PAGINA = 20;

export default async function Historico({ searchParams }) {
  const supabase = createClient();
  if (!supabase) redirect("/login");
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const numero = Number(searchParams.pagina || 1);
  const pagina = Number.isSafeInteger(numero) && numero > 0 && numero <= 100000 ? numero : 1;
  const inicio = (pagina - 1) * POR_PAGINA;
  let registros = [];
  let total = 0;
  let falhou = false;
  try {
    const { data, error, count } = await supabase
      .from("respostas")
      .select("id, entrada, resposta, created_at", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false, nullsFirst: false })
      .order("id", { ascending: false })
      .range(inicio, inicio + POR_PAGINA - 1);
    if (error) {
      falhou = true;
      console.error("[historico] Falha ao consultar registros", { codigo: error.code || "consulta_recusada" });
    } else {
      registros = data || [];
      total = count || 0;
    }
  } catch {
    falhou = true;
    console.error("[historico] Falha ao consultar registros", { codigo: "falha_conexao" });
  }

  return (
    <>
      <SiteHeader email={user.email} />
      <main className="pagina pagina-historico">
        <section className="caixa">
          <h1>Meu histórico</h1>
          <p><Link href="/">Voltar ao treino</Link></p>
          <p>Suas avaliações, da mais recente para a mais antiga. Horário de Brasília.</p>
          {falhou ? (
            <p role="alert">Não foi possível carregar seu histórico. Tente novamente em alguns instantes.</p>
          ) : (
            <>
              {registros.length === 0 && <p>{pagina === 1 ? "Você ainda não tem avaliações salvas." : "Não há avaliações nesta página."}</p>}
              {registros.map((registro) => (
                <article className="registro-historico" key={registro.id}>
                  <h2>Avaliação — <time dateTime={registro.created_at || undefined}>{formatarData(registro.created_at)}</time></h2>
                  <details>
                    <summary>Ver o que você escreveu</summary>
                    <div className="texto-historico">{registro.entrada}</div>
                  </details>
                  <h3>Retorno da IA</h3>
                  <div className="texto-historico">{registro.resposta}</div>
                </article>
              ))}
              <nav className="paginacao" aria-label="Páginas do histórico">
                {pagina > 1 && <Link href={`/historico?pagina=${pagina - 1}`}>Mais recentes</Link>}
                {inicio + POR_PAGINA < total && <Link href={`/historico?pagina=${pagina + 1}`}>Mais antigas</Link>}
              </nav>
            </>
          )}
        </section>
      </main>
    </>
  );
}

"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { desafio } from "../desafio";
import { mensagemErroIA } from "../lib/ia-errors.mjs";

export default function Analyzer() {
  const router = useRouter();
  const [valores, setValores] = useState({});
  const [resposta, setResposta] = useState("");
  const [erro, setErro] = useState("");
  const [avisoHistorico, setAvisoHistorico] = useState("");
  const [analisando, setAnalisando] = useState(false);
  const enviando = useRef(false);

  async function analisar(event) {
    event.preventDefault();
    if (enviando.current) return;
    enviando.current = true;
    setAnalisando(true);
    setResposta("");
    setErro("");
    setAvisoHistorico("");
    try {
      const response = await fetch("/api/ia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(desafio.campos.map(({ id }) => [id, valores[id] || ""]))),
      });
      const texto = await response.text();
      if (!response.ok) throw new Error(mensagemErroIA(response.status));
      if (!texto.trim()) throw new Error("A IA não retornou uma resposta. Tente novamente.");
      setResposta(texto);
      if (response.headers.get("X-Historico-Salvo") === "false") {
        setAvisoHistorico("Sua avaliação foi gerada, mas não foi salva no histórico. Copie o resultado para não perdê-lo.");
      } else if (response.headers.get("X-Historico-Salvo") === "true") {
        router.refresh();
      }
    } catch (error) {
      setErro(error instanceof TypeError ? "Não foi possível conectar. Verifique sua conexão e tente novamente." : error.message || "Não foi possível concluir a análise. Tente novamente.");
    } finally {
      enviando.current = false;
      setAnalisando(false);
    }
  }

  return (
    <main className="pagina">
      <section className="caixa">
        <h1>{desafio.nome}</h1>
        <p>{desafio.subtitulo}</p>
        <form onSubmit={analisar}>
          {desafio.campos.map(({ id, rotulo, linhas }) => (
            <div key={id}>
              <label htmlFor={id}>{rotulo}</label>
              <textarea
                id={id}
                name={id}
                rows={linhas}
                value={valores[id] || ""}
                onChange={(event) => setValores((atuais) => ({ ...atuais, [id]: event.target.value }))}
                disabled={analisando}
              />
            </div>
          ))}
          <button type="submit" disabled={analisando}>{analisando ? "Analisando..." : desafio.botao}</button>
          <small className="aviso">{desafio.aviso}</small>
        </form>
        {erro && <p role="alert">{erro}</p>}
        <div className="resposta" role="status" aria-live="polite" aria-busy={analisando}>{resposta}</div>
        {avisoHistorico && <p role="alert">{avisoHistorico}</p>}
      </section>
    </main>
  );
}

"use client";

import { useState } from "react";

const TEXTOS = {
  titulo: "Meu Analisador",
  subtitulo: "Digite um texto abaixo e clique em Analisar.",
  botao: "Analisar",
};

export default function Home() {
  const [texto, setTexto] = useState("");
  const [resposta, setResposta] = useState("");

  function analisar() {
    setResposta(texto);
  }

  return (
    <main className="pagina">
      <section className="caixa">
        <h1>{TEXTOS.titulo}</h1>
        <p>{TEXTOS.subtitulo}</p>

        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Digite seu texto aqui..."
        />

        <button onClick={analisar}>{TEXTOS.botao}</button>

        <div className="resposta">
          {resposta}
        </div>
      </section>
    </main>
  );
}

import Link from "next/link";
import SiteHeader from "../../components/site-header";

export const metadata = {
  title: "Dicas para a primeira entrevista | Treino de entrevista",
  description: "Seis dicas práticas para se preparar para uma entrevista de jovem aprendiz.",
};

const dicas = [
  {
    titulo: "O que vestir",
    texto: "Escolha uma roupa limpa, confortável e adequada ao ambiente da empresa. Não precisa comprar roupa nova para a entrevista.",
  },
  {
    titulo: "Chegue um pouco antes",
    texto: "Planeje o trajeto para chegar de 10 a 15 minutos antes. Se acontecer um imprevisto, avise a empresa assim que puder.",
  },
  {
    titulo: "O que levar",
    texto: "Leve seu currículo, um documento com foto e uma caneta. Confira antes se a empresa pediu algum outro documento.",
  },
  {
    titulo: "Como se apresentar",
    texto: "Diga seu nome, o que estuda e o que gostaria de aprender. Você pode contar experiências da escola ou de projetos, mesmo sem ter trabalhado antes.",
  },
  {
    titulo: "O que perguntar no final",
    texto: "Pergunte: “Como é a rotina do jovem aprendiz?” ou “Quais são os próximos passos da seleção?”. É uma chance de conhecer melhor a vaga.",
  },
  {
    titulo: "O que fazer depois",
    texto: "Agradeça pela conversa e anote o que aprendeu. Acompanhe o canal combinado com a empresa e respeite o prazo informado para o retorno.",
  },
];

export default function Dicas() {
  return (
    <>
      <SiteHeader />
      <main className="pagina pagina-dicas">
        <section className="caixa">
          <span className="etiqueta">Seu primeiro emprego começa com preparo</span>
          <h1>6 dicas para sua primeira entrevista</h1>
          <p>Um pouco de preparo ajuda a chegar com mais confiança. Você não precisa saber tudo para começar.</p>
          <ol className="lista-dicas">
            {dicas.map(({ titulo, texto }, indice) => (
              <li className="cartao-dica" key={titulo}>
                <span className="numero-campo" aria-hidden="true">{String(indice + 1).padStart(2, "0")}</span>
                <h2>{titulo}</h2>
                <p>{texto}</p>
              </li>
            ))}
          </ol>
          <Link className="link-botao" href="/">Quero praticar minhas respostas</Link>
        </section>
      </main>
    </>
  );
}

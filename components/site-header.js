import Link from "next/link";
import SignOut from "./sign-out";

export default function SiteHeader({ email }) {
  return (
    <header className="topo">
      {email ? <span>{email}</span> : <Link href="/">Treino de entrevista</Link>}
      <nav className="topo-acoes" aria-label="Navegação do site">
        <Link href="/dicas">Dicas</Link>
        {email ? (
          <>
            <Link href="/historico">Meu histórico</Link>
            <SignOut />
          </>
        ) : <Link href="/">Ir para o treino</Link>}
      </nav>
    </header>
  );
}

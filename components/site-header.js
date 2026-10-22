import Link from "next/link";
import SignOut from "./sign-out";

export default function SiteHeader({ email }) {
  return (
    <header className="topo">
      <span>{email}</span>
      <nav className="topo-acoes" aria-label="Navegação da conta">
        <Link href="/historico">Meu histórico</Link>
        <SignOut />
      </nav>
    </header>
  );
}

import "./globals.css";

export const metadata = {
  title: "Analisador",
  description: "Projeto simples em Next.js",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <footer className="rodape">Feito por Maria Eduarda e Julia Mayumi · Do Zero ao Ar · Afesu Veleiros 2026</footer>
      </body>
    </html>
  );
}

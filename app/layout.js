import "./globals.css";

export const metadata = {
  title: "Analisador",
  description: "Projeto simples em Next.js",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

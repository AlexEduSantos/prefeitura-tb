import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Text editor",
  description: "Criado para testes de editor de texto",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} w-screen h-screen antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

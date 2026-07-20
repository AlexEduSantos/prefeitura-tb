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

import { Providers } from "@/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";
import Header from "@/components/public/header";

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
      <body className="h-screen flex flex-col w-full">
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}

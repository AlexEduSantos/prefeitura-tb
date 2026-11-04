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
import Script from "next/script";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} antialiased`}>
      <body className="h-svh flex flex-col">
        <Providers>{children}</Providers>
        <Toaster />
        <Script
          async
          defer
          data-website-id="2d337f2d-c590-4975-8e88-d27d7bebd0e1" // Cole o UUID gerado
          src="http://localhost:3002/script.js" // Aponte para o seu container
        />
      </body>
    </html>
  );
}

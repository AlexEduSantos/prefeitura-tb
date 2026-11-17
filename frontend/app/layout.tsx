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
  const umamiUrl = process.env.NEXT_PUBLIC_UMAMI_URL;
  const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  const umamiScriptSrc = umamiUrl
    ? umamiUrl.endsWith(".js")
      ? umamiUrl
      : `${umamiUrl.replace(/\/$/, "")}/script.js`
    : undefined;

  return (
    <html lang="pt-BR" className={`${inter.variable} antialiased`}>
      <body className="h-svh flex flex-col">
        <Providers>{children}</Providers>
        <Toaster />
        {umamiScriptSrc && umamiWebsiteId ? (
          <Script
            async
            defer
            data-website-id={umamiWebsiteId}
            src={umamiScriptSrc}
          />
        ) : null}
      </body>
    </html>
  );
}

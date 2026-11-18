import { Footer } from "@/components/public/footer";
import Header from "@/components/public/header";
import { VLibrasWidget } from "@/components/public/vlibras-widget";
import { Toaster } from "sonner";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <Footer />
      <VLibrasWidget />
      <Toaster />
    </div>
  );
}

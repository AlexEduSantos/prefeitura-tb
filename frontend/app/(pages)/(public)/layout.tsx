import { Footer } from "@/components/public/footer";
import Header from "@/components/public/header";
import { Toaster } from "sonner";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex flex-col h-screen">
      <main className="relative h-screen">
        <Header />
        {children}
        <Footer />
      </main>
      <Toaster />
    </main>
  );
}

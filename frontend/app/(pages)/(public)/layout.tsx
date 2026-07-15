import Header from "@/components/public/header";
import { Toaster } from "sonner";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="h-screen flex flex-col w-full">
      <main className="w-full">
        <Header />
        {children}
      </main>
      <Toaster />
    </main>
  );
}

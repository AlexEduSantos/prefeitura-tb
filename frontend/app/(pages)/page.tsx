"use client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  return (
    <div className="w-full flex items-center justify-center h-[calc(100vh-5rem)]">
      <Button
        className="px-4 py-2"
        onClick={() => {
          router.push("/administrator");
        }}
      >
        Painel Administrativo
      </Button>
    </div>
  );
}

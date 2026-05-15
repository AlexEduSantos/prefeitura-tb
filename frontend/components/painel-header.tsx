"use client";
import { Button } from "./ui/button";
import { Bell, ChevronLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "./ui/input";
import Image from "next/image";

export function PainelHeader({ title }: { title: string }) {
  const router = useRouter();

  const user = {
    name: "Usuário Teste",
    email: "[EMAIL_ADDRESS]",
    avatar: "/placeholder.svg",
  };

  return (
    <header className="w-full min-h-20 flex items-center justify-center border-b p-4 bg-card">
      <div className="flex items-center justify-between w-full gap-2">
        <div className="flex items-center gap-2">
          {title !== "Painel" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="p-0 w-auto h-auto"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
          )}
          <h2 className="text-2xl font-semibold">{title}</h2>
        </div>

        <div className="flex gap-2 items-center">
          <div className="relative hidden sm:block">
            <Input
              placeholder="Pesquisar..."
              className="min-w-80 rounded-full h-10 shadow-none"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full p-2 h-fit w-fit"
            >
              <Search className="w-6 h-6 text-muted-foreground" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-10 w-10 p-2 hidden sm:flex"
          >
            <Bell className="size-6 text-[#999999]" fill="#999999" />
          </Button>
          <div className="relative w-10 h-10 border rounded-full overflow-hidden p-1">
            <Image
              src={user?.avatar || "/placeholder.svg"}
              alt="Profile"
              fill
              className="rounded-full object-contain p-0.5"
            />
          </div>
        </div>
      </div>
    </header>
  );
}

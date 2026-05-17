"use client";
import { Button } from "./ui/button";
import { Bell, ChevronLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "./ui/input";
import Image from "next/image";
import { IUser } from "@/app/type/user";

export function PainelHeader({ title }: { title: string }) {
  const router = useRouter();

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
      </div>
    </header>
  );
}

"use client";
import { Button } from "./ui/button";
import { Bell, ChevronLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "./ui/input";
import Image from "next/image";
import { IUser } from "@/app/type/user";
import { useProfileViewModel } from "@/app/viewmodel/user.viewmodel";
import { format } from "date-fns";

interface PainelHeaderProps {
  title: string;
  mode?: "title" | "welcome";
}

export function PainelHeader({ title, mode = "title" }: PainelHeaderProps) {
  const router = useRouter();

  const { profile, isLoadingProfile, isErrorProfile } = useProfileViewModel();
  if (isLoadingProfile) return <>Carregando...</>;
  if (!profile || isErrorProfile) return <>Erro ao carregar perfil</>;

  return (
    <header className="w-full min-h-20 flex items-center justify-center border-b p-4 bg-card">
      <div className="flex items-center justify-between w-full gap-2">
        <div className="flex items-center gap-2">
          {mode === "title" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="p-0 w-auto h-auto"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
          )}

          {mode === "welcome" && (
            <div>
              <h2 className="text-2xl font-semibold">
                Seja bem vindo,{" "}
                <span className="text-primary">{profile.name}</span>
              </h2>
              <p className="text-muted-foreground text-sm">
                {format(new Date(), "d 'de' MMMM 'de' yyyy")}
              </p>
            </div>
          )}
          <h2 className="text-2xl font-semibold">{title}</h2>
        </div>
      </div>
    </header>
  );
}

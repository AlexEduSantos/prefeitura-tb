"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SettingsService } from "../service/settings.service";
import { ISiteSettings } from "../type/settings";

// Coloque a URL da sua API aqui
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function useSettings() {
  const [openModal, setOpenModal] = useState(false);
  const [formData, setFormData] = useState<Partial<ISiteSettings>>({});

  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery<ISiteSettings>({
    queryKey: ["site-settings"],
    queryFn: SettingsService.getSettings,
    staleTime: 1000 * 60 * 15, // 15 minutos de cache
  });

  // ✅ MÁGICA DO TAILWIND: Injeta as cores do banco no CSS Global
  useEffect(() => {
    if (settings) {
      const root = document.documentElement;
      // Converte o Hex (#1e3a8a) para o formato HSL ou RGB se necessário,
      // mas o CSS moderno aceita Hex direto em variáveis.
      // Aqui usamos as variáveis padrão do shadcn (--primary, --secondary)
      root.style.setProperty("--primary", settings.primaryColor);
      root.style.setProperty(
        "--primary-foreground",
        settings.primaryForegroundColor,
      );
      root.style.setProperty("--secondary", settings.secondaryColor);
      root.style.setProperty(
        "--secondary-foreground",
        settings.secondaryForegroundColor,
      );

      // Atualiza o título da aba do navegador
      document.title = settings.siteName;
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Partial<ISiteSettings>) =>
      SettingsService.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("Configurações salvas com sucesso!");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const setField = <K extends keyof ISiteSettings>(
    key: K,
    value: ISiteSettings[K],
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return {
    settings,
    isLoadingSettings: isLoading,
    updateSettings: updateSettingsMutation.mutate,
    isUpdating: updateSettingsMutation.isPending,
    openModal,
    setOpenModal,
    setField,
    formData,
    setFormData,
  };
}

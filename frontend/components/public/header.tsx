"use client";
import { Contrast, ZoomIn, ZoomOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function header() {
  const router = useRouter();

  return (
    <div className="w-screen">
      <div className="w-full flex items-center justify-center h-8 bg-primary text-primary-foreground">
        <div className="w-full max-w-7xl mx-auto px-4 flex items-center justify-between text-xs">
          <div className="flex gap-2 items-center">
            <p>Boletim Oficial</p>
            <span className="w-px h-4 bg-gray-300" />
            <p> Transparência</p>
            <span className="w-px h-4 bg-gray-300" />
            <p> Legislação</p>
            <span className="w-px h-4 bg-gray-300" />
            <p> Ouvidoria</p>
            <span className="w-px h-4 bg-gray-300" />
            <p> FUNPREV</p>
          </div>
          <div className="flex gap-2 items-center">
            <p>Youtube</p>
            <p>Facebook</p>
            <p>Instagram</p>
            <span className="w-px h-4 bg-gray-300" />
            <ZoomIn size={16} />
            <ZoomOut size={16} />
            <Contrast size={16} />
            <p>Acessibilidade</p>
          </div>
        </div>
      </div>
      <div className="w-full flex items-center justify-center h-36 bg-white shadow">
        <div className="w-full max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div
            className="w-1/2 cursor-pointer"
            onClick={() => router.push("/")}
          >
            <img src="/logo.png" alt="" />
          </div>
          <div className="w-1/2 flex gap-2 items-center justify-end-safe">
            <p>Prefeitura</p>
            <p>Serviços</p>
            <p>Servidores</p>
            <p>Notícias</p>
          </div>
        </div>
      </div>
    </div>
  );
}

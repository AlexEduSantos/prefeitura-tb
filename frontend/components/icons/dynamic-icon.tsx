"use client";

import { useEffect, useState } from "react";

interface DynamicIconProps extends React.HTMLAttributes<HTMLDivElement> {
  src: string; // Ex: "/icons/facebook.svg"
}

export default function DynamicIcon({
  src,
  className,
  ...props
}: DynamicIconProps) {
  const [svgContent, setSvgContent] = useState<string>("");

  useEffect(() => {
    // Busca o arquivo SVG diretamente da pasta public
    fetch(src)
      .then((res) => res.text())
      .then((data) => {
        // Remove os estilos fixos injetados pelo Adobe Illustrator (<style>...</style>)
        // e limpa atributos fixos para o Tailwind assumir o controle total
        const cleanSvg = data
          .replace(/<style.*?<\/style>/g, "")
          .replace(/class="[^"]*"/g, "")
          .replace(/fill="#[^"]*"/g, ""); // Remove preenchimentos de cor fixa originais

        setSvgContent(cleanSvg);
      })
      .catch((err) => console.error("Erro ao carregar o SVG:", err));
  }, [src]);

  if (!svgContent) {
    // Um esqueleto ou div vazia enquanto o SVG carrega
    return <div className={className} {...props} />;
  }

  return (
    <div
      className={className}
      {...props}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}

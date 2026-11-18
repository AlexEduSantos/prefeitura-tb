"use client";

import { useEffect, useState } from "react";
import { sanitizeSvg } from "@/lib/sanitize-html";

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
    let mounted = true;
    fetch(src)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Falha ao carregar SVG (${res.status})`);
        }
        return res.text();
      })
      .then((data) => {
        if (!mounted) return;
        const cleanSvg = sanitizeSvg(data);
        setSvgContent(cleanSvg);
      })
      .catch((err) => {
        if (mounted) {
          setSvgContent("");
          console.error("Erro ao carregar o SVG:", err);
        }
      });

    return () => {
      mounted = false;
    };
  }, [src]);

  if (!svgContent) {
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

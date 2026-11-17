"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    VLibras?: {
      Widget: new (url: string) => void;
    };
  }
}

export function VLibrasWidget() {
  useEffect(() => {
    const scriptId = "vlibras-plugin-script";
    const initWidget = () => {
      if (typeof window !== "undefined" && window.VLibras?.Widget) {
        new window.VLibras.Widget("https://vlibras.gov.br/app");
      }
    };

    if (document.getElementById(scriptId)) {
      initWidget();
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://vlibras.gov.br/app/vlibras-plugin.js";
    script.async = true;
    script.onload = initWidget;
    document.body.appendChild(script);
  }, []);

  return (
    <div {...({ vw: "true" } as any)} className="enabled">
      <div {...({ "vw-access-button": "true" } as any)} className="active" />
      <div {...({ "vw-plugin-wrapper": "true" } as any)}>
        <div className="vw-plugin-top-wrapper" />
      </div>
    </div>
  );
}

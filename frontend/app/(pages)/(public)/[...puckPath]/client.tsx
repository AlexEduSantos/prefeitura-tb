"use client";

import { Render } from "@puckeditor/core";
import { config } from "@/puck.config";

export function ClientPage({ content }: { content: any }) {
  return <Render config={config} data={content} />;
}

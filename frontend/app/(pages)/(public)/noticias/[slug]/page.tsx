"use client";

import ArticleViewer from "@/components/public/article";
import { useParams } from "next/navigation";

export default function ArticlePage() {
  const params = useParams();
  const slug = params.slug as string;

  return <ArticleViewer slug={slug} />;
}

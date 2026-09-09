"use client";
import { useStories } from "@/app/viewmodel/stories.viewmodel";
import { StoriesViewer } from "@/components/stories-viewer";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function TestPage() {
  const [open, setOpen] = useState(false);
  const { storiesQuery, isLoadingStories } = useStories();

  if (isLoadingStories) return <p>Carregando...</p>;

  const stories = storiesQuery.data;

  return (
    <div className="w-full h-full flex items-center justify-center">
      <Button onClick={() => setOpen(true)}>Teste de Destaque</Button>
      {stories && (
        <StoriesViewer
          stories={stories[0]}
          open={open}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

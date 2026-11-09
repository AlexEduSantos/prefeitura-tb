"use client";
import { IStories } from "@/app/type/stories";
import { useStories } from "@/app/viewmodel/stories.viewmodel";
import Image from "next/image";
import { StoriesViewer } from "../stories-viewer";
import { useState } from "react";
import { BlockHeader } from "./block-header";
import { Skeleton } from "../ui/skeleton";

export default function StoriesBlock() {
  const [viewingStory, setViewingStory] = useState<IStories | null>(null);
  const [openModel, setOpenModel] = useState(false);

  const { storiesQuery: stories, isLoadingStories } = useStories();

  const imageLoader = (src: string) => {
    return `${process.env.NEXT_PUBLIC_API_URL}/media/file/${src}`;
  };

  if (isLoadingStories) return <Skeleton className="w-full min-h-20" />;

  if (!stories || stories.data.length === 0) return <></>;

  return (
    <section className="w-full max-w-7xl mx-auto px-2 xl:px-0">
      <BlockHeader title="destaques" route="#" button="" />
      <div className="w-full flex gap-8 items-center justify-start">
        {stories?.data.map((story: IStories) => (
          <div
            key={story.id}
            className="relative group cursor-pointer"
            onClick={() => {
              setViewingStory(story);
              setOpenModel(true);
            }}
          >
            <div className="w-16 h-16 sm:w-24 sm:h-24 transition-all duration-200 bg-white rounded-full border-4 border-background ring-2 ring-primary relative overflow-hidden">
              <Image
                loader={() => imageLoader(story.cover.key)}
                src={story.cover.key}
                alt={story.title}
                fill
                className="object-cover object-top"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
            <p className="text-center text-xs w-full max-w-20 line-clamp-2 mt-1 text-primary">
              {story.title}
            </p>
          </div>
        ))}
      </div>
      <StoriesViewer
        stories={viewingStory}
        open={openModel}
        onClose={() => setOpenModel(false)}
      />
    </section>
  );
}

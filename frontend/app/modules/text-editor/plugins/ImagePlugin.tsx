// plugins/ImagePlugin.tsx
"use client";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  COMMAND_PRIORITY_EDITOR,
  LexicalCommand,
  createCommand,
} from "lexical";
import { JSX, useEffect, useState } from "react";
import { $createImageNode, ImageNode } from "../nodes/ImageNode";
import { $insertNodeToNearestRoot } from "@lexical/utils";
import { MediaPickerModal } from "@/components/media-picker-modal";
import { IMedia } from "@/app/type/media";

// O comando não precisa mais receber um payload de imagem completo,
// ele só serve para "abrir o modal".
export const INSERT_IMAGE_COMMAND: LexicalCommand<void> = createCommand(
  "INSERT_IMAGE_COMMAND",
);

export default function ImagePlugin(): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!editor.hasNodes([ImageNode])) {
      throw new Error("ImagePlugin: ImageNode não está registrado no editor.");
    }

    return editor.registerCommand(
      INSERT_IMAGE_COMMAND,
      () => {
        setIsModalOpen(true); // Abre o modal
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  const handleSelectMedia = (media: IMedia | IMedia[]) => {
    // Como configuramos para seleção única, garantimos que é um IMedia
    const selected = Array.isArray(media) ? media[0] : media;
    if (!selected) return;

    const imageUrl = `${process.env.NEXT_PUBLIC_API_URL}/media/file/${selected.key}`;

    editor.update(() => {
      const imageNode = $createImageNode({
        src: imageUrl,
        alt: selected.altText || selected.title || "",
        title: selected.title || "",
        description: selected.description || "",
        width: "100%", // Padrão
        height: "auto",
        position: "block", // Padrão
      });
      $insertNodeToNearestRoot(imageNode);
    });

    setIsModalOpen(false);
  };

  return (
    <MediaPickerModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      onSelect={handleSelectMedia}
      multiple={false}
    />
  );
}

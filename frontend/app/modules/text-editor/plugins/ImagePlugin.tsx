"use client";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  COMMAND_PRIORITY_EDITOR,
  LexicalCommand,
  createCommand,
} from "lexical";
import { useEffect } from "react";
import { $createImageNode, ImageNode, ImagePayload } from "../nodes/ImageNode";
import { $insertNodeToNearestRoot } from "@lexical/utils";

/**
 * Comando Lexical para inserção de imagens.
 * Deve ser importado tanto pelo plugin quanto pela toolbar.
 */
export const INSERT_IMAGE_COMMAND: LexicalCommand<ImagePayload> = createCommand(
  "INSERT_IMAGE_COMMAND",
);

/**
 * Plugin que registra o INSERT_IMAGE_COMMAND e insere um ImageNode
 * na posição mais próxima da raiz ao receber o comando.
 */
export default function ImagePlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([ImageNode])) {
      throw new Error(
        "ImagePlugin: ImageNode não está registrado no editor. Adicione-o ao array `nodes`.",
      );
    }

    return editor.registerCommand(
      INSERT_IMAGE_COMMAND,
      (payload: ImagePayload) => {
        const imageNode = $createImageNode(payload);
        $insertNodeToNearestRoot(imageNode);
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}

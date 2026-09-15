"use client";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";

// Defina as classes de estilização (Tailwind) para a formatação do texto
const theme = {
  paragraph: "mb-4 text-base leading-relaxed text-gray-800",
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
    underlineStrikethrough: "underline line-through",
  },
};

interface LexicalViewerProps {
  content: string | object;
}

export function LexicalViewer({ content }: LexicalViewerProps) {
  // Converte para string caso o conteúdo venha como objeto JSON do banco
  const jsonString =
    typeof content === "object" ? JSON.stringify(content) : content;

  const initialConfig = {
    namespace: "LexicalViewer",
    theme,
    editable: false, // Trava o editor em modo de leitura
    editorState: jsonString,
    onError: (error: Error) => {
      console.error("Erro ao carregar o conteúdo do Lexical:", error);
    },
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <RichTextPlugin
        contentEditable={
          <ContentEditable
            className="outline-none focus:outline-none"
            aria-readonly="true"
          />
        }
        placeholder={null}
        ErrorBoundary={LexicalErrorBoundary}
      />
    </LexicalComposer>
  );
}

"use client";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin";
import { TableNode, TableCellNode, TableRowNode } from "@lexical/table";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { ExtendedTableNode } from "@/app/modules/text-editor/nodes/ExtendedTableNode";
import { CollapsibleContainerNode } from "@/app/modules/text-editor/nodes/collapsible/CollapsibleContainerNode";
import { CollapsibleTitleNode } from "@/app/modules/text-editor/nodes/collapsible/CollapsibleTitleNode";
import { CollapsibleContentNode } from "@/app/modules/text-editor/nodes/collapsible/CollapsibleContentNode";
import CollapsiblePlugin from "@/app/modules/text-editor/plugins/CollapsiblePlugin";
import { ImageNode } from "@/app/modules/text-editor/nodes/ImageNode";

// Defina as classes de estilização (Tailwind) para a formatação do texto
const theme = {
  heading: {
    h1: "mb-3 text-3xl font-bold text-foreground",
    h2: "mb-2 text-2xl font-bold text-foreground",
    h3: "mb-2 text-xl font-semibold text-foreground",
  },
  paragraph: "mb-4 text-base leading-relaxed text-foreground/90",
  quote:
    "my-4 border-l-4 border-primary pl-4 italic text-muted-foreground bg-muted/30 py-2 rounded-r",
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
    underlineStrikethrough: "underline line-through",
    subscript: "align-sub text-[0.8em]",
    superscript: "align-super text-[0.8em]",
  },
  link: "text-primary hover:underline cursor-pointer",
  list: {
    ul: "list-disc pl-6 my-2 space-y-1",
    ol: "list-decimal pl-6 my-2 space-y-1",
    listitem: "my-0.5",
    nested: { listitem: "list-none" },
  },
  table:
    "border-collapse border border-border my-4 w-full table-fixed break-words",
  tableCell:
    "border border-border p-2 min-w-[75px] align-top overflow-wrap-anywhere",
  tableCellHeader: "bg-muted font-bold text-left",
};

const viewerNodes = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  LinkNode,
  AutoLinkNode,
  HorizontalRuleNode,
  ExtendedTableNode,
  {
    replace: TableNode,
    withKlass: ExtendedTableNode,
    with: (node: TableNode) => {
      const extendedNode = new ExtendedTableNode();
      extendedNode.setColWidths(node.getColWidths());
      extendedNode.append(...node.getChildren());
      return extendedNode;
    },
  },
  TableCellNode,
  TableRowNode,
  CollapsibleContainerNode,
  CollapsibleTitleNode,
  CollapsibleContentNode,
  ImageNode,
];

interface LexicalViewerProps {
  content: string | object;
}

export function LexicalViewer({ content }: LexicalViewerProps) {
  // Prepara o JSON do estado do Lexical
  let editorState: string | undefined = undefined;

  if (content) {
    if (typeof content === "object") {
      editorState = JSON.stringify(content);
    } else if (typeof content === "string" && content.trim().length > 0) {
      try {
        // Testa se é um JSON válido
        JSON.parse(content);
        editorState = content;
      } catch (e) {
        console.warn("Conteúdo do Lexical não é um JSON válido:", e);
      }
    }
  }

  const initialConfig = {
    namespace: "LexicalViewer",
    theme,
    editable: false, // Trava o editor em modo de leitura
    nodes: viewerNodes,
    editorState,
    onError: (error: Error) => {
      console.error("Erro ao carregar o conteúdo do Lexical:", error);
    },
  };

  if (!editorState) {
    return null;
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <RichTextPlugin
        contentEditable={
          <ContentEditable
            className="outline-none focus:outline-none article-lexical-body"
            aria-readonly="true"
          />
        }
        placeholder={null}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <ListPlugin />
      <TablePlugin />
      <CollapsiblePlugin />
      <HorizontalRulePlugin />
    </LexicalComposer>
  );
}

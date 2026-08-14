import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useEffect } from "react";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ToolbarPlugin } from "./toolbar";
import { defineExtension } from "lexical";
import { RichTextExtension } from "@lexical/rich-text";
import { HistoryExtension } from "@lexical/history";
import { TabIndentationExtension } from "@lexical/extension";
import { LexicalExtensionComposer } from "@lexical/react/LexicalExtensionComposer";
import { LinkExtension } from "@lexical/link";
import { PlaygroundAutoLinkExtension } from "../plugins/AutoLinkExtension";
import FloatingLinkEditorPlugin from "../plugins/FloatingLinkEditorPlugin";
import FloatingTextFormatToolbarPlugin from "../plugins/FloatingTextFormatToolbarPlugin";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin";
import { TableNode, TableCellNode, TableRowNode } from "@lexical/table";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import TableActionMenuPlugin from "../plugins/TableActionMenuPlugin";
import { ExtendedTableNode } from "../nodes/ExtendedTableNode";
import { CollapsibleContainerNode } from "../nodes/collapsible/CollapsibleContainerNode";
import { CollapsibleTitleNode } from "../nodes/collapsible/CollapsibleTitleNode";
import { CollapsibleContentNode } from "../nodes/collapsible/CollapsibleContentNode";
import CollapsiblePlugin from "../plugins/CollapsiblePlugin";
import { ClearEditorPlugin } from "@lexical/react/LexicalClearEditorPlugin";
import { ListNode, ListItemNode } from "@lexical/list";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { ImageNode } from "../nodes/ImageNode";
import ImagePlugin from "../plugins/ImagePlugin";

function onError(error: Error) {
  console.error(error);
}

function InitialStatePlugin({ state }: { state?: string }) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    if (state) {
      try {
        const parsedState = editor.parseEditorState(state);
        editor.setEditorState(parsedState);
      } catch (e) {
        console.error("Error setting initial editor state:", e);
      }
    }
  }, [editor, state]);
  return null;
}

const theme = {
  heading: {
    h1: "mb-2 text-3xl font-bold",
    h2: "mb-2 text-2xl font-bold",
    h3: "mb-1 text-xl font-semibold",
  },
  paragraph: "my-0",
  quote:
    "my-2 border-l-4 [border-left-style:solid] border-accent pl-4 italic text-accent-foreground",
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
    subscript: "align-sub text-[0.8em]",
    superscript: "align-super text-[0.8em]",
  },
  link: "text-primary hover:underline cursor-pointer",
  list: {
    ul: "list-disc pl-6 my-1",
    ol: "list-decimal pl-6 my-1",
    listitem: "my-0.5",
    nested: { listitem: "list-none" },
  },
  table:
    "border-collapse border border-border my-4 w-full table-fixed break-words",
  tableCell:
    "border border-border p-2 min-w-[75px] align-top overflow-wrap-anywhere",
  tableCellHeader: "bg-muted font-bold text-left",
};

const landingHeroExtension = defineExtension({
  dependencies: [
    RichTextExtension,
    HistoryExtension,
    TabIndentationExtension,
    LinkExtension,
    PlaygroundAutoLinkExtension,
  ],
  nodes: [
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
    ListNode,
    ListItemNode,
    ImageNode,
  ],
  name: "@lexical/website/landing-hero-editor",
  namespace: "@lexical/website/landing-hero-editor",
  theme,
});

export function Editor({ onChange, initialValue }: { onChange?: (state: string) => void; initialValue?: string }) {
  return (
    <LexicalExtensionComposer
      extension={landingHeroExtension}
      contentEditable={null}
    >
      <div className=" p-2 w-full h-full border border-border rounded-lg bg-card">
        <ToolbarPlugin />
        <ContentEditable
          aria-placeholder="Enter some text"
          placeholder={<></>}
          className="min-h-[300px] sm:max-h-[80vh] overflow-y-auto p-4 text-base leading-relaxed text-wrap outline-none"
        />
        <TablePlugin hasCellMerge={true} hasCellBackgroundColor={true} />
        <TableActionMenuPlugin />
        <FloatingLinkEditorPlugin />
        <FloatingTextFormatToolbarPlugin />
        <CollapsiblePlugin />
        <ClearEditorPlugin />
        <HorizontalRulePlugin />
        <ListPlugin />
        <ImagePlugin />
        <InitialStatePlugin state={initialValue} />

        {onChange && (
          <OnChangePlugin
            onChange={(editorState) => {
              onChange(JSON.stringify(editorState.toJSON()));
            }}
          />
        )}
      </div>
    </LexicalExtensionComposer>
  );
}

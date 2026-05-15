import {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  ElementNode,
  LexicalEditor,
  LexicalNode,
  SerializedElementNode,
  RangeSelection,
} from "lexical";
import { $isCollapsibleContainerNode } from "./CollapsibleContainerNode";
import { $isCollapsibleContentNode } from "./CollapsibleContentNode";

type SerializedCollapsibleTitleNode = SerializedElementNode;

export class CollapsibleTitleNode extends ElementNode {
  static getType(): string {
    return "collapsible-title";
  }

  static clone(node: CollapsibleTitleNode): CollapsibleTitleNode {
    return new CollapsibleTitleNode(node.__key);
  }

  createDOM(config: EditorConfig, editor: LexicalEditor): HTMLElement {
    const dom = document.createElement("summary");
    dom.classList.add(
      "px-4",
      "py-3",
      "font-semibold",
      "cursor-pointer",
      "hover:bg-muted/50",
      "transition-colors",
      "outline-none",
      "focus-visible:ring-2",
      "focus-visible:ring-ring"
    );

    return dom;
  }

  updateDOM(prevNode: CollapsibleTitleNode, dom: HTMLElement): boolean {
    return false;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      summary: (domNode: HTMLElement) => {
        return {
          conversion: $convertSummaryElement,
          priority: 1,
        };
      },
    };
  }

  static importJSON(
    serializedNode: SerializedCollapsibleTitleNode
  ): CollapsibleTitleNode {
    return $createCollapsibleTitleNode();
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("summary");
    return { element };
  }

  exportJSON(): SerializedCollapsibleTitleNode {
    return {
      ...super.exportJSON(),
      type: "collapsible-title",
      version: 1,
    };
  }

  collapseAtStart(): boolean {
    this.getParentOrThrow().insertBefore(this);
    return true;
  }

  insertNewAfter(_: RangeSelection, restoreSelection?: boolean): LexicalNode | null {
    const containerNode = this.getParentOrThrow();
    if (!$isCollapsibleContainerNode(containerNode)) {
      throw new Error(
        "CollapsibleTitleNode expects to be child of CollapsibleContainerNode"
      );
    }
    if (containerNode.getOpen()) {
      const contentNode = this.getNextSibling();
      if (!$isCollapsibleContentNode(contentNode)) {
        throw new Error(
          "CollapsibleTitleNode expects to have CollapsibleContentNode sibling"
        );
      }
      const firstChild = contentNode.getFirstChild();
      if (firstChild === null) {
        contentNode.append(); // create empty text node? No, append paragraph
      }
      // Return a new node to focus, let Lexical handle it by default
      return contentNode;
    }
    return super.insertNewAfter(_, restoreSelection);
  }
}

export function $createCollapsibleTitleNode(): CollapsibleTitleNode {
  return new CollapsibleTitleNode();
}

export function $isCollapsibleTitleNode(
  node: LexicalNode | null | undefined
): node is CollapsibleTitleNode {
  return node instanceof CollapsibleTitleNode;
}

function $convertSummaryElement(
  domNode: HTMLElement
): DOMConversionOutput | null {
  const node = $createCollapsibleTitleNode();
  return {
    node,
  };
}

import { TableNode, SerializedTableNode } from "@lexical/table";
import { DOMConversionMap, DOMExportOutput, EditorConfig, LexicalEditor, NodeKey, SerializedElementNode, Spread } from "lexical";

export type SerializedExtendedTableNode = Spread<
  {
    borderColor?: string;
    borderWidth?: string;
    borderStyle?: string;
  },
  SerializedTableNode
>;

export class ExtendedTableNode extends TableNode {
  __borderColor?: string;
  __borderWidth?: string;
  __borderStyle?: string;

  static getType() {
    return "extended-table";
  }

  static clone(node: ExtendedTableNode): ExtendedTableNode {
    return new ExtendedTableNode(node.__key);
  }

  constructor(key?: NodeKey) {
    super(key);
  }

  getBorderColor(): string | undefined {
    return this.__borderColor;
  }

  setBorderColor(color: string): this {
    const writable = this.getWritable();
    writable.__borderColor = color;
    return writable;
  }

  getBorderWidth(): string | undefined {
    return this.__borderWidth;
  }

  setBorderWidth(width: string): this {
    const writable = this.getWritable();
    writable.__borderWidth = width;
    return writable;
  }

  getBorderStyle(): string | undefined {
    return this.__borderStyle;
  }

  setBorderStyle(style: string): this {
    const writable = this.getWritable();
    writable.__borderStyle = style;
    return writable;
  }

  createDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement {
    const dom = super.createDOM(config, editor);
    
    if (this.__borderColor) {
      dom.style.borderColor = this.__borderColor;
    }
    if (this.__borderWidth) {
      dom.style.borderWidth = this.__borderWidth;
    }
    if (this.__borderStyle) {
      dom.style.borderStyle = this.__borderStyle;
    }
    
    // As the table inherits border styles to its cells, we can use CSS variables
    // or rely on CSS inheritance if set. For table borders specifically,
    // we set it directly on the table wrapper or element.
    // Lexical table DOM is a `table`.
    dom.style.borderCollapse = "collapse";
    
    return dom;
  }

  updateDOM(prevNode: ExtendedTableNode, dom: HTMLElement, config: EditorConfig): boolean {
    super.updateDOM(prevNode as any, dom, config);
    
    if (this.__borderColor !== prevNode.__borderColor) {
      dom.style.borderColor = this.__borderColor || "";
    }
    if (this.__borderWidth !== prevNode.__borderWidth) {
      dom.style.borderWidth = this.__borderWidth || "";
    }
    if (this.__borderStyle !== prevNode.__borderStyle) {
      dom.style.borderStyle = this.__borderStyle || "";
    }

    return false;
  }

  exportJSON(): SerializedExtendedTableNode {
    return {
      ...super.exportJSON(),
      borderColor: this.__borderColor,
      borderWidth: this.__borderWidth,
      borderStyle: this.__borderStyle,
      type: "extended-table",
    };
  }

  static importJSON(serializedNode: SerializedExtendedTableNode): ExtendedTableNode {
    const node = TableNode.importJSON(serializedNode) as unknown as ExtendedTableNode;
    // Lexical importJSON creates a standard TableNode because of how super.importJSON works
    // We need to instantiate ExtendedTableNode and copy properties
    const extendedNode = $createExtendedTableNode();
    extendedNode.setColWidths(serializedNode.colWidths);
    extendedNode.setFormat(serializedNode.format);
    extendedNode.setIndent(serializedNode.indent);
    extendedNode.setDirection(serializedNode.direction);
    
    if (serializedNode.borderColor) extendedNode.setBorderColor(serializedNode.borderColor);
    if (serializedNode.borderWidth) extendedNode.setBorderWidth(serializedNode.borderWidth);
    if (serializedNode.borderStyle) extendedNode.setBorderStyle(serializedNode.borderStyle);
    
    return extendedNode;
  }
}

export function $createExtendedTableNode(): ExtendedTableNode {
  return new ExtendedTableNode();
}

export function $isExtendedTableNode(node: any): node is ExtendedTableNode {
  return node instanceof ExtendedTableNode;
}

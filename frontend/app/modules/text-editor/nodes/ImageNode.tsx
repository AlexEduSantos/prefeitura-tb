"use client";

import {
  DecoratorNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
  LexicalNode,
  DOMExportOutput,
  $getNodeByKey,
} from "lexical";
import { JSX, useState, useRef, useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize2,
  Trash2,
} from "lucide-react";

// --- Tipos ---

export type ImagePosition = "block" | "left" | "right" | "center";

export type SerializedImageNode = Spread<
  {
    src: string;
    alt: string;
    title: string;
    description: string;
    width: string;
    height: string;
    position: ImagePosition;
  },
  SerializedLexicalNode
>;

export type ImagePayload = {
  src: string;
  alt: string;
  title: string;
  description: string;
  width: string;
  height: string;
  position: ImagePosition;
};

// --- Componente React renderizado dentro do editor e no visualizador ---

interface ImageComponentProps {
  nodeKey: NodeKey;
  src: string;
  alt: string;
  title: string;
  description: string;
  width: string;
  height: string;
  position: ImagePosition;
}

function ImageComponent({
  nodeKey,
  src,
  alt,
  title,
  description,
  width,
  height,
  position,
}: ImageComponentProps) {
  const [editor] = useLexicalComposerContext();
  const isEditable = editor.isEditable();
  const [isSelected, setIsSelected] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fecha seleção ao clicar fora da imagem
  useEffect(() => {
    if (!isEditable) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsSelected(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isEditable]);

  // Tecla Delete / Backspace para excluir a imagem selecionada
  useEffect(() => {
    if (!isEditable || !isSelected) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Backspace" || e.key === "Delete") {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag === "input" || activeTag === "textarea") return;
        e.preventDefault();
        editor.update(() => {
          const node = $getNodeByKey(nodeKey);
          if ($isImageNode(node)) {
            node.remove();
          }
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditable, isSelected, editor, nodeKey]);

  const updatePosition = (newPos: ImagePosition) => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isImageNode(node)) {
        node.setPosition(newPos);
        if (newPos === "block") {
          node.setWidth("100%");
        } else if (node.getWidth() === "100%") {
          node.setWidth(newPos === "center" ? "60%" : "45%");
        }
      }
    });
  };

  const updateWidth = (newWidth: string) => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isImageNode(node)) {
        node.setWidth(newWidth);
      }
    });
  };

  const deleteNode = () => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isImageNode(node)) {
        node.remove();
      }
    });
  };

  // Modo somente leitura (Visualizador público LexicalViewer)
  if (!isEditable) {
    return (
      <figure style={{ margin: 0, padding: 0 }} className="w-full">
        <img
          src={src}
          alt={alt}
          style={{
            width: "100%",
            height: height || "auto",
            display: "block",
            objectFit: "cover",
          }}
          className="rounded-lg shadow-xs"
          draggable={false}
        />
        {(title || description) && (
          <figcaption
            style={{
              fontSize: "0.85rem",
              color: "var(--muted-foreground)",
              padding: "0.4rem 0.25rem 0",
              lineHeight: 1.4,
              textAlign: position === "center" ? "center" : "left",
            }}
          >
            {title && (
              <strong className="font-medium text-foreground/85">
                {title}
              </strong>
            )}
            {title && description && " — "}
            {description}
          </figcaption>
        )}
      </figure>
    );
  }

  // Modo de edição no painel
  return (
    <div
      ref={containerRef}
      className={`relative inline-block w-full group rounded-lg transition-all ${
        isSelected
          ? "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-md"
          : "hover:ring-1 hover:ring-primary/40 cursor-pointer"
      }`}
      onClick={(e) => {
        e.stopPropagation();
        setIsSelected(true);
      }}
    >
      {/* Barra de Ferramentas de Posicionamento e Tamanho */}
      {isSelected && (
        <div
          className="absolute -top-11 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 bg-popover/95 backdrop-blur-md text-popover-foreground border border-border shadow-xl rounded-lg px-2 py-1 select-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Botões de Alinhamento / Posição */}
          <button
            type="button"
            title="Flutuar à Esquerda"
            onClick={() => updatePosition("left")}
            className={`p-1.5 rounded transition-colors ${
              position === "left"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <AlignLeft size={16} />
          </button>
          <button
            type="button"
            title="Centralizar"
            onClick={() => updatePosition("center")}
            className={`p-1.5 rounded transition-colors ${
              position === "center"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <AlignCenter size={16} />
          </button>
          <button
            type="button"
            title="Flutuar à Direita"
            onClick={() => updatePosition("right")}
            className={`p-1.5 rounded transition-colors ${
              position === "right"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <AlignRight size={16} />
          </button>
          <button
            type="button"
            title="Largura Total (Bloco)"
            onClick={() => updatePosition("block")}
            className={`p-1.5 rounded transition-colors ${
              position === "block"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <Maximize2 size={16} />
          </button>

          <div className="w-px h-4 bg-border mx-1" />

          {/* Atalhos Rápidos de Largura */}
          {(["25%", "50%", "75%", "100%"] as const).map((w) => (
            <button
              key={w}
              type="button"
              title={`Largura ${w}`}
              onClick={() => updateWidth(w)}
              className={`px-1.5 py-0.5 text-xs font-medium rounded transition-colors ${
                width === w
                  ? "bg-primary text-primary-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {w}
            </button>
          ))}

          <div className="w-px h-4 bg-border mx-1" />

          {/* Excluir Imagem */}
          <button
            type="button"
            title="Remover imagem"
            onClick={deleteNode}
            className="p-1.5 rounded text-muted-foreground hover:bg-destructive/15 hover:text-destructive transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}

      {/* Tag de Imagem */}
      <figure style={{ margin: 0, padding: 0 }} className="w-full">
        <img
          src={src}
          alt={alt}
          style={{
            width: "100%",
            height: height || "auto",
            display: "block",
            objectFit: "cover",
          }}
          className="rounded-md pointer-events-none"
          draggable={false}
        />
        {(title || description) && (
          <figcaption
            style={{
              fontSize: "0.8rem",
              color: "var(--muted-foreground)",
              padding: "0.35rem 0.25rem 0",
              lineHeight: 1.4,
              textAlign: position === "center" ? "center" : "left",
            }}
          >
            {title && <strong>{title}</strong>}
            {title && description && " — "}
            {description}
          </figcaption>
        )}
      </figure>
    </div>
  );
}

// --- Nó Lexical ---

/**
 * ImageNode: DecoratorNode customizado para inserção de imagens no editor.
 * Suporta 4 modos de posicionamento: bloco, float esquerda, float direita e centralizado.
 */
export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __alt: string;
  __title: string;
  __description: string;
  __width: string;
  __height: string;
  __position: ImagePosition;

  static getType(): string {
    return "image";
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__alt,
      node.__title,
      node.__description,
      node.__width,
      node.__height,
      node.__position,
      node.__key,
    );
  }

  constructor(
    src: string,
    alt: string,
    title: string,
    description: string,
    width: string,
    height: string,
    position: ImagePosition,
    key?: NodeKey,
  ) {
    super(key);
    this.__src = src;
    this.__alt = alt;
    this.__title = title;
    this.__description = description;
    this.__width = width;
    this.__height = height;
    this.__position = position;
  }

  // --- Mutadores ---

  setPosition(position: ImagePosition): void {
    const writable = this.getWritable();
    writable.__position = position;
  }

  setWidth(width: string): void {
    const writable = this.getWritable();
    writable.__width = width;
  }

  setHeight(height: string): void {
    const writable = this.getWritable();
    writable.__height = height;
  }

  setTitle(title: string): void {
    const writable = this.getWritable();
    writable.__title = title;
  }

  setAlt(alt: string): void {
    const writable = this.getWritable();
    writable.__alt = alt;
  }

  setSrc(src: string): void {
    const writable = this.getWritable();
    writable.__src = src;
  }

  // --- Getters ---

  getPosition(): ImagePosition {
    return this.__position;
  }

  getWidth(): string {
    return this.__width;
  }

  getHeight(): string {
    return this.__height;
  }

  getTitle(): string {
    return this.__title;
  }

  getAlt(): string {
    return this.__alt;
  }

  getSrc(): string {
    return this.__src;
  }

  /** Aplica classe de posicionamento E largura como estilo inline no wrapper. */
  private _applyStyles(dom: HTMLElement): void {
    dom.className = `lexical-image-wrapper lexical-image-${this.__position}`;
    dom.style.width = this.__width;
    if (this.__position === "center") {
      dom.style.marginLeft = "auto";
      dom.style.marginRight = "auto";
      dom.style.display = "block";
      dom.style.clear = "both";
    } else if (this.__position === "block") {
      dom.style.marginLeft = "auto";
      dom.style.marginRight = "auto";
      dom.style.display = "block";
      dom.style.clear = "both";
    } else {
      dom.style.marginLeft = "";
      dom.style.marginRight = "";
      dom.style.display = "";
      dom.style.clear = "";
    }
  }

  /** Cria o elemento DOM container da imagem. */
  createDOM(): HTMLElement {
    const div = document.createElement("div");
    this._applyStyles(div);
    return div;
  }

  /** Atualiza o container quando posição ou largura mudam. */
  updateDOM(prevNode: ImageNode, dom: HTMLElement): boolean {
    if (
      prevNode.__position !== this.__position ||
      prevNode.__width !== this.__width
    ) {
      this._applyStyles(dom);
    }
    return false;
  }

  /** Exporta para HTML. */
  exportDOM(): DOMExportOutput {
    const wrapper = document.createElement("div");
    this._applyStyles(wrapper);
    const img = document.createElement("img");
    img.setAttribute("src", this.__src);
    img.setAttribute("alt", this.__alt);
    img.style.width = "100%";
    img.style.height = this.__height || "auto";
    wrapper.appendChild(img);
    if (this.__title || this.__description) {
      const caption = document.createElement("figcaption");
      caption.textContent = [this.__title, this.__description]
        .filter(Boolean)
        .join(" — ");
      wrapper.appendChild(caption);
    }
    return { element: wrapper };
  }

  /** Serializa para JSON (persistência). */
  exportJSON(): SerializedImageNode {
    return {
      type: "image",
      version: 1,
      src: this.__src,
      alt: this.__alt,
      title: this.__title,
      description: this.__description,
      width: this.__width,
      height: this.__height,
      position: this.__position,
    };
  }

  /** Desserializa do JSON salvo. */
  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    return $createImageNode({
      src: serializedNode.src,
      alt: serializedNode.alt,
      title: serializedNode.title ?? "",
      description: serializedNode.description ?? "",
      width: serializedNode.width,
      height: serializedNode.height ?? "",
      position: serializedNode.position,
    });
  }

  /** Nó de bloco — não é inline. */
  isInline(): boolean {
    return false;
  }

  /** Renderiza o componente React dentro do DOM do editor. */
  decorate(): JSX.Element {
    return (
      <ImageComponent
        nodeKey={this.__key}
        src={this.__src}
        alt={this.__alt}
        title={this.__title}
        description={this.__description}
        width={this.__width}
        height={this.__height}
        position={this.__position}
      />
    );
  }
}

// --- Funções auxiliares ---

export function $createImageNode(payload: ImagePayload): ImageNode {
  return new ImageNode(
    payload.src,
    payload.alt,
    payload.title,
    payload.description,
    payload.width,
    payload.height,
    payload.position,
  );
}

export function $isImageNode(
  node: LexicalNode | null | undefined,
): node is ImageNode {
  return node instanceof ImageNode;
}

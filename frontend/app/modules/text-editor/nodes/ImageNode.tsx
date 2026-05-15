"use client";
import {
  DecoratorNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
  LexicalNode,
  DOMExportOutput,
} from "lexical";
import { JSX } from "react";

// --- Tipos ---

export type ImagePosition = "block" | "left" | "right";

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

// --- Componente React renderizado dentro do editor ---

function ImageComponent({
  src,
  alt,
  title,
  description,
  height,
}: {
  src: string;
  alt: string;
  title: string;
  description: string;
  height: string;
}) {
  return (
    <figure style={{ margin: 0, padding: 0 }}>
      <img
        src={src}
        alt={alt}
        style={{
          width: "100%",            // ocupa 100% do wrapper, que tem o tamanho correto
          height: height || "auto",
          display: "block",
          objectFit: "cover",
        }}
        draggable={false}
      />
      {(title || description) && (
        <figcaption
          style={{
            fontSize: "0.8rem",
            color: "var(--muted-foreground)",
            padding: "0.3rem 0.25rem 0",
            lineHeight: 1.4,
          }}
        >
          {title && <strong>{title}</strong>}
          {title && description && " — "}
          {description}
        </figcaption>
      )}
    </figure>
  );
}

// --- Nó Lexical ---

/**
 * ImageNode: DecoratorNode customizado para inserção de imagens no editor.
 *
 * O tamanho (width/height) é controlado via estilo inline no wrapper DOM,
 * garantindo que o float e o tamanho funcionem corretamente independente
 * da especificidade CSS externa.
 *
 * Suporta 3 modos de posicionamento: bloco, float esquerda e float direita.
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

  /** Aplica classe de posicionamento E largura como estilo inline no wrapper. */
  private _applyStyles(dom: HTMLElement): void {
    dom.className = `lexical-image-wrapper lexical-image-${this.__position}`;
    dom.style.width = this.__width;
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

  /** Serializa para JSON (persistência via data/content.json). */
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
        src={this.__src}
        alt={this.__alt}
        title={this.__title}
        description={this.__description}
        height={this.__height}
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

import type { Config } from "@puckeditor/core";
import { DropZone } from "@puckeditor/core";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import React, { useState } from "react";

// --- TipTap Editor Field ---
const TipTapEditor = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) => {
  const editor = useEditor({
    extensions: [StarterKit, Link.configure({ openOnClick: false })],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <div className="border border-border rounded-md overflow-hidden flex flex-col bg-background">
      <div className="bg-muted p-1 border-b border-border flex gap-1 flex-wrap">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 py-1 text-sm font-semibold rounded ${
            editor.isActive("bold")
              ? "bg-primary text-primary-foreground"
              : "hover:bg-secondary"
          }`}
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 text-sm italic rounded ${
            editor.isActive("italic")
              ? "bg-primary text-primary-foreground"
              : "hover:bg-secondary"
          }`}
        >
          I
        </button>
        <button
          type="button"
          onClick={() => {
            const previousUrl = editor.getAttributes("link").href;
            const url = window.prompt("URL", previousUrl);
            if (url === null) return;
            if (url === "") {
              editor.chain().focus().extendMarkRange("link").unsetLink().run();
              return;
            }
            editor
              .chain()
              .focus()
              .extendMarkRange("link")
              .setLink({ href: url })
              .run();
          }}
          className={`px-2 py-1 text-sm rounded ${
            editor.isActive("link")
              ? "bg-primary text-primary-foreground"
              : "hover:bg-secondary"
          }`}
        >
          Link
        </button>
      </div>
      <div className="p-3 min-h-[120px] prose prose-sm max-w-none cursor-text">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

// --- Props ---
type Props = {
  Título: {
    title: string;
    alinhamento: "left" | "center" | "right";
    level: "h1" | "h2" | "h3" | "h4";
  };
  Texto: {
    content: string;
    alinhamento: "left" | "center" | "right" | "justify";
    tamanho: "sm" | "base" | "lg";
  };
  Imagem: {
    url: string;
    alt: string;
    caption: string;
    alinhamento: "left" | "center" | "right";
    width: "25%" | "50%" | "75%" | "100%";
    shadow: boolean;
    lightbox: boolean;
  };
  Tabela: {
    headers: string;
    rows: { cells: string }[];
    bordered: boolean;
    striped: boolean;
    alinhamento: "left" | "center" | "right";
  };
  YouTube: {
    url: string;
    title: string;
    autoplay: boolean;
    mute: boolean;
    loop: boolean;
  };
  Colunas: {
    layout: "1" | "1/2+1/2" | "1/3+2/3" | "2/3+1/3" | "1/3+1/3+1/3";
    gap: "sm" | "md" | "lg" | "xl";
  };
  Botão: {
    label: string;
    url: string;
    variant: "primary" | "secondary" | "outline";
    tamanho: "sm" | "md" | "lg";
    alinhamento: "left" | "center" | "right";
  };
  Lista: {
    items: { text: string }[];
    type: "ordered" | "unordered";
  };
  Citação: {
    quote: string;
    author: string;
    source: string;
  };
  Separador: {
    style: "solid" | "dashed" | "dotted";
    thickness: "1px" | "2px" | "4px";
    color: string;
  };
  Espaçador: {
    height: string;
  };
  Banner: {
    title: string;
    subtitle: string;
    buttonText: string;
    buttonUrl: string;
    backgroundImage: string;
    overlayColor: string;
  };
  Accordion: {
    items: { question: string; answer: string }[];
  };
  Galeria: {
    images: { url: string; alt: string }[];
    columns: "2" | "3" | "4";
  };
  Embed: {
    code: string;
  };
  Mapa: {
    location: string;
    height: string;
    zoom: number;
  };
};

function getYouTubeEmbedUrl(
  urlOrId: string,
  autoplay: boolean,
  mute: boolean,
  loop: boolean,
) {
  if (!urlOrId) return "";
  let id = urlOrId.trim();
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = id.match(regExp);
  if (match && match[2].length === 11) {
    id = match[2];
  }
  let query = "?rel=0";
  if (autoplay) query += "&autoplay=1";
  if (mute) query += "&mute=1";
  if (loop) query += `&loop=1&playlist=${id}`;
  return `https://www.youtube.com/embed/${id}${query}`;
}

export const config: Config<Props> = {
  components: {
    Título: {
      fields: {
        title: { type: "text" },
        alinhamento: {
          type: "radio",
          options: [
            { label: "Esquerda", value: "left" },
            { label: "Centro", value: "center" },
            { label: "Direita", value: "right" },
          ],
        },
        level: {
          type: "select",
          options: [
            { label: "Heading 1", value: "h1" },
            { label: "Heading 2", value: "h2" },
            { label: "Heading 3", value: "h3" },
            { label: "Heading 4", value: "h4" },
          ],
        },
      },
      defaultProps: {
        title: "Novo Título",
        alinhamento: "left",
        level: "h1",
      },
      render: ({ title, alinhamento, level }) => {
        const alinhamentoClass =
          alinhamento === "center"
            ? "text-center"
            : alinhamento === "right"
              ? "text-right"
              : "text-left";
        switch (level) {
          case "h1":
            return (
              <h1
                className={`text-4xl font-extrabold tracking-tight py-4 ${alinhamentoClass}`}
              >
                {title}
              </h1>
            );
          case "h2":
            return (
              <h2
                className={`text-3xl font-bold border-b border-border pb-2 py-3 ${alinhamentoClass}`}
              >
                {title}
              </h2>
            );
          case "h3":
            return (
              <h3 className={`text-2xl font-semibold py-2 ${alinhamentoClass}`}>
                {title}
              </h3>
            );
          case "h4":
            return (
              <h4 className={`text-xl font-medium py-2 ${alinhamentoClass}`}>
                {title}
              </h4>
            );
          default:
            return (
              <h1 className={`text-3xl font-bold py-2 ${alinhamentoClass}`}>
                {title}
              </h1>
            );
        }
      },
    },
    Texto: {
      fields: {
        content: {
          type: "custom",
          render: ({ value, onChange }) => (
            <TipTapEditor value={value} onChange={onChange} />
          ),
        },
        alinhamento: {
          type: "radio",
          options: [
            { label: "Esq", value: "left" },
            { label: "Centro", value: "center" },
            { label: "Dir", value: "right" },
            { label: "Just", value: "justify" },
          ],
        },
        tamanho: {
          type: "select",
          options: [
            { label: "Pequeno", value: "sm" },
            { label: "Padrão", value: "base" },
            { label: "Grande", value: "lg" },
          ],
        },
      },
      defaultProps: {
        content: "<p>Escreva seu texto aqui...</p>",
        alinhamento: "left",
        tamanho: "base",
      },
      render: ({ content, alinhamento, tamanho }) => {
        const alinhamentoClass =
          alinhamento === "center"
            ? "text-center"
            : alinhamento === "right"
              ? "text-right"
              : alinhamento === "justify"
                ? "text-justify"
                : "text-left";

        const tamanhoClass =
          tamanho === "sm"
            ? "text-sm text-muted-foreground"
            : tamanho === "lg"
              ? "text-lg text-foreground"
              : "text-base text-foreground";

        return (
          <div
            className={`py-2 ${alinhamentoClass} ${tamanhoClass} prose prose-sm max-w-none dark:prose-invert`}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        );
      },
    },
    Imagem: {
      fields: {
        url: { type: "text", label: "URL da Imagem" },
        alt: { type: "text", label: "Texto Alternativo (Alt)" },
        caption: { type: "text", label: "Legenda (Opcional)" },
        alinhamento: {
          type: "radio",
          options: [
            { label: "Esq", value: "left" },
            { label: "Centro", value: "center" },
            { label: "Dir", value: "right" },
          ],
        },
        width: {
          type: "select",
          options: [
            { label: "25%", value: "25%" },
            { label: "50%", value: "50%" },
            { label: "75%", value: "75%" },
            { label: "100%", value: "100%" },
          ],
        },
        shadow: {
          type: "radio",
          options: [
            { label: "Sim", value: true },
            { label: "Não", value: false },
          ],
        },
        lightbox: {
          type: "radio",
          options: [
            { label: "Sim", value: true },
            { label: "Não", value: false },
          ],
        },
      },
      defaultProps: {
        url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800",
        alt: "Imagem descritiva",
        caption: "",
        alinhamento: "center",
        width: "100%",
        shadow: false,
        lightbox: false,
      },
      render: ({ url, alt, caption, alinhamento, width, shadow, lightbox }) => {
        const [isOpen, setIsOpen] = useState(false);
        const alinhamentoClass =
          alinhamento === "left"
            ? "justify-start"
            : alinhamento === "right"
              ? "justify-end"
              : "justify-center";

        const widthMap = {
          "25%": "max-w-[25%]",
          "50%": "max-w-[50%]",
          "75%": "max-w-[75%]",
          "100%": "max-w-full",
        };

        const imgContent = (
          <figure className={`flex flex-col w-full py-4 ${alinhamentoClass}`}>
            <div
              className={`overflow-hidden rounded-lg ${widthMap[width] || "max-w-full"} ${shadow ? "shadow-lg" : ""}`}
            >
              <img
                src={url}
                alt={alt}
                loading="lazy"
                className={`w-full h-auto object-cover ${lightbox ? "cursor-pointer hover:opacity-90 transition-opacity" : ""}`}
                onClick={() => lightbox && setIsOpen(true)}
              />
              {caption && (
                <figcaption className="text-sm text-muted-foreground text-center mt-2 italic">
                  {caption}
                </figcaption>
              )}
            </div>
          </figure>
        );

        return (
          <>
            {imgContent}
            {lightbox && isOpen && (
              <div
                className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                onClick={() => setIsOpen(false)}
              >
                <img
                  src={url}
                  alt={alt}
                  className="max-w-full max-h-[90vh] object-contain rounded-md"
                />
              </div>
            )}
          </>
        );
      },
    },
    Tabela: {
      fields: {
        headers: {
          type: "text",
          label: "Cabeçalhos (separados por vírgula)",
        },
        rows: {
          type: "array",
          getItemSummary: (item, index) =>
            `Linha ${(index !== undefined ? index : 0) + 1}: ${item.cells || ""}`,
          arrayFields: {
            cells: {
              type: "text",
              label: "Células (separadas por vírgula)",
            },
          },
        },
        bordered: {
          type: "radio",
          options: [
            { label: "Sim", value: true },
            { label: "Não", value: false },
          ],
        },
        striped: {
          type: "radio",
          options: [
            { label: "Sim", value: true },
            { label: "Não", value: false },
          ],
        },
        alinhamento: {
          type: "radio",
          options: [
            { label: "Esq", value: "left" },
            { label: "Centro", value: "center" },
            { label: "Dir", value: "right" },
          ],
        },
      },
      defaultProps: {
        headers: "Coluna 1, Coluna 2, Coluna 3",
        rows: [
          { cells: "Item A1, Item A2, Item A3" },
          { cells: "Item B1, Item B2, Item B3" },
        ],
        bordered: true,
        striped: true,
        alinhamento: "left",
      },
      render: ({ headers, rows, bordered, striped, alinhamento }) => {
        const headerList = headers
          ? headers.split(",").map((h) => h.trim())
          : [];
        const borderClass = bordered ? "border border-border" : "";
        const alinhamentoClass =
          alinhamento === "center"
            ? "text-center"
            : alinhamento === "right"
              ? "text-right"
              : "text-left";

        return (
          <div className="w-full my-4 overflow-x-auto rounded-lg">
            <table className={`w-full text-sm text-foreground ${borderClass}`}>
              {headerList.length > 0 && (
                <thead
                  className={`bg-muted text-muted-foreground font-semibold ${bordered ? "border-b border-border" : ""}`}
                >
                  <tr>
                    {headerList.map((header, idx) => (
                      <th
                        key={idx}
                        className={`px-4 py-3 ${bordered && idx > 0 ? "border-l border-border" : ""} ${alinhamentoClass}`}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {rows &&
                  rows.map((row, rIdx) => {
                    const rowCells = row.cells
                      ? row.cells.split(",").map((c) => c.trim())
                      : [];
                    return (
                      <tr
                        key={rIdx}
                        className={`${bordered ? "border-b border-border last:border-0" : ""} ${striped && rIdx % 2 !== 0 ? "bg-muted/30" : ""} hover:bg-muted/50`}
                      >
                        {rowCells.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className={`px-4 py-3 ${bordered && cIdx > 0 ? "border-l border-border" : ""} ${alinhamentoClass}`}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        );
      },
    },
    YouTube: {
      fields: {
        url: { type: "text", label: "Link ou ID" },
        title: { type: "text", label: "Título (Acessibilidade)" },
        autoplay: {
          type: "radio",
          options: [
            { label: "Sim", value: true },
            { label: "Não", value: false },
          ],
        },
        mute: {
          type: "radio",
          options: [
            { label: "Sim", value: true },
            { label: "Não", value: false },
          ],
        },
        loop: {
          type: "radio",
          options: [
            { label: "Sim", value: true },
            { label: "Não", value: false },
          ],
        },
      },
      defaultProps: {
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        title: "Vídeo do YouTube",
        autoplay: false,
        mute: false,
        loop: false,
      },
      render: ({ url, title, autoplay, mute, loop }) => {
        const embedUrl = getYouTubeEmbedUrl(url, autoplay, mute, loop);
        if (!embedUrl) {
          return (
            <div className="flex items-center justify-center p-8 bg-muted text-muted-foreground border rounded-lg">
              Link inválido.
            </div>
          );
        }
        return (
          <div className="w-full py-4">
            <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-md">
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src={embedUrl}
                title={title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>
        );
      },
    },
    Colunas: {
      fields: {
        layout: {
          type: "select",
          label: "Proporção das Colunas",
          options: [
            { label: "1 Coluna (100%)", value: "1" },
            { label: "2 Colunas (50% / 50%)", value: "1/2+1/2" },
            { label: "2 Colunas (33% / 67%)", value: "1/3+2/3" },
            { label: "2 Colunas (67% / 33%)", value: "2/3+1/3" },
            { label: "3 Colunas (33% / 33% / 33%)", value: "1/3+1/3+1/3" },
          ],
        },
        gap: {
          type: "select",
          label: "Espaçamento (Gap)",
          options: [
            { label: "Pequeno", value: "sm" },
            { label: "Médio", value: "md" },
            { label: "Grande", value: "lg" },
            { label: "Extra Grande", value: "xl" },
          ],
        },
      },
      defaultProps: {
        layout: "1/2+1/2",
        gap: "md",
      },
      render: ({ layout, gap }) => {
        const gapMap = { sm: "gap-2", md: "gap-4", lg: "gap-8", xl: "gap-12" };
        let gridClass = "grid-cols-1";
        let hasCol2 = false;
        let hasCol3 = false;

        switch (layout) {
          case "1":
            gridClass = "grid-cols-1";
            break;
          case "1/2+1/2":
            gridClass = "md:grid-cols-2";
            hasCol2 = true;
            break;
          case "1/3+2/3":
            gridClass = "md:grid-cols-[1fr_2fr]";
            hasCol2 = true;
            break;
          case "2/3+1/3":
            gridClass = "md:grid-cols-[2fr_1fr]";
            hasCol2 = true;
            break;
          case "1/3+1/3+1/3":
            gridClass = "md:grid-cols-3";
            hasCol2 = true;
            hasCol3 = true;
            break;
        }

        return (
          <div className={`grid ${gridClass} ${gapMap[gap]} w-full py-4`}>
            <div className="min-h-[100px] border border-transparent hover:border-dashed hover:border-muted-foreground/50 rounded p-1 transition-colors">
              <DropZone zone="col-1" />
            </div>
            {hasCol2 && (
              <div className="min-h-[100px] border border-transparent hover:border-dashed hover:border-muted-foreground/50 rounded p-1 transition-colors">
                <DropZone zone="col-2" />
              </div>
            )}
            {hasCol3 && (
              <div className="min-h-[100px] border border-transparent hover:border-dashed hover:border-muted-foreground/50 rounded p-1 transition-colors">
                <DropZone zone="col-3" />
              </div>
            )}
          </div>
        );
      },
    },
    Botão: {
      fields: {
        label: { type: "text", label: "Rótulo" },
        url: { type: "text", label: "URL Destino" },
        variant: {
          type: "select",
          options: [
            { label: "Primário", value: "primary" },
            { label: "Secundário", value: "secondary" },
            { label: "Outline", value: "outline" },
          ],
        },
        tamanho: {
          type: "select",
          options: [
            { label: "Pequeno", value: "sm" },
            { label: "Médio", value: "md" },
            { label: "Grande", value: "lg" },
          ],
        },
        alinhamento: {
          type: "radio",
          options: [
            { label: "Esq", value: "left" },
            { label: "Centro", value: "center" },
            { label: "Dir", value: "right" },
          ],
        },
      },
      defaultProps: {
        label: "Clique aqui",
        url: "#",
        variant: "primary",
        tamanho: "md",
        alinhamento: "center",
      },
      render: ({ label, url, variant, tamanho, alinhamento }) => {
        const variants = {
          primary: "bg-primary text-primary-foreground hover:bg-primary/90",
          secondary:
            "bg-secondary text-secondary-foreground hover:bg-secondary/80",
          outline:
            "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        };
        const tamanhos = {
          sm: "h-9 px-3 text-xs",
          md: "h-10 px-4 py-2 text-sm",
          lg: "h-11 px-8 text-base",
        };
        const alinhamentoClass =
          alinhamento === "center"
            ? "text-center"
            : alinhamento === "right"
              ? "text-right"
              : "text-left";
        return (
          <div className={`py-2 ${alinhamentoClass}`}>
            <a
              href={url}
              aria-label={label}
              className={`inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${variants[variant]} ${tamanhos[tamanho]}`}
            >
              {label}
            </a>
          </div>
        );
      },
    },
    Lista: {
      fields: {
        items: {
          type: "array",
          getItemSummary: (item) => item.text || "Novo item",
          arrayFields: { text: { type: "text" } },
        },
        type: {
          type: "radio",
          options: [
            { label: "Ordenada (1. 2. 3.)", value: "ordered" },
            { label: "Não-ordenada (•)", value: "unordered" },
          ],
        },
      },
      defaultProps: {
        items: [{ text: "Primeiro item" }, { text: "Segundo item" }],
        type: "unordered",
      },
      render: ({ items, type }) => {
        const ListTag = type === "ordered" ? "ol" : "ul";
        const listClass = type === "ordered" ? "list-decimal" : "list-disc";
        return (
          <ListTag
            className={`${listClass} pl-6 py-4 space-y-2 text-foreground`}
          >
            {items.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {item.text}
              </li>
            ))}
          </ListTag>
        );
      },
    },
    Citação: {
      fields: {
        quote: { type: "textarea", label: "Texto da Citação" },
        author: { type: "text", label: "Autor" },
        source: { type: "text", label: "Fonte (Opcional)" },
      },
      defaultProps: {
        quote:
          "O design não é apenas o que parece e o que se sente. Design é como funciona.",
        author: "Steve Jobs",
        source: "",
      },
      render: ({ quote, author, source }) => (
        <blockquote className="border-l-4 border-primary pl-4 py-2 my-4 italic text-muted-foreground bg-muted/20 rounded-r-lg">
          <p className="text-lg mb-2">"{quote}"</p>
          <footer className="text-sm font-semibold text-foreground">
            — {author}{" "}
            {source && (
              <span className="font-normal text-muted-foreground">
                , {source}
              </span>
            )}
          </footer>
        </blockquote>
      ),
    },
    Separador: {
      fields: {
        style: {
          type: "select",
          options: [
            { label: "Sólida", value: "solid" },
            { label: "Tracejada", value: "dashed" },
            { label: "Pontilhada", value: "dotted" },
          ],
        },
        thickness: {
          type: "select",
          options: [
            { label: "Fino (1px)", value: "1px" },
            { label: "Médio (2px)", value: "2px" },
            { label: "Grosso (4px)", value: "4px" },
          ],
        },
        color: {
          type: "text",
          label: "Cor (Hex, RGB ou nome da classe Tailwind bg-)",
        },
      },
      defaultProps: {
        style: "solid",
        thickness: "1px",
        color: "#e5e7eb",
      },
      render: ({ style, thickness, color }) => (
        <div className="py-6 w-full flex items-center justify-center">
          <div
            style={{
              width: "100%",
              borderTopStyle: style,
              borderTopWidth: thickness,
              borderColor: color,
            }}
          />
        </div>
      ),
    },
    Espaçador: {
      fields: {
        height: { type: "text", label: "Altura (ex: 2rem, 50px, 10vh)" },
      },
      defaultProps: {
        height: "2rem",
      },
      render: ({ height }) => (
        <div style={{ height }} aria-hidden="true" className="w-full" />
      ),
    },
    Banner: {
      fields: {
        title: { type: "text" },
        subtitle: { type: "textarea" },
        buttonText: { type: "text" },
        buttonUrl: { type: "text" },
        backgroundImage: { type: "text", label: "URL da Imagem de Fundo" },
        overlayColor: {
          type: "text",
          label: "Cor do Overlay (Ex: rgba(0,0,0,0.5))",
        },
      },
      defaultProps: {
        title: "Título de Destaque",
        subtitle:
          "Uma breve descrição impactante para prender a atenção do usuário.",
        buttonText: "Saiba Mais",
        buttonUrl: "#",
        backgroundImage:
          "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000",
        overlayColor: "rgba(0,0,0,0.6)",
      },
      render: ({
        title,
        subtitle,
        buttonText,
        buttonUrl,
        backgroundImage,
        overlayColor,
      }) => (
        <div
          className="relative w-full min-h-[400px] flex items-center justify-center rounded-xl overflow-hidden my-6"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundtamanho: "cover",
            backgroundPosition: "center",
          }}
        >
          <div
            className="absolute inset-0 z-0"
            style={{ backgroundColor: overlayColor }}
          />
          <div className="relative z-10 text-center text-white p-8 max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-md">
              {title}
            </h1>
            <p className="text-lg md:text-xl mb-8 opacity-90 drop-shadow">
              {subtitle}
            </p>
            {buttonText && (
              <a
                href={buttonUrl}
                className="inline-block bg-white text-black font-semibold px-8 py-3 rounded-full hover:bg-gray-200 transition-colors shadow-lg"
              >
                {buttonText}
              </a>
            )}
          </div>
        </div>
      ),
    },
    Accordion: {
      fields: {
        items: {
          type: "array",
          getItemSummary: (item) => item.question || "Nova pergunta",
          arrayFields: {
            question: { type: "text", label: "Pergunta" },
            answer: { type: "textarea", label: "Resposta" },
          },
        },
      },
      defaultProps: {
        items: [
          {
            question: "O que é este serviço?",
            answer:
              "Esta é a resposta descritiva para a primeira pergunta do FAQ.",
          },
          {
            question: "Como posso entrar em contato?",
            answer: "Você pode nos contactar via email ou telefone.",
          },
        ],
      },
      render: ({ items }) => (
        <div className="w-full flex flex-col gap-2 my-4">
          {items.map((item, idx) => (
            <details
              key={idx}
              className="group border border-border rounded-lg bg-card text-card-foreground"
            >
              <summary className="cursor-pointer font-medium p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 list-none flex justify-between items-center [&::-webkit-details-marker]:hidden">
                {item.question}
                <span className="transition group-open:rotate-180">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </span>
              </summary>
              <div className="p-4 pt-0 text-muted-foreground border-t border-border mt-2">
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      ),
    },
    Galeria: {
      fields: {
        columns: {
          type: "select",
          options: [
            { label: "2 Colunas", value: "2" },
            { label: "3 Colunas", value: "3" },
            { label: "4 Colunas", value: "4" },
          ],
        },
        images: {
          type: "array",
          getItemSummary: (_, idx) =>
            `Imagem ${(idx !== undefined ? idx : 0) + 1}`,
          arrayFields: {
            url: { type: "text" },
            alt: { type: "text" },
          },
        },
      },
      defaultProps: {
        columns: "3",
        images: [
          {
            url: "https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400",
            alt: "Galeria 1",
          },
          {
            url: "https://images.unsplash.com/photo-1497215842964-222b330cefa4?w=400",
            alt: "Galeria 2",
          },
          {
            url: "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=400",
            alt: "Galeria 3",
          },
        ],
      },
      render: ({ images, columns }) => {
        const gridCols = {
          "2": "grid-cols-1 sm:grid-cols-2",
          "3": "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
          "4": "grid-cols-1 sm:grid-cols-2 md:grid-cols-4",
        };
        return (
          <div className={`grid ${gridCols[columns]} gap-4 my-6`}>
            {images.map((img, idx) => (
              <div
                key={idx}
                className="aspect-square overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <img
                  src={img.url}
                  alt={img.alt}
                  loading="lazy"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        );
      },
    },
    Embed: {
      fields: {
        code: { type: "textarea", label: "Código de Embed (HTML/Iframe)" },
      },
      defaultProps: {
        code: '<iframe src="https://example.com" width="100%" height="300" style="border:none;"></iframe>',
      },
      render: ({ code }) => (
        <div
          className="w-full my-4 rounded-lg overflow-hidden flex justify-center"
          dangerouslySetInnerHTML={{ __html: code }}
        />
      ),
    },
    Mapa: {
      fields: {
        location: { type: "text", label: "Endereço ou Coordenadas" },
        height: { type: "text", label: "Altura" },
        zoom: { type: "text", label: "Zoom (1 a 20)" }, // Puck arrayFields/inputs as text to avoid casting issues in older versions
      },
      defaultProps: {
        location: "São Paulo, SP, Brasil",
        height: "400px",
        zoom: 14 as any,
      },
      render: ({ location, height, zoom }) => {
        const encodedQuery = encodeURIComponent(location);
        const mapUrl = `https://maps.google.com/maps?q=${encodedQuery}&t=&z=${zoom}&ie=UTF8&iwloc=&output=embed`;
        return (
          <div className="w-full my-4 rounded-xl overflow-hidden shadow-sm border border-border">
            <iframe
              width="100%"
              height={height}
              src={mapUrl}
              frameBorder="0"
              scrolling="no"
              marginHeight={0}
              marginWidth={0}
              loading="lazy"
              title={`Mapa de ${location}`}
            />
          </div>
        );
      },
    },
  },
};

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
} from "@lexical/rich-text";
import {
  $setBlocksType,
  $getSelectionStyleValueForProperty,
  $patchStyleText,
} from "@lexical/selection";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  $isTextNode,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_LOW,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  LexicalEditor,
  REDO_COMMAND,
  UNDO_COMMAND,
  CLEAR_EDITOR_COMMAND,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  ElementFormatType,
} from "lexical";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Undo,
  Redo,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Eraser,
  Minus,
  Plus,
  TypeIcon,
  TextInitialIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  QuoteIcon,
  Baseline,
  PaintBucket,
  Link as LinkIcon,
  Strikethrough,
  Subscript,
  Superscript,
  ChevronDown,
  Table as TableIcon,
  FoldVertical,
  Trash2,
  Indent as IndentIcon,
  Outdent as OutdentIcon,
  Scissors,
  Copy,
  ClipboardPaste,
  FileText,
  Printer,
  MoveHorizontal,
  AlignVerticalJustifyStart,
  CaseUpper,
  CaseLower,
  CaseSensitive,
  Check,
  XIcon,
  List,
  ListOrdered,
  TextQuote,
  ImageIcon,
} from "lucide-react";
import { TOGGLE_LINK_COMMAND, $isLinkNode } from "@lexical/link";
import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/react/LexicalHorizontalRuleNode";
import { INSERT_TABLE_COMMAND } from "@lexical/table";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
} from "@lexical/list";
import { INSERT_IMAGE_COMMAND } from "../plugins/ImagePlugin";
import type { ImagePosition } from "../nodes/ImageNode";
import { INSERT_COLLAPSIBLE_COMMAND } from "../plugins/CollapsiblePlugin";
import {
  TOGGLE_LINK_EDIT_MODE_COMMAND,
  getSelectedNode,
} from "../plugins/FloatingLinkEditorPlugin";
import { DropdownColorPicker } from "@/app/modules/text-editor/components/color-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- Constantes de Estilo e Opções ---

const btnBase =
  "group flex cursor-pointer items-center justify-center rounded-md border-0 p-1.5 transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500";
const btnInactive = "bg-card hover:bg-accent";
const btnActive =
  "bg-primary text-primary-foreground enabled:hover:bg-primary/80";

const BLOCK_TYPES = [
  { label: "Normal", value: "paragraph", icon: TextInitialIcon },
  { label: "Título 1", value: "h1", icon: Heading1Icon },
  { label: "Título 2", value: "h2", icon: Heading2Icon },
  { label: "Título 3", value: "h3", icon: Heading3Icon },
  { label: "Citação", value: "quote", icon: QuoteIcon },
];

const FONT_FAMILY_OPTIONS: [string, string][] = [
  ["Arial", "Arial"],
  ["Courier New", "Courier New"],
  ["Georgia", "Georgia"],
  ["Times New Roman", "Times New Roman"],
  ["Trebuchet MS", "Trebuchet MS"],
  ["Verdana", "Verdana"],
];

const FONT_SIZES = [
  8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72,
];

// --- Sub-componentes ---

/**
 * Divisor visual entre grupos de ferramentas na toolbar.
 */
function Divider() {
  return <div className="mx-1 w-px self-stretch bg-accent" />;
}

/**
 * Seletor de Família de Fonte.
 */
function FontDropDown({
  editor,
  value,
  style,
  disabled = false,
}: {
  editor: LexicalEditor;
  value: string;
  style: string;
  disabled?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        asChild
        disabled={disabled}
        className="rounded-lg border-0 w-26 overflow-x-clip text-start bg-card"
      >
        <Button
          variant="outline"
          type="button"
          className="text-start flex items-center justify-start overflow-x-clip text-wrap truncate px-2 "
        >
          <TypeIcon />
          {value}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-75 overflow-y-auto">
        {FONT_FAMILY_OPTIONS.map(([optionLabel, optionValue]) => (
          <DropdownMenuItem
            key={optionValue}
            onClick={() =>
              editor.update(() => {
                const selection = $getSelection();
                if (selection !== null) {
                  $patchStyleText(selection, { [style]: optionValue });
                }
              })
            }
          >
            {optionLabel}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Seletor de Tamanho de Fonte com botões de incremento/decremento e input manual.
 */
function FontSizePicker({
  editor,
  value,
  disabled = false,
}: {
  editor: LexicalEditor;
  value: string;
  disabled?: boolean;
}) {
  const sizeMatch = value.match(/^(\d+(?:\.\d+)?)(px|em|rem|pt|%)?$/);
  const numericValue = sizeMatch ? parseFloat(sizeMatch[1]) : 14;
  const unit = sizeMatch && sizeMatch[2] ? sizeMatch[2] : "px";

  const [inputValue, setInputValue] = useState(numericValue.toString());

  useEffect(() => {
    setInputValue(numericValue.toString());
  }, [numericValue]);

  const updateFontSize = (newSize: number) => {
    if (newSize < 1 || newSize > 200) return;
    editor.update(() => {
      const selection = $getSelection();
      if (selection !== null) {
        $patchStyleText(selection, { "font-size": `${newSize}${unit}` });
      }
    });
  };

  const handleDecrease = () => {
    let nextSize = numericValue;
    for (let i = FONT_SIZES.length - 1; i >= 0; i--) {
      if (FONT_SIZES[i] < numericValue) {
        nextSize = FONT_SIZES[i];
        break;
      }
    }
    if (nextSize !== numericValue) {
      updateFontSize(nextSize);
    }
  };

  const handleIncrease = () => {
    let nextSize = numericValue;
    for (let i = 0; i < FONT_SIZES.length; i++) {
      if (FONT_SIZES[i] > numericValue) {
        nextSize = FONT_SIZES[i];
        break;
      }
    }
    if (nextSize !== numericValue) {
      updateFontSize(nextSize);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    const newSize = parseFloat(inputValue);
    if (!isNaN(newSize)) {
      updateFontSize(newSize);
    } else {
      setInputValue(numericValue.toString());
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleInputBlur();
    }
  };

  return (
    <div className="flex h-9 items-center gap-0 rounded-md p-0.5">
      <button
        type="button"
        disabled={disabled || numericValue <= FONT_SIZES[0]}
        onClick={handleDecrease}
        className={`${btnBase} ${btnInactive} aspect-square`}
        aria-label="Diminuir tamanho da fonte"
      >
        <Minus size={14} />
      </button>
      <Input
        type="text"
        readOnly
        value={inputValue}
        disabled={disabled}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onKeyDown={handleInputKeyDown}
        className="w-12 text-center m-0 p-0 bg-card"
        aria-label="Tamanho da fonte"
      />
      <button
        type="button"
        disabled={disabled || numericValue >= FONT_SIZES[FONT_SIZES.length - 1]}
        onClick={handleIncrease}
        className={`${btnBase} ${btnInactive} aspect-square`}
        aria-label="Aumentar tamanho da fonte"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

// --- Funções Auxiliares de Formatação ---

/**
 * Formata o bloco selecionado como Parágrafo.
 */
function formatParagraph(editor: LexicalEditor) {
  editor.update(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      $setBlocksType(selection, () => $createParagraphNode());
    }
  });
}

/**
 * Formata o bloco selecionado como Cabeçalho (H1, H2, H3).
 */
function formatHeading(editor: LexicalEditor, headingTag: "h1" | "h2" | "h3") {
  editor.update(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      $setBlocksType(selection, () => $createHeadingNode(headingTag));
    }
  });
}

/**
 * Formata o bloco selecionado como Citação (Quote).
 */
function formatQuote(editor: LexicalEditor) {
  editor.update(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      $setBlocksType(selection, () => $createQuoteNode());
    }
  });
}

/**
 * Aplica o tipo de bloco baseado no valor selecionado.
 */
function applyBlockType(editor: LexicalEditor, type: string) {
  if (type === "paragraph") {
    formatParagraph(editor);
  } else if (type === "quote") {
    formatQuote(editor);
  } else {
    formatHeading(editor, type as "h1" | "h2" | "h3");
  }
}

// --- Componente Principal ---

/**
 * Plugin de Toolbar para o editor Lexical.
 * Fornece controles de formatação de texto, alinhamento, inserção de tabelas, links e mais.
 */
export function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Estados de Histórico
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isEditable, setIsEditable] = useState(() => editor.isEditable());

  // Estados de Estilo de Texto
  const [fontFamily, setFontFamily] = useState<string>("Arial");
  const [fontSize, setFontSize] = useState<string>("14px");
  const [fontColor, setFontColor] = useState<string>("#000");
  const [bgColor, setBgColor] = useState<string>("#fff");
  const [blockType, setBlockType] = useState("paragraph");

  // Estados de Formatação Inline
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isSubscript, setIsSubscript] = useState(false);
  const [isSuperscript, setIsSuperscript] = useState(false);
  const [isLink, setIsLink] = useState(false);

  // Estados de Tabela
  const [isTableDialogOpen, setIsTableDialogOpen] = useState(false);
  const [tableRows, setTableRows] = useState("3");
  const [tableCols, setTableCols] = useState("3");

  // Estado de Alinhamento de bloco
  const [elementFormat, setElementFormat] = useState<ElementFormatType>("left");

  // Estados de Espaçamento
  const [letterSpacing, setLetterSpacing] = useState<string>("normal");
  const [lineHeight, setLineHeight] = useState<string>("normal");
  const [paragraphSpacing, setParagraphSpacing] = useState<string>("0px");

  // Estados de Lista
  const [isBulletList, setIsBulletList] = useState(false);
  const [isOrderedList, setIsOrderedList] = useState(false);

  // Funções de Área de Transferência
  const handleCut = useCallback(async () => {
    editor.getEditorState().read(async () => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const text = selection.getTextContent();
        try {
          await navigator.clipboard.writeText(text);
          editor.update(() => {
            const sel = $getSelection();
            if ($isRangeSelection(sel)) {
              sel.removeText();
            }
          });
        } catch (err) {
          console.error("Falha ao recortar: ", err);
        }
      }
    });
  }, [editor]);

  const handleCopy = useCallback(async () => {
    editor.getEditorState().read(async () => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const text = selection.getTextContent();
        try {
          await navigator.clipboard.writeText(text);
        } catch (err) {
          console.error("Falha ao copiar: ", err);
        }
      }
    });
  }, [editor]);

  const handlePasteText = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          selection.insertText(text);
        }
      });
    } catch (err) {
      console.error("Falha ao colar como texto: ", err);
    }
  }, [editor]);

  const handlePrint = useCallback(() => {
    const rootElement = editor.getRootElement();
    if (!rootElement) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const content = rootElement.innerHTML;

    printWindow.document.write(`
      <html>
        <head>
          <title>Impressão - Matéria</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 40px; line-height: 1.6; color: #1a202c; max-width: 800px; margin: 0 auto; }
            img { max-width: 100%; height: auto; border-radius: 6px; }
            table { border-collapse: collapse; width: 100%; margin: 24px 0; font-size: 0.9em; }
            table, th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
            th { background-color: #f7fafc; font-weight: 600; }
            .lexical-image-left { float: left; margin: 0 1.5rem 1rem 0; max-width: 40%; }
            .lexical-image-right { float: right; margin: 0 0 1rem 1.5rem; max-width: 40%; }
            .lexical-image-block { display: block; margin: 24px auto; text-align: center; }
            figcaption { font-size: 0.85rem; color: #718096; margin-top: 8px; text-align: center; font-style: italic; }
            h1 { font-size: 2.25rem; font-weight: 700; margin-bottom: 0.5em; border-bottom: 2px solid #edf2f7; padding-bottom: 0.3em; color: #111; }
            h2 { font-size: 1.875rem; font-weight: 700; margin-top: 1.5em; margin-bottom: 0.5em; color: #2d3748; }
            h3 { font-size: 1.5rem; font-weight: 600; margin-top: 1.25em; margin-bottom: 0.4em; color: #4a5568; }
            blockquote { border-left: 4px solid #cbd5e0; padding: 12px 24px; margin: 24px 0; font-style: italic; color: #4a5568; background: #f8fafc; border-radius: 0 4px 4px 0; }
            ul, ol { margin: 16px 0; padding-left: 32px; }
            li { margin-bottom: 6px; }
            hr { border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0; }
            p { margin-bottom: 12px; }
            @media print {
              body { padding: 20px; }
              @page { margin: 2cm; }
            }
          </style>
        </head>
        <body>
          <div class="content">${content}</div>
          <script>
            window.onload = () => {
              // Pequeno delay para garantir carregamento de imagens se houver
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }, [editor]);

  /** Alterna lista não ordenada (marcadores). */
  const handleBulletList = useCallback(() => {
    if (isBulletList) {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    }
  }, [editor, isBulletList]);

  /** Alterna lista ordenada (numérica). */
  const handleOrderedList = useCallback(() => {
    if (isOrderedList) {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    }
  }, [editor, isOrderedList]);

  /** Aplica espaçamento entre parágrafos via CSS custom property no root do editor. */
  const handleParagraphSpacing = useCallback(
    (value: string) => {
      const rootElement = editor.getRootElement();
      if (rootElement) {
        rootElement.style.setProperty("--lexical-para-spacing", value);
      }
      setParagraphSpacing(value);
    },
    [editor],
  );

  /**
   * Atualiza o estado da toolbar baseado na seleção atual do editor.
   */
  const $updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode();
      let topLevelElement = $findMatchingParent(anchorNode, (e) => {
        const parent = e.getParent();
        return parent !== null && $isRootOrShadowRoot(parent);
      });
      if (topLevelElement === null) {
        topLevelElement = anchorNode.getTopLevelElementOrThrow();
      }

      // Detecta tipo de bloco
      if ($isHeadingNode(topLevelElement)) {
        setBlockType(topLevelElement.getTag());
      } else {
        setBlockType(topLevelElement.getType());
      }

      // Detecta formatos básicos
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));
      setIsSubscript(selection.hasFormat("subscript"));
      setIsSuperscript(selection.hasFormat("superscript"));

      // Detecta se é link
      const node = getSelectedNode(selection);
      const parent = node.getParent();
      setIsLink($isLinkNode(parent) || $isLinkNode(node));

      // Busca estilos computados
      setFontFamily(
        $getSelectionStyleValueForProperty(selection, "font-family", "Arial"),
      );
      setFontSize(
        $getSelectionStyleValueForProperty(selection, "font-size", "14px"),
      );
      setFontColor(
        $getSelectionStyleValueForProperty(selection, "color", "#000"),
      );
      setBgColor(
        $getSelectionStyleValueForProperty(
          selection,
          "background-color",
          "#fff",
        ),
      );

      // Detecta alinhamento do bloco
      const format = topLevelElement
        ? (topLevelElement as any).getFormatType?.()
        : "left";
      setElementFormat((format as ElementFormatType) || "left");

      // Detecta tipo de lista
      if ($isListNode(topLevelElement)) {
        const listType = topLevelElement.getListType();
        setIsBulletList(listType === "bullet");
        setIsOrderedList(listType === "number");
      } else {
        setIsBulletList(false);
        setIsOrderedList(false);
      }
    }
  }, []);

  /**
   * Limpa todas as formatações do texto selecionado.
   */
  const clearFormatting = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.getNodes().forEach((node) => {
          if ($isTextNode(node)) {
            node.setFormat(0);
            node.setStyle("");
          }
        });
      }
    });
  }, [editor]);

  /**
   * Alterna a inserção ou edição de links.
   */
  const insertLink = useCallback(() => {
    if (!isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, "https://");
      setTimeout(() => {
        editor.dispatchCommand(TOGGLE_LINK_EDIT_MODE_COMMAND, true);
      }, 0);
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  }, [editor, isLink]);

  /**
   * Aplica estilos CSS arbitrários à seleção.
   */
  const applyStyleText = useCallback(
    (styles: Record<string, string>) => {
      editor.update(() => {
        const selection = $getSelection();
        if (selection !== null) {
          $patchStyleText(selection, styles);
        }
      });
    },
    [editor],
  );

  const onFontColorSelect = useCallback(
    (value: string) => {
      applyStyleText({ color: value });
    },
    [applyStyleText],
  );

  const onBgColorSelect = useCallback(
    (value: string) => {
      applyStyleText({ "background-color": value });
    },
    [applyStyleText],
  );

  // Registro de ouvintes do editor
  useEffect(() => {
    return mergeRegister(
      editor.registerEditableListener((editable) => {
        setIsEditable(editable);
      }),
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(
          () => {
            $updateToolbar();
          },
          { editor },
        );
      }),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor, $updateToolbar]);

  return (
    <div
      className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 overflow-x-auto border-b border-black/10 px-2 py-1.5 bg-card"
      ref={toolbarRef}
    >
      {/* Grupo: Histórico */}
      <button
        disabled={!canUndo}
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        className={`${btnBase} ${btnInactive} mr-0.5`}
        aria-label="Desfazer"
        title="Desfazer (Ctrl+Z)"
        type="button"
      >
        <Undo size={18} />
      </button>
      <button
        disabled={!canRedo}
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        className={`${btnBase} ${btnInactive}`}
        aria-label="Refazer"
        title="Refazer (Ctrl+Y)"
        type="button"
      >
        <Redo size={18} />
      </button>

      <Divider />

      {/* Grupo: Fonte e Tamanho */}
      <FontDropDown
        editor={editor}
        value={fontFamily}
        style="font-family"
        disabled={!isEditable}
      />
      <Divider />

      <FontSizePicker editor={editor} value={fontSize} disabled={!isEditable} />

      <Divider />

      {/* Grupo: Formatação Básica */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
          className={`${btnBase} mr-0.5 ${isBold ? btnActive : btnInactive}`}
          aria-label="Negrito"
          aria-pressed={isBold}
          title="Negrito (Ctrl+B)"
          type="button"
        >
          <Bold size={18} />
        </button>
        <button
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
          className={`${btnBase} mr-0.5 ${isItalic ? btnActive : btnInactive}`}
          aria-label="Itálico"
          aria-pressed={isItalic}
          type="button"
          title="Itálico (Ctrl+I)"
        >
          <Italic size={18} />
        </button>
        <button
          onClick={() =>
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")
          }
          className={`${btnBase} mr-0.5 ${isUnderline ? btnActive : btnInactive}`}
          aria-label="Sublinhado"
          aria-pressed={isUnderline}
          title="Sublinhado (Ctrl+U)"
          type="button"
        >
          <Underline size={18} />
        </button>
        <button
          onClick={insertLink}
          className={`${btnBase} mr-0.5 ${isLink ? btnActive : btnInactive}`}
          aria-label="Inserir Link"
          aria-pressed={isLink}
          title="Link (Ctrl+K)"
          type="button"
        >
          <LinkIcon size={18} />
        </button>
        {/* Grupo: Formatações Avançadas */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`${btnBase} ${btnInactive}`}
              aria-label="Mais Formatações"
              title="Mais Formatações"
              type="button"
            >
              <TextInitialIcon size={18} />
              <ChevronDown size={14} className="ml-1 opacity-50" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem
              onClick={() =>
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")
              }
              className={
                isStrikethrough ? "bg-accent text-accent-foreground" : ""
              }
            >
              <Strikethrough size={16} className="mr-2" />
              Tachado
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, "subscript")
              }
              className={isSubscript ? "bg-accent text-accent-foreground" : ""}
            >
              <Subscript size={16} className="mr-2" />
              Subscrito
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, "superscript")
              }
              className={
                isSuperscript ? "bg-accent text-accent-foreground" : ""
              }
            >
              <Superscript size={16} className="mr-2" />
              Sobrescrito
            </DropdownMenuItem>
            <div className="h-px bg-border my-1" />
            <DropdownMenuItem
              onClick={() => applyStyleText({ "text-transform": "lowercase" })}
            >
              <CaseLower size={16} />
              Minúsculas
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => applyStyleText({ "text-transform": "uppercase" })}
            >
              <CaseUpper size={16} /> Maiúsculas
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => applyStyleText({ "text-transform": "capitalize" })}
            >
              <CaseSensitive size={16} />
              Capitalizar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {/* Grupo: Alinhamento (Dropdown) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`${btnBase} ${btnInactive}`}
              aria-label="Alinhamento"
              title="Alinhamento"
              type="button"
            >
              {elementFormat === "center" ? (
                <AlignCenter size={18} />
              ) : elementFormat === "right" ? (
                <AlignRight size={18} />
              ) : elementFormat === "justify" ? (
                <AlignJustify size={18} />
              ) : (
                <AlignLeft size={18} />
              )}
              <ChevronDown size={14} className="ml-1 opacity-50" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {[
              {
                label: "Esquerda",
                value: "left" as ElementFormatType,
                icon: AlignLeft,
              },
              {
                label: "Centralizado",
                value: "center" as ElementFormatType,
                icon: AlignCenter,
              },
              {
                label: "Direita",
                value: "right" as ElementFormatType,
                icon: AlignRight,
              },
              {
                label: "Justificado",
                value: "justify" as ElementFormatType,
                icon: AlignJustify,
              },
            ].map(({ label, value, icon: Icon }) => (
              <DropdownMenuItem
                key={value}
                onClick={() => {
                  editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, value);
                  setElementFormat(value);
                }}
                className={
                  elementFormat === value
                    ? "bg-accent text-accent-foreground"
                    : ""
                }
              >
                <Icon size={16} className="mr-2" />
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Grupo: Área de Transferência */}
      <Divider />
      <div className="flex items-center gap-1">
        <button
          onClick={handleCut}
          className={`${btnBase} ${btnInactive}`}
          aria-label="Recortar"
          title="Recortar"
          type="button"
        >
          <Scissors size={18} />
        </button>
        <button
          onClick={handleCopy}
          className={`${btnBase} ${btnInactive}`}
          aria-label="Copiar"
          title="Copiar"
          type="button"
        >
          <Copy size={18} />
        </button>
        <button
          onClick={handlePasteText}
          className={`${btnBase} ${btnInactive}`}
          aria-label="Colar"
          title="Colar"
          type="button"
        >
          <ClipboardPaste size={18} />
        </button>
        <button
          onClick={handlePasteText}
          className={`${btnBase} ${btnInactive}`}
          aria-label="Colar como Texto"
          title="Colar como Texto"
          type="button"
        >
          <FileText size={18} />
        </button>
      </div>

      <Divider />

      {/* Grupo: Inserção de Objetos */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={`${btnBase} ${btnInactive} mr-0.5`}
            aria-label="Inserir"
            type="button"
            title="Inserir Objeto"
          >
            <Plus size={18} />
            <span className="text-sm font-medium ml-1">Inserir</span>
            <ChevronDown size={14} className="ml-1 opacity-50" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            onClick={() =>
              editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)
            }
          >
            <Minus size={16} className="mr-2" />
            Linha Divisória
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsTableDialogOpen(true)}>
            <TableIcon size={16} className="mr-2" />
            Tabela
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              editor.dispatchCommand(INSERT_COLLAPSIBLE_COMMAND, undefined)
            }
          >
            <FoldVertical size={16} className="mr-2" />
            Container Retrátil
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              editor.dispatchCommand(INSERT_IMAGE_COMMAND, undefined)
            }
          >
            <ImageIcon size={16} className="mr-2" />
            Imagem
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modal de Configuração de Tabela */}
      <Dialog open={isTableDialogOpen} onOpenChange={setIsTableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inserir Tabela</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="rows" className="text-right text-sm">
                Linhas
              </label>
              <Input
                id="rows"
                type="number"
                min="1"
                max="500"
                value={tableRows}
                onChange={(e) => setTableRows(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="cols" className="text-right text-sm">
                Colunas
              </label>
              <Input
                id="cols"
                type="number"
                min="1"
                max="50"
                value={tableCols}
                onChange={(e) => setTableCols(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                editor.dispatchCommand(INSERT_TABLE_COMMAND, {
                  columns: tableCols,
                  rows: tableRows,
                  includeHeaders: false,
                });
                setIsTableDialogOpen(false);
              }}
            >
              Inserir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Divider />

      {/* Grupo: Tipos de Bloco */}
      <Select
        value={isBulletList || isOrderedList ? "paragraph" : blockType}
        onValueChange={(value) => applyBlockType(editor, value)}
        aria-label="Tipo de Bloco"
        disabled={isBulletList || isOrderedList}
      >
        <SelectTrigger
          className={`${btnBase} ${btnInactive} opacity-${isBulletList || isOrderedList ? "50" : "100"}`}
          title={
            isBulletList || isOrderedList
              ? "Indisponível dentro de listas"
              : "Tipo de Bloco"
          }
        >
          <SelectValue placeholder="Tipo de Bloco" />
        </SelectTrigger>
        <SelectContent>
          {BLOCK_TYPES.map(({ label, value, icon: Icon }) => (
            <SelectItem key={value} value={value}>
              <div className="flex items-center gap-2">
                <Icon size={14} />
                {label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Divider />

      {/* Grupo: Cores */}
      <DropdownColorPicker
        disabled={!isEditable}
        color={fontColor}
        onChange={onFontColorSelect}
        icon={Baseline}
        title="Cor do Texto"
      />
      <DropdownColorPicker
        disabled={!isEditable}
        color={bgColor}
        onChange={onBgColorSelect}
        icon={PaintBucket}
        title="Cor de Fundo"
      />

      <Divider />

      {/* Grupo: Espaçamento entre Letras */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={`${btnBase} ${btnInactive}`}
            aria-label="Espaçamento entre Letras"
            title="Espaçamento entre Letras"
            disabled={!isEditable}
            type="button"
          >
            <MoveHorizontal size={18} />
            <ChevronDown size={14} className="ml-1 opacity-50" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {[
            { label: "Normal", value: "normal" },
            { label: "Condensado (−1px)", value: "-1px" },
            { label: "Apertado (−0.5px)", value: "-0.5px" },
            { label: "Padrão (0px)", value: "0px" },
            { label: "Amplo (1px)", value: "1px" },
            { label: "Espaçado (2px)", value: "2px" },
            { label: "Muito Espaçado (4px)", value: "4px" },
          ].map(({ label, value }) => (
            <DropdownMenuItem
              key={value}
              onClick={() => {
                setLetterSpacing(value);
                applyStyleText({ "letter-spacing": value });
              }}
              className={
                letterSpacing === value
                  ? "bg-accent text-accent-foreground"
                  : ""
              }
            >
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Grupo: Espaçamento entre Parágrafos */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={`${btnBase} ${btnInactive}`}
            aria-label="Espaçamento entre Parágrafos"
            title="Espaçamento entre Parágrafos"
            disabled={!isEditable}
            type="button"
          >
            <TextQuote size={18} />
            <ChevronDown size={14} className="ml-1 opacity-50" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {[
            { label: "Nenhum (0)", value: "0px" },
            { label: "Pequeno (4px)", value: "4px" },
            { label: "Médio (8px)", value: "8px" },
            { label: "Grande (16px)", value: "16px" },
            { label: "Extra Grande (24px)", value: "24px" },
          ].map(({ label, value }) => (
            <DropdownMenuItem
              key={value}
              onClick={() => handleParagraphSpacing(value)}
              className={
                paragraphSpacing === value
                  ? "bg-accent text-accent-foreground"
                  : ""
              }
            >
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Grupo: Altura de Linha */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={`${btnBase} ${btnInactive}`}
            aria-label="Altura de Linha"
            title="Altura de Linha"
            disabled={!isEditable}
            type="button"
          >
            <AlignVerticalJustifyStart size={18} />
            <ChevronDown size={14} className="ml-1 opacity-50" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {[
            { label: "Simples (1)", value: "1" },
            { label: "1.15", value: "1.15" },
            { label: "1.5", value: "1.5" },
            { label: "Duplo (2)", value: "2" },
            { label: "2.5", value: "2.5" },
            { label: "3", value: "3" },
          ].map(({ label, value }) => (
            <DropdownMenuItem
              key={value}
              onClick={() => {
                setLineHeight(value);
                applyStyleText({ "line-height": value });
              }}
              className={
                lineHeight === value ? "bg-accent text-accent-foreground" : ""
              }
            >
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Divider />

      {/* Grupo: Listas */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={handleBulletList}
          className={`${btnBase} ${isBulletList ? btnActive : btnInactive}`}
          aria-label="Lista Não Ordenada"
          aria-pressed={isBulletList}
          title="Lista Não Ordenada"
          type="button"
        >
          <List size={18} />
        </button>
        <button
          onClick={handleOrderedList}
          className={`${btnBase} ${isOrderedList ? btnActive : btnInactive}`}
          aria-label="Lista Ordenada"
          aria-pressed={isOrderedList}
          title="Lista Ordenada (Numérica)"
          type="button"
        >
          <ListOrdered size={18} />
        </button>
      </div>

      <Divider />

      {/* Grupo: Recuo */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() =>
            editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)
          }
          className={`${btnBase} ${btnInactive}`}
          aria-label="Diminuir Recuo"
          title="Diminuir Recuo"
          type="button"
        >
          <OutdentIcon size={18} />
        </button>
        <button
          onClick={() =>
            editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)
          }
          className={`${btnBase} ${btnInactive}`}
          aria-label="Aumentar Recuo"
          title="Aumentar Recuo"
          type="button"
        >
          <IndentIcon size={18} />
        </button>
      </div>

      <Divider />

      {/* Grupo: Gerenciamento do Editor & Impressão & Salvar/Carregar */}
      <div className="flex-1 flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrint}
          title="Imprimir"
          type="button"
          className="h-8 w-8 p-0 text-muted-foreground hover:bg-accent rounded-lg"
        >
          <Printer size={16} />
        </Button>

        <Button
          variant="ghost"
          type="button"
          size="sm"
          onClick={() => {
            if (
              window.confirm(
                "Tem certeza que deseja limpar todo o conteúdo do editor?",
              )
            ) {
              editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined);
            }
          }}
          title="Limpar Editor"
          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
        >
          <Trash2 size={16} />
        </Button>
        <Button
          variant="ghost"
          type="button"
          size="sm"
          onClick={clearFormatting}
          title="Limpar formatação"
          className="h-8 w-8 cursor-pointer p-0 text-destructive/50 hover:text-destructive/50 hover:border-destructive/10 hover:bg-transparent rounded-lg"
        >
          <Eraser size={16} className="" />
        </Button>
      </div>
    </div>
  );
}

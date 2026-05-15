"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection, LexicalEditor } from "lexical";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { autoUpdate, offset, shift, useFloating } from "@floating-ui/react";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  $deleteTableColumnAtSelection,
  $deleteTableRowAtSelection,
  $insertTableColumnAtSelection,
  $insertTableRowAtSelection,
  $getTableCellNodeFromLexicalNode,
  $isTableNode,
  $getTableColumnIndexFromTableCellNode,
} from "@lexical/table";
import { $findMatchingParent } from "@lexical/utils";
import { $getNodeByKey } from "lexical";
import {
  $isExtendedTableNode,
  ExtendedTableNode,
} from "../nodes/ExtendedTableNode";

function TableActionMenu({
  editor,
  anchorElem,
}: {
  editor: LexicalEditor;
  anchorElem: HTMLElement;
}) {
  const [tableCellNodeKey, setTableCellNodeKey] = useState<string | null>(null);
  const [isPropertiesDialogOpen, setIsPropertiesDialogOpen] = useState(false);

  // Propriedades do Dialog
  const [cellBgColor, setCellBgColor] = useState("");
  const [colWidth, setColWidth] = useState("");
  const [borderColor, setBorderColor] = useState("");
  const [borderWidth, setBorderWidth] = useState("");
  const [borderStyle, setBorderStyle] = useState("solid");

  const updatePopup = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        setTableCellNodeKey(null);
        return;
      }

      const focusNode = selection.focus.getNode();
      const tableCellNode = $getTableCellNodeFromLexicalNode(focusNode);
      if (tableCellNode) {
        setTableCellNodeKey(tableCellNode.getKey());
      } else {
        setTableCellNodeKey(null);
      }
    });
  }, [editor]);

  useEffect(() => {
    document.addEventListener("selectionchange", updatePopup);
    return () => {
      document.removeEventListener("selectionchange", updatePopup);
    };
  }, [updatePopup]);

  useEffect(() => {
    return editor.registerUpdateListener(() => {
      updatePopup();
    });
  }, [editor, updatePopup]);

  const { refs, floatingStyles } = useFloating({
    middleware: [offset(2), shift()],
    placement: "top-end",
    strategy: "absolute",
    whileElementsMounted: (...args) =>
      autoUpdate(...args, { ancestorScroll: false }),
  });

  useEffect(() => {
    if (tableCellNodeKey) {
      const cellElement = editor.getElementByKey(tableCellNodeKey);
      if (cellElement) {
        refs.setReference({
          getBoundingClientRect: () => cellElement.getBoundingClientRect(),
          getClientRects: () => cellElement.getClientRects(),
        });
      }
    } else {
      refs.setReference(null);
    }
  }, [tableCellNodeKey, refs, editor]);

  if (!tableCellNodeKey) {
    return null;
  }

  return createPortal(
    <div ref={refs.setFloating} style={floatingStyles} className="z-40">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex h-5 w-5 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 focus:outline-none">
            <ChevronDown size={12} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            onClick={() => {
              editor.update(() => {
                $insertTableRowAtSelection(false);
              });
            }}
          >
            Inserir Linha Acima
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              editor.update(() => {
                $insertTableRowAtSelection(true);
              });
            }}
          >
            Inserir Linha Abaixo
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              editor.update(() => {
                $insertTableColumnAtSelection(false);
              });
            }}
          >
            Inserir Coluna à Esquerda
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              editor.update(() => {
                $insertTableColumnAtSelection(true);
              });
            }}
          >
            Inserir Coluna à Direita
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              editor.update(() => {
                $deleteTableRowAtSelection();
              });
            }}
          >
            Excluir Linha
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              editor.update(() => {
                $deleteTableColumnAtSelection();
              });
            }}
          >
            Excluir Coluna
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              editor.getEditorState().read(() => {
                if (tableCellNodeKey) {
                  const cellNode = $getNodeByKey(tableCellNodeKey);
                  if (cellNode) {
                    const tableNode = $findMatchingParent(
                      cellNode,
                      $isTableNode,
                    );
                    if (tableNode && $isExtendedTableNode(tableNode)) {
                      setBorderColor(tableNode.getBorderColor() || "");
                      setBorderWidth(tableNode.getBorderWidth() || "");
                      setBorderStyle(tableNode.getBorderStyle() || "solid");

                      // @ts-ignore
                      setCellBgColor(cellNode.getBackgroundColor() || "");

                      // Get column width
                      const colIndex = $getTableColumnIndexFromTableCellNode(
                        cellNode as any,
                      );
                      const colWidths = tableNode.getColWidths();
                      if (colWidths && colWidths[colIndex]) {
                        setColWidth(colWidths[colIndex].toString());
                      } else {
                        setColWidth("");
                      }
                    }
                  }
                }
              });
              setIsPropertiesDialogOpen(true);
            }}
          >
            Propriedades da Tabela
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                  const focusNode = selection.focus.getNode();
                  const tableNode = $findMatchingParent(
                    focusNode,
                    $isTableNode,
                  );
                  if (tableNode) {
                    tableNode.remove();
                  }
                }
              });
            }}
            className="text-destructive focus:text-destructive"
          >
            Excluir Tabela
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={isPropertiesDialogOpen}
        onOpenChange={setIsPropertiesDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Propriedades da Tabela e Célula</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <h4 className="font-semibold text-sm">Célula Atual e Coluna</h4>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="cellBg" className="text-right text-sm">
                Cor de Fundo
              </label>
              <Input
                id="cellBg"
                type="color"
                value={cellBgColor || "#ffffff"}
                onChange={(e) => setCellBgColor(e.target.value)}
                className="col-span-3 h-10 px-2"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="colWidth" className="text-right text-sm">
                Largura da Coluna (px)
              </label>
              <Input
                id="colWidth"
                type="number"
                placeholder="Ex: 150"
                value={colWidth}
                onChange={(e) => setColWidth(e.target.value)}
                className="col-span-3"
              />
            </div>

            <hr className="my-2" />
            <h4 className="font-semibold text-sm">Bordas da Tabela</h4>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="borderColor" className="text-right text-sm">
                Cor da Borda
              </label>
              <Input
                id="borderColor"
                type="color"
                value={borderColor || "#000000"}
                onChange={(e) => setBorderColor(e.target.value)}
                className="col-span-3 h-10 px-2"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="borderWidth" className="text-right text-sm">
                Espessura
              </label>
              <Input
                id="borderWidth"
                type="text"
                placeholder="Ex: 1px, 2px"
                value={borderWidth}
                onChange={(e) => setBorderWidth(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm">Estilo</label>
              <div className="col-span-3">
                <Select value={borderStyle} onValueChange={setBorderStyle}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sólida" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solid">Sólida</SelectItem>
                    <SelectItem value="dashed">Tracejada</SelectItem>
                    <SelectItem value="dotted">Pontilhada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                editor.update(() => {
                  if (tableCellNodeKey) {
                    const cellNode = $getNodeByKey(tableCellNodeKey);
                    if (cellNode) {
                      if (cellBgColor) {
                        // @ts-ignore
                        cellNode.setBackgroundColor(cellBgColor);
                      }

                      const tableNode = $findMatchingParent(
                        cellNode,
                        $isTableNode,
                      );
                      if (tableNode && $isExtendedTableNode(tableNode)) {
                        if (borderColor) tableNode.setBorderColor(borderColor);
                        if (borderWidth) tableNode.setBorderWidth(borderWidth);
                        if (borderStyle) tableNode.setBorderStyle(borderStyle);

                        if (colWidth) {
                          const colIndex =
                            $getTableColumnIndexFromTableCellNode(
                              cellNode as any,
                            );
                          const currentWidths = tableNode.getColWidths() || [];
                          const newWidths = [...currentWidths];
                          // Preencher se não houver largura
                          for (let i = 0; i < tableNode.getColumnCount(); i++) {
                            if (!newWidths[i]) newWidths[i] = 100; // Padrão
                          }
                          newWidths[colIndex] = parseInt(colWidth, 10);
                          tableNode.setColWidths(newWidths);
                        }
                      }
                    }
                  }
                });
                setIsPropertiesDialogOpen(false);
              }}
            >
              Aplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>,
    anchorElem,
  );
}

export default function TableActionMenuPlugin({
  anchorElem,
}: {
  anchorElem?: HTMLElement;
}) {
  const [editor] = useLexicalComposerContext();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <TableActionMenu editor={editor} anchorElem={anchorElem || document.body} />
  );
}

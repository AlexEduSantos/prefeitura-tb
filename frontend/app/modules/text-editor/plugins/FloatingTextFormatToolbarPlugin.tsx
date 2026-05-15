"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  FORMAT_TEXT_COMMAND,
  LexicalEditor,
} from "lexical";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { autoUpdate, flip, inline, offset, shift, useFloating } from "@floating-ui/react";
import { Bold, Italic, Strikethrough, Underline, Link as LinkIcon, Subscript, Superscript } from "lucide-react";
import { TOGGLE_LINK_COMMAND, $isLinkNode } from "@lexical/link";
import { $patchStyleText } from "@lexical/selection";
import { getSelectedNode, TOGGLE_LINK_EDIT_MODE_COMMAND } from "./FloatingLinkEditorPlugin";

const btnBase =
  "flex cursor-pointer items-center justify-center rounded-md p-1.5 transition-colors duration-150 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500";
const btnInactive = "text-muted-foreground hover:bg-accent hover:text-accent-foreground";
const btnActive = "bg-primary text-primary-foreground";

function FloatingTextFormatToolbar({
  editor,
  anchorElem,
}: {
  editor: LexicalEditor;
  anchorElem: HTMLElement;
}) {
  const [isText, setIsText] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isSubscript, setIsSubscript] = useState(false);
  const [isSuperscript, setIsSuperscript] = useState(false);

  const updatePopup = useCallback(() => {
    editor.getEditorState().read(() => {
      if (editor.isComposing()) {
        return;
      }
      const selection = $getSelection();
      const nativeSelection = window.getSelection();
      const rootElement = editor.getRootElement();

      if (
        nativeSelection !== null &&
        (!$isRangeSelection(selection) ||
          rootElement === null ||
          !rootElement.contains(nativeSelection.anchorNode))
      ) {
        setIsText(false);
        return;
      }

      if (!$isRangeSelection(selection)) {
        return;
      }

      const node = getSelectedNode(selection);

      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));
      setIsSubscript(selection.hasFormat("subscript"));
      setIsSuperscript(selection.hasFormat("superscript"));

      const parent = node.getParent();
      if ($isLinkNode(parent) || $isLinkNode(node)) {
        setIsLink(true);
      } else {
        setIsLink(false);
      }

      if (!selection.isCollapsed() && selection.getTextContent() !== "") {
        setIsText($isTextNode(node) || $isTextNode(parent));
      } else {
        setIsText(false);
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

  const scrollerElem = anchorElem.parentElement;

  const { refs, floatingStyles } = useFloating({
    middleware: [
      inline(),
      offset(10),
      flip({
        boundary: scrollerElem || undefined,
        padding: 10,
      }),
      shift({
        boundary: scrollerElem || undefined,
        crossAxis: true,
        mainAxis: true,
        padding: 10,
      }),
    ],
    placement: "top",
    strategy: "absolute",
    whileElementsMounted: (...args) =>
      autoUpdate(...args, { ancestorScroll: false }),
  });

  useEffect(() => {
    const nativeSelection = window.getSelection();
    if (isText && nativeSelection && nativeSelection.rangeCount > 0) {
      const range = nativeSelection.getRangeAt(0);
      refs.setReference({
        getBoundingClientRect: () => range.getBoundingClientRect(),
        getClientRects: () => range.getClientRects(),
      });
    } else {
      refs.setReference(null);
    }
  }, [isText, refs]);

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

  const applyStyleText = useCallback(
    (styles: Record<string, string>) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, styles);
        }
      });
    },
    [editor],
  );

  if (!isText) {
    return null;
  }

  return createPortal(
    <div
      ref={refs.setFloating}
      style={floatingStyles}
      className="z-50 flex items-center gap-1 rounded-md border border-border bg-popover p-1 shadow-md will-change-transform"
    >
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
        }}
        className={`${btnBase} ${isBold ? btnActive : btnInactive}`}
        aria-label="Format Bold"
      >
        <Bold size={16} />
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
        }}
        className={`${btnBase} ${isItalic ? btnActive : btnInactive}`}
        aria-label="Format Italics"
      >
        <Italic size={16} />
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
        }}
        className={`${btnBase} ${isUnderline ? btnActive : btnInactive}`}
        aria-label="Format Underline"
      >
        <Underline size={16} />
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
        }}
        className={`${btnBase} ${isStrikethrough ? btnActive : btnInactive}`}
        aria-label="Format Strikethrough"
      >
        <Strikethrough size={16} />
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "subscript");
        }}
        className={`${btnBase} ${isSubscript ? btnActive : btnInactive}`}
        aria-label="Format Subscript"
      >
        <Subscript size={16} />
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "superscript");
        }}
        className={`${btnBase} ${isSuperscript ? btnActive : btnInactive}`}
        aria-label="Format Superscript"
      >
        <Superscript size={16} />
      </button>
      <button
        onClick={() => applyStyleText({ "text-transform": "uppercase" })}
        className={`${btnBase} ${btnInactive} w-8`}
        aria-label="Uppercase"
      >
        <span className="text-sm font-bold">ABC</span>
      </button>
      <button
        onClick={() => applyStyleText({ "text-transform": "lowercase" })}
        className={`${btnBase} ${btnInactive} w-8`}
        aria-label="Lowercase"
      >
        <span className="text-sm font-bold">abc</span>
      </button>
      <button
        onClick={() => applyStyleText({ "text-transform": "capitalize" })}
        className={`${btnBase} ${btnInactive} w-8`}
        aria-label="Capitalize"
      >
        <span className="text-sm font-bold">Tt</span>
      </button>
      <button
        onClick={insertLink}
        className={`${btnBase} ${isLink ? btnActive : btnInactive}`}
        aria-label="Insert Link"
      >
        <LinkIcon size={16} />
      </button>
    </div>,
    anchorElem
  );
}

export default function FloatingTextFormatToolbarPlugin({
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
    <FloatingTextFormatToolbar
      editor={editor}
      anchorElem={anchorElem || document.body}
    />
  );
}

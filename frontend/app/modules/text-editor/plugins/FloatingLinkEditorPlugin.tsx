"use client";

import { useCallback, useEffect, useRef, useState, Dispatch } from "react";
import { createPortal } from "react-dom";

import {
  autoUpdate,
  flip,
  inline,
  offset,
  shift,
  useFloating,
} from "@floating-ui/react";
import {
  $createLinkNode,
  $isAutoLinkNode,
  $isLinkNode,
  LinkNode,
  TOGGLE_LINK_COMMAND,
} from "@lexical/link";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import {
  $getSelection,
  $isDecoratorNode,
  $isLineBreakNode,
  $isNodeSelection,
  $isRangeSelection,
  BaseSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  getDOMSelection,
  KEY_ESCAPE_COMMAND,
  LexicalEditor,
  RangeSelection,
  SELECTION_CHANGE_COMMAND,
  createCommand,
  LexicalCommand,
} from "lexical";
import { $isAtNodeEnd } from "@lexical/selection";
import { Edit2, Trash2, Check, X, ExternalLink } from "lucide-react";

export const TOGGLE_LINK_EDIT_MODE_COMMAND: LexicalCommand<boolean> = createCommand(
  "TOGGLE_LINK_EDIT_MODE_COMMAND"
);

export function getSelectedNode(selection: RangeSelection) {
  const anchor = selection.anchor;
  const focus = selection.focus;
  const anchorNode = selection.anchor.getNode();
  const focusNode = selection.focus.getNode();
  if (anchorNode === focusNode) {
    return anchorNode;
  }
  const isBackward = selection.isBackward();
  if (isBackward) {
    return $isAtNodeEnd(focus) ? anchorNode : focusNode;
  } else {
    return $isAtNodeEnd(anchor) ? focusNode : anchorNode;
  }
}

export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (["http:", "https:", "mailto:", "tel:"].includes(parsed.protocol)) {
      return parsed.href;
    }
  } catch (e) {
    // not a valid URL yet
  }
  return "about:blank";
}

function $getSelectedLinkNode(selection: RangeSelection): LinkNode | null {
  const node = getSelectedNode(selection);
  // 1. Node itself is a link
  if ($isLinkNode(node)) {
    return node;
  }
  // 2. Parent is a link
  const linkParent = $findMatchingParent(node, $isLinkNode);
  if ($isLinkNode(linkParent)) {
    return linkParent;
  }
  // 3. Right-biased adjacent link (for single-char links)
  if (selection.isCollapsed()) {
    const anchor = selection.anchor;
    if (anchor.type === "text") {
      const anchorNode = anchor.getNode();
      if (anchor.offset === anchorNode.getTextContentSize()) {
        const nextSibling = anchorNode.getNextSibling();
        if ($isLinkNode(nextSibling)) {
          return nextSibling;
        }
      }
    }
  }
  return null;
}

function preventDefault(
  event: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent<HTMLElement>,
): void {
  event.preventDefault();
}

function FloatingLinkEditor({
  editor,
  isLink,
  setIsLink,
  anchorElem,
  isLinkEditMode,
  setIsLinkEditMode,
}: {
  editor: LexicalEditor;
  isLink: boolean;
  setIsLink: Dispatch<boolean>;
  anchorElem: HTMLElement;
  isLinkEditMode: boolean;
  setIsLinkEditMode: Dispatch<boolean>;
}) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [editedLinkUrl, setEditedLinkUrl] = useState("https://");
  const [lastSelection, setLastSelection] = useState<BaseSelection | null>(
    null,
  );

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
    placement: "bottom-start",
    strategy: "absolute",
    whileElementsMounted: (...args) =>
      autoUpdate(...args, { ancestorScroll: false }),
  });

  const $updateLinkEditor = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const linkNode = $getSelectedLinkNode(selection);
      if (linkNode) {
        setLinkUrl(linkNode.getURL());
      } else {
        setLinkUrl("");
      }
      if (isLinkEditMode) {
        setEditedLinkUrl(linkUrl);
      }
    } else if ($isNodeSelection(selection)) {
      const nodes = selection.getNodes();
      if (nodes.length > 0) {
        const node = nodes[0];
        const parent = node.getParent();
        if ($isLinkNode(parent)) {
          setLinkUrl(parent.getURL());
        } else if ($isLinkNode(node)) {
          setLinkUrl(node.getURL());
        } else {
          setLinkUrl("");
        }
        if (isLinkEditMode) {
          setEditedLinkUrl(linkUrl);
        }
      }
    }

    const nativeSelection = getDOMSelection(editor._window);
    const activeElement = document.activeElement;
    const rootElement = editor.getRootElement();

    if (selection !== null && rootElement !== null && editor.isEditable()) {
      let referenceElement: Element | null = null;

      if ($isNodeSelection(selection)) {
        const nodes = selection.getNodes();
        if (nodes.length > 0) {
          referenceElement = editor.getElementByKey(nodes[0].getKey());
        }
      } else if (
        $isRangeSelection(selection) &&
        nativeSelection !== null &&
        nativeSelection.rangeCount > 0 &&
        rootElement.contains(nativeSelection.anchorNode)
      ) {
        const linkNode = $getSelectedLinkNode(selection);
        if (linkNode) {
          const onlyChild =
            linkNode.getChildrenSize() === 1 ? linkNode.getFirstChild() : null;
          referenceElement =
            onlyChild && $isDecoratorNode(onlyChild)
              ? editor.getElementByKey(onlyChild.getKey())
              : editor.getElementByKey(linkNode.getKey());
        }
      }

      if (referenceElement) {
        const refEl = referenceElement;
        refs.setPositionReference({
          getBoundingClientRect: () => refEl.getBoundingClientRect(),
          getClientRects: () => refEl.getClientRects(),
        });
      } else if (
        nativeSelection !== null &&
        nativeSelection.rangeCount > 0 &&
        rootElement.contains(nativeSelection.anchorNode)
      ) {
        refs.setPositionReference(nativeSelection.getRangeAt(0));
      }
      setLastSelection(selection);
    } else if (!activeElement || activeElement.className !== "link-input") {
      setLastSelection(null);
      setIsLinkEditMode(false);
      setLinkUrl("");
    }

    return true;
  }, [editor, setIsLinkEditMode, isLinkEditMode, linkUrl, refs]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateLinkEditor();
        });
      }),

      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          $updateLinkEditor();
          return true;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        () => {
          if (isLink) {
            setIsLink(false);
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_HIGH,
      ),
    );
  }, [editor, $updateLinkEditor, setIsLink, isLink]);

  useEffect(() => {
    editor.getEditorState().read(() => {
      $updateLinkEditor();
    });
  }, [editor, $updateLinkEditor]);

  useEffect(() => {
    if (isLinkEditMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLinkEditMode, isLink]);

  useEffect(() => {
    const editorElement = editorRef.current;
    if (editorElement === null) {
      return;
    }
    const handleBlur = (event: FocusEvent) => {
      if (!editorElement.contains(event.relatedTarget as Element) && isLink) {
        setIsLink(false);
        setIsLinkEditMode(false);
      }
    };
    editorElement.addEventListener("focusout", handleBlur);
    return () => {
      editorElement.removeEventListener("focusout", handleBlur);
    };
  }, [editorRef, setIsLink, setIsLinkEditMode, isLink]);

  const monitorInputInteraction = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Enter") {
      handleLinkSubmission(event);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setIsLinkEditMode(false);
    }
  };

  const handleLinkSubmission = (
    event:
      | React.KeyboardEvent<HTMLInputElement>
      | React.MouseEvent<HTMLElement>,
  ) => {
    event.preventDefault();
    if (lastSelection !== null) {
      if (linkUrl !== "") {
        editor.update(() => {
          editor.dispatchCommand(
            TOGGLE_LINK_COMMAND,
            sanitizeUrl(editedLinkUrl),
          );
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const parent = getSelectedNode(selection).getParent();
            if ($isAutoLinkNode(parent)) {
              const linkNode = $createLinkNode(parent.getURL(), {
                rel: parent.__rel,
                target: parent.__target,
                title: parent.__title,
              });
              parent.replace(linkNode, true);
            }
          }
        });
      }
      setEditedLinkUrl("https://");
      setIsLinkEditMode(false);
    }
  };

  return (
    <div
      ref={(el) => {
        editorRef.current = el;
        refs.setFloating(el);
      }}
      className="absolute z-10 top-0 left-0 flex items-center gap-1 bg-card shadow-md border border-border rounded-lg p-1.5 transition-opacity duration-200"
      style={{
        ...floatingStyles,
        opacity: isLink ? 1 : 0,
        pointerEvents: isLink ? "auto" : "none",
      }}
    >
      {!isLink ? null : isLinkEditMode ? (
        <>
          <input
            ref={inputRef}
            className="w-64 px-2 py-1 bg-input/50 border border-transparent rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring text-sm"
            value={editedLinkUrl}
            onChange={(event) => {
              setEditedLinkUrl(event.target.value);
            }}
            onKeyDown={(event) => {
              monitorInputInteraction(event);
            }}
          />
          <div className="flex items-center">
            <button
              className="p-1.5 rounded hover:bg-accent text-muted-foreground ml-1 cursor-pointer flex items-center justify-center transition-colors"
              onMouseDown={preventDefault}
              onClick={() => {
                setIsLinkEditMode(false);
              }}
              title="Cancel"
            >
              <X size={16} />
            </button>
            <button
              className="p-1.5 rounded hover:bg-accent text-primary ml-1 cursor-pointer flex items-center justify-center transition-colors"
              onMouseDown={preventDefault}
              onClick={handleLinkSubmission}
              title="Confirm"
            >
              <Check size={16} />
            </button>
          </div>
        </>
      ) : (
        <div className="flex items-center gap-2 text-sm px-1">
          <a
            href={sanitizeUrl(linkUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline max-w-48 truncate overflow-hidden flex items-center gap-1"
          >
            {linkUrl}
            <ExternalLink size={14} className="flex-shrink-0" />
          </a>
          <button
            className="p-1.5 rounded hover:bg-accent text-muted-foreground ml-1 cursor-pointer flex items-center justify-center transition-colors"
            onMouseDown={preventDefault}
            onClick={(event) => {
              event.preventDefault();
              setEditedLinkUrl(linkUrl);
              setIsLinkEditMode(true);
            }}
            title="Edit link"
          >
            <Edit2 size={16} />
          </button>
          <button
            className="p-1.5 rounded hover:bg-accent text-destructive ml-1 cursor-pointer flex items-center justify-center transition-colors"
            onMouseDown={preventDefault}
            onClick={() => {
              editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
            }}
            title="Remove link"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

function FloatingLinkEditorToolbar({
  editor,
  anchorElem,
  isLinkEditMode,
  setIsLinkEditMode,
}: {
  editor: LexicalEditor;
  anchorElem: HTMLElement;
  isLinkEditMode: boolean;
  setIsLinkEditMode: Dispatch<boolean>;
}) {
  const [activeEditor, setActiveEditor] = useState(editor);
  const [isLink, setIsLink] = useState(false);

  useEffect(() => {
    function $updateToolbar() {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const focusLinkNode = $getSelectedLinkNode(selection);
        const focusNode = getSelectedNode(selection);
        const focusAutoLinkNode = $findMatchingParent(
          focusNode,
          $isAutoLinkNode,
        );
        if (!(focusLinkNode || focusAutoLinkNode)) {
          setIsLink(false);
          return;
        }
        const badNode = selection
          .getNodes()
          .filter((node) => !$isLineBreakNode(node))
          .find((node) => {
            const linkNode = $findMatchingParent(node, $isLinkNode);
            const autoLinkNode = $findMatchingParent(node, $isAutoLinkNode);
            return (
              (focusLinkNode && !focusLinkNode.is(linkNode)) ||
              (linkNode && !linkNode.is(focusLinkNode)) ||
              (focusAutoLinkNode && !focusAutoLinkNode.is(autoLinkNode)) ||
              (autoLinkNode &&
                (!autoLinkNode.is(focusAutoLinkNode) ||
                  autoLinkNode.getIsUnlinked()))
            );
          });
        if (!badNode) {
          setIsLink(true);
        } else {
          setIsLink(false);
        }
      } else if ($isNodeSelection(selection)) {
        const nodes = selection.getNodes();
        if (nodes.length === 0) {
          setIsLink(false);
          return;
        }
        const node = nodes[0];
        const parent = node.getParent();
        if ($isLinkNode(parent) || $isLinkNode(node)) {
          setIsLink(true);
        } else {
          setIsLink(false);
        }
      }
    }
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateToolbar();
        });
      }),
      editor.registerCommand(
        TOGGLE_LINK_EDIT_MODE_COMMAND,
        (payload) => {
          setIsLinkEditMode(payload);
          return true;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_payload, newEditor) => {
          $updateToolbar();
          setActiveEditor(newEditor);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        CLICK_COMMAND,
        (payload) => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const node = getSelectedNode(selection);
            const linkNode = $findMatchingParent(node, $isLinkNode);
            if ($isLinkNode(linkNode) && (payload.metaKey || payload.ctrlKey)) {
              window.open(linkNode.getURL(), "_blank");
              return true;
            }
          }
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor]);

  return createPortal(
    <FloatingLinkEditor
      editor={activeEditor}
      isLink={isLink}
      anchorElem={anchorElem}
      setIsLink={setIsLink}
      isLinkEditMode={isLinkEditMode}
      setIsLinkEditMode={setIsLinkEditMode}
    />,
    anchorElem,
  );
}

export default function FloatingLinkEditorPlugin({
  anchorElem,
}: {
  anchorElem?: HTMLElement;
}) {
  const [editor] = useLexicalComposerContext();
  const [isLinkEditMode, setIsLinkEditMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <FloatingLinkEditorToolbar
      editor={editor}
      anchorElem={anchorElem || document.body}
      isLinkEditMode={isLinkEditMode}
      setIsLinkEditMode={setIsLinkEditMode}
    />
  );
}

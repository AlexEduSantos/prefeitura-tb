import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  createCommand,
  LexicalCommand,
} from "lexical";
import { $insertNodeToNearestRoot, mergeRegister } from "@lexical/utils";
import { useEffect } from "react";
import {
  $createCollapsibleContainerNode,
  CollapsibleContainerNode,
} from "../nodes/collapsible/CollapsibleContainerNode";
import {
  $createCollapsibleTitleNode,
  CollapsibleTitleNode,
} from "../nodes/collapsible/CollapsibleTitleNode";
import {
  $createCollapsibleContentNode,
  CollapsibleContentNode,
} from "../nodes/collapsible/CollapsibleContentNode";

export const INSERT_COLLAPSIBLE_COMMAND: LexicalCommand<void> = createCommand(
  "INSERT_COLLAPSIBLE_COMMAND",
);

export default function CollapsiblePlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        INSERT_COLLAPSIBLE_COMMAND,
        () => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            return false;
          }

          const containerNode = $createCollapsibleContainerNode(true);
          const titleNode = $createCollapsibleTitleNode();
          const contentNode = $createCollapsibleContentNode();

          // Title starts empty
          const paragraphNode = $createParagraphNode();
          contentNode.append(paragraphNode);

          containerNode.append(titleNode, contentNode);
          $insertNodeToNearestRoot(containerNode);

          titleNode.selectStart();
          return true;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor]);

  return null;
}

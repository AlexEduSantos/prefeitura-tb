export function extractTextFromLexical(jsonContent: string | object): string {
  try {
    const content =
      typeof jsonContent === "string" ? JSON.parse(jsonContent) : jsonContent;

    let text = "";

    const traverse = (node: any) => {
      if (node.text) {
        text += node.text + " ";
      }
      if (node.children) {
        node.children.forEach(traverse);
      }
    };

    // O nó "root" contém todo o conteúdo
    if (content.root) {
      traverse(content.root);
    }

    return text.trim();
  } catch (e) {
    return "";
  }
}

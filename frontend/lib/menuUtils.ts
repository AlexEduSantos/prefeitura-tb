import { IMenuItem } from "@/app/type/menu";

export type FlatMenuItem = IMenuItem & { level: number };

function buildTree(
  items: IMenuItem[],
): (IMenuItem & { children: IMenuItem[] })[] {
  const sorted = [...items].sort((a, b) => a.order - b.order);
  const map = new Map<string, IMenuItem & { children: IMenuItem[] }>();
  const roots: (IMenuItem & { children: IMenuItem[] })[] = [];

  sorted.forEach((item) => {
    map.set(item.id, { ...item, children: [] });
  });

  sorted.forEach((item) => {
    const node = map.get(item.id)!;
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

export function flattenTreeWithLevel(items: IMenuItem[]): FlatMenuItem[] {
  const tree = buildTree(items);
  const result: FlatMenuItem[] = [];

  function traverse(node: any, level: number) {
    const { children, ...rest } = node;
    result.push({ ...rest, level });
    node.children.forEach((child: any) => traverse(child, level + 1));
  }

  tree.forEach((root) => traverse(root, 0));
  return result;
}

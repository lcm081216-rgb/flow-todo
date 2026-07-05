import type { TodoNode, TreeNodeWithChildren } from './types';

export function getNodeIcon(type: string, hasChildren?: boolean): string {
  if (type === 'group') {
    return hasChildren ? 'folder' : 'folder-open';
  }
  return 'circle';
}

export function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len) + '…';
}

export function countDescendants(nodeId: string, nodes: Record<string, TodoNode>): { tasks: number; completed: number } {
  let tasks = 0;
  let completed = 0;
  const walk = (parentId: string) => {
    Object.values(nodes).forEach(n => {
      if (n.parentId === parentId) {
        if (n.type === 'task') {
          tasks++;
          if (n.completed) completed++;
        }
        if (n.type === 'group') walk(n.id);
      }
    });
  };
  walk(nodeId);
  return { tasks, completed };
}

export function findNodePath(nodeId: string, nodes: Record<string, TodoNode>): string[] {
  const path: string[] = [];
  let current = nodes[nodeId];
  while (current) {
    path.unshift(current.title);
    current = current.parentId ? nodes[current.parentId] : undefined as any;
  }
  return path;
}

export function flattenTree(tree: TreeNodeWithChildren[]): TreeNodeWithChildren[] {
  const result: TreeNodeWithChildren[] = [];
  const walk = (items: TreeNodeWithChildren[]) => {
    for (const item of items) {
      result.push(item);
      if (item.children.length > 0) walk(item.children);
    }
  };
  walk(tree);
  return result;
}

export function isAncestorOf(nodeId: string, targetId: string, nodes: Record<string, TodoNode>): boolean {
  if (nodeId === targetId) return true;
  const target = nodes[targetId];
  if (!target || !target.parentId) return false;
  return isAncestorOf(nodeId, target.parentId, nodes);
}

export function getDragImage(type: string, title: string): HTMLElement {
  const el = document.createElement('div');
  el.style.cssText = 'padding: 6px 14px; background: #6366f1; color: #fff; border-radius: 8px; font-size: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); position: absolute; top: -9999px; left: -9999px;';
  el.textContent = `${type === 'group' ? '📁' : '☐'} ${title}`;
  document.body.appendChild(el);
  return el;
}

export function resizeImage(file: File, maxDim = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

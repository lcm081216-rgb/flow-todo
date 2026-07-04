export type NodeType = 'group' | 'task';

export interface TodoNode {
  id: string;
  type: NodeType;
  title: string;
  parentId: string | null;
  order: number;
  completed: boolean;
  createdAt: number;
}

export interface TreeNodeWithChildren extends TodoNode {
  children: TreeNodeWithChildren[];
}

export type Action =
  | { type: 'ADD_NODE'; payload: { type: NodeType; title: string; parentId: string | null } }
  | { type: 'UPDATE_NODE'; payload: { id: string; title?: string; completed?: boolean } }
  | { type: 'DELETE_NODE'; payload: { id: string } }
  | { type: 'MOVE_NODE'; payload: { id: string; newParentId: string | null; newOrder: number } }
  | { type: 'REORDER_CHILDREN'; payload: { parentId: string | null; orderedIds: string[] } }
  | { type: 'LOAD_STATE'; payload: { nodes: Record<string, TodoNode> } }
  | { type: 'IMPORT_DATA'; payload: { nodes: Record<string, TodoNode> } };

export interface TodoState {
  nodes: Record<string, TodoNode>;
  selectedGroupId: string | null;
}

export interface StoreContextType {
  state: TodoState;
  dispatch: React.Dispatch<Action>;
  getChildren: (parentId: string | null) => TodoNode[];
  getNode: (id: string) => TodoNode | undefined;
  getAncestors: (id: string) => TodoNode[];
  getTree: () => TreeNodeWithChildren[];
  selectGroup: (id: string | null) => void;
}

import React, { createContext, useContext, useReducer, useCallback, useMemo, useEffect } from 'react';
import type { TodoNode, TodoState, Action, StoreContextType, TreeNodeWithChildren } from './types';
import { pushToCloud, pullFromCloud, subscribeToChanges, getSyncId, setSyncId as setSyncIdStorage } from './lib/sync';
import { ensureTableExists } from './lib/create-table';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function todoReducer(state: TodoState, action: Action): TodoState {
  switch (action.type) {
    case 'ADD_NODE': {
      const { type, title, parentId } = action.payload;
      const children = Object.values(state.nodes).filter(n => n.parentId === parentId);
      const maxOrder = children.length > 0 ? Math.max(...children.map(n => n.order)) : -1;
      const newNode: TodoNode = {
        id: generateId(),
        type,
        title: title.trim(),
        parentId,
        order: maxOrder + 1,
        completed: false,
        createdAt: Date.now(),
      };
      return { ...state, nodes: { ...state.nodes, [newNode.id]: newNode } };
    }
    case 'UPDATE_NODE': {
      const { id, title, completed, type: newType, images } = action.payload;
      const node = state.nodes[id];
      if (!node) return state;
      const updated: TodoNode = {
        ...node,
        ...(title !== undefined ? { title: title.trim() } : {}),
        ...(completed !== undefined ? { completed } : {}),
        ...(newType !== undefined ? { type: newType } : {}),
        ...(images !== undefined ? { images } : {}),
      };
      return { ...state, nodes: { ...state.nodes, [id]: updated } };
    }
    case 'DELETE_NODE': {
      const { id } = action.payload;
      // Recursively collect all descendant ids
      const idsToDelete = new Set<string>([id]);
      const collectDescendants = (parentId: string) => {
        Object.values(state.nodes).forEach(n => {
          if (n.parentId === parentId && !idsToDelete.has(n.id)) {
            idsToDelete.add(n.id);
            collectDescendants(n.id);
          }
        });
      };
      collectDescendants(id);
      const newNodes: Record<string, TodoNode> = {};
      Object.entries(state.nodes).forEach(([key, node]) => {
        if (!idsToDelete.has(key)) {
          newNodes[key] = node;
        }
      });
      return { ...state, nodes: newNodes };
    }
    case 'MOVE_NODE': {
      const { id, newParentId, newOrder } = action.payload;
      const node = state.nodes[id];
      if (!node || node.parentId === newParentId) return state;
      // Prevent circular: can't move a group into its own descendant
      const isDescendant = (ancestorId: string, targetId: string): boolean => {
        if (ancestorId === targetId) return true;
        const target = state.nodes[targetId];
        if (!target || !target.parentId) return false;
        return isDescendant(ancestorId, target.parentId);
      };
      if (node.type === 'group' && newParentId !== null && isDescendant(id, newParentId)) {
        return state; // Can't move a parent into its child
      }
      // Reorder siblings at the old parent
      const oldSiblings = Object.values(state.nodes)
        .filter(n => n.parentId === node.parentId && n.id !== id)
        .sort((a, b) => a.order - b.order);
      oldSiblings.forEach((n, i) => { n.order = i; });
      // Reorder siblings at the new parent
      const newSiblings = Object.values(state.nodes)
        .filter(n => n.parentId === newParentId && n.id !== id)
        .sort((a, b) => a.order - b.order);
      newSiblings.forEach((n, i) => { n.order = i < newOrder ? i : i + 1; });
      const updatedNode = { ...node, parentId: newParentId, order: newOrder };
      return {
        ...state,
        nodes: {
          ...state.nodes,
          [id]: updatedNode,
          ...Object.fromEntries(oldSiblings.map(n => [n.id, n])),
          ...Object.fromEntries(newSiblings.map(n => [n.id, n])),
        },
      };
    }
    case 'REORDER_CHILDREN': {
      const { parentId, orderedIds } = action.payload;
      const updated: Record<string, TodoNode> = {};
      orderedIds.forEach((id, index) => {
        const node = state.nodes[id];
        if (node) {
          updated[id] = { ...node, order: index };
        }
      });
      return { ...state, nodes: { ...state.nodes, ...updated } };
    }
    case 'LOAD_STATE':
    case 'IMPORT_DATA':
      return { ...state, nodes: action.payload.nodes };
    default:
      return state;
  }
}

const STORAGE_KEY = 'todo-tree-data';

function loadInitialState(): TodoState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const nodes = JSON.parse(saved) as Record<string, TodoNode>;
      return { nodes, selectedGroupId: null };
    }
  } catch {}
  // Default data
  const rootId = generateId();
  const workId = generateId();
  const hobbyId = generateId();
  const bikeId = generateId();
  const taskId = generateId();
  const subTaskId = generateId();
  const nodes: Record<string, TodoNode> = {
    [rootId]: { id: rootId, type: 'group', title: '我的待办', parentId: null, order: 0, completed: false, createdAt: Date.now() - 10000 },
    [workId]: { id: workId, type: 'group', title: '工作', parentId: rootId, order: 0, completed: false, createdAt: Date.now() - 8000 },
    [hobbyId]: { id: hobbyId, type: 'group', title: '爱好', parentId: rootId, order: 1, completed: false, createdAt: Date.now() - 6000 },
    [bikeId]: { id: bikeId, type: 'group', title: '骑行', parentId: hobbyId, order: 0, completed: false, createdAt: Date.now() - 4000 },
    [taskId]: { id: taskId, type: 'task', title: '给自行车换个轮子', parentId: bikeId, order: 0, completed: false, createdAt: Date.now() - 2000 },
    [subTaskId]: { id: subTaskId, type: 'task', title: '买一对700C公路车轮组', parentId: taskId, order: 0, completed: true, createdAt: Date.now() - 1000 },
  };
  return { nodes, selectedGroupId: null };
}

const TodoContext = createContext<StoreContextType | null>(null);

export type SyncStatus = 'local' | 'syncing' | 'synced' | 'error';

export function TodoProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(todoReducer, null, loadInitialState);
  const [selectedGroupId, setSelectedGroupId] = React.useState<string | null>(null);
  const [syncId, setSyncIdState] = React.useState<string>(() => getSyncId());
  const [syncStatus, setSyncStatus] = React.useState<SyncStatus>(syncId ? 'synced' : 'local');

  // Auto-select the root group on first load
  useEffect(() => {
    if (!selectedGroupId) {
      const rootNode = Object.values(state.nodes).find(n => n.parentId === null);
      if (rootNode) setSelectedGroupId(rootNode.id);
    }
  }, [state.nodes, selectedGroupId]);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.nodes));
    } catch {}
  }, [state.nodes]);

  const getNode = useCallback(
    (id: string) => state.nodes[id],
    [state.nodes]
  );

  // --- Cloud Sync ---
  const lastPushedRef = React.useRef<string>('');
  const initialSyncDoneRef = React.useRef(false);
  const pushTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial sync: pull from cloud on mount if syncId exists
  useEffect(() => {
    if (!syncId) {
      initialSyncDoneRef.current = true;
      return;
    }

    const doInitialSync = async () => {
      setSyncStatus('syncing');
      try {
        await ensureTableExists();
        const data = await pullFromCloud(syncId);
        if (data && typeof data === 'object' && Object.keys(data).length > 0) {
          // Remote data exists — use it as source of truth
          dispatch({ type: 'LOAD_STATE', payload: { nodes: data } });
          lastPushedRef.current = JSON.stringify(data);
        } else {
          // No remote data yet — push local data to cloud
          const ok = await pushToCloud(state.nodes, syncId);
          if (ok) lastPushedRef.current = JSON.stringify(state.nodes);
        }
        setSyncStatus('synced');
      } catch {
        setSyncStatus('local');
      }
      initialSyncDoneRef.current = true;
    };

    doInitialSync();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to real-time changes
  useEffect(() => {
    if (!syncId) return;
    const unsub = subscribeToChanges(syncId, (remoteData) => {
      const dataStr = JSON.stringify(remoteData);
      if (dataStr !== lastPushedRef.current) {
        // Change came from another device — load it
        dispatch({ type: 'LOAD_STATE', payload: { nodes: remoteData } });
      }
    });
    return unsub;
  }, [syncId]);

  // Debounced push on local state changes
  useEffect(() => {
    if (!syncId || !initialSyncDoneRef.current) return;

    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(async () => {
      setSyncStatus('syncing');
      const ok = await pushToCloud(state.nodes, syncId);
      if (ok) {
        setSyncStatus('synced');
        lastPushedRef.current = JSON.stringify(state.nodes);
      } else {
        setSyncStatus('error');
      }
    }, 800);
    return () => { if (pushTimerRef.current) clearTimeout(pushTimerRef.current); };
  }, [state.nodes, syncId, syncStatus]);

  const getChildren = useCallback(
    (parentId: string | null) =>
      Object.values(state.nodes)
        .filter(n => n.parentId === parentId)
        .sort((a, b) => a.order - b.order),
    [state.nodes]
  );

  const getAncestors = useCallback(
    (id: string): TodoNode[] => {
      const result: TodoNode[] = [];
      let current = state.nodes[id];
      while (current && current.parentId !== null) {
        const parent = state.nodes[current.parentId];
        if (parent) {
          result.unshift(parent);
          current = parent;
        } else break;
      }
      return result;
    },
    [state.nodes]
  );

  const getTree = useCallback((): TreeNodeWithChildren[] => {
    const build = (parentId: string | null): TreeNodeWithChildren[] =>
      Object.values(state.nodes)
        .filter(n => n.parentId === parentId)
        .sort((a, b) => a.order - b.order)
        .map(n => ({
          ...n,
          children: build(n.id),
        }));
    return build(null);
  }, [state.nodes]);

  const selectGroup = useCallback((id: string | null) => {
    setSelectedGroupId(id);
  }, []);

  const changeSyncId = useCallback((newId: string) => {
    const trimmed = newId.trim();
    if (trimmed) {
      setSyncIdStorage(trimmed);
      setSyncIdState(trimmed);
      setSyncStatus('synced');
    }
  }, []);

  const value = useMemo(
    () => ({
      state: { ...state, selectedGroupId },
      dispatch,
      getChildren,
      getNode,
      getAncestors,
      getTree,
      selectGroup,
      syncId,
      syncStatus,
      changeSyncId,
    }),
    [
      state,
      selectedGroupId,
      dispatch,
      getChildren,
      getNode,
      getAncestors,
      getTree,
      selectGroup,
      syncId,
      syncStatus,
      changeSyncId,
    ]
  );

  return React.createElement(TodoContext.Provider, { value }, children);
}

export function useTodoStore() {
  const ctx = useContext(TodoContext);
  if (!ctx) throw new Error('useTodoStore must be used within TodoProvider');
  return ctx;
}

export function useExport() {
  const { state } = useTodoStore();
  return useCallback(() => {
    const blob = new Blob([JSON.stringify(state.nodes, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `todo-tree-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state.nodes]);
}

export function useImport() {
  const { dispatch } = useTodoStore();
  return useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const nodes = JSON.parse(reader.result as string);
          dispatch({ type: 'IMPORT_DATA', payload: { nodes } });
        } catch {}
      };
      reader.readAsText(file);
    };
    input.click();
  }, [dispatch]);
}

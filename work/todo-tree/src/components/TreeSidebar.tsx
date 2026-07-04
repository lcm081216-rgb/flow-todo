import { useState, useCallback } from 'react';
import { Download, Upload, Plus, ListTodo, Inbox } from 'lucide-react';
import { useTodoStore, useExport, useImport } from '../store';
import TreeNode from './TreeNode';
import type { TodoNode } from '../types';

interface Props {
  onNavigate?: () => void;
}

export default function TreeSidebar({ onNavigate }: Props) {
  const { state, dispatch, getChildren, getNode } = useTodoStore();
  const exportData = useExport();
  const importData = useImport();

  const roots = getChildren(null);

  const handleDropOnNode = useCallback((e: React.DragEvent, targetNode: TodoNode) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId || draggedId === targetNode.id) return;
    const dragged = getNode(draggedId);
    if (!dragged) return;
    if (targetNode.type === 'group') {
      const children = getChildren(targetNode.id);
      dispatch({
        type: 'MOVE_NODE',
        payload: { id: draggedId, newParentId: targetNode.id, newOrder: children.length },
      });
    }
  }, [dispatch, getChildren, getNode]);

  return (
    <div className="flex flex-col h-full">
      {/* Tools */}
      <div className="shrink-0 px-3 pt-3 pb-2 flex items-center gap-1">
        <button
          onClick={exportData}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          title="导出"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={importData}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          title="导入"
        >
          <Upload className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1 px-2">
        {roots.length === 0 ? (
          <div className="text-center py-10 text-gray-300">
            <Inbox className="w-8 h-8 mx-auto mb-2" />
            <p className="text-xs">还没有分组</p>
          </div>
        ) : (
          roots.map(node => (
            <TreeNode
              key={node.id}
              node={node}
              depth={0}
              onDrop={handleDropOnNode}
              onNavigate={onNavigate}
            />
          ))
        )}
      </div>

      {/* Add root group */}
      <div className="shrink-0 px-3 py-2 border-t border-gray-50">
        <button
          onClick={() => {
            const title = prompt('输入新分组名称：');
            if (title?.trim()) {
              dispatch({ type: 'ADD_NODE', payload: { type: 'group', title: title.trim(), parentId: null } });
            }
          }}
          className="flex items-center justify-center gap-1.5 w-full py-2 text-xs text-gray-400 hover:text-indigo-500 hover:bg-indigo-50/60 rounded-xl transition-colors border border-dashed border-gray-200 hover:border-indigo-200"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>新分组</span>
        </button>
      </div>
    </div>
  );
}

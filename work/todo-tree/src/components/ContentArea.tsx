import { useCallback, useMemo } from 'react';
import { ArrowLeft, ListTodo, Inbox, ChevronRight } from 'lucide-react';
import { useTodoStore } from '../store';
import Breadcrumb from './Breadcrumb';
import ItemCard from './ItemCard';
import AddItemForm from './AddItemForm';
import type { TodoNode } from '../types';
import { countDescendants } from '../utils';

function GroupHeader({ nodeId }: { nodeId: string }) {
  const { state } = useTodoStore();
  const node = state.nodes[nodeId];
  const stats = countDescendants(nodeId, state.nodes);
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const pct = stats.tasks > 0 ? stats.completed / stats.tasks : 0;
  const offset = circumference * (1 - pct);

  return (
    <div className="bg-white rounded-2xl p-5 mb-4 todo-card">
      <div className="flex items-center gap-4">
        {/* Progress ring */}
        <svg width="48" height="48" viewBox="0 0 48 48" className="shrink-0">
          <circle cx="24" cy="24" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="3.5" />
          {stats.tasks > 0 && (
            <circle cx="24" cy="24" r={radius} fill="none" stroke="#6366f1" strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="progress-ring-circle"
              transform="rotate(-90 24 24)"
            />
          )}
          <text x="24" y="24" textAnchor="middle" dominantBaseline="central"
            fill="#6366f1" fontSize="11" fontWeight="700">
            {stats.tasks > 0 ? `${Math.round(pct * 100)}%` : '0'}
          </text>
        </svg>

        <div className="flex-1 min-w-0">
          <h2 className="text-[17px] font-bold text-gray-800">{node?.title}</h2>
          {stats.tasks > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">
              {stats.completed}/{stats.tasks} 已完成 · {stats.tasks - stats.completed} 进行中
            </p>
          )}
          {stats.tasks === 0 && (
            <p className="text-xs text-gray-400 mt-0.5">暂无任务</p>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ hasParent }: { hasParent: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mb-5">
        <ListTodo className="w-8 h-8 text-indigo-200" />
      </div>
      <p className="text-sm text-gray-400 mb-1">
        {hasParent ? '这个分组还没有内容' : '还没有待办事项'}
      </p>
      <p className="text-xs text-gray-300">点击下方按钮添加任务或分组</p>
    </div>
  );
}

export default function ContentArea() {
  const { state, dispatch, getChildren, getNode, selectGroup } = useTodoStore();
  const { selectedGroupId } = state;

  const currentNode = selectedGroupId ? getNode(selectedGroupId) : null;
  const children = getChildren(selectedGroupId);
  const parentNode = currentNode?.parentId ? getNode(currentNode.parentId) : null;

  const handleDrop = useCallback((e: React.DragEvent, targetNode: TodoNode) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId || draggedId === targetNode.id) return;
    const dragged = getNode(draggedId);
    if (!dragged) return;

    if (targetNode.type === 'group') {
      const siblings = getChildren(targetNode.id);
      dispatch({ type: 'MOVE_NODE', payload: { id: draggedId, newParentId: targetNode.id, newOrder: siblings.length } });
    } else {
      const siblings = getChildren(targetNode.parentId);
      const idx = siblings.findIndex(s => s.id === targetNode.id);
      dispatch({ type: 'MOVE_NODE', payload: { id: draggedId, newParentId: targetNode.parentId, newOrder: idx + 1 } });
    }
  }, [dispatch, getChildren, getNode]);

  const handleDropOnArea = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId) return;
    const siblings = getChildren(selectedGroupId);
    dispatch({ type: 'MOVE_NODE', payload: { id: draggedId, newParentId: selectedGroupId, newOrder: siblings.length } });
  }, [dispatch, getChildren, selectedGroupId]);

  const taskItems = useMemo(() => children.filter(n => n.type === 'task'), [children]);
  const groupItems = useMemo(() => children.filter(n => n.type === 'group'), [children]);

  // If no current node and no root, show empty
  if (!currentNode && !selectedGroupId) {
    return (
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <EmptyState hasParent={false} />
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto" onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }} onDrop={handleDropOnArea}>
        {/* Top bar */}
        <div className="px-4 md:px-6 pt-4 pb-1">
          {parentNode && (
            <button onClick={() => selectGroup(parentNode.id)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-500 mb-2 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              返回 {parentNode.title}
            </button>
          )}
          {currentNode && (
            <div className="flex items-center gap-1 mb-2">
              <span className="text-xs text-gray-400">当前：</span>
              <Breadcrumb />
            </div>
          )}
        </div>

        {/* Group header with progress ring */}
        {currentNode && currentNode.type === 'group' && (
          <div className="px-4 md:px-6 pb-4">
            <GroupHeader nodeId={currentNode.id} />
          </div>
        )}

        {/* Items */}
        <div className="px-4 md:px-6 pb-4">
          {children.length === 0 ? (
            <EmptyState hasParent={!!currentNode} />
          ) : (
            <div className="space-y-2 slide-up">
              {/* Groups first */}
              {groupItems.length > 0 && groupItems.map(node => (
                <ItemCard key={node.id} node={node} onDrop={handleDrop} />
              ))}
              {/* Tasks */}
              {taskItems.length > 0 && taskItems.map(node => (
                <ItemCard key={node.id} node={node} onDrop={handleDrop} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add form */}
      <div className="shrink-0 px-4 md:px-6 py-3 bg-white/80 backdrop-blur-sm border-t border-gray-100">
        <AddItemForm parentId={selectedGroupId} />
      </div>
    </main>
  );
}

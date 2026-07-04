import { useState, useRef, useEffect } from 'react';
import { ChevronRight, Circle, CheckCircle2, Trash2, Edit3, Plus, ListTodo } from 'lucide-react';
import { useTodoStore } from '../store';
import type { TodoNode } from '../types';
import { countDescendants } from '../utils';

interface Props {
  node: TodoNode;
  depth?: number;
  onDragStart?: (e: React.DragEvent, node: TodoNode) => void;
  onDragOver?: (e: React.DragEvent, node: TodoNode) => void;
  onDrop?: (e: React.DragEvent, targetNode: TodoNode) => void;
  onNavigate?: () => void;
}

function MiniBar({ done, total }: { done: number; total: number }) {
  if (total === 0) return null;
  const pct = Math.round((done / total) * 100);
  return (
    <span className="text-[10px] text-gray-400 tabular-nums shrink-0 ml-auto">{done}/{total}</span>
  );
}

export default function TreeNode({ node, depth = 0, onDragStart, onDragOver, onDrop, onNavigate }: Props) {
  const { state, dispatch, getChildren, selectGroup } = useTodoStore();
  const { selectedGroupId } = state;
  const children = getChildren(node.id);
  const hasChildren = children.length > 0;
  const isGroup = node.type === 'group';
  const isSelected = selectedGroupId === node.id;

  const [expanded, setExpanded] = useState(depth < 2);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(node.title);
  const [showAdd, setShowAdd] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

  const handleSave = () => {
    if (editTitle.trim() && editTitle.trim() !== node.title) {
      dispatch({ type: 'UPDATE_NODE', payload: { id: node.id, title: editTitle.trim() } });
    }
    setEditing(false);
  };

  const stats = isGroup ? countDescendants(node.id, state.nodes) : null;

  const handleClick = () => {
    if (isGroup) {
      selectGroup(node.id);
      onNavigate?.();
    }
  };

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  return (
    <div>
      <div
        className={`group flex items-center gap-1 px-2 py-1.5 rounded-xl cursor-pointer transition-all ${
          isSelected
            ? 'bg-indigo-50 text-indigo-700'
            : 'hover:bg-gray-50 text-gray-600'
        }`}
        onClick={handleClick}
        draggable
        onDragStart={e => {
          e.dataTransfer.setData('text/plain', node.id);
          e.dataTransfer.effectAllowed = 'move';
          onDragStart?.(e, node);
        }}
        onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; onDragOver?.(e, node); }}
        onDrop={e => { e.preventDefault(); onDrop?.(e, node); }}
      >
        <span className="w-3.5 shrink-0 flex items-center justify-center">
          {isGroup && hasChildren ? (
            <button onClick={toggleExpand} className="p-0.5 rounded hover:bg-gray-200/60 transition-colors">
              <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
            </button>
          ) : <span className="w-3" />}
        </span>

        <span className="shrink-0">
          {isGroup ? (
            <ListTodo className="w-4 h-4 text-indigo-400" />
          ) : node.completed ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <Circle className="w-3.5 h-3.5 text-gray-300" />
          )}
        </span>

        {editing ? (
          <input
            ref={inputRef}
            type="text" value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            onBlur={handleSave}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') { setEditing(false); setEditTitle(node.title); } }}
            className="flex-1 min-w-0 text-xs px-1 py-0.5 border border-indigo-300 rounded-lg bg-white outline-none"
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 min-w-0 text-xs truncate ml-0.5">{node.title}</span>
        )}

        {stats && <MiniBar done={stats.completed} total={stats.tasks} />}

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={e => { e.stopPropagation(); setEditing(true); setEditTitle(node.title); }}
            className="p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors" title="重命名">
            <Edit3 className="w-2.5 h-2.5" />
          </button>
          {isGroup && (
            <button onClick={e => { e.stopPropagation(); setShowAdd(!showAdd); }}
              className="p-0.5 rounded hover:bg-indigo-100 text-gray-400 hover:text-indigo-600 transition-colors" title="添加子项">
              <Plus className="w-2.5 h-2.5" />
            </button>
          )}
          <button onClick={e => {
            e.stopPropagation();
            if (confirm(`确定删除「${node.title}」吗？${isGroup && hasChildren ? '其所有子项也将被删除。' : ''}`))
              dispatch({ type: 'DELETE_NODE', payload: { id: node.id } });
          }}
            className="p-0.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors" title="删除">
            <Trash2 className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      {isGroup && expanded && (
        <div className="ml-3 border-l border-gray-50 pl-1">
          {children.length > 0 && children.map(child => (
            <TreeNode key={child.id} node={child} depth={depth + 1}
              onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} onNavigate={onNavigate} />
          ))}
          {showAdd && (
            <div className="pl-2 py-1">
              <InlineAdd parentId={node.id} onDone={() => setShowAdd(false)} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InlineAdd({ parentId, onDone }: { parentId: string; onDone: () => void }) {
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { dispatch } = useTodoStore();
  useEffect(() => { inputRef.current?.focus(); }, []);

  const submit = (type: 'group' | 'task') => {
    if (title.trim()) {
      dispatch({ type: 'ADD_NODE', payload: { type, title: title.trim(), parentId } });
      setTitle(''); inputRef.current?.focus();
    }
  };

  return (
    <div className="flex items-center gap-1 fade-in">
      <input ref={inputRef} type="text" value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') submit('task'); if (e.key === 'Escape') onDone(); }}
        placeholder="名称..." className="flex-1 min-w-0 text-xs px-2 py-1 border border-gray-200 rounded-lg outline-none focus:border-indigo-300 bg-white" />
      <button onClick={() => submit('task')} className="px-2 py-0.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">任务</button>
      <button onClick={() => submit('group')} className="px-2 py-0.5 text-xs font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors">分组</button>
      <button onClick={onDone} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><XIcon size={12} /></button>
    </div>
  );
}

function XIcon({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
}

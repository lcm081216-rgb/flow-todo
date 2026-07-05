import { useState, useRef, useEffect } from 'react';
import { Circle, CheckCircle2, Trash2, Edit3, ArrowRight, ListTodo, FolderPlus, FileText, ImagePlus } from 'lucide-react';
import { useTodoStore } from '../store';
import type { TodoNode } from '../types';
import { countDescendants, resizeImage } from '../utils';
import ContextMenu from './ContextMenu';

interface Props {
  node: TodoNode;
  onDragStart?: (e: React.DragEvent, node: TodoNode) => void;
  onDragOver?: (e: React.DragEvent, node: TodoNode) => void;
  onDrop?: (e: React.DragEvent, node: TodoNode) => void;
}

/* ── SVG Progress Ring ── */
function ProgressRing({ done, total, size = 40, stroke = 4 }: { done: number; total: number; size?: number; stroke?: number }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = total > 0 ? done / total : 0;
  const offset = circumference * (1 - pct);
  const center = size / 2;

  return (
    <svg width={size} height={size} className="shrink-0" viewBox={`0 0 ${size} ${size}`}>
      <circle cx={center} cy={center} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
      <circle cx={center} cy={center} r={radius} fill="none" stroke="#10b981" strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="progress-ring-circle"
        transform={`rotate(-90 ${center} ${center})`}
      />
      <text x={center} y={center} textAnchor="middle" dominantBaseline="central"
        className="fill-gray-500" fontSize="9" fontWeight="500">
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
}

/* ── Task Item ── */
function TaskCard({ node, onDragStart }: { node: TodoNode; onDragStart?: (e: React.DragEvent, node: TodoNode) => void }) {
  const { dispatch } = useTodoStore();
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(node.title);
  const [ctxPos, setCtxPos] = useState<{ x: number; y: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewerIdx, setViewerIdx] = useState<number | null>(null);
  const images = node.images || [];
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setEditTitle(node.title); }, [node.title]);
  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

  const handleSave = () => {
    if (editTitle.trim() && editTitle.trim() !== node.title) {
      dispatch({ type: 'UPDATE_NODE', payload: { id: node.id, title: editTitle.trim() } });
    }
    setEditing(false);
  };

  return (
    <>
    <div
      className="todo-card group"
      draggable
      onContextMenu={e => {
        e.preventDefault();
        setCtxPos({ x: e.clientX, y: e.clientY });
      }}
      onDragStart={e => {
        e.dataTransfer.setData('text/plain', node.id);
        e.dataTransfer.effectAllowed = 'move';
        onDragStart?.(e, node);
      }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
      {/* Animated checkbox */}
      <button
        onClick={() => dispatch({ type: 'UPDATE_NODE', payload: { id: node.id, completed: !node.completed } })}
        className="shrink-0 transition-all duration-200 active:scale-90"
      >
        {node.completed ? (
          <CheckCircle2 className="w-6 h-6 text-emerald-500" strokeWidth={2.5} />
        ) : (
          <Circle className="w-6 h-6 text-gray-300 hover:text-indigo-400 transition-colors" strokeWidth={2} />
        )}
      </button>

      {/* Title */}
      {editing ? (
        <input ref={inputRef} type="text" value={editTitle}
          onChange={e => setEditTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') { setEditing(false); setEditTitle(node.title); } }}
          className="flex-1 text-sm px-2 py-1 border border-indigo-300 rounded-lg bg-white outline-none" />
      ) : (
        <span className={`flex-1 text-sm transition-all duration-200 ${
          node.completed ? 'text-gray-400 line-through' : 'text-gray-800'
        }`}>
          {node.title}
        </span>
      )}

      {/* Actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200 shrink-0">
        <button onClick={() => { setEditing(true); setEditTitle(node.title); }}
          onContextMenu={e => e.stopPropagation()}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="编辑">
          <Edit3 className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => { if (confirm(`删除「${node.title}」？`)) dispatch({ type: 'DELETE_NODE', payload: { id: node.id } }); }}
          onContextMenu={e => e.stopPropagation()}
          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="删除">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => fileInputRef.current?.click()}
          onContextMenu={e => e.stopPropagation()}
          className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-500 transition-colors" title="添加图片">
          <ImagePlus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
    {ctxPos && (
      <ContextMenu
        x={ctxPos.x}
        y={ctxPos.y}
        items={[
          { label: '转换为分组', icon: <FolderPlus className="w-4 h-4 text-indigo-500" />, onClick: () => dispatch({ type: 'UPDATE_NODE', payload: { id: node.id, type: 'group' } }) },
          { label: '转换为任务', icon: <FileText className="w-4 h-4 text-gray-400" />, onClick: () => {}, disabled: true },
        ]}
        onClose={() => setCtxPos(null)}
      />
    )}
    </div>
    </>
  );
}

/* ── Group Item ── */
function GroupCard({ node, onDragStart, onDragOver, onDrop }: {
  node: TodoNode;
  onDragStart?: (e: React.DragEvent, node: TodoNode) => void;
  onDragOver?: (e: React.DragEvent, node: TodoNode) => void;
  onDrop?: (e: React.DragEvent, node: TodoNode) => void;
}) {
  const { state, dispatch, selectGroup } = useTodoStore();
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(node.title);
  const [ctxPos, setCtxPos] = useState<{ x: number; y: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const stats = countDescendants(node.id, state.nodes);

  useEffect(() => { setEditTitle(node.title); }, [node.title]);
  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

  const handleSave = () => {
    if (editTitle.trim() && editTitle.trim() !== node.title) {
      dispatch({ type: 'UPDATE_NODE', payload: { id: node.id, title: editTitle.trim() } });
    }
    setEditing(false);
  };

  return (
    <>
    <div
      className="todo-card px-4 py-3 flex items-center gap-3 group cursor-pointer hover:border-indigo-100/80"
      onClick={() => selectGroup(node.id)}
      draggable
      onContextMenu={e => {
        e.preventDefault();
        e.stopPropagation();
        setCtxPos({ x: e.clientX, y: e.clientY });
      }}
      onDragStart={e => {
        e.dataTransfer.setData('text/plain', node.id);
        e.dataTransfer.effectAllowed = 'move';
        e.stopPropagation();
        onDragStart?.(e, node);
      }}
      onDragOver={e => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        onDragOver?.(e, node);
      }}
      onDrop={e => {
        e.preventDefault();
        e.stopPropagation();
        onDrop?.(e, node);
      }}
    >
      {/* Progress ring or icon */}
      <div className="shrink-0">
        {stats.tasks > 0 ? (
          <ProgressRing done={stats.completed} total={stats.tasks} size={40} stroke={3.5} />
        ) : (
          <div className="w-10 h-10 flex items-center justify-center bg-indigo-50 rounded-full">
            <ListTodo className="w-5 h-5 text-indigo-400" />
          </div>
        )}
      </div>

      {/* Title + info */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input ref={inputRef} type="text" value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            onBlur={handleSave}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') { setEditing(false); setEditTitle(node.title); } }}
            className="w-full text-sm px-2 py-1 border border-indigo-300 rounded-lg bg-white outline-none"
            onClick={e => e.stopPropagation()} />
        ) : (
          <>
            <span className="text-sm font-medium text-gray-800 block">{node.title}</span>
            {stats.tasks > 0 && (
              <span className="text-[11px] text-gray-400 mt-0.5 block">
                {stats.completed}/{stats.tasks} 已完成
              </span>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200 shrink-0">
        <button onClick={e => { e.stopPropagation(); setEditing(true); }}
          onContextMenu={e => e.stopPropagation()}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="重命名">
          <Edit3 className="w-3.5 h-3.5" />
        </button>
        <button onClick={e => { e.stopPropagation(); if (confirm(`删除分组「${node.title}」？`)) dispatch({ type: 'DELETE_NODE', payload: { id: node.id } }); }}
          onContextMenu={e => e.stopPropagation()}
          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="删除">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        <button onClick={e => { e.stopPropagation(); selectGroup(node.id); }}
          onContextMenu={e => e.stopPropagation()}
          className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-500 transition-colors" title="进入">
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
    {ctxPos && (
      <ContextMenu
        x={ctxPos.x}
        y={ctxPos.y}
        items={[
          { label: '转换为分组', icon: <FolderPlus className="w-4 h-4 text-indigo-500" />, onClick: () => {}, disabled: true },
          { label: '转换为任务', icon: <FileText className="w-4 h-4 text-gray-500" />, onClick: () => dispatch({ type: 'UPDATE_NODE', payload: { id: node.id, type: 'task' } }) },
        ]}
        onClose={() => setCtxPos(null)}
      />
    )}
    </>
  );
}

export default function ItemCard(props: Props) {
  return props.node.type === 'group'
    ? <GroupCard node={props.node} onDragStart={props.onDragStart} onDragOver={props.onDragOver} onDrop={props.onDrop} />
    : <TaskCard node={props.node} onDragStart={props.onDragStart} />;
}

import { useState, useRef, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { useTodoStore } from '../store';
import type { NodeType } from '../types';

interface Props {
  parentId: string | null;
  autoFocus?: boolean;
  onDone?: () => void;
}

export default function AddItemForm({ parentId, autoFocus = false, onDone }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { dispatch } = useTodoStore();

  useEffect(() => { if (open && autoFocus && inputRef.current) inputRef.current.focus(); }, [open, autoFocus]);

  const submit = (type: NodeType) => {
    if (title.trim()) {
      dispatch({ type: 'ADD_NODE', payload: { type, title: title.trim(), parentId } });
      setTitle(''); inputRef.current?.focus(); onDone?.();
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-1.5 w-full py-2.5 text-sm text-gray-400 hover:text-indigo-500 hover:bg-indigo-50/50 rounded-xl border border-dashed border-gray-200 hover:border-indigo-200 transition-all">
        <Plus className="w-4 h-4" />
        <span>添加</span>
      </button>
    );
  }

  return (
    <div className="scale-in">
      <div className="flex items-center gap-2 bg-white border border-indigo-200 rounded-xl px-3.5 py-2 shadow-sm">
        <input ref={inputRef} type="text" value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit('task'); if (e.key === 'Escape') { setOpen(false); setTitle(''); onDone?.(); } }}
          placeholder="任务名称，回车添加"
          className="flex-1 text-sm outline-none bg-transparent placeholder-gray-400" />
        <div className="flex items-center gap-1">
          <button onClick={() => submit('task')}
            className="px-2.5 py-1 text-xs font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors">任务</button>
          <button onClick={() => submit('group')}
            className="px-2.5 py-1 text-xs font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors">分组</button>
          <button onClick={() => { setOpen(false); setTitle(''); onDone?.(); }}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ml-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

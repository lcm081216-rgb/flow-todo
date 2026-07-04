import { ChevronRight } from 'lucide-react';
import { useTodoStore } from '../store';

export default function Breadcrumb() {
  const { state, getNode, selectGroup, getAncestors } = useTodoStore();

  if (!state.selectedGroupId) return null;
  const currentNode = getNode(state.selectedGroupId);
  if (!currentNode) return null;

  const ancestors = getAncestors(state.selectedGroupId);
  const path = [...ancestors, currentNode];

  return (
    <nav className="flex items-center gap-1 text-xs text-gray-400 overflow-x-auto pb-0.5">
      {path.map((node, i) => (
        <div key={node.id} className="flex items-center gap-1 shrink-0">
          {i > 0 && <ChevronRight className="w-3 h-3 text-gray-300" />}
          {i === path.length - 1 ? (
            <span className="text-indigo-600 font-medium truncate max-w-[160px]">{node.title}</span>
          ) : (
            <button onClick={() => selectGroup(node.id)}
              className="hover:text-gray-600 transition-colors truncate max-w-[120px]">{node.title}</button>
          )}
        </div>
      ))}
    </nav>
  );
}

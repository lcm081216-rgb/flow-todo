import { useEffect, useRef } from 'react';

export interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

interface Props {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}

export default function ContextMenu({ x, y, items, onClose }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Adjust position so menu doesn't clip off-screen
  const adjustedX = Math.min(x, window.innerWidth - 180);
  const adjustedY = Math.min(y, window.innerHeight - items.length * 36 - 16);

  // Escape key to close — keep this simple (native listener)
  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', keyHandler);
    return () => document.removeEventListener('keydown', keyHandler);
  }, []);

  return (
    <>
      {/* 
        Transparent backdrop — catches clicks anywhere outside the menu.
        Using React's onMouseDown (synthetic event), so no native listener issues.
      */}
      <div
        className="fixed inset-0 z-[998]"
        onMouseDown={() => onClose()}
        onContextMenu={e => { e.preventDefault(); e.stopPropagation(); }}
      />

      {/* Context menu */}
      <div
        ref={menuRef}
        className="fixed z-[999] bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[160px] overflow-hidden"
        style={{ left: adjustedX, top: adjustedY }}
        onMouseDown={e => {
          // Stop propagation so the backdrop doesn't catch clicks on the menu itself.
          // In React 19, this prevents the synthetic event from reaching parent elements.
          e.stopPropagation();
        }}
        onContextMenu={e => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {items.map((item, i) => (
          <button
            key={i}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={() => {
              if (!item.disabled) {
                item.onClick();
                onClose();
              }
            }}
            disabled={item.disabled}
          >
            {item.icon && <span className="w-4 h-4 shrink-0 flex items-center">{item.icon}</span>}
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
}

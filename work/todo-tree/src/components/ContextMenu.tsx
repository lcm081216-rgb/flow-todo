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

  useEffect(() => {
    // Use 'click' event instead of 'mousedown' because right-click 
    // (which opens the menu) does NOT generate a 'click' event — 
    // so it can never accidentally close the menu it just opened.
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onCloseRef.current();
      }
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };

    document.addEventListener('click', handler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('click', handler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, []);

  return (
    <div
      ref={menuRef}
      className="fixed z-[999] bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[160px] overflow-hidden"
      style={{ left: adjustedX, top: adjustedY }}
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
  );
}

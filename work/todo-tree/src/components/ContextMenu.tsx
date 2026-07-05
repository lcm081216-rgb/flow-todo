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
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    // Delay so the same click that opened us doesn't close us
    const raf = requestAnimationFrame(() => {
      document.addEventListener('mousedown', handler);
      document.addEventListener('keydown', keyHandler);
    });
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, [onClose]);

  // Adjust position so menu doesn't clip off-screen
  const adjustedX = Math.min(x, window.innerWidth - 180);
  const adjustedY = Math.min(y, window.innerHeight - items.length * 36 - 16);

  return (
    <div
      ref={ref}
      className="context-menu fixed z-[999] bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[160px] overflow-hidden"
      style={{ left: adjustedX, top: adjustedY }}
    >
      {items.map((item, i) => (
        <button
          key={i}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={() => { if (!item.disabled) { item.onClick(); onClose(); } }}
          disabled={item.disabled}
        >
          {item.icon && <span className="w-4 h-4 shrink-0 flex items-center">{item.icon}</span>}
          {item.label}
        </button>
      ))}
    </div>
  );
}

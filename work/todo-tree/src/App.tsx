import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { TodoProvider, useTodoStore } from './store';
import TreeSidebar from './components/TreeSidebar';
import ContentArea from './components/ContentArea';
import SyncIndicator from './components/SyncIndicator';

function AppContent() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-gray-50">
      {/* Mobile header */}
      <header className="md:hidden shrink-0 header-gradient text-white px-4 flex items-center justify-between" style={{ height: 'var(--header-height)' }}>
        <button
          onClick={() => setDrawerOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 active:bg-white/20 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-[15px] font-semibold tracking-wide">Flow Todo</span>
        <div className="w-9" />
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <>
          <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} />
          <div className="drawer-panel flex flex-col">
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-50">
              <span className="text-[15px] font-semibold text-gray-800 tracking-wide">Flow Todo</span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <TreeSidebar onNavigate={() => setDrawerOpen(false)} />
            </div>
            <div className="shrink-0">
              <SyncIndicator />
            </div>
          </div>
        </>
      )}

      {/* Desktop layout */}
      <div className="flex-1 flex overflow-hidden">
        <aside className="sidebar-desktop flex-col bg-white border-r border-gray-100" style={{ width: 'var(--sidebar-width)' }}>
          <div className="shrink-0 px-4 py-3 border-b border-gray-50 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg header-gradient flex items-center justify-center">
              <span className="text-white text-xs font-bold">✓</span>
            </div>
            <span className="text-sm font-semibold text-gray-800 tracking-wide">Flow Todo</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <TreeSidebar />
          </div>
          <div className="shrink-0">
            <SyncIndicator />
          </div>
        </aside>
        <ContentArea />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <TodoProvider>
      <AppContent />
    </TodoProvider>
  );
}

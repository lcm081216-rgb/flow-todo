import { useTodoStore } from '../store'
import type { SyncStatus } from '../store'

const icons: Record<SyncStatus, string> = {
  local: '○',
  syncing: '◎',
  synced: '●',
  error: '⚠',
}
const colors: Record<SyncStatus, string> = {
  local: 'text-gray-300',
  syncing: 'text-blue-500',
  synced: 'text-emerald-500',
  error: 'text-red-500',
}
const labels: Record<SyncStatus, string> = {
  local: '本地存储',
  syncing: '同步中...',
  synced: '已同步',
  error: '同步失败',
}

export default function SyncIndicator() {
  const { syncStatus, syncId, changeSyncId } = useTodoStore()
  const status = syncStatus || 'local'
  const id = syncId || ''
  const [editing, setEditing] = useState(false)
  const [editId, setEditId] = useState(id)

  return (
    <div className="px-3 py-1.5 border-t border-gray-50 flex items-center gap-1.5 text-xs group">
      <span className={`${colors[status]} transition-colors`} title={labels[status]}>
        {icons[status]}
      </span>
      <span className="text-gray-400 flex-1 truncate" title={`同步ID: ${id}`}>
        {editing ? (
          <input
            autoFocus
            className="w-full px-1 py-0.5 border border-gray-200 rounded text-xs outline-none"
            value={editId}
            onChange={e => setEditId(e.target.value)}
            onBlur={() => { changeSyncId?.(editId); setEditing(false) }}
            onKeyDown={e => { if (e.key === 'Enter') { changeSyncId?.(editId); setEditing(false) } }}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span
            className="cursor-pointer hover:text-gray-600"
            onClick={() => { setEditId(id); setEditing(true) }}
          >
            {status === 'local' ? '点击设置同步ID' : id.slice(0, 12) + '...'}
          </span>
        )}
      </span>
    </div>
  )
}

import { useState } from 'react'

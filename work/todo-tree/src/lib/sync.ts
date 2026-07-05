import { supabase } from './supabase'

const SYNC_ID_KEY = 'todo-sync-id'

export function getSyncId(): string {
  let id = localStorage.getItem(SYNC_ID_KEY)
  if (!id) {
    id = generateId()
    localStorage.setItem(SYNC_ID_KEY, id)
  }
  return id
}

export function setSyncId(id: string) {
  if (id && id.trim()) {
    localStorage.setItem(SYNC_ID_KEY, id.trim())
    return true
  }
  return false
}

function generateId(): string {
  const arr = new Uint8Array(8)
  crypto.getRandomValues(arr)
  return Array.from(arr, b => b.toString(36).padStart(2, '0')).join('').slice(0, 12)
}

// Push to Supabase
export async function pushToCloud(data: any, syncId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('todos')
      .upsert({
        sync_id: syncId,
        data,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'sync_id'
      })
    if (error) throw error
    return true
  } catch (e) {
    console.warn('Sync push failed:', e)
    return false
  }
}

// Pull from Supabase
export async function pullFromCloud(syncId: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('todos')
      .select('data, updated_at')
      .eq('sync_id', syncId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data?.data || null
  } catch (e) {
    console.warn('Sync pull failed:', e)
    return null
  }
}

// Subscribe to real-time changes
export function subscribeToChanges(syncId: string, onUpdate: (data: any) => void) {
  const channel = supabase
    .channel(`todos:sync_id=eq.${syncId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'todos',
        filter: `sync_id=eq.${syncId}`
      },
      (payload) => {
        if (payload.new && (payload.new as any).data) {
          onUpdate((payload.new as any).data)
        }
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

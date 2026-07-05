// Auto-migration script - runs on first app load
import { supabase } from './supabase'

export async function ensureTableExists(): Promise<boolean> {
  try {
    // Try to query the table to see if it exists
    const { error } = await supabase.from('todos').select('id').limit(1)
    
    // If table exists, no error (or PGRST116 = no rows found, which is fine)
    if (!error || error.code === 'PGRST116') return true
    
    // Table doesn't exist, nothing we can do from the client side
    console.warn('Sync table not available, will use localStorage only:', error.message)
    return false
  } catch (e) {
    console.warn('Sync check failed:', e)
    return false
  }
}

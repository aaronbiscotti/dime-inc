// This file is kept for backwards compatibility
// New code should use @/utils/supabase/client instead
import { createClient as createSupabaseClient } from '@/utils/supabase/client'

export const supabase = createSupabaseClient()
export const createClient = createSupabaseClient
import { createClient } from './supabase/client'

// Use the singleton client from client.ts to avoid multiple instances
export const supabase = createClient()


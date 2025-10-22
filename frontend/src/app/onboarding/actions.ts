'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function completeAmbassador(_: unknown, fd: FormData) {
  const full_name = String(fd.get('full_name') || '')
  const bio = String(fd.get('bio') || '')
  const supabase = await createClient()

  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) throw new Error('Unauthenticated')

  // get profiles.id (same as auth.user.id)
  const userId = auth.user.id

  const { error } = await supabase.from('ambassador_profiles').insert({
    user_id: userId,
    full_name,
    bio,
  })
  if (error) throw error
  redirect('/dashboard')
}

export async function completeClient(_: unknown, fd: FormData) {
  const company_name = String(fd.get('company_name') || '')
  const company_description = String(fd.get('company_description') || '')
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) throw new Error('Unauthenticated')

  const userId = auth.user.id
  const { error } = await supabase.from('client_profiles').insert({
    user_id: userId,
    company_name,
    company_description,
  })
  if (error) throw error
  redirect('/dashboard')
}

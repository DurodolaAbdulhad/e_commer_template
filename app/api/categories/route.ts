import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export const revalidate = 60

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, parent_id, is_active, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    if (error) throw error
    return NextResponse.json({ categories: data ?? [] })
  } catch {
    return NextResponse.json({ categories: [] })
  }
}

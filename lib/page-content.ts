import { createClient } from './supabase-server'

export async function getPageContent(slug: string): Promise<any> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('id', `store_page_${slug}`)
      .single()
    return data?.value ?? null
  } catch {
    return null
  }
}

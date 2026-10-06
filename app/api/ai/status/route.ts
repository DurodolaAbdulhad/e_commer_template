import { NextResponse } from 'next/server'
import { getServiceClient, isServiceClientReady } from '@/lib/supabase-service'

export async function GET() {
  if (!isServiceClientReady()) return NextResponse.json({ enabled: false })
  const supabase = getServiceClient()
  const { data } = await supabase
    .from('site_settings')
    .select('value')
    .eq('id', 'store_ai_api_key')
    .maybeSingle()
  const enabled = !!(data?.value && String(data.value).trim().length > 10)
  return NextResponse.json({ enabled })
}

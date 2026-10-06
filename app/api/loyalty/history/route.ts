import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient, isServiceClientReady } from '@/lib/supabase-service'

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')?.trim().toLowerCase()
  if (!email) return NextResponse.json({ rows: [] })

  if (!isServiceClientReady()) return NextResponse.json({ rows: [] })

  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('loyalty_points')
    .select('type, points, description, created_at')
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error || !data) return NextResponse.json({ rows: [] })

  return NextResponse.json({ rows: data })
}

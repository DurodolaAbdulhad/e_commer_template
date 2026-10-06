import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient, isServiceClientReady } from '@/lib/supabase-service'

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')?.trim().toLowerCase()
  if (!email) return NextResponse.json({ points: 0 })

  if (!isServiceClientReady()) return NextResponse.json({ points: 0 })

  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('loyalty_points')
    .select('type, points')
    .eq('email', email)

  if (error || !data) return NextResponse.json({ points: 0 })

  const balance = data.reduce((acc, row) => {
    return row.type === 'earn' ? acc + Number(row.points) : acc - Number(row.points)
  }, 0)

  return NextResponse.json({ points: Math.max(0, balance) })
}

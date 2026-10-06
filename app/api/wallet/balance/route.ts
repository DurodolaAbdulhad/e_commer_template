import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient, isServiceClientReady } from '@/lib/supabase-service'

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')?.trim().toLowerCase()
  if (!email) return NextResponse.json({ balance: 0 })

  if (!isServiceClientReady()) return NextResponse.json({ balance: 0 })

  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('wallet_ledger')
    .select('type, amount')
    .eq('email', email)

  if (error || !data) return NextResponse.json({ balance: 0 })

  const balance = data.reduce((acc, row) => {
    return row.type === 'credit' ? acc + Number(row.amount) : acc - Number(row.amount)
  }, 0)

  return NextResponse.json({ balance: Math.max(0, balance) })
}

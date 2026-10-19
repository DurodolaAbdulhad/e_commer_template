import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-auth'
import { getServiceClient } from '@/lib/supabase-service'

// POST /api/admin/chats/[id]/mode — switch ai/human mode
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await verifyAdminToken(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { mode } = await req.json()
  if (mode !== 'ai' && mode !== 'human') {
    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
  }

  const supabase = getServiceClient()
  await supabase.from('conversations').update({ mode }).eq('id', params.id)

  return NextResponse.json({ ok: true })
}

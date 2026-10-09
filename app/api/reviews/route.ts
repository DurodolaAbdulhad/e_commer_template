import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient, isServiceClientReady } from '@/lib/supabase-service'

export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get('productId')
  if (!productId) return NextResponse.json({ reviews: [] })

  if (!isServiceClientReady()) return NextResponse.json({ reviews: [] })

  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('product_reviews')
    .select('id, nickname, summary, body, rating, created_at')
    .eq('product_id', productId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ reviews: [] })
  return NextResponse.json({ reviews: data ?? [] })
}

export async function POST(req: NextRequest) {
  if (!isServiceClientReady()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const body = await req.json().catch(() => ({}))
  const { productId, nickname, summary, reviewBody, rating } = body

  if (!productId || !nickname?.trim() || !reviewBody?.trim() || !rating) {
    return NextResponse.json({ error: 'productId, nickname, body and rating are required' }, { status: 400 })
  }
  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'rating must be 1–5' }, { status: 400 })
  }

  const supabase = getServiceClient()
  const { error } = await supabase.from('product_reviews').insert({
    product_id: productId,
    nickname: nickname.trim().slice(0, 100),
    summary: summary?.trim().slice(0, 200) ?? null,
    body: reviewBody.trim().slice(0, 2000),
    rating: Number(rating),
    status: 'pending',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, status: 'pending' })
}

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-auth'
import { getServiceClient, isServiceClientReady } from '@/lib/supabase-service'

function auth(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value
  return verifyAdminToken(token)
}

async function recalcProductRating(supabase: any, productId: string) {
  const { data } = await supabase
    .from('product_reviews')
    .select('rating')
    .eq('product_id', productId)
    .eq('status', 'approved')

  const reviews = data ?? []
  const count   = reviews.length
  const avg     = count ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / count : null

  await supabase
    .from('products')
    .update({ rating: avg ? Number(avg.toFixed(1)) : null, review_count: count })
    .eq('id', productId)
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isServiceClientReady()) return NextResponse.json({ reviews: [], dbReady: false })

  const supabase = getServiceClient()
  const status   = req.nextUrl.searchParams.get('status') ?? ''

  let q = supabase
    .from('product_reviews')
    .select('id, product_id, nickname, summary, body, rating, status, created_at, products(name, slug)')
    .order('created_at', { ascending: false })

  if (status) q = q.eq('status', status)

  const { data, error } = await q
  if (error) return NextResponse.json({ reviews: [], error: error.message })
  return NextResponse.json({ reviews: data ?? [], dbReady: true })
}

export async function PATCH(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isServiceClientReady()) return NextResponse.json({ error: 'Database not configured' }, { status: 503 })

  const { id, status } = await req.json().catch(() => ({}))
  if (!id || !['approved', 'rejected', 'pending'].includes(status)) {
    return NextResponse.json({ error: 'id and valid status required' }, { status: 400 })
  }

  const supabase = getServiceClient()
  const { data: review, error: fetchErr } = await supabase
    .from('product_reviews').select('product_id').eq('id', id).single()
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })

  const { error } = await supabase.from('product_reviews').update({ status }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await recalcProductRating(supabase, review.product_id)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isServiceClientReady()) return NextResponse.json({ error: 'Database not configured' }, { status: 503 })

  const { id } = await req.json().catch(() => ({}))
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = getServiceClient()
  const { data: review, error: fetchErr } = await supabase
    .from('product_reviews').select('product_id').eq('id', id).single()
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })

  const { error } = await supabase.from('product_reviews').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await recalcProductRating(supabase, review.product_id)
  return NextResponse.json({ ok: true })
}

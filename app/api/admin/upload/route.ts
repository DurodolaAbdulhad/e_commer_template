import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-auth'
import { getServiceClient, isServiceClientReady } from '@/lib/supabase-service'

export async function POST(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value
  if (!verifyAdminToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isServiceClientReady()) {
    return NextResponse.json({ error: 'Storage not configured' }, { status: 503 })
  }

  const form = await req.formData()
  const file   = form.get('file')   as File | null
  const bucket = (form.get('bucket') as string | null) || 'products'
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const ALLOWED_BUCKETS = ['products', 'banners', 'categories', 'avatars']
  if (!ALLOWED_BUCKETS.includes(bucket)) {
    return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 })
  }

  // Preserve original extension for category icons (gif, svg, webp, etc.)
  const mimeToExt: Record<string, string> = {
    'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
    'image/svg+xml': 'svg', 'image/avif': 'avif', 'image/jpeg': 'jpg',
  }
  const ext = mimeToExt[file.type] ?? 'jpg'
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const supabase = getServiceClient()
  const { error } = await supabase.storage
    .from(bucket)
    .upload(filename, file, { contentType: file.type, upsert: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filename)
  return NextResponse.json({ url: urlData.publicUrl })
}

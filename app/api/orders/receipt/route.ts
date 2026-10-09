import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase-server'

export async function PATCH(req: NextRequest) {
  try {
    const { orderRef, receiptUrl } = await req.json()
    if (!orderRef || !receiptUrl) {
      return NextResponse.json({ error: 'orderRef and receiptUrl are required' }, { status: 400 })
    }
    const supabase = getServiceClient()
    const { error } = await supabase
      .from('orders')
      .update({ receipt_url: receiptUrl, status: 'pending' })
      .eq('order_number', orderRef)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

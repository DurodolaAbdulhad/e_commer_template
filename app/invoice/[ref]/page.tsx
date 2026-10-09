import { notFound } from 'next/navigation'
import { getServiceClient } from '@/lib/supabase-service'
import { client } from '@/config/client'
import PrintButton from './PrintButton'

function fmt(n: number) {
  return `${client.currencySymbol}${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function invoiceNumber(order: any) {
  const d = new Date(order.created_at)
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const suffix = (order.order_number || order.id || '').toString().slice(-6).toUpperCase()
  return `INV-${ymd}-${suffix}`
}

export default async function InvoicePage({ params }: { params: { ref: string } }) {
  const { ref } = params
  const supabase = getServiceClient()

  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .or(`id.eq.${ref},order_number.eq.${ref},payment_reference.eq.${ref}`)
    .maybeSingle()

  if (!order) notFound()

  const addr = order.address ?? {}
  const items: any[] = order.items ?? []
  const invNum = invoiceNumber(order)
  const orderDate = new Date(order.created_at).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const paymentLabel =
    order.payment_method === 'pay_on_delivery' ? 'Pay on Delivery' :
    order.payment_method === 'bank_transfer'   ? 'Bank Transfer' :
    order.payment_method === 'whatsapp'        ? 'WhatsApp Order' :
    'Online Payment (Paystack)'

  const statusLabel =
    order.payment_method === 'bank_transfer' ? 'Pending Confirmation' :
    order.payment_method === 'pay_on_delivery' ? 'Payment on Delivery' :
    'Paid'

  return (
    <>
      {/* Print styles injected inline — no Tailwind in print */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          .invoice-page { padding: 32px !important; box-shadow: none !important; max-width: 100% !important; }
        }
        @page { margin: 16mm; }
      `}</style>

      {/* Top bar — hidden on print */}
      <div className="no-print bg-gray-50 border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <a href="/" className="text-sm text-gray-500 hover:text-gray-700">← Back to store</a>
        <div className="flex items-center gap-3">
          <a
            href={`/order/${ref}`}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Order Confirmation
          </a>
          <PrintButton />
        </div>
      </div>

      {/* Invoice document */}
      <div className="invoice-page max-w-3xl mx-auto px-8 py-10 bg-white shadow-sm my-8 print:my-0 print:shadow-none">

        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900" style={{ fontFamily: 'sans-serif' }}>
              {client.name}
            </h1>
            {client.address && <p className="text-sm text-gray-500 mt-1">{client.address}</p>}
            {client.email && <p className="text-sm text-gray-500">{client.email}</p>}
            {client.phone && <p className="text-sm text-gray-500">{client.phone}</p>}
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold text-gray-900 tracking-tight">INVOICE</p>
            <p className="text-sm font-semibold text-gray-500 mt-1">{invNum}</p>
            <p className="text-xs text-gray-400 mt-0.5">Date: {orderDate}</p>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-gray-200 mb-8" />

        {/* Bill To + Order Info */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Bill To</p>
            <p className="text-sm font-semibold text-gray-800">{addr.fullName || [addr.firstName, addr.lastName].filter(Boolean).join(' ')}</p>
            {addr.address && <p className="text-sm text-gray-600 mt-0.5">{addr.address}</p>}
            {(addr.city || addr.state) && <p className="text-sm text-gray-600">{[addr.city, addr.state].filter(Boolean).join(', ')}</p>}
            {addr.country && <p className="text-sm text-gray-600">{addr.country}</p>}
            {addr.phone && <p className="text-sm text-gray-500 mt-1">{addr.phone}</p>}
            {(order.email || addr.email) && <p className="text-sm text-gray-500">{order.email || addr.email}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Order Details</p>
            <div className="space-y-1">
              <p className="text-sm text-gray-600"><span className="text-gray-400">Order #:</span> {order.order_number || order.id}</p>
              <p className="text-sm text-gray-600"><span className="text-gray-400">Ref:</span> {order.payment_reference || '—'}</p>
              <p className="text-sm text-gray-600"><span className="text-gray-400">Payment:</span> {paymentLabel}</p>
              <p className="text-sm font-semibold" style={{ color: order.payment_method === 'bank_transfer' ? '#d97706' : '#16a34a' }}>
                {statusLabel}
              </p>
            </div>
          </div>
        </div>

        {/* Line items */}
        <table className="w-full text-sm mb-6" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
              <th className="text-left py-2.5 px-3 text-xs font-bold uppercase tracking-wide text-gray-500">Item</th>
              <th className="text-center py-2.5 px-3 text-xs font-bold uppercase tracking-wide text-gray-500">Qty</th>
              <th className="text-right py-2.5 px-3 text-xs font-bold uppercase tracking-wide text-gray-500">Unit Price</th>
              <th className="text-right py-2.5 px-3 text-xs font-bold uppercase tracking-wide text-gray-500">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any, i: number) => (
              <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td className="py-3 px-3 text-gray-800">
                  <span className="font-medium">{item.name}</span>
                  {item.variant && <span className="text-gray-400 text-xs block">{item.variant}</span>}
                </td>
                <td className="py-3 px-3 text-center text-gray-600">{item.quantity}</td>
                <td className="py-3 px-3 text-right text-gray-600">{fmt(item.price)}</td>
                <td className="py-3 px-3 text-right font-semibold text-gray-800">{fmt(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-10">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>{fmt(order.subtotal ?? 0)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Shipping</span>
              <span>{order.shipping_cost === 0 ? 'FREE' : fmt(order.shipping_cost ?? 0)}</span>
            </div>
            {(order.discount ?? 0) > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount{order.coupon_code ? ` (${order.coupon_code})` : ''}</span>
                <span>-{fmt(order.discount)}</span>
              </div>
            )}
            {(order.vat ?? 0) > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>VAT</span>
                <span>{fmt(order.vat)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t-2 border-gray-200">
              <span>Total</span>
              <span>{fmt(order.total ?? 0)}</span>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="border-t border-gray-100 pt-6 text-center">
          <p className="text-xs text-gray-400">
            Thank you for shopping with {client.name}. For any queries, contact us at {client.email || client.phone || 'our support channels'}.
          </p>
          <p className="text-xs text-gray-300 mt-1">{invNum} · Generated {new Date().toLocaleDateString('en-NG')}</p>
        </div>
      </div>
    </>
  )
}

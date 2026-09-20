'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PageBox from '@/components/ui/PageBox'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { formatPrice, getShippingCost, loadShippingSettings, generateOrderNumber } from '@/lib/utils'
import { client } from '@/config/client'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { ChevronRight, Tag, ShieldCheck, Truck, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import CheckoutRecommendations from '@/components/checkout/CheckoutRecommendations'
import { validateCoupon, redeemGiftCard, evaluateAutoDiscount } from '@/lib/admin-db'

const ACCENT = '#e84c3d'

const nigeriaStates = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT - Abuja','Gombe',
  'Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos',
  'Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto',
  'Taraba','Yobe','Zamfara',
]

interface FormData {
  fullName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  area: string
  country: string
  notes: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, subtotal, itemCount, dispatch, loaded: cartLoaded } = useCart()
  const { user } = useAuth()
  const [form, setForm] = useState<FormData>({
    fullName: '', email: '', phone: '',
    address: '', city: '', state: 'Lagos', area: '', country: 'Nigeria', notes: '',
  })
  const [coupon, setCoupon] = useState('')
  const [discount, setDiscount] = useState(0)
  const [couponApplied, setCouponApplied] = useState('')
  const [autoDiscount, setAutoDiscount] = useState<{ name: string; value: number } | null>(null)
  const [giftCard, setGiftCard] = useState('')
  const [giftCardApplied, setGiftCardApplied] = useState('')
  const [giftCardDiscount, setGiftCardDiscount] = useState(0)
  const [loading,          setLoading]          = useState(false)
  const [mounted,          setMounted]          = useState(false)
  const [shippingSettings, setShippingSettings] = useState<any>(null)
  const [shipMethod,       setShipMethod]       = useState<'store' | 'self'>('store')
  useEffect(() => {
    setMounted(true)
    loadShippingSettings().then(s => setShippingSettings(s)).catch(() => {})
  }, [])

  // Auto-discount — re-evaluate whenever subtotal changes
  useEffect(() => {
    if (!mounted) return
    evaluateAutoDiscount(subtotal).then(rule => {
      if (!rule) { setAutoDiscount(null); return }
      const val = rule.type === 'percent' ? Math.floor(subtotal * rule.value / 100) : rule.value
      setAutoDiscount({ name: rule.name, value: val })
    }).catch(() => {})
  }, [subtotal, mounted])

  if (!mounted) return null

  // Fix 5: wholesale tag is authoritative from Supabase user_metadata only
  // Admin assigns tags via /admin/customers which writes to Supabase user_metadata server-side
  // Reading from localStorage here would allow anyone to grant themselves wholesale pricing
  const wholesaleTag = client.wholesale?.tag ?? 'wholesale'
  const userMetaTags: string[] = (user as any)?.user_metadata?.tags ?? []
  const isWholesale = client.wholesale?.enabled && userMetaTags.includes(wholesaleTag)
  const wholesaleDiscount = isWholesale
    ? Math.floor(subtotal * (client.wholesale.discountPercent ?? 0) / 100)
    : 0

  const selfFee  = shippingSettings?.selfLogisticsFee ?? 0
  const shipping = shipMethod === 'self'
    ? selfFee
    : getShippingCost(subtotal, shippingSettings, form.state, form.area)

  // Derive selectable sub-areas for the chosen state (from zones that have per-area rates)
  const areaOptions: string[] = (() => {
    if (!shippingSettings?.zonesEnabled || !form.state) return []
    const zonesForState = (shippingSettings.zones ?? []).filter((z: any) =>
      z.states?.includes(form.state) && Array.isArray(z.areaRates) && z.areaRates.length > 0
    )
    const allAreas = zonesForState.flatMap((z: any) => (z.areaRates as any[]).map(a => a.area))
    return [...new Set(allAreas)].sort()
  })()
  const vatRate     = client.tax?.enabled && !client.tax?.inclusive ? (client.tax.rate ?? 0) / 100 : 0
  const totalBeforeVat = subtotal + shipping - discount - (autoDiscount?.value ?? 0) - giftCardDiscount - wholesaleDiscount
  const vatAmount   = Math.floor(totalBeforeVat * vatRate)
  const total       = totalBeforeVat + vatAmount

  function set(key: keyof FormData, val: string) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  async function applyCoupon() {
    if (!coupon.trim()) return
    const found = await validateCoupon(coupon.trim())
    if (!found) { toast.error('Invalid or expired coupon code'); return }
    if (found.min_order && subtotal < found.min_order) {
      toast.error(`Minimum order of ${formatPrice(found.min_order)} required`)
      return
    }
    let disc = 0
    if (found.type === 'percent')  disc = Math.floor(subtotal * found.value / 100)
    if (found.type === 'fixed')    disc = Math.min(found.value, subtotal)
    if (found.type === 'shipping') disc = shipping
    setDiscount(disc)
    setCouponApplied(found.code)
    toast.success(`Coupon applied — ${found.type === 'shipping' ? 'free shipping' : found.type === 'percent' ? `${found.value}% off` : `${formatPrice(disc)} off`}!`)
  }

  async function applyGiftCard() {
    if (!giftCard.trim()) return
    // Fix 9: validate via server API — never read gift card balances from localStorage
    const res = await fetch('/api/gift-card/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: giftCard.trim() }),
    })
    if (!res.ok) { toast.error('Invalid or exhausted gift card'); return }
    const card = await res.json()
    setGiftCardApplied(card.code)
    setGiftCardDiscount(Math.min(card.balance, total))
    toast.success(`Gift card applied — ${formatPrice(Math.min(card.balance, total))} credited!`)
  }

  function validate() {
    const required: (keyof FormData)[] = ['fullName', 'email', 'phone', 'address', 'city', 'state']
    for (const key of required) {
      if (!form[key].trim()) {
        toast.error(`Please fill in your ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`)
        return false
      }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error('Please enter a valid email address')
      return false
    }
    return true
  }

  async function handlePayNow() {
    if ((items as any).length === 0) return toast.error('Your cart is empty')
    if (!validate()) return

    setLoading(true)
    const reference = generateOrderNumber()

    try {
      // Fix 4 + B: verify prices AND coupon server-side before passing to Paystack
      const priceRes = await fetch('/api/checkout/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: (items as any).map((i: any) => ({ id: i.id, quantity: i.quantity })),
          couponCode:      couponApplied,   // Fix B: send code, not pre-computed amount
          giftCardDiscount,
          reference,
        }),
      })
      if (!priceRes.ok) {
        setLoading(false)
        return toast.error('Could not verify order total. Please refresh and try again.')
      }
      const verified = await priceRes.json()
      const verifiedTotal      = verified.total         as number
      const verifiedSig        = verified.sig           as string
      const verifiedCouponDisc = verified.couponDiscount as number

      const gateway = client.paymentGateway ?? 'paystack'

      if (gateway === 'flutterwave') {
        // ── Flutterwave ──────────────────────────────────────────────────────
        // @ts-ignore
        if (!window.FlutterwaveCheckout) {
          toast.error('Payment system not loaded. Please refresh and try again.')
          setLoading(false)
          return
        }
        // @ts-ignore
        window.FlutterwaveCheckout({
          public_key: process.env.NEXT_PUBLIC_FLW_PUBLIC_KEY || 'FLWPUBK_TEST-placeholder',
          tx_ref:     reference,
          amount:     verifiedTotal,          // Flutterwave uses full units (₦), not kobo
          currency:   'NGN',
          customer: {
            email:       form.email,
            phonenumber: form.phone,
            name:        form.fullName,
          },
          meta: { price_sig: verifiedSig },   // Fix C: verified by webhook
          customizations: {
            title:       client.name,
            description: `Order ${reference}`,
            logo:        client.logo ?? '',
          },
          callback: async (response: any) => {
            if (response.status === 'successful' || response.status === 'completed') {
              await saveOrderAndRedirect(response.tx_ref, verifiedTotal, verifiedSig, verifiedCouponDisc)
            } else {
              setLoading(false)
              toast.error('Payment not completed. Please try again.')
            }
          },
          onclose: () => {
            setLoading(false)
            toast('Payment cancelled')
          },
        })
      } else {
        // ── Paystack — redirect flow (no popup, no iframe) ───────────────────
        if (!verifiedTotal || verifiedTotal <= 0) {
          setLoading(false)
          toast.error('Order total is zero. Please refresh and try again.')
          return
        }

        // Save order to localStorage NOW so the confirmation page can read it
        const orderStub = {
          order_number: reference,
          status: 'pending',
          total: verifiedTotal,
          subtotal,
          shipping_cost: shipping,
          discount: verifiedCouponDisc + (autoDiscount?.value ?? 0) + giftCardDiscount + wholesaleDiscount,
          vat: vatAmount,
          items: (items as any[]).map((i: any) => ({
            id: i.id, name: i.name, price: i.price,
            quantity: i.quantity, image: i.images?.[0] ?? null,
          })),
          address: {
            fullName: form.fullName, email: form.email, phone: form.phone,
            address: form.address, city: form.city,
            state: form.state, area: form.area || null, country: form.country,
          },
          payment_method: 'paystack',
          payment_reference: reference,
          coupon_code: couponApplied || null,
          delivery_method: shipMethod === 'self' ? 'self_logistics' : 'store_delivery',
        }
        localStorage.setItem(`order_${reference}`, JSON.stringify(orderStub))

        // Server creates the Paystack transaction and returns authorization_url
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
        const createRes = await fetch('/api/paystack/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email:       form.email,
            amount:      verifiedTotal,
            reference,
            sig:         verifiedSig,
            callbackUrl: `${siteUrl}/order/${reference}`,
            metadata: {
              price_sig: verifiedSig,
              custom_fields: [
                { display_name: 'Customer Name', variable_name: 'customer_name', value: form.fullName },
                { display_name: 'Phone',         variable_name: 'phone',         value: form.phone },
              ],
            },
          }),
        })

        if (!createRes.ok) {
          const err = await createRes.json().catch(() => ({}))
          setLoading(false)
          toast.error(err?.error || 'Could not start payment. Please try again.')
          return
        }

        const { authorization_url } = await createRes.json()
        if (!authorization_url) {
          setLoading(false)
          toast.error('No payment URL returned. Please try again.')
          return
        }

        // Clear cart then redirect to Paystack hosted checkout
        dispatch({ type: 'CLEAR_CART' })
        window.location.href = authorization_url
      }
    } catch (err: any) {
      setLoading(false)
      console.error('Payment error:', err)
      toast.error(err?.message || 'Failed to open payment. Please try again.')
    }
    // safetyTimer cleared in callback/onClose; if try block throws before setup, clear it
  }

  async function saveOrderAndRedirect(paystackRef: string, verifiedTotal?: number, verifiedSig?: string, verifiedCouponDisc?: number) {
    const finalTotal      = verifiedTotal    ?? total
    const finalCouponDisc = verifiedCouponDisc ?? discount
    // Redeem gift card balance if applied
    if (giftCardApplied && giftCardDiscount > 0) {
      try { await redeemGiftCard(giftCardApplied, giftCardDiscount) } catch {}
    }

    const orderData = {
      order_number: paystackRef,
      status: 'pending',
      items: (items as any[]).map((i: any) => ({
        id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        variant: i.variant ?? null,
        image: i.images?.[0] ?? null,
      })),
      subtotal,
      shipping_cost: shipping,
      discount: finalCouponDisc + (autoDiscount?.value ?? 0) + giftCardDiscount + wholesaleDiscount,
      vat: vatAmount,
      total: finalTotal,
      price_sig: verifiedSig ?? null,
      address: {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        address: form.address,
        city: form.city,
        state: form.state,
        area: form.area || null,
        country: form.country,
        notes: form.notes,
      },
      payment_method: client.paymentGateway ?? 'paystack',
      payment_reference: paystackRef,
      coupon_code: couponApplied || null,
      gift_card_code: giftCardApplied || null,
      auto_discount: autoDiscount?.name || null,
    }

    // Fix 11: store minimal data in localStorage — full order saved to Supabase only
    // Keep a lightweight stub so the confirmation page can render without Supabase
    const stub = {
      order_number: orderData.order_number,
      status: orderData.status,
      total: orderData.total,
      items: orderData.items,
      address: {
        fullName: orderData.address.fullName,
        city: orderData.address.city,
        state: orderData.address.state,
      },
    }
    localStorage.setItem(`order_${paystackRef}`, JSON.stringify(stub))

    // Try to save to Supabase
    try {
      const supabase = createClient()
      await supabase.from('orders').insert(orderData)
    } catch {}

    // Clear cart
    dispatch({ type: 'CLEAR_CART' })

    // Redirect to confirmation
    router.push(`/order/${paystackRef}`)
  }

  if (itemCount === 0 && mounted && cartLoaded) {
    return (
      <>
        <Header />
        <PageBox>
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <p className="text-2xl">🛒</p>
            <h1 className="text-xl font-bold text-gray-700">Your cart is empty</h1>
            <p className="text-sm text-gray-400">Add some items before checking out</p>
            <Link href="/shop" className="mt-2 px-6 py-2.5 text-white text-sm font-semibold rounded"
              style={{ backgroundColor: ACCENT }}>
              Browse Products
            </Link>
          </div>
        </PageBox>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <PageBox>
        <main className="px-6 py-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-xs text-gray-400 mb-6">
            <Link href="/" className="hover:text-gray-600">Home</Link>
            <ChevronRight size={12} />
            <Link href="/cart" className="hover:text-gray-600">Cart</Link>
            <ChevronRight size={12} />
            <span className="text-gray-700 font-medium">Checkout</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">

            {/* ── LEFT: Form ── */}
            <div className="space-y-6">

              {/* Contact info */}
              <div className="bg-white border border-gray-100 rounded-xl p-5">
                <h2 className="font-bold text-gray-800 text-sm mb-4 uppercase tracking-wide">
                  Contact Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label>Full Name *</Label>
                    <Input value={form.fullName} onChange={v => set('fullName', v)} placeholder="e.g. Abdulhad Durodola" />
                  </div>
                  <div>
                    <Label>Email Address *</Label>
                    <Input type="email" value={form.email} onChange={v => set('email', v)} placeholder="you@example.com" />
                  </div>
                  <div>
                    <Label>Phone Number *</Label>
                    <Input type="tel" value={form.phone} onChange={v => set('phone', v)} placeholder="+234 800 000 0000" />
                  </div>
                </div>
              </div>

              {/* Delivery method — shown when self-logistics is enabled in admin */}
              {shippingSettings?.selfLogisticsEnabled && (
                <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
                  <h2 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Delivery Method</h2>

                  {/* Store delivery option */}
                  <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${shipMethod === 'store' ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="shipMethod" value="store" checked={shipMethod === 'store'}
                      onChange={() => setShipMethod('store')} className="mt-0.5 accent-red-500" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-800">Store Delivery</p>
                        <span className="text-sm font-bold text-gray-800">
                          {shipping === 0 ? 'FREE' : formatPrice(shipping)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{shippingSettings?.estimatedDays ?? client.shipping.estimatedDays}</p>
                    </div>
                  </label>

                  {/* Self-logistics option */}
                  <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${shipMethod === 'self' ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="shipMethod" value="self" checked={shipMethod === 'self'}
                      onChange={() => setShipMethod('self')} className="mt-0.5 accent-red-500" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-800">Arrange My Own Delivery</p>
                        <span className="text-sm font-bold text-gray-800">
                          {selfFee === 0 ? 'FREE' : formatPrice(selfFee)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">Book directly with a logistics provider of your choice</p>
                    </div>
                  </label>

                  {/* Self-logistics detail panel */}
                  {shipMethod === 'self' && (
                    <div className="rounded-xl border border-dashed border-gray-200 p-4 space-y-3 bg-gray-50">
                      {shippingSettings.selfLogisticsNote && (
                        <p className="text-xs text-gray-600 leading-relaxed">{shippingSettings.selfLogisticsNote}</p>
                      )}
                      {shippingSettings.logisticsProviders?.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {shippingSettings.logisticsProviders.map((p: any, i: number) => (
                            <a key={i} href={p.website || '#'} target="_blank" rel="noopener noreferrer"
                              className="flex items-center justify-between gap-2 px-3 py-2.5 bg-white border border-gray-200 rounded-xl hover:border-gray-400 hover:shadow-sm transition-all group">
                              <div>
                                <p className="text-xs font-bold text-gray-800 group-hover:text-gray-900">{p.name}</p>
                                {p.phone && <p className="text-[10px] text-gray-400 mt-0.5">{p.phone}</p>}
                              </div>
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 group-hover:text-gray-500 flex-shrink-0"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Delivery address */}
              <div className="bg-white border border-gray-100 rounded-xl p-5">
                <h2 className="font-bold text-gray-800 text-sm mb-4 uppercase tracking-wide">
                  {shipMethod === 'self' ? 'Pickup / Collection Address' : 'Delivery Address'}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label>Street Address *</Label>
                    <Input value={form.address} onChange={v => set('address', v)} placeholder="House number, street name, area" />
                  </div>
                  <div>
                    <Label>City *</Label>
                    <Input value={form.city} onChange={v => set('city', v)} placeholder="e.g. Lagos" />
                  </div>
                  <div>
                    <Label>State *</Label>
                    <select
                      value={form.state}
                      onChange={e => { set('state', e.target.value); set('area', '') }}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none text-gray-700 focus:border-gray-400"
                    >
                      {nigeriaStates.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>

                  {/* Area / sub-zone dropdown — shown only when the selected state has zone sub-areas */}
                  {areaOptions.length > 0 && (
                    <div>
                      <Label>Area / Delivery Zone *</Label>
                      <select
                        value={form.area}
                        onChange={e => set('area', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none text-gray-700 focus:border-gray-400"
                      >
                        <option value="">— Select your area —</option>
                        {areaOptions.map(a => <option key={a}>{a}</option>)}
                      </select>
                      {!form.area && (
                        <p className="text-[11px] text-amber-600 mt-1">
                          Select your area to see the exact delivery rate
                        </p>
                      )}
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <Label>Country</Label>
                    <Input value={form.country} onChange={v => set('country', v)} disabled />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Delivery Notes (optional)</Label>
                    <textarea
                      value={form.notes}
                      onChange={e => set('notes', e.target.value)}
                      placeholder="Any special instructions for delivery..."
                      rows={2}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none text-gray-700 focus:border-gray-400 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Trust */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: <Lock size={15} />, text: 'Secure Checkout' },
                  { icon: <Truck size={15} />, text: shippingSettings?.estimatedDays ?? client.shipping.estimatedDays },
                  { icon: <ShieldCheck size={15} />, text: `${shippingSettings?.returnDays ?? 7}-day Returns` },
                ].map(t => (
                  <div key={t.text} className="flex flex-col items-center gap-1 py-3 text-center bg-gray-50 rounded-lg">
                    <span className="text-gray-400">{t.icon}</span>
                    <span className="text-xs text-gray-500">{t.text}</span>
                  </div>
                ))}
              </div>

              {/* Upsell & Cross-sell */}
              <CheckoutRecommendations />
            </div>

            {/* ── RIGHT: Order summary ── */}
            <div className="space-y-4">
              <div className="bg-white border border-gray-100 rounded-xl p-5 lg:sticky lg:top-24">

                <h2 className="font-bold text-gray-800 text-sm mb-4 uppercase tracking-wide">
                  Order Summary ({itemCount} item{itemCount !== 1 ? 's' : ''})
                </h2>

                {/* Items */}
                <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                  {(items as any[]).map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      {/* Image */}
                      <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
                        {item.images?.[0]
                          ? <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                          : <span className="text-lg">{item.name.charAt(0)}</span>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">{item.name}</p>
                        {item.variant && <p className="text-xs text-gray-400">{item.variant}</p>}
                        <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-xs font-semibold text-gray-800 shrink-0">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Coupon + Gift Card */}
                <div className="border-t border-gray-100 pt-4 mb-4 space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                      <Tag size={12} /> Coupon Code
                    </p>
                    <div className="flex gap-2">
                      <input type="text" value={coupon} onChange={e => setCoupon(e.target.value.toUpperCase())}
                        placeholder="Enter code" disabled={!!couponApplied}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none uppercase placeholder-gray-400 disabled:bg-gray-50" />
                      <button onClick={applyCoupon} disabled={!!couponApplied}
                        className="px-3 py-2 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        {couponApplied ? '✓ Applied' : 'Apply'}
                      </button>
                    </div>
                  </div>

                  {client.features?.giftCards && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                        🎁 Gift Card
                      </p>
                      <div className="flex gap-2">
                        <input type="text" value={giftCard} onChange={e => setGiftCard(e.target.value.toUpperCase())}
                          placeholder="XXXX-XXXX-XXXX-XXXX" disabled={!!giftCardApplied}
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none uppercase placeholder-gray-400 disabled:bg-gray-50" />
                        <button onClick={applyGiftCard} disabled={!!giftCardApplied}
                          className="px-3 py-2 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                          {giftCardApplied ? '✓ Applied' : 'Apply'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Totals */}
                <div className="border-t border-gray-100 pt-4 space-y-2.5 mb-5">
                  <Row label="Subtotal" value={formatPrice(subtotal)} />
                  <Row
                    label={`Shipping${shipping === 0 ? ' (Free)' : ''}${shippingSettings?.zonesEnabled && form.state ? ` · ${form.state}${form.area ? ` › ${form.area}` : ''}` : ''}`}
                    value={shipMethod === 'self' ? (selfFee === 0 ? 'FREE (self)' : formatPrice(selfFee)) : shipping === 0 ? 'FREE' : formatPrice(shipping)}
                  />
                  {discount > 0 && <Row label={`Coupon (${couponApplied})`} value={`-${formatPrice(discount)}`} accent />}
                  {autoDiscount && <Row label={autoDiscount.name} value={`-${formatPrice(autoDiscount.value)}`} accent />}
                  {wholesaleDiscount > 0 && <Row label={`Wholesale (${client.wholesale?.discountPercent}% off)`} value={`-${formatPrice(wholesaleDiscount)}`} accent />}
                  {giftCardDiscount > 0 && <Row label={`Gift Card (${giftCardApplied})`} value={`-${formatPrice(giftCardDiscount)}`} accent />}
                  {vatAmount > 0 && <Row label={client.tax?.label ?? 'VAT'} value={formatPrice(vatAmount)} />}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <span className="text-sm font-bold text-gray-800">Total</span>
                    <span className="text-lg font-extrabold" style={{ color: ACCENT }}>
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>

                {/* Pay button */}
                <button
                  onClick={handlePayNow}
                  disabled={loading}
                  className="w-full py-3.5 text-white font-bold text-sm rounded-lg flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed"
                  style={{ backgroundColor: ACCENT }}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Redirecting to payment...
                    </>
                  ) : (
                    <>
                      <Lock size={14} />
                      Pay {formatPrice(total)} with {client.paymentGateway === 'flutterwave' ? 'Flutterwave' : 'Paystack'}
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-gray-400 mt-3">
                  {client.paymentGateway === 'flutterwave'
                    ? 'Secured by Flutterwave · Visa · Mastercard · Verve · USSD'
                    : 'Secured by Paystack · Visa · Mastercard · Verve'}
                </p>
              </div>
            </div>
          </div>
        </main>
      </PageBox>
      <Footer />
    </>
  )
}

/* ─── Small helpers ─── */
function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-gray-600 mb-1">{children}</label>
}

function Input({ value, onChange, placeholder = '', type = 'text', disabled = false }: {
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  type?: string
  disabled?: boolean
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange?.(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none text-gray-700 placeholder-gray-400 focus:border-gray-400 disabled:bg-gray-50 disabled:text-gray-400"
    />
  )
}

function Row({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-xs font-semibold ${accent ? 'text-green-600' : 'text-gray-700'}`}>{value}</span>
    </div>
  )
}

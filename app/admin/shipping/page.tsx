'use client'

import { useEffect, useState } from 'react'
import { Save, Check, Truck, Package, MapPin, Clock, RefreshCw, Plus, Trash2, ExternalLink, Globe } from 'lucide-react'
import { getStoreSetting, saveStoreSetting } from '@/lib/admin-db'
import { client } from '@/config/client'
import toast from 'react-hot-toast'

const ACCENT = '#e84c3d'

const NIGERIA_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT – Abuja','Gombe',
  'Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos',
  'Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto',
  'Taraba','Yobe','Zamfara',
]

type AreaRate = { area: string; rate: number }
type ShippingZone = { name: string; rate: number; states: string[]; areaRates?: AreaRate[] }

const DEFAULT_ZONES: ShippingZone[] = [
  { name: 'Lagos',        rate: 2000,  states: ['Lagos'] },
  { name: 'South West',   rate: 3000,  states: ['Ogun','Oyo','Osun','Ondo','Ekiti'] },
  { name: 'Other States', rate: 4500,  states: [] },
]

// Pre-defined sub-areas for states that commonly need granular pricing
const AREA_MAP: Record<string, string[]> = {
  'Lagos': [
    'Agege','Ajeromi-Ifelodun','Alimosho','Amuwo-Odofin','Apapa',
    'Badagry','Epe','Eti-Osa','Ibeju-Lekki','Ifako-Ijaye',
    'Ikeja','Ikorodu','Kosofe','Lagos Island','Lagos Mainland',
    'Lekki','Mushin','Ojo','Oshodi-Isolo','Shomolu',
    'Surulere','Victoria Island / Ikoyi','Yaba',
  ],
  'FCT – Abuja': [
    'Abuja City Centre','Asokoro','Bwari','Garki','Gwarinpa',
    'Gwagwalada','Jabi','Karu / Nyanya','Kuje','Kubwa / Lugbe',
    'Maitama','Utako','Wuse','Wuse 2',
  ],
  'Rivers': [
    'Port Harcourt','Obio-Akpor','Eleme','Etche','Ikwerre',
    'Emohua','Okrika','Oyigbo','Tai',
  ],
  'Kano': [
    'Kano Municipal','Dala','Fagge','Gwale','Kumbotso',
    'Nassarawa','Tarauni','Ungogo',
  ],
  'Ogun': [
    'Abeokuta North','Abeokuta South','Ado-Odo / Ota','Ewekoro',
    'Ifo','Ijebu East','Ijebu North','Ijebu Ode','Sagamu',
  ],
  'Oyo': [
    'Ibadan North','Ibadan South-East','Ibadan South-West',
    'Egbeda','Lagelu','Oluyole','Ona Ara','Ogbomosho North',
  ],
  'Edo': [
    'Benin City','Egor','Ikpoba-Okha','Oredo','Ovia North-East','Ovia South-West',
  ],
  'Anambra': [
    'Awka North','Awka South','Anambra East','Anambra West',
    'Nnewi North','Nnewi South','Onitsha North','Onitsha South',
  ],
}

const DEFAULT_PROVIDERS = [
  { name: 'GIG Logistics', website: 'https://giglogistics.com', phone: '07000442546', whatsapp: '' },
  { name: 'Sendbox',       website: 'https://sendbox.co',       phone: '',           whatsapp: '' },
  { name: 'DHL Nigeria',   website: 'https://dhl.com/ng',       phone: '0700225500',  whatsapp: '' },
]

type Provider = { name: string; website: string; phone: string; whatsapp: string }

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-gray-100 last:border-0">
      <div className="w-52 flex-shrink-0 pt-1">
        <p className="text-xs font-semibold text-gray-700">{label}</p>
        {hint && <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">{hint}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
        <Icon size={13} className="text-gray-500" />
        <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide">{title}</h3>
      </div>
      <div className="px-5">{children}</div>
    </div>
  )
}

export default function ShippingPage() {
  // Shipping rates
  const [flatRate,      setFlatRate]      = useState(client.shipping.flatRate ?? 2500)
  const [freeAbove,     setFreeAbove]     = useState(client.shipping.freeAbove ?? 50000)
  const [freeEnabled,   setFreeEnabled]   = useState((client.shipping.freeAbove ?? 50000) > 0)
  const [estDays,       setEstDays]       = useState(client.shipping.estimatedDays ?? '2–5 business days')
  // Fulfillment
  const [processingTime,  setProcessingTime]  = useState('1–2 business days')
  const [cutoffTime,      setCutoffTime]      = useState('2:00 PM')
  const [pickupEnabled,   setPickupEnabled]   = useState(false)
  const [pickupAddress,   setPickupAddress]   = useState(client.address ?? '')
  const [fulfillmentNote, setFulfillmentNote] = useState('')
  // Return policy
  const [returnDays,   setReturnDays]   = useState(7)
  const [returnPolicy, setReturnPolicy] = useState('Items must be unused and in original packaging.')
  // Shipping zones (location-based pricing)
  const [zonesEnabled, setZonesEnabled] = useState(false)
  const [zones,        setZones]        = useState<ShippingZone[]>(DEFAULT_ZONES)
  // Third-party logistics
  const [selfLogisticsEnabled,   setSelfLogisticsEnabled]   = useState(false)
  const [selfLogisticsNote,      setSelfLogisticsNote]      = useState('Choose a logistics provider below to book your own delivery. Once booked, send us your tracking number.')
  const [selfLogisticsFee,       setSelfLogisticsFee]       = useState(0)
  const [providers,              setProviders]              = useState<Provider[]>(DEFAULT_PROVIDERS)

  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  useEffect(() => {
    getStoreSetting('shipping_flat_rate').then(v   => { if (v !== null) setFlatRate(Number(v)) })
    getStoreSetting('shipping_free_above').then(v  => { if (v !== null) { setFreeAbove(Number(v)); setFreeEnabled(Number(v) > 0) } })
    getStoreSetting('shipping_est_days').then(v    => { if (v) setEstDays(v) })
    getStoreSetting('shipping_processing').then(v  => { if (v) setProcessingTime(v) })
    getStoreSetting('shipping_cutoff').then(v      => { if (v) setCutoffTime(v) })
    getStoreSetting('shipping_pickup').then(v      => { if (v !== null) setPickupEnabled(Boolean(v)) })
    getStoreSetting('shipping_pickup_address').then(v => { if (v) setPickupAddress(v) })
    getStoreSetting('shipping_note').then(v        => { if (v) setFulfillmentNote(v) })
    getStoreSetting('return_days').then(v          => { if (v !== null) setReturnDays(Number(v)) })
    getStoreSetting('return_policy').then(v        => { if (v) setReturnPolicy(v) })
    getStoreSetting('shipping_zones_enabled').then(v => { if (v !== null) setZonesEnabled(Boolean(v)) })
    getStoreSetting('shipping_zones').then(v         => { if (v && Array.isArray(v) && v.length > 0) setZones(v) })
    getStoreSetting('self_logistics_enabled').then(v => { if (v !== null) setSelfLogisticsEnabled(Boolean(v)) })
    getStoreSetting('self_logistics_note').then(v    => { if (v) setSelfLogisticsNote(v) })
    getStoreSetting('self_logistics_fee').then(v     => { if (v !== null) setSelfLogisticsFee(Number(v)) })
    getStoreSetting('logistics_providers').then(v    => { if (v && Array.isArray(v) && v.length > 0) setProviders(v) })
  }, [])

  function addProvider() {
    setProviders(p => [...p, { name: '', website: '', phone: '', whatsapp: '' }])
    setSaved(false)
  }

  function updateProvider(i: number, field: keyof Provider, val: string) {
    setProviders(p => p.map((pr, idx) => idx === i ? { ...pr, [field]: val } : pr))
    setSaved(false)
  }

  function removeProvider(i: number) {
    setProviders(p => p.filter((_, idx) => idx !== i))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await saveStoreSetting('shipping_zones_enabled',  zonesEnabled)
      await saveStoreSetting('shipping_zones',           zones)
      await saveStoreSetting('shipping_flat_rate',      flatRate)
      await saveStoreSetting('shipping_free_above',     freeEnabled ? freeAbove : 0)
      await saveStoreSetting('shipping_est_days',       estDays)
      await saveStoreSetting('shipping_processing',     processingTime)
      await saveStoreSetting('shipping_cutoff',         cutoffTime)
      await saveStoreSetting('shipping_pickup',         pickupEnabled)
      await saveStoreSetting('shipping_pickup_address', pickupAddress)
      await saveStoreSetting('shipping_note',           fulfillmentNote)
      await saveStoreSetting('return_days',             returnDays)
      await saveStoreSetting('return_policy',           returnPolicy)
      await saveStoreSetting('self_logistics_enabled',  selfLogisticsEnabled)
      await saveStoreSetting('self_logistics_note',     selfLogisticsNote)
      await saveStoreSetting('self_logistics_fee',      selfLogisticsFee)
      await saveStoreSetting('logistics_providers',     providers.filter(p => p.name.trim()))
      setSaved(true)
      toast.success('Shipping & fulfillment settings saved')
    } catch (e: any) {
      toast.error(e?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const cur = client.currencySymbol ?? '₦'

  return (
    <div className="max-w-2xl space-y-4">

      {/* Shipping Rates */}
      <Section title="Shipping Rates" icon={Truck}>
        <Row label="Flat Rate" hint="Charged on every order (unless free shipping applies)">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 font-medium">{cur}</span>
            <input type="number" min={0} value={flatRate}
              onChange={e => { setFlatRate(Number(e.target.value)); setSaved(false) }}
              className="w-36 px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-gray-400 font-mono" />
          </div>
        </Row>

        <Row label="Free Shipping" hint="Orders at or above this amount ship free">
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={freeEnabled}
                onChange={e => { setFreeEnabled(e.target.checked); setSaved(false) }}
                className="w-4 h-4 accent-red-500 rounded" />
              <span className="text-xs text-gray-600 font-medium">Enable free shipping threshold</span>
            </label>
            {freeEnabled && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 font-medium">{cur}</span>
                <input type="number" min={0} value={freeAbove}
                  onChange={e => { setFreeAbove(Number(e.target.value)); setSaved(false) }}
                  className="w-36 px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-gray-400 font-mono" />
              </div>
            )}
          </div>
        </Row>

        <Row label="Estimated Delivery" hint="Shown at checkout and on order confirmation">
          <input value={estDays} onChange={e => { setEstDays(e.target.value); setSaved(false) }}
            placeholder="e.g. 2–5 business days"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-gray-400" />
        </Row>
      </Section>

      {/* Shipping Zones */}
      <Section title="Location-Based Pricing" icon={Globe}>
        <Row label="Enable Zones" hint="Override flat rate per state — customers see their zone rate at checkout">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={zonesEnabled}
              onChange={e => { setZonesEnabled(e.target.checked); setSaved(false) }}
              className="w-4 h-4 accent-red-500 rounded" />
            <span className="text-xs text-gray-600 font-medium">Different shipping rate per location</span>
          </label>
        </Row>

        {zonesEnabled && (
          <Row label="Zones" hint="States not in any zone use the flat rate above">
            <div className="space-y-3">
              {zones.map((zone, zi) => (
                <div key={zi} className="border border-gray-200 rounded-xl p-3 space-y-2 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <input value={zone.name}
                      onChange={e => { const z=[...zones]; z[zi]={...z[zi],name:e.target.value}; setZones(z); setSaved(false) }}
                      placeholder="Zone name (e.g. Lagos)"
                      className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-gray-400 bg-white font-semibold" />
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">{cur}</span>
                      <input type="number" min={0} value={zone.rate}
                        onChange={e => { const z=[...zones]; z[zi]={...z[zi],rate:Number(e.target.value)}; setZones(z); setSaved(false) }}
                        className="w-24 px-2 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-gray-400 bg-white font-mono" />
                    </div>
                    <button onClick={() => { setZones(z => z.filter((_,i)=>i!==zi)); setSaved(false) }}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                      <Trash2 size={12} />
                    </button>
                  </div>
                  {/* State picker */}
                  <div className="flex flex-wrap gap-1">
                    {NIGERIA_STATES.map(state => {
                      const selected = zone.states.includes(state)
                      return (
                        <button key={state}
                          onClick={() => {
                            const z = [...zones]
                            const newStates = selected
                              ? z[zi].states.filter(s => s !== state)
                              : [...z[zi].states, state]
                            // When deselecting a state, remove its area rates
                            const removedAreas = selected ? (AREA_MAP[state] ?? []) : []
                            const newAreaRates = z[zi].areaRates
                              ? z[zi].areaRates.filter(a => !removedAreas.includes(a.area))
                              : undefined
                            z[zi] = { ...z[zi], states: newStates, areaRates: newAreaRates }
                            setZones(z); setSaved(false)
                          }}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${selected ? 'text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-400'}`}
                          style={selected ? { backgroundColor: ACCENT } : {}}>
                          {state}
                        </button>
                      )
                    })}
                  </div>
                  {zone.states.length === 0 && (
                    <p className="text-[10px] text-amber-500 font-medium">⚠ No states selected — this zone won't match any location</p>
                  )}

                  {/* Per-area pricing — appears when selected states have area presets */}
                  {(() => {
                    const availableAreas = [...new Set(zone.states.flatMap(s => AREA_MAP[s] ?? []))]
                    if (availableAreas.length === 0) return null
                    const areasEnabled = Array.isArray(zone.areaRates)
                    return (
                      <div className="border-t border-dashed border-gray-200 pt-2 mt-1">
                        <label className="flex items-center gap-1.5 cursor-pointer mb-2">
                          <input type="checkbox" checked={areasEnabled}
                            onChange={e => {
                              const z = [...zones]
                              z[zi] = { ...z[zi], areaRates: e.target.checked ? [] : undefined }
                              setZones(z); setSaved(false)
                            }}
                            className="w-3.5 h-3.5 accent-red-500" />
                          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                            Set individual price per area
                          </span>
                        </label>
                        {areasEnabled && (
                          <div className="space-y-1.5">
                            {availableAreas.map(area => {
                              const existing = zone.areaRates?.find(a => a.area === area)
                              const isActive = !!existing
                              return (
                                <div key={area} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${isActive ? 'bg-blue-50 border border-blue-100' : 'bg-white border border-gray-100'}`}>
                                  <input type="checkbox" checked={isActive}
                                    onChange={e => {
                                      const z = [...zones]
                                      const cur = z[zi].areaRates ?? []
                                      z[zi] = { ...z[zi], areaRates: e.target.checked
                                        ? [...cur, { area, rate: z[zi].rate }]
                                        : cur.filter(a => a.area !== area) }
                                      setZones(z); setSaved(false)
                                    }}
                                    className="w-3.5 h-3.5 accent-blue-600 flex-shrink-0" />
                                  <span className={`text-[11px] flex-1 ${isActive ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>{area}</span>
                                  {isActive && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] text-gray-400">{cur}</span>
                                      <input type="number" min={0} value={existing.rate}
                                        onChange={e => {
                                          const z = [...zones]
                                          z[zi] = { ...z[zi], areaRates: z[zi].areaRates!.map(a =>
                                            a.area === area ? { ...a, rate: Number(e.target.value) } : a
                                          )}
                                          setZones(z); setSaved(false)
                                        }}
                                        className="w-24 px-2 py-1 text-xs border border-blue-200 rounded-lg outline-none focus:border-blue-400 bg-white font-mono text-right" />
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                            {(zone.areaRates?.length ?? 0) === 0 && (
                              <p className="text-[10px] text-amber-500 font-medium px-1">⚠ No areas added — check boxes to add areas with their own prices</p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
              ))}
              <button onClick={() => { setZones(z => [...z, { name: '', rate: 0, states: [] }]); setSaved(false) }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-gray-400 hover:text-gray-700 w-full justify-center">
                <Plus size={12} /> Add Zone
              </button>
            </div>
          </Row>
        )}
      </Section>

      {/* Self-Arranged Logistics */}
      <Section title="Customer Self-Logistics" icon={ExternalLink}>
        <Row label="Enable" hint="Customers can choose their own delivery provider at checkout">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={selfLogisticsEnabled}
              onChange={e => { setSelfLogisticsEnabled(e.target.checked); setSaved(false) }}
              className="w-4 h-4 accent-red-500 rounded" />
            <span className="text-xs text-gray-600 font-medium">Allow customers to arrange their own logistics</span>
          </label>
        </Row>

        {selfLogisticsEnabled && (
          <>
            <Row label="Handling Fee" hint="Optional fee when customer uses own logistics (0 = free)">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 font-medium">{cur}</span>
                <input type="number" min={0} value={selfLogisticsFee}
                  onChange={e => { setSelfLogisticsFee(Number(e.target.value)); setSaved(false) }}
                  className="w-36 px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-gray-400 font-mono" />
              </div>
            </Row>

            <Row label="Customer Note" hint="Instructions shown at checkout when they choose self-logistics">
              <textarea value={selfLogisticsNote}
                onChange={e => { setSelfLogisticsNote(e.target.value); setSaved(false) }}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-gray-400 resize-none" />
            </Row>

            <Row label="Logistics Providers" hint="Providers shown to customer — they click to book on the provider's site">
              <div className="space-y-2">
                {providers.map((pr, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center bg-gray-50 rounded-xl px-3 py-2">
                    <input value={pr.name} onChange={e => updateProvider(i, 'name', e.target.value)}
                      placeholder="Provider name"
                      className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-gray-400 bg-white" />
                    <input value={pr.website} onChange={e => updateProvider(i, 'website', e.target.value)}
                      placeholder="Website URL"
                      className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-gray-400 bg-white font-mono" />
                    <input value={pr.phone} onChange={e => updateProvider(i, 'phone', e.target.value)}
                      placeholder="Phone / WhatsApp"
                      className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-gray-400 bg-white" />
                    <button onClick={() => removeProvider(i)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                <button onClick={addProvider}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-gray-400 hover:text-gray-700 w-full justify-center">
                  <Plus size={12} /> Add Provider
                </button>
              </div>
            </Row>
          </>
        )}
      </Section>

      {/* Fulfillment */}
      <Section title="Fulfillment" icon={Package}>
        <Row label="Processing Time" hint="How long before order is dispatched">
          <input value={processingTime} onChange={e => { setProcessingTime(e.target.value); setSaved(false) }}
            placeholder="e.g. 1–2 business days"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-gray-400" />
        </Row>
        <Row label="Same-Day Cut-off" hint="Orders before this time may ship same day">
          <input value={cutoffTime} onChange={e => { setCutoffTime(e.target.value); setSaved(false) }}
            placeholder="e.g. 2:00 PM"
            className="w-48 px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-gray-400" />
        </Row>
        <Row label="Fulfillment Note" hint="Shown on checkout — e.g. dispatch info, delays">
          <textarea value={fulfillmentNote} onChange={e => { setFulfillmentNote(e.target.value); setSaved(false) }}
            placeholder="e.g. Orders placed before 2 PM ship same day. Weekend orders ship Monday."
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-gray-400 resize-none" />
        </Row>
      </Section>

      {/* Local Pickup */}
      <Section title="Local Pickup" icon={MapPin}>
        <Row label="Enable Pickup" hint="Allow customers to collect in-store">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={pickupEnabled}
              onChange={e => { setPickupEnabled(e.target.checked); setSaved(false) }}
              className="w-4 h-4 accent-red-500 rounded" />
            <span className="text-xs text-gray-600 font-medium">Offer local pickup option at checkout</span>
          </label>
        </Row>
        {pickupEnabled && (
          <Row label="Pickup Address" hint="Where customers collect their order">
            <textarea value={pickupAddress} onChange={e => { setPickupAddress(e.target.value); setSaved(false) }}
              placeholder="Full pickup address" rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-gray-400 resize-none" />
          </Row>
        )}
      </Section>

      {/* Returns */}
      <Section title="Returns & Refunds" icon={Clock}>
        <Row label="Return Window" hint="Days after delivery customer can request a return">
          <div className="flex items-center gap-2">
            <input type="number" min={0} max={90} value={returnDays}
              onChange={e => { setReturnDays(Number(e.target.value)); setSaved(false) }}
              className="w-20 px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-gray-400 font-mono" />
            <span className="text-xs text-gray-500">days</span>
          </div>
        </Row>
        <Row label="Return Policy" hint="Shown on product and checkout pages">
          <textarea value={returnPolicy} onChange={e => { setReturnPolicy(e.target.value); setSaved(false) }}
            placeholder="Describe your return conditions…" rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-gray-400 resize-none" />
        </Row>
      </Section>

      {/* Save */}
      <div className="flex justify-end gap-2 pt-1">
        <button onClick={() => {
          setFlatRate(client.shipping.flatRate ?? 2500)
          setFreeAbove(client.shipping.freeAbove ?? 50000)
          setFreeEnabled((client.shipping.freeAbove ?? 50000) > 0)
          setEstDays(client.shipping.estimatedDays ?? '2–5 business days')
          setSaved(false)
        }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600">
          <RefreshCw size={11} /> Reset
        </button>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl text-white hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: saved ? '#16a34a' : ACCENT }}>
          {saved ? <><Check size={13} /> Saved</>
            : saving ? <><Save size={13} className="animate-pulse" /> Saving…</>
            : <><Save size={13} /> Save Settings</>}
        </button>
      </div>
    </div>
  )
}

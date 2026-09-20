'use client'

import { useState, useEffect, FormEvent } from 'react'
import { User, Mail, Phone, MapPin, Lock, Eye, EyeOff, Save } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createBrowserClient } from '@supabase/ssr'
import toast from 'react-hot-toast'

const ACCENT = '#e84c3d'
const NAVY   = '#1a2638'

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','Gombe','Imo','Jigawa',
  'Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger',
  'Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe',
  'Zamfara','FCT Abuja',
]

export default function ProfilePage() {
  const { user, updateProfile, isDemoMode } = useAuth()

  const meta = user?.user_metadata ?? {}

  const [fullName, setFullName]   = useState(meta.full_name ?? '')
  const [phone,    setPhone]      = useState(meta.phone ?? '')
  const [address,  setAddress]    = useState(meta.address ?? '')
  const [city,     setCity]       = useState(meta.city ?? '')
  const [state,    setState]      = useState(meta.state ?? '')
  const [saving,   setSaving]     = useState(false)

  // Password change
  const [currentPwd,  setCurrentPwd]  = useState('')
  const [newPwd,      setNewPwd]      = useState('')
  const [confirmPwd,  setConfirmPwd]  = useState('')
  const [showPwd,     setShowPwd]     = useState(false)
  const [savingPwd,   setSavingPwd]   = useState(false)

  useEffect(() => {
    if (meta.full_name) setFullName(meta.full_name)
    if (meta.phone)     setPhone(meta.phone)
    if (meta.address)   setAddress(meta.address)
    if (meta.city)      setCity(meta.city)
    if (meta.state)     setState(meta.state)
  }, [user])

  async function saveProfile(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await updateProfile({ full_name: fullName, phone, address, city, state })
      toast.success('Profile updated!')
    } catch (err: any) {
      toast.error(err?.message || 'Could not update profile')
    } finally {
      setSaving(false)
    }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault()
    if (newPwd !== confirmPwd) return toast.error('Passwords do not match')
    if (newPwd.length < 6)     return toast.error('Password must be at least 6 characters')
    if (isDemoMode) return toast.success('Password change simulated (demo mode)')
    setSavingPwd(true)
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
      const supabase = createBrowserClient(supabaseUrl, supabaseKey)
      const { error } = await supabase.auth.updateUser({ password: newPwd })
      if (error) throw error
      toast.success('Password updated!')
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('')
    } catch (err: any) {
      toast.error(err?.message || 'Could not update password')
    } finally {
      setSavingPwd(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Personal Info */}
      <form onSubmit={saveProfile} className="bg-white rounded-lg border border-gray-100 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100" style={{ backgroundColor: '#fafafa' }}>
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Personal Information</h3>
        </div>
        <div className="px-5 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Full Name */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5 uppercase tracking-wide">Full Name</label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors" />
            </div>
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5 uppercase tracking-wide">Email Address</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="email" value={user?.email ?? ''} readOnly
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed" />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Email cannot be changed here.</p>
          </div>

          {/* Phone */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5 uppercase tracking-wide">Phone Number</label>
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+234 800 000 0000"
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors" />
            </div>
          </div>

          {/* State */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5 uppercase tracking-wide">State</label>
            <select value={state} onChange={e => setState(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors bg-white">
              <option value="">Select state</option>
              {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Street Address */}
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-gray-600 block mb-1.5 uppercase tracking-wide">Street Address</label>
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-3 text-gray-400" />
              <textarea value={address} onChange={e => setAddress(e.target.value)}
                placeholder="House number, street name…" rows={2}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors resize-none" />
            </div>
          </div>

          {/* City */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5 uppercase tracking-wide">City / LGA</label>
            <input type="text" value={city} onChange={e => setCity(e.target.value)}
              placeholder="Lagos Island"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors" />
          </div>
        </div>

        <div className="px-5 pb-5 flex justify-end">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 text-white text-sm font-bold rounded-lg transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: ACCENT }}>
            <Save size={14} />
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Change Password */}
      <form onSubmit={changePassword} className="bg-white rounded-lg border border-gray-100 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100" style={{ backgroundColor: '#fafafa' }}>
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Change Password</h3>
        </div>
        <div className="px-5 py-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Current Password',  value: currentPwd, setter: setCurrentPwd },
            { label: 'New Password',       value: newPwd,     setter: setNewPwd },
            { label: 'Confirm New Password', value: confirmPwd, setter: setConfirmPwd },
          ].map(({ label, value, setter }) => (
            <div key={label}>
              <label className="text-xs font-semibold text-gray-600 block mb-1.5 uppercase tracking-wide">{label}</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showPwd ? 'text' : 'password'} value={value} onChange={e => setter(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-9 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors" />
                {label === 'New Password' && (
                  <button type="button" onClick={() => setShowPwd(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 pb-5 flex justify-end">
          <button type="submit" disabled={savingPwd}
            className="flex items-center gap-2 px-6 py-2.5 text-white text-sm font-bold rounded-lg transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: NAVY }}>
            <Lock size={14} />
            {savingPwd ? 'Updating…' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  )
}

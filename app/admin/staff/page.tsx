'use client'

import { useEffect, useState } from 'react'
import { getAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser } from '@/lib/admin-db'
import { Users, Plus, Trash2, Edit2, X } from 'lucide-react'
import toast from 'react-hot-toast'

const ACCENT = '#e84c3d'

const ROLES = [
  { value: 'admin',   label: 'Admin',   desc: 'Full access — products, orders, settings, staff management' },
  { value: 'manager', label: 'Manager', desc: 'Products, orders, coupons, blog — cannot manage staff or settings' },
  { value: 'viewer',  label: 'Viewer',  desc: 'Read-only access to orders and analytics dashboard' },
]

const ROLE_STYLES: Record<string, string> = {
  admin:   'bg-red-50 text-red-700',
  manager: 'bg-blue-50 text-blue-700',
  viewer:  'bg-gray-100 text-gray-600',
}

export default function StaffPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState({ name: '', email: '', role: 'manager', is_active: true })

  async function load() {
    setLoading(true)
    try { setUsers(await getAdminUsers()) } catch {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function openCreate() { setEditing(null); setForm({ name: '', email: '', role: 'manager', is_active: true }); setModal(true) }
  function openEdit(u: any) { setEditing(u); setForm({ name: u.name, email: u.email, role: u.role, is_active: u.is_active }); setModal(true) }

  async function handleSave() {
    if (!form.name.trim() || !form.email.trim()) { toast.error('Name and email are required'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { toast.error('Invalid email'); return }
    try {
      if (editing) await updateAdminUser(editing.id, form)
      else await createAdminUser(form)
      toast.success(editing ? 'Updated' : 'Staff member added')
      setModal(false); load()
    } catch { toast.error('Failed to save') }
  }

  async function handleDelete(u: any) {
    if (u.role === 'admin' && users.filter(x => x.role === 'admin').length === 1) {
      toast.error('Cannot delete the last admin account'); return
    }
    if (!confirm(`Remove ${u.name} from staff?`)) return
    try { await deleteAdminUser(u.id); toast.success('Removed'); load() } catch { toast.error('Failed') }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{users.length} staff member{users.length !== 1 ? 's' : ''}</p>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-lg transition-opacity hover:opacity-90"
          style={{ backgroundColor: ACCENT }}>
          <Plus size={15} /> Add Staff
        </button>
      </div>

      {/* Role reference */}
      <div className="grid grid-cols-3 gap-3">
        {ROLES.map(r => (
          <div key={r.value} className="bg-white border border-gray-100 rounded-xl p-4">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ROLE_STYLES[r.value]}`}>{r.label}</span>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">{r.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-red-500 animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center">
            <Users size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No staff members yet.</p>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-[1fr_200px_90px_80px_60px] gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span>Name</span><span>Email</span><span>Role</span><span>Status</span><span></span>
            </div>
            {users.map(u => (
              <div key={u.id} className="grid grid-cols-[1fr_200px_90px_80px_60px] gap-3 items-center px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                    {u.name?.charAt(0)?.toUpperCase() ?? '?'}
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{u.name}</p>
                </div>
                <p className="text-sm text-gray-500 truncate">{u.email}</p>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full w-fit capitalize ${ROLE_STYLES[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
                  {u.role}
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full w-fit ${u.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {u.is_active ? 'Active' : 'Inactive'}
                </span>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => openEdit(u)} className="text-gray-400 hover:text-blue-600 transition-colors"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(u)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-800">{editing ? 'Edit Staff Member' : 'Add Staff Member'}</h2>
              <button onClick={() => setModal(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Adebayo Okafor"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="staff@mystore.com"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400">
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>
            <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
              Staff members receive an invite email (when Supabase Auth is active). In demo mode, roles are stored locally and enforced via middleware when you add a JWT check.
            </p>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setModal(false)} className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} className="flex-1 py-2.5 text-sm font-bold text-white rounded-lg transition-opacity hover:opacity-90" style={{ backgroundColor: ACCENT }}>
                {editing ? 'Save Changes' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

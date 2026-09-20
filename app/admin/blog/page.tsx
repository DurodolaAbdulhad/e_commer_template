'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getPosts, createPost, updatePost, deletePost } from '@/lib/admin-db'
import { Plus, Pencil, Trash2, Eye, EyeOff, X, Check, AlignLeft } from 'lucide-react'
import toast from 'react-hot-toast'

const ACCENT = '#e84c3d'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
}

const BLANK = {
  title: '', slug: '', excerpt: '', content: '', cover_image: '',
  category: '', author: 'Store Team', tags: '', read_time: 4, is_published: true,
}

export default function AdminBlogPage() {
  const [posts, setPosts]   = useState<any[]>([])
  const [open, setOpen]     = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm]     = useState<any>(BLANK)
  const [saving, setSaving] = useState(false)

  async function load() {
    const data = await getPosts()
    setPosts(data)
  }

  useEffect(() => { load() }, [])

  function set(key: string, val: any) {
    setForm((p: any) => ({
      ...p,
      [key]: val,
      ...(key === 'title' && !editing ? { slug: slugify(val) } : {}),
    }))
  }

  function openNew() {
    setEditing(null)
    setForm(BLANK)
    setOpen(true)
  }

  function openEdit(p: any) {
    setEditing(p.id)
    setForm({ ...p, tags: Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags ?? '') })
    setOpen(true)
  }

  async function handleSave() {
    if (!form.title.trim()) { toast.error('Title is required'); return }
    if (!form.slug.trim())  { toast.error('Slug is required'); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
        read_time: Number(form.read_time) || 4,
      }
      if (editing) {
        await updatePost(editing, payload)
        toast.success('Post updated')
      } else {
        await createPost(payload)
        toast.success('Post created')
      }
      setOpen(false)
      load()
    } catch (e: any) {
      toast.error(e.message ?? 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(p: any) {
    await updatePost(p.id, { is_published: !p.is_published })
    toast.success(p.is_published ? 'Post unpublished' : 'Post published')
    load()
  }

  async function handleDelete(p: any) {
    if (!confirm(`Delete "${p.title}"?`)) return
    await deletePost(p.id)
    toast.success('Post deleted')
    load()
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Blog Posts</h1>
          <p className="text-sm text-gray-400 mt-0.5">{posts.length} total · {posts.filter(p => p.is_published).length} published</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/blog" target="_blank"
            className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors">
            <Eye size={13} /> View Blog
          </Link>
          <button onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-lg transition-opacity hover:opacity-90"
            style={{ backgroundColor: ACCENT }}>
            <Plus size={16} /> New Post
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {posts.length === 0 ? (
          <div className="py-16 text-center">
            <AlignLeft size={28} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 text-sm">No blog posts yet.</p>
            <button onClick={openNew}
              className="mt-4 text-sm font-semibold"
              style={{ color: ACCENT }}>+ Create your first post</button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500 bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Title</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Date</th>
                <th className="text-center px-4 py-3 font-semibold">Status</th>
                <th className="text-right px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {posts.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      {p.cover_image && (
                        <img src={p.cover_image} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
                      )}
                      <div>
                        <p className="font-medium text-gray-800 line-clamp-1">{p.title}</p>
                        <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{p.excerpt}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">{p.category}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell whitespace-nowrap">
                    {formatDate(p.created_at)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleToggle(p)}
                      title={p.is_published ? 'Unpublish' : 'Publish'}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors"
                      style={{
                        backgroundColor: p.is_published ? '#f0fdf4' : '#fef2f2',
                        color: p.is_published ? '#16a34a' : '#dc2626',
                      }}>
                      {p.is_published ? <Check size={11} /> : <EyeOff size={11} />}
                      {p.is_published ? 'Live' : 'Draft'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/blog/${p.slug}`} target="_blank"
                        className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors" title="Preview">
                        <Eye size={14} />
                      </Link>
                      <button onClick={() => openEdit(p)}
                        className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors" title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(p)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-800">{editing ? 'Edit Post' : 'New Blog Post'}</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            {/* Modal body */}
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
                  <input value={form.title} onChange={e => set('title', e.target.value)}
                    placeholder="Post title"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Slug *</label>
                  <input value={form.slug} onChange={e => set('slug', slugify(e.target.value))}
                    placeholder="post-url-slug"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400 font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                  <input value={form.category} onChange={e => set('category', e.target.value)}
                    placeholder="e.g. Tech & Productivity"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Cover Image URL</label>
                  <input value={form.cover_image} onChange={e => set('cover_image', e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Excerpt</label>
                  <textarea value={form.excerpt} onChange={e => set('excerpt', e.target.value)}
                    rows={2} placeholder="Short description shown in post cards..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400 resize-none" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Content</label>
                  <textarea value={form.content} onChange={e => set('content', e.target.value)}
                    rows={8} placeholder="Full post content. Use **text** for bold, # for headings..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400 resize-y font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Author</label>
                  <input value={form.author} onChange={e => set('author', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Read Time (minutes)</label>
                  <input type="number" min={1} value={form.read_time} onChange={e => set('read_time', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tags (comma-separated)</label>
                  <input value={form.tags} onChange={e => set('tags', e.target.value)}
                    placeholder="gadgets, home office, productivity"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400" />
                </div>
                <div className="sm:col-span-2 flex items-center gap-2">
                  <input type="checkbox" id="is_published" checked={form.is_published}
                    onChange={e => set('is_published', e.target.checked)}
                    className="w-4 h-4 rounded accent-red-500" />
                  <label htmlFor="is_published" className="text-sm text-gray-700">Publish immediately</label>
                </div>
              </div>
            </div>
            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100">
              <button onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2 text-sm font-semibold text-white rounded-lg transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: ACCENT }}>
                {saving ? 'Saving…' : (editing ? 'Save Changes' : 'Create Post')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

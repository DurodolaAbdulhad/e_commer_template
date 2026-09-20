'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getProduct } from '@/lib/admin-db'
import ProductForm from '@/components/admin/ProductForm'

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProduct(id).then(p => { setProduct(p); setLoading(false) })
  }, [id])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-red-500 animate-spin" />
    </div>
  )
  if (!product) return <p className="text-sm text-gray-400 p-5">Product not found.</p>

  return <ProductForm product={product} />
}

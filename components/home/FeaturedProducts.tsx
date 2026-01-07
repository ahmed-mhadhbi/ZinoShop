'use client'

import { motion } from 'framer-motion'
import ProductCard from '@/components/products/ProductCard'
import { useEffect, useState } from 'react'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface FeaturedProduct {
  id: string
  name: string
  price: number
  images?: string[]
  image?: string
  rating?: number
  reviewCount?: number
  sku?: string
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState<FeaturedProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const fetchFeatured = async () => {
      try {
        const res = await api.get('/products/featured')
        if (!cancelled) setProducts(res.data || [])
      } catch (err: any) {
        console.error('Failed to fetch featured products', err)
        toast.error(err?.response?.data?.message || 'Failed to load featured products')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchFeatured()
    return () => { cancelled = true }
  }, [])

  const renderSkeletons = () => (
    Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="card animate-pulse">
        <div className="relative aspect-square bg-gray-200" />
        <div className="p-4">
          <div className="h-4 bg-gray-200 w-3/4 mb-2" />
          <div className="h-6 bg-gray-200 w-1/3" />
        </div>
      </div>
    ))
  )

  return (
    <section className="py-20 bg-gray-50">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">
            Featured Products
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Handpicked selections from our finest collection
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            renderSkeletons()
          ) : products && products.length > 0 ? (
            products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <ProductCard product={{
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  images: product.images,
                  image: product.image,
                  rating: product.rating,
                  reviews: product.reviewCount,
                  sku: product.sku,
                }} />
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-600">
              No featured products available at the moment.
            </div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-center mt-12"
        >
          <a
            href="/products"
            className="btn-primary inline-flex items-center"
          >
            View All Products
          </a>
        </motion.div>
      </div>
    </section>
  )
}


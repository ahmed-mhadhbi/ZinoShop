'use client'

import { motion } from 'framer-motion'
import ProductCard from '@/components/products/ProductCard'
import { useEffect, useState } from 'react'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Sparkles } from 'lucide-react'

interface FeaturedProduct {
  id: string
  name: string
  price: number
  images?: string[]
  image?: string
  variants?: string[]
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
        const res = await api.get(`/products/featured?_t=${Date.now()}`)
        if (!cancelled) setProducts((res.data || []).slice(0, 4))
      } catch (err: any) {
        console.error('Failed to fetch featured products', err)
        toast.error(err?.response?.data?.message || 'Echec du chargement des produits en vedette')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchFeatured()
    return () => { cancelled = true }
  }, [])

  const renderSkeletons = () => (
    Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="card animate-pulse rounded-2xl overflow-hidden">
        <div className="relative aspect-square bg-gray-200" />
        <div className="p-2 sm:p-3">
          <div className="h-3 bg-gray-200 w-3/4 mb-2" />
          <div className="h-5 bg-gray-200 w-1/3" />
        </div>
      </div>
    ))
  )

  return (
    <section className="relative py-16 sm:py-20 bg-gradient-to-b from-gray-50 via-white to-gray-50 overflow-hidden">
      <div className="pointer-events-none absolute -top-16 -left-10 w-52 h-52 rounded-full bg-primary-100/45 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -right-10 w-56 h-56 rounded-full bg-gold-100/50 blur-3xl" />

      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 text-primary-700 text-xs sm:text-sm font-semibold shadow-sm mb-4">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            Coup de coeur Zino
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-3">
            Produits en vedette
          </h2>
          <p className="text-sm sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Une selection soignee de notre meilleure collection
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {loading ? (
            renderSkeletons()
          ) : products && products.length > 0 ? (
            products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                whileHover={{ y: -4 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.5 }}
              >
                <ProductCard product={{
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  images: product.images,
                  image: product.image,
                  variants: product.variants,
                  rating: product.rating,
                  reviews: product.reviewCount,
                  sku: product.sku,
                }} compact />
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-600">
              Aucun produit en vedette pour le moment.
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
            Voir tous les produits
          </a>
        </motion.div>
      </div>
    </section>
  )
}


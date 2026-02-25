'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import { Heart } from 'lucide-react'
import Link from 'next/link'
import ProductCard from '@/components/products/ProductCard'
import api from '@/lib/api'

export default function WishlistPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [wishlistItems, setWishlistItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchWishlist = async () => {
    try {
      setIsLoading(true)
      const response = await api.get('/wishlist')
      console.log('Wishlist response:', response.data)
      setWishlistItems(response.data || [])
    } catch (error: any) {
      console.error('Failed to fetch wishlist:', error)
      if (error.response?.status === 401) {
        router.push('/auth/login')
      }
      setWishlistItems([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    fetchWishlist()
  }, [isAuthenticated, router])

  // Refresh wishlist when page becomes visible or focused (user might have added items from another tab/page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
        fetchWishlist()
      }
    }
    const handleFocus = () => {
      if (isAuthenticated) {
        fetchWishlist()
      }
    }
    const handleWishlistUpdate = () => {
      if (isAuthenticated) {
        fetchWishlist()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('wishlistUpdated', handleWishlistUpdate)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('wishlistUpdated', handleWishlistUpdate)
    }
  }, [isAuthenticated])

  if (!isAuthenticated || isLoading) {
    return (
      <div className="pt-24 pb-20 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  const products = wishlistItems.map((item) => ({
    id: item.product?.id || item.productId,
    name: item.product?.name || 'Produit',
    price: item.product?.price || 0,
    image: item.product?.images?.[0] || '',
    rating: item.product?.rating || 0,
    reviews: item.product?.reviewCount || 0,
  }))

  return (
    <div className="pt-24 pb-20">
      <div className="container-custom">
        <h1 className="text-4xl font-serif font-bold mb-8">Ma liste de souhaits</h1>

        {wishlistItems.length === 0 ? (
          <div className="card p-12 text-center">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Votre liste de souhaits est vide</h2>
            <p className="text-gray-600 mb-6">
              Ajoutez vos articles preferes a votre liste de souhaits
            </p>
            <Link href="/products" className="btn-primary">
              Voir les produits
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


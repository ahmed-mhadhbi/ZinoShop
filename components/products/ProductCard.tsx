'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import ProductImage from '@/components/common/ProductImage'

interface Product {
  id: string
  name: string
  price: number
  image?: string
  images?: string[]
  rating?: number
  reviews?: number
  sku?: string
}

export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem)
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false)

  // Get the first image from images array or fallback to image property
  const productImage = product.images && product.images.length > 0 
    ? product.images[0] 
    : product.image || ''

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: productImage,
    })
    toast.success('Added to cart!')
  }

  const handleAddToWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    
    if (!isAuthenticated) {
      toast.error('Please login to add items to wishlist')
      router.push('/auth/login?redirect=/account/wishlist')
      return
    }

    setIsAddingToWishlist(true)
    try {
      const response = await api.post(`/wishlist/${product.id}`)
      console.log('Added to wishlist:', response.data)
      toast.success('Added to wishlist!')
      // Dispatch custom event to refresh wishlist page if it's open
      window.dispatchEvent(new CustomEvent('wishlistUpdated'))
    } catch (error: any) {
      console.error('Wishlist add error:', error)
      if (error.response?.status === 401) {
        toast.error('Please login to add items to wishlist')
        router.push('/auth/login?redirect=/account/wishlist')
      } else {
        toast.error(error.response?.data?.message || 'Failed to add to wishlist')
      }
    } finally {
      setIsAddingToWishlist(false)
    }
  }

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="card overflow-hidden group"
    >
      <Link href={`/products/${product.id}`}>
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <ProductImage
            src={productImage}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleAddToWishlist}
              disabled={isAddingToWishlist}
              className="p-2 bg-white rounded-full shadow-lg hover:bg-primary-50 transition-colors disabled:opacity-50"
            >
              <Heart className={`w-5 h-5 ${isAddingToWishlist ? 'text-primary-600' : 'text-gray-700'}`} />
            </button>
          </div>
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/products/${product.id}`}>
          <h3 className="font-semibold text-lg mb-2 hover:text-primary-600 transition-colors">
            {product.name}
          </h3>
        </Link>



        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-primary-600">
            {product.price.toLocaleString()} tnd
          </span>
          <button
            onClick={handleAddToCart}
            className="btn-primary text-sm py-2 px-4"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </motion.div>
  )
}


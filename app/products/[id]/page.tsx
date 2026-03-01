'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Star, Heart, Share2, Minus, Plus, Truck, Shield, RotateCcw } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'
import ProductImage from '@/components/common/ProductImage'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false)
  const addItem = useCartStore((state) => state.addItem)
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    const fetchProduct = async () => {
      if (!params.id) return
      
      try {
        setIsLoading(true)
        const response = await api.get(`/products/${params.id}`)
        setProduct(response.data)
        // Reset selected image when product changes
        setSelectedImage(0)
        setSelectedVariant('')
      } catch (error: any) {
        console.error('Failed to fetch product:', error)
        if (error.response?.status === 404) {
          toast.error('Produit introuvable')
        } else {
          toast.error('Echec du chargement du produit')
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchProduct()
  }, [params.id])

  const handleAddToCart = () => {
    if (!product) return

    const variants = Array.isArray(product.variants)
      ? product.variants.map((variant: string) => String(variant || '').trim()).filter(Boolean)
      : []

    if (variants.length > 0 && !selectedVariant) {
      toast.error('Veuillez choisir une variante avant d ajouter au panier')
      return
    }
    
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: productImages[selectedImage] || product.images?.[0] || product.image || '',
        variant: selectedVariant || undefined,
      })
    }
    toast.success(`${quantity} article(s) ajoute(s) au panier !`)
  }

  const handleShare = async () => {
    if (!product) return
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Decouvrez ce magnifique ${product.name} sur ZinoShop !`,
          url: window.location.href,
        })
      } catch {
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Lien copie !')
    }
  }

  const handleAddToWishlist = async () => {
    if (!product) return
    
    if (!isAuthenticated) {
      toast.error('Veuillez vous connecter pour ajouter a la liste de souhaits')
      router.push('/auth/login?redirect=/account/wishlist')
      return
    }

    setIsAddingToWishlist(true)
    try {
      await api.post(`/wishlist/${product.id}`)
      toast.success('Ajoute a la liste de souhaits !')
      // Dispatch custom event to refresh wishlist page if it's open
      window.dispatchEvent(new CustomEvent('wishlistUpdated'))
    } catch (error: any) {
      console.error('Wishlist add error:', error)
      if (error.response?.status === 401) {
        toast.error('Veuillez vous connecter pour ajouter a la liste de souhaits')
        router.push('/auth/login?redirect=/account/wishlist')
      } else {
        toast.error(error.response?.data?.message || 'Echec de l ajout a la liste de souhaits')
      }
    } finally {
      setIsAddingToWishlist(false)
    }
  }

  if (isLoading) {
    return (
      <div className="pt-24 pb-20 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Chargement du produit...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="pt-24 pb-20 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Produit introuvable</p>
          <Link href="/products" className="btn-primary">
            Retour aux produits
          </Link>
        </div>
      </div>
    )
  }

  // Ensure images is an array
  const productImages = product.images && Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : product.image
      ? [product.image]
      : ['https://images.unsplash.com/photo-1603561596112-0a1325a55570?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'] // Fallback image

  const inStock = product.stock > 0 && product.isActive !== false
  const productVariants = Array.isArray(product.variants)
    ? product.variants.map((variant: string) => String(variant || '').trim()).filter(Boolean)
    : []

  return (
    <div className="pt-24 pb-20">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images */}
          <div>
            <div className="relative aspect-square mb-4 rounded-lg overflow-hidden bg-gray-100">
              <ProductImage
                src={productImages[selectedImage]}
                alt={product.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            {productImages.length > 1 && (
              <div className="grid grid-cols-3 gap-4">
                {productImages.map((image: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index
                        ? 'border-primary-600'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <ProductImage
                      src={image}
                      alt={`${product.name} view ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 33vw, 16vw"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
              {product.name}
            </h1>



            <div className="text-4xl font-bold text-primary-600 mb-6">
              {product.price.toLocaleString()} tnd
            </div>

            <p className="text-gray-700 mb-8 leading-relaxed">
              {product.description}
            </p>

            {/* Product Details */}
            <div className="border-t border-b py-6 mb-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Disponibilite:</span>
                <span
                  className={`font-semibold ${
                    inStock ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {inStock
                    ? `En stock (${product.stock || 0} disponible)`
                    : 'Rupture de stock'}
                </span>
              </div>
            </div>

            {/* Quantity Selector */}
            {productVariants.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">
                  Variante *
                </label>
                <div className="flex flex-wrap gap-2">
                  {productVariants.map((variant: string) => (
                    <button
                      key={variant}
                      type="button"
                      onClick={() => setSelectedVariant(variant)}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        selectedVariant === variant
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {variant}
                    </button>
                  ))}
                </div>
                {!selectedVariant && (
                  <p className="text-xs text-gray-500 mt-2">
                    Choisissez une variante pour continuer.
                  </p>
                )}
              </div>
            )}

            {/* Quantity Selector */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">
                Quantite
              </label>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 border rounded-lg hover:bg-gray-50"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="text-xl font-semibold w-12 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() =>
                    setQuantity(
                      Math.min(product.stock || 10, quantity + 1)
                    )
                  }
                  disabled={!inStock}
                  className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4 mb-8">
              <button
                onClick={handleAddToCart}
                disabled={!inStock}
                className="btn-primary w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ajouter au panier
              </button>
              <div className="flex gap-4">
                <button
                  onClick={handleAddToWishlist}
                  disabled={isAddingToWishlist}
                  className="btn-outline flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Heart className={`w-5 h-5 ${isAddingToWishlist ? 'fill-primary-600 text-primary-600' : ''}`} />
                  {isAddingToWishlist ? 'Ajout...' : 'Liste de souhaits'}
                </button>
                <button
                  onClick={handleShare}
                  className="btn-outline flex-1 flex items-center justify-center gap-2"
                >
                  <Share2 className="w-5 h-5" />
                  Partager
                </button>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t">
              <div className="text-center">
                <Truck className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                <p className="text-sm font-semibold">Livraison: 8 tnd</p>
                <p className="text-xs text-gray-600">Livraison en 7 jours ouvrables</p>
              </div>
              <div className="text-center">
                <Shield className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                <p className="text-sm font-semibold">Paiement securise</p>
                <p className="text-xs text-gray-600">100% protege</p>
              </div>

            </div>
          </div>
        </div>


      </div>
    </div>
  )
}


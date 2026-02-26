'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import ProductCard from '@/components/products/ProductCard'
import { Filter, Grid, List, Sparkles } from 'lucide-react'
import api from '@/lib/api'

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('newest')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchProducts()
    
    // Listen for custom event to refresh products (only when needed)
    const handleProductsUpdate = () => {
      fetchProducts(true)
    }
    
    window.addEventListener('productsUpdated', handleProductsUpdate)
    
    return () => {
      window.removeEventListener('productsUpdated', handleProductsUpdate)
    }
  }, [selectedCategory, selectedMaterial, page])

  const fetchProducts = async (forceRefresh: boolean = false) => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') params.append('category', selectedCategory)
      if (selectedMaterial !== 'all') params.append('material', selectedMaterial)
      params.append('page', page.toString())
      params.append('limit', '20')
      // Use cache-busting only when a product update event explicitly requests fresh data.
      if (forceRefresh) {
        params.append('_t', Date.now().toString())
      }
      
      const response = await api.get(`/products?${params.toString()}`)
      const data = response.data
      
      // Handle both old format (array) and new format (paginated object)
      if (Array.isArray(data)) {
        setProducts(data)
        setTotal(data.length)
        setTotalPages(1)
      } else {
        setProducts(data.products || [])
        setTotal(data.total || 0)
        setTotalPages(data.totalPages || 1)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }

  const categories = ['all', 'Bracelets', 'colliers', 'bague', 'series', 'manchettes', 'rangements', 'montres', 'sac', 'boucles']
  const materials = ['all', 'Gold', 'Silver', 'Platinum', 'Pearl', 'Diamond', 'Other']
  const materialLabels: Record<string, string> = {
    all: 'toutes',
    Gold: 'Or',
    Silver: 'Argent',
    Platinum: 'Platine',
    Pearl: 'Perle',
    Diamond: 'Diamant',
    Other: 'Autre',
  }

  // Client-side sorting only (filtering is done server-side)
  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price
      case 'price-high':
        return b.price - a.price
      case 'rating':
        return (b.rating || 0) - (a.rating || 0)
      case 'newest':
        // Sort by createdAt if available, otherwise keep original order
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        }
        return 0
      default:
        return 0
    }
  })

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setPage(1) // Reset to first page when filter changes
  }

  const handleMaterialChange = (material: string) => {
    setSelectedMaterial(material)
    setPage(1) // Reset to first page when filter changes
  }

  if (isLoading) {
    return (
      <div className="pt-24 pb-20 min-h-screen">
        <div className="container-custom">
          <div className="flex flex-col items-center justify-center text-center mb-10">
            <div className="flex items-center gap-2 text-primary-600 mb-2">
              <Sparkles className="w-5 h-5 animate-bounce" />
              <p className="font-semibold">Chargement des plus belles pieces pour vous...</p>
              <Sparkles className="w-5 h-5 animate-bounce [animation-delay:120ms]" />
            </div>
            <p className="text-gray-600">Un instant...</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 md:gap-4">
            {Array.from({ length: 12 }).map((_, idx) => (
              <div key={idx} className="card overflow-hidden">
                <div className="aspect-square bg-gradient-to-br from-primary-100 via-pink-50 to-gold-100 animate-pulse" />
                <div className="p-2 sm:p-3 space-y-2">
                  <div className="h-3 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-2/3 bg-gray-200 rounded animate-pulse" />
                  <div className="h-6 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-24 pb-20">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
            Notre collection
          </h1>
          <p className="text-xl text-gray-600">
            Decouvrez notre gamme de bijoux artisanaux
          </p>
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-outline flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Filter className="w-5 h-5" />
              Filtres
            </button>
            <div className="flex items-center gap-2 border rounded-lg p-1 w-full sm:w-auto justify-center">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${
                  viewMode === 'grid'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${
                  viewMode === 'list'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-field w-full md:w-auto"
          >
            <option value="newest">Plus recent</option>
            <option value="price-low">Prix: croissant</option>
            <option value="price-high">Prix: decroissant</option>
            <option value="rating">Mieux notes</option>
          </select>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="card p-6 mb-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Categorie
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => handleCategoryChange(category)}
                      className={`px-4 py-2 rounded-lg transition-colors capitalize ${
                        selectedCategory === category
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category === 'all' ? 'toutes' : category}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Matiere
                </label>
                <div className="flex flex-wrap gap-2">
                  {materials.map((material) => (
                    <button
                      key={material}
                      onClick={() => handleMaterialChange(material)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        selectedMaterial === material
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {materialLabels[material] || material}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Products Grid */}
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-2 lg:grid-cols-6 gap-3 md:gap-4'
              : 'grid grid-cols-1 lg:grid-cols-4 gap-6'
          }
        >
          {sortedProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ProductCard 
                compact={viewMode === 'grid'}
                product={{
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  image: product.images?.[0] || product.image || '',
                  variants: product.variants || [],
                  rating: product.rating || 0,
                  reviews: product.reviewCount || 0,
                  sku: product.sku,
                }} 
              />
            </motion.div>
          ))}
        </div>

        {sortedProducts.length === 0 && !isLoading && (
          <div className="text-center py-20">
            <p className="text-xl text-gray-600">
              Aucun produit ne correspond a vos filtres.
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-12">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Precedent
            </button>
            <span className="text-gray-700">
              Page {page} sur {totalPages} ({total} au total)
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Suivant
            </button>
          </div>
        )}
      </div>
    </div>
  )
}


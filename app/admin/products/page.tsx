'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ProductImage from '@/components/common/ProductImage'
import { Edit, Trash2, Plus, Search } from 'lucide-react'
import api from '@/lib/api'
import toast from 'react-hot-toast'

export default function AdminProductsPage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchProducts = useCallback(async (targetPage: number = 1) => {
    try {
      setIsLoading(true)
      const response = await api.get(`/products?page=${targetPage}&limit=30&_t=${Date.now()}`)
      const data = response.data
      
      // Handle both old format (array) and new format (paginated object)
      if (Array.isArray(data)) {
        setProducts(data)
        setTotal(data.length)
        setTotalPages(1)
      } else {
        const nextProducts = data.products || []
        setProducts(nextProducts)
        setTotal(data.total || nextProducts.length || 0)
        setTotalPages(data.totalPages || 1)
        setPage(data.page || targetPage)
      }
    } catch (error: any) {
      console.error('Failed to fetch products:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Echec du chargement des produits'
      toast.error(errorMessage)
      setProducts([])
      setTotal(0)
      setTotalPages(1)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/auth/login')
      return
    }

    fetchProducts(page)

    // Listen for product updates
    const handleProductsUpdate = () => {
      fetchProducts(page)
    }
    
    window.addEventListener('productsUpdated', handleProductsUpdate)
    
    return () => {
      window.removeEventListener('productsUpdated', handleProductsUpdate)
    }
  }, [isAuthenticated, user, router, fetchProducts, page])

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce produit ?')) return

    try {
      await api.delete(`/products/${id}`)
      toast.success('Produit supprime avec succes')
      fetchProducts(page)
    } catch (error) {
      toast.error('Echec de suppression du produit')
    }
  }

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!isAuthenticated || user?.role !== 'admin' || isLoading) {
    return (
      <div className="pt-24 pb-20 min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Chargement...</p>
      </div>
    )
  }

  return (
    <div className="pt-24 pb-20">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-serif font-bold">Gerer les produits</h1>
          <p className="text-gray-600">Total: {total}</p>
          <Link href="/admin/products/new" className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Ajouter un produit
          </Link>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>

        {/* Products Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Image
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prix
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.images?.[0] ? (
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                          <ProductImage
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-lg" />
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                      <div className="text-sm text-gray-500">{product.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                      {product.price?.toLocaleString()} tnd
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.stock || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          product.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {product.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">Aucun produit trouve</p>
            <Link href="/admin/products/new" className="btn-primary">
              Ajouter votre premier produit
            </Link>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              onClick={() => fetchProducts(Math.max(1, page - 1))}
              disabled={page === 1 || isLoading}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Precedent
            </button>
            <span className="text-gray-700">
              Page {page} sur {totalPages}
            </span>
            <button
              onClick={() => fetchProducts(Math.min(totalPages, page + 1))}
              disabled={page === totalPages || isLoading}
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


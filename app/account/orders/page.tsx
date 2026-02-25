'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import { Package, Calendar, DollarSign } from 'lucide-react'
import Link from 'next/link'
import api from '@/lib/api'

export default function OrdersPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [orders, setOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    const fetchOrders = async () => {
      try {
        const response = await api.get('/orders')
        setOrders(response.data)
      } catch (error) {
        console.error('Failed to fetch orders:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [isAuthenticated, router])

  if (!isAuthenticated || isLoading) {
    return (
      <div className="pt-24 pb-20 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-24 pb-20">
      <div className="container-custom max-w-6xl">
        <h1 className="text-4xl font-serif font-bold mb-8">Mes commandes</h1>

        {orders.length === 0 ? (
          <div className="card p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Aucune commande pour le moment</h2>
            <p className="text-gray-600 mb-6">
              Commencez vos achats pour voir vos commandes ici
            </p>
            <Link href="/products" className="btn-primary">
              Voir les produits
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="card p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <Package className="w-5 h-5 text-primary-600" />
                      <div>
                        <h3 className="font-semibold text-lg">
                          Commande #{order.orderNumber}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {order.items?.length || 0} article(s)
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold">Statut: </span>
                        <span
                          className={`capitalize ${
                            order.status === 'delivered'
                              ? 'text-green-600'
                              : order.status === 'cancelled'
                              ? 'text-red-600'
                              : 'text-yellow-600'
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="flex items-center space-x-2 text-primary-600 font-bold text-xl">
                        <DollarSign className="w-5 h-5" />
                        <span>{order.total?.toLocaleString()}</span>
                      </div>
                    </div>
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="btn-outline"
                    >
                      Voir details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


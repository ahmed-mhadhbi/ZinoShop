'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import { Package, ShoppingCart, Users, DollarSign, TrendingUp, Plus } from 'lucide-react'
import Link from 'next/link'
import api from '@/lib/api'

export default function AdminDashboard() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
  })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const formatOrderDate = (value: any) => {
    if (!value) return '-'
    const date = new Date(value)
    return isNaN(date.getTime()) ? '-' : date.toLocaleDateString()
  }

  useEffect(() => {
    console.log('Admin page check - isAuthenticated:', isAuthenticated, 'user:', user, 'role:', user?.role) // Debug log
    
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/admin')
      return
    }
    if (user?.role !== 'admin') {
      console.log('User is not admin, redirecting to login') // Debug log
      router.push('/auth/login?redirect=/admin')
      return
    }

    const fetchData = async () => {
      try {
        // Fetch stats and recent orders
        const [productsRes, ordersRes, usersRes] = await Promise.all([
          api.get('/products'),
          api.get('/orders'),
          api.get('/users'),
        ])

        const orders = ordersRes.data || []
        const totalRevenue = orders.reduce(
          (sum: number, order: any) => sum + (order.total || 0),
          0
        )

        setStats({
          totalProducts: productsRes.data?.length || 0,
          totalOrders: orders.length,
          totalUsers: usersRes.data?.length || 0,
          totalRevenue,
        })

        setRecentOrders(orders.slice(0, 5))
      } catch (error) {
        console.error('Failed to fetch admin data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [isAuthenticated, user, router])

  if (!isAuthenticated || user?.role !== 'admin' || isLoading) {
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
      <div className="container-custom">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-serif font-bold">Tableau de bord admin</h1>
          <Link href="/admin/products/new" className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
            <Plus className="w-5 h-5" />
            Ajouter un produit
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total produits</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.totalProducts}
                </p>
              </div>
              <div className="p-3 bg-primary-100 rounded-lg">
                <Package className="w-8 h-8 text-primary-600" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total commandes</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.totalOrders}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <ShoppingCart className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total utilisateurs</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.totalUsers}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Chiffre d affaires</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.totalRevenue.toLocaleString()} tnd
                </p>
              </div>
              <div className="p-3 bg-gold-100 rounded-lg">
                <DollarSign className="w-8 h-8 text-gold-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="card p-6">
            <h2 className="text-2xl font-semibold mb-4">Actions rapides</h2>
            <div className="space-y-3">
              <Link
                href="/admin/products"
                className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Gerer les produits</span>
                  <Package className="w-5 h-5 text-gray-400" />
                </div>
              </Link>
              <Link
                href="/admin/orders"
                className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Gerer les commandes</span>
                  <ShoppingCart className="w-5 h-5 text-gray-400" />
                </div>
              </Link>
              <Link
                href="/admin/users"
                className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Gerer les utilisateurs</span>
                  <Users className="w-5 h-5 text-gray-400" />
                </div>
              </Link>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-2xl font-semibold mb-4">Commandes recentes</h2>
            {recentOrders.length === 0 ? (
              <p className="text-gray-600">Aucune commande recente</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Commande #{order.orderNumber}</p>
                        <p className="text-sm text-gray-600">
                          {formatOrderDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{order.total?.toLocaleString()} tnd</p>
                        <p
                          className={`text-sm capitalize ${
                            order.status === 'delivered'
                              ? 'text-green-600'
                              : order.status === 'cancelled'
                              ? 'text-red-600'
                              : 'text-yellow-600'
                          }`}
                        >
                          {order.status}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


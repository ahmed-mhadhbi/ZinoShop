'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import { User, Package, Heart, Settings } from 'lucide-react'
import Link from 'next/link'
import api from '@/lib/api'

export default function AccountPage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()
  const [userData, setUserData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    const fetchUserData = async () => {
      try {
        const response = await api.get('/users/me')
        setUserData(response.data)
      } catch (error) {
        console.error('Failed to fetch user data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [isAuthenticated, router])

  if (!isAuthenticated || isLoading) {
    return (
      <div className="pt-24 pb-20 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-24 pb-20">
      <div className="container-custom max-w-6xl">
        <h1 className="text-4xl font-serif font-bold mb-8">My Account</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="card p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-10 h-10 text-primary-600" />
                </div>
                <h3 className="font-semibold">
                  {userData?.firstName} {userData?.lastName}
                </h3>
                <p className="text-sm text-gray-600">{userData?.email}</p>
              </div>

              <nav className="space-y-2">
                <Link
                  href="/account"
                  className="flex items-center space-x-3 p-3 rounded-lg bg-primary-50 text-primary-600 font-semibold"
                >
                  <User className="w-5 h-5" />
                  <span>Profile</span>
                </Link>
                <Link
                  href="/account/orders"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 text-gray-700"
                >
                  <Package className="w-5 h-5" />
                  <span>Orders</span>
                </Link>
                <Link
                  href="/account/wishlist"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 text-gray-700"
                >
                  <Heart className="w-5 h-5" />
                  <span>Wishlist</span>
                </Link>
                <Link
                  href="/account/settings"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 text-gray-700"
                >
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </Link>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">
            <div className="card p-8">
              <h2 className="text-2xl font-semibold mb-6">Profile Information</h2>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={userData?.firstName || ''}
                      className="input-field"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={userData?.lastName || ''}
                      className="input-field"
                      readOnly
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={userData?.email || ''}
                    className="input-field"
                    readOnly
                  />
                </div>

                {userData?.phone && (
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={userData.phone}
                      className="input-field"
                      readOnly
                    />
                  </div>
                )}

                {userData?.address && (
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      value={userData.address}
                      className="input-field"
                      readOnly
                    />
                  </div>
                )}

                <div className="pt-4">
                  <Link href="/account/settings" className="btn-primary">
                    Edit Profile
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


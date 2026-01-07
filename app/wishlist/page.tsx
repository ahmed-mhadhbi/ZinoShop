'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

export default function WishlistRedirectPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/account/wishlist')
    } else {
      router.replace('/auth/login?redirect=/account/wishlist')
    }
  }, [isAuthenticated, router])

  return (
    <div className="pt-24 pb-20 min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Redirecting to wishlist...</p>
      </div>
    </div>
  )
}


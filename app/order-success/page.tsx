'use client'

import Link from 'next/link'
import { CheckCircle, Package, Home } from 'lucide-react'

export default function OrderSuccessPage() {
  return (
    <div className="pt-24 pb-20 min-h-screen flex items-center justify-center">
      <div className="max-w-2xl w-full text-center">
        <div className="card p-12">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>

          <h1 className="text-4xl font-serif font-bold mb-4">
            Order Placed Successfully!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Thank you for your purchase. We've received your order and will
            process it shortly.
          </p>

          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-center space-x-2 text-gray-700 mb-4">
              <Package className="w-5 h-5" />
              <span className="font-semibold">What's Next?</span>
            </div>
            <ul className="text-left space-y-2 text-gray-600">
              <li>• You will receive an order confirmation email shortly</li>
              <li>• We'll notify you when your order ships</li>
              <li>• Track your order in your account</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/account/orders" className="btn-primary">
              View My Orders
            </Link>
            <Link href="/" className="btn-outline">
              <Home className="w-5 h-5 inline mr-2" />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}


'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { CreditCard, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

const checkoutSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  address: z.string().min(5, 'Address is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  paymentMethod: z.enum(['pay_on_delivery']),
  saveInfo: z.boolean().default(false),
})

type CheckoutFormData = z.infer<typeof checkoutSchema>

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getTotal, clearCart } = useCartStore()
  const { isAuthenticated, user } = useAuthStore()
  const [isProcessing, setIsProcessing] = useState(false)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/checkout')
    }
  }, [isAuthenticated, router])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      email: user?.email || '',
      paymentMethod: 'pay_on_delivery',
      saveInfo: false,
    },
  })

  const paymentMethod = watch('paymentMethod')
  const total = getTotal()
  // Shipping fee removed; delivery is free and takes 7 business days
  const shipping: number = 0
  const finalTotal = total

  const onSubmit = async (data: CheckoutFormData) => {
    if (!isAuthenticated) {
      toast.error('Please login to place an order')
      router.push('/auth/login?redirect=/checkout')
      return
    }

    setIsProcessing(true)

    try {
      // Prepare order data
      const orderData = {
        items: items.map(item => ({
          productId: item.id,
          quantity: item.quantity,
        })),
        paymentMethod: data.paymentMethod,
        customerFirstName: data.firstName,
        customerLastName: data.lastName,
        shippingAddress: data.address,
        shippingPhone: data.phone,
        shipping: shipping,
        notes: `Customer Email: ${data.email}`,
      }

      console.log('Submitting order:', orderData)

      // Create order via API
      const response = await api.post('/orders', orderData)
      
      console.log('Order created:', response.data)

      toast.success('Order placed successfully!')
      clearCart()
      router.push('/order-success')
    } catch (error: any) {
      console.error('Checkout error:', error)
      console.error('Error response:', error.response?.data)
      
      if (error.response?.status === 401) {
        toast.error('Please login to place an order')
        router.push('/auth/login?redirect=/checkout')
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message)
      } else {
        toast.error('Failed to place order. Please try again.')
      }
    } finally {
      setIsProcessing(false)
    }
  }

  if (items.length === 0) {
    router.push('/cart')
    return null
  }

  return (
    <div className="pt-24 pb-20">
      <div className="container-custom max-w-5xl">
        <h1 className="text-4xl font-serif font-bold mb-8">Checkout</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Contact Information */}
            <div className="card p-6">
              <h2 className="text-2xl font-semibold mb-6">Contact Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    {...register('email')}
                    className="input-field"
                    placeholder="your@email.com"
                  />
                  {errors.email && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    {...register('phone')}
                    className="input-field"
                    placeholder="+1 (555) 123-4567"
                  />
                  {errors.phone && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.phone.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="card p-6">
              <h2 className="text-2xl font-semibold mb-6">Shipping Address</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    {...register('firstName')}
                    className="input-field"
                  />
                  {errors.firstName && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    {...register('lastName')}
                    className="input-field"
                  />
                  {errors.lastName && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-semibold mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  {...register('address')}
                  className="input-field"
                  placeholder="Street address"
                />
                {errors.address && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.address.message}
                  </p>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div className="card p-6">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <Lock className="w-6 h-6" />
                Payment Method
              </h2>
              <div className="space-y-4">
                <label className="flex items-center p-4 border-2 rounded-lg bg-green-50 cursor-default">
                  <input
                    type="radio"
                    value="pay_on_delivery"
                    {...register('paymentMethod')}
                    className="mr-4"
                    defaultChecked
                  />
                  <span className="font-semibold">Pay on Delivery</span>
                </label>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h2 className="text-2xl font-serif font-bold mb-6">
                Order Summary
              </h2>
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.name} x{item.quantity}
                    </span>
                    <span className="font-semibold">
                      {(item.price * item.quantity).toLocaleString()} tnd
                    </span>
                  </div>
                ))}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">
                      {total.toLocaleString()} tnd
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-semibold">
                      {shipping === 0 ? (
                        <span className="text-green-600">Free</span>
                      ) : (
                        `${shipping.toLocaleString()} tnd`
                      )} 
                    </span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total</span>
                      <span className="text-primary-600">
                        {finalTotal.toLocaleString()} tnd
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={isProcessing}
                className="btn-primary w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Place Order'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}


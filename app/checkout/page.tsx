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

const TUNISIA_COUNTRY_CODE = '+216'
const LOCAL_PHONE_LENGTH = 8

const checkoutSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  firstName: z.string().min(2, 'Le prenom est obligatoire'),
  lastName: z.string().min(2, 'Le nom est obligatoire'),
  address: z.string().min(5, 'L adresse est obligatoire'),
  phone: z
    .string()
    .regex(/^\d{8}$/, 'Numero de telephone invalide (8 chiffres)'),
  paymentMethod: z.enum(['pay_on_delivery']),
  saveInfo: z.boolean().default(false),
})

type CheckoutFormData = z.infer<typeof checkoutSchema>

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getTotal, clearCart } = useCartStore()
  const { isAuthenticated, user } = useAuthStore()
  const [isProcessing, setIsProcessing] = useState(false)
  const normalizeLocalPhone = (value: string) =>
    value.replace(/\D/g, '').slice(0, LOCAL_PHONE_LENGTH)

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
      phone: normalizeLocalPhone((user?.phone || '').replace(/^\+216/, '')),
      paymentMethod: 'pay_on_delivery',
      saveInfo: false,
    },
  })

  const phoneField = register('phone')

  const paymentMethod = watch('paymentMethod')
  const total = getTotal()
  const shipping: number = 8
  const finalTotal = total + shipping

  const onSubmit = async (data: CheckoutFormData) => {
    if (!isAuthenticated) {
      toast.error('Veuillez vous connecter pour passer une commande')
      router.push('/auth/login?redirect=/checkout')
      return
    }

    setIsProcessing(true)

    try {
      const localPhone = normalizeLocalPhone(data.phone)
      // Prepare order data
      const orderData = {
        items: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          ...(item.variant ? { variant: item.variant } : {}),
        })),
        paymentMethod: data.paymentMethod,
        customerFirstName: data.firstName,
        customerLastName: data.lastName,
        shippingAddress: data.address,
        shippingPhone: `${TUNISIA_COUNTRY_CODE}${localPhone}`,
        shipping: shipping,
        notes: `Email client: ${data.email}`,
      }

      console.log('Submitting order:', orderData)

      // Create order via API
      const response = await api.post('/orders', orderData)
      
      console.log('Order created:', response.data)

      toast.success('Commande validee avec succes !')
      clearCart()
      router.push('/order-success')
    } catch (error: any) {
      console.error('Checkout error:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      
      if (error.response?.status === 401) {
        toast.error('Veuillez vous connecter pour passer une commande')
        router.push('/auth/login?redirect=/checkout')
      } else if (error.code === 'ECONNABORTED') {
        toast.error('Le serveur met trop de temps a repondre. Reessayez dans 30 secondes.')
      } else if (error.code === 'ERR_NETWORK') {
        toast.error('Connexion au serveur impossible. Verifiez le backend/CORS puis reessayez.')
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message)
      } else {
        toast.error('Echec de la commande. Veuillez reessayer.')
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
        <h1 className="text-4xl font-serif font-bold mb-8">Paiement</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Contact Information */}
            <div className="card p-6">
              <h2 className="text-2xl font-semibold mb-6">Informations de contact</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Adresse e-mail *
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
                    Numero de telephone *
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 border border-gray-300 border-r-0 rounded-l-lg bg-gray-50 text-gray-700 text-sm font-semibold">
                      {TUNISIA_COUNTRY_CODE}
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      maxLength={LOCAL_PHONE_LENGTH}
                      {...phoneField}
                      onChange={(e) => {
                        e.target.value = normalizeLocalPhone(e.target.value)
                        phoneField.onChange(e)
                      }}
                      className="input-field rounded-l-none border-l-0"
                      placeholder="12345678"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Entrez uniquement les 8 chiffres de votre numero.</p>
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
              <h2 className="text-2xl font-semibold mb-6">Adresse de livraison</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Prenom *
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
                    Nom *
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
                  Adresse *
                </label>
                <input
                  type="text"
                  {...register('address')}
                  className="input-field"
                  placeholder="Adresse complete"
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
                Methode de paiement
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
                  <span className="font-semibold">Paiement a la livraison</span>
                </label>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h2 className="text-2xl font-serif font-bold mb-6">
                Resume de commande
              </h2>
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={`${item.id}-${item.variant || 'sans-variante'}`} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.name}
                      {item.variant ? ` (${item.variant})` : ''} x{item.quantity}
                    </span>
                    <span className="font-semibold">
                      {(item.price * item.quantity).toLocaleString()} tnd
                    </span>
                  </div>
                ))}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sous-total</span>
                    <span className="font-semibold">
                      {total.toLocaleString()} tnd
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Livraison</span>
                    <span className="font-semibold">{shipping.toLocaleString()} tnd</span>
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
                {isProcessing ? 'Traitement...' : 'Confirmer la commande'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}


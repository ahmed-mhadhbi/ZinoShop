'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import toast from 'react-hot-toast'

export default function CartPage() {
  const { items, updateQuantity, removeItem, getTotal, clearCart } =
    useCartStore()

  const handleUpdateQuantity = (id: string, quantity: number, variant?: string) => {
    if (quantity <= 0) {
      removeItem(id, variant)
      toast.success('Article retire du panier')
    } else {
      updateQuantity(id, quantity, variant)
    }
  }

  const handleRemoveItem = (id: string, variant?: string) => {
    removeItem(id, variant)
    toast.success('Article retire du panier')
  }

  const total = getTotal()
  const shipping: number = 8
  const finalTotal = total + shipping

  if (items.length === 0) {
    return (
      <div className="pt-24 pb-20 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-6" />
          <h2 className="text-3xl font-serif font-bold mb-4">
            Votre panier est vide
          </h2>
          <p className="text-gray-600 mb-8">
            Vous n avez encore ajoute aucun article.
          </p>
          <Link href="/products" className="btn-primary">
            Continuer vos achats
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-24 pb-20">
      <div className="container-custom">
        <h1 className="text-4xl font-serif font-bold mb-8">Panier</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, index) => (
              <motion.div
                key={`${item.id}-${item.variant || 'sans-variante'}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card p-6"
              >
                <div className="flex gap-6">
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{item.name}</h3>
                    {item.variant && (
                      <p className="text-sm text-gray-600 mb-1">Variante: {item.variant}</p>
                    )}
                    {item.sku && (
                      <p className="text-sm text-gray-500 mb-4">SKU: {item.sku}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() =>
                            handleUpdateQuantity(item.id, item.quantity - 1, item.variant)
                          }
                          className="p-1 border rounded hover:bg-gray-50"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-lg font-semibold w-12 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            handleUpdateQuantity(item.id, item.quantity + 1, item.variant)
                          }
                          className="p-1 border rounded hover:bg-gray-50"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-xl font-bold text-primary-600">
                          {(item.price * item.quantity).toLocaleString()} tnd
                        </span>
                        <button
                          onClick={() => handleRemoveItem(item.id, item.variant)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            <button
              onClick={() => {
                clearCart()
                toast.success('Panier vide')
              }}
              className="text-red-600 hover:text-red-700 font-semibold"
            >
              Vider le panier
            </button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h2 className="text-2xl font-serif font-bold mb-6">
                Resume de commande
              </h2>
              <div className="space-y-4 mb-6">
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
              <Link
                href="/checkout"
                className="btn-primary w-full text-center block mb-4"
              >
                Passer au paiement
              </Link>
              <Link
                href="/products"
                className="btn-outline w-full text-center block"
              >
                Continuer vos achats
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


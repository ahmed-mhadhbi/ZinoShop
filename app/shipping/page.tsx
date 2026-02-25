'use client'

import { motion } from 'framer-motion'
import { Truck, Clock, Shield, Package } from 'lucide-react'

const shippingOptions = [
  {
    name: 'Livraison standard',
    price: 8,
    time: '7 jours ouvrables',
    icon: Truck,
    condition: 'Frais de livraison fixes sur toutes les commandes',
  },
]

import { redirect } from 'next/navigation'

export default function ShippingPage() {
  return (
    <div className="pt-24 pb-20">
      <div className="container-custom max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
            Informations de livraison
          </h1>
          <p className="text-xl text-gray-600">
            Options de livraison rapides, securisees et fiables
          </p>
        </motion.div>

        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {shippingOptions.map((option, index) => {
              const Icon = option.icon
              return (
                <div key={index} className="card p-6 text-center">
                  <Icon className="w-12 h-12 text-primary-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">{option.name}</h3>
                  <p className="text-2xl font-bold text-primary-600 mb-2">
                    {`${option.price.toLocaleString()} tnd`}
                  </p>
                  <p className="text-gray-600 text-sm mb-2">{option.time}</p>
                  {option.condition && (
                    <p className="text-gray-500 text-xs">{option.condition}</p>
                  )}
                </div>
              )
            })}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-8"
          >
            <h2 className="text-2xl font-serif font-bold mb-6">
              Details de livraison
            </h2>
            <div className="space-y-4 text-gray-700">
              <div className="flex items-start space-x-4">
                <Truck className="w-6 h-6 text-primary-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">Traitement et livraison</h3>
                  <p>
                    Les commandes sont traitees sous 1 jour ouvrable. La livraison prend 7 jours ouvrables.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <Shield className="w-6 h-6 text-primary-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">Emballage securise</h3>
                  <p>
                    Tous les articles sont emballes avec soin pour arriver en
                    parfait etat. Les articles de grande valeur sont expedies
                    avec des mesures de securite supplementaires.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <Package className="w-6 h-6 text-primary-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">Suivi</h3>
                  <p>
                    Vous recevrez un numero de suivi par e-mail des l expedition.
                    Utilisez-le pour suivre votre colis en temps reel.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}


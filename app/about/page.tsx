'use client'

import { motion } from 'framer-motion'

export default function AboutPage() {
  return (
    <div className="pt-24 pb-20">
      <div className="container-custom max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
            A propos de ZinoShop
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="prose prose-lg max-w-none"
        >
          <div className="relative h-96 mb-8 rounded-lg overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
              alt="A propos de ZinoShop"
              className="object-cover w-full h-full"
              style={{ objectFit: 'cover' }}
            />
          </div>

          <div className="space-y-6 text-gray-700">
            <p className="text-xl leading-relaxed">
              Bienvenue chez ZinoShop, ou l elegance rencontre le savoir-faire.
              Nous vous proposons une collection de bijoux de luxe, chaque piece
              etant selectionnee et travaillee avec precision.
            </p>

            <h2 className="text-3xl font-serif font-bold mt-8 mb-4">Notre histoire</h2>
            <p>
              Fonde avec une passion pour la beaute intemporelle, ZinoShop
              selectionne des collections raffinees pour des clients exigeants.
              Le bijou est plus qu un accessoire: c est une expression du style
              personnel et des moments importants.
            </p>

            <h2 className="text-3xl font-serif font-bold mt-8 mb-4">Notre mission</h2>
            <p>
              Notre mission est d offrir des bijoux exceptionnels, qui combinent
              artisanat traditionnel et design moderne. Nous selectionnons les
              meilleurs materiaux et collaborons avec des artisans qualifies.
            </p>

            <h2 className="text-3xl font-serif font-bold mt-8 mb-4">Promesse qualite</h2>
            <p>
              Chaque piece passe un controle qualite strict pour respecter nos
              standards eleves. Nous garantissons chaque produit et nous nous
              engageons pour votre satisfaction complete.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

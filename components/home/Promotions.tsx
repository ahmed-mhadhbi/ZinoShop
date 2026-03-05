'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function Promotions() {
  return (
    <section className="py-20">
      <div className="container-custom">
        <div className="grid grid-cols-2 gap-3 sm:gap-8">

          {/* Promotion 1 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-2xl h-56 sm:h-96 group"
          >
            <div
              className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-700"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1605100804763-247f67b3557e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="relative h-full flex flex-col justify-end p-4 sm:p-8 text-white">
              <h3 className="text-lg sm:text-3xl font-serif font-bold mb-1 sm:mb-2">
                Nouvelle collection
              </h3>
              <p className="text-sm sm:text-lg mb-2 sm:mb-4 text-gray-200">
                Decouvrez nos dernieres creations
              </p>
              <Link
                href="/products"
                className="inline-flex items-center text-sm sm:text-base text-white font-semibold hover:text-gold-300 transition-colors group/link"
              >
                Acheter maintenant
                <ArrowRight className="ml-2 w-5 h-5 group-hover/link:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>

          {/* Promotion 2 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-2xl h-56 sm:h-96 group"
          >
            <div
              className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-700"
              style={{
                backgroundImage: "url('/promotion.webp')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="relative h-full flex flex-col justify-end p-4 sm:p-8 text-white">
              <h3 className="text-lg sm:text-3xl font-serif font-bold mb-1 sm:mb-2">
                Offre speciale
              </h3>
              <p className="text-sm sm:text-lg mb-2 sm:mb-4 text-gray-200">
                Jusqu a 30% de reduction sur une selection
              </p>
              <span className="inline-flex items-center text-sm sm:text-base text-white font-semibold opacity-80 cursor-default">
                Bientot
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}


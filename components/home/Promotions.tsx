'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function Promotions() {
  return (
    <section className="py-20">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Promotion 1 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-2xl h-96 group"
          >
            <div
              className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-700"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1605100804763-247f67b3557e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="relative h-full flex flex-col justify-end p-8 text-white">
              <h3 className="text-3xl font-serif font-bold mb-2">
                New Collection
              </h3>
              <p className="text-lg mb-4 text-gray-200">
                Discover our latest designs
              </p>
              <Link
                href="/products"
                className="inline-flex items-center text-white font-semibold hover:text-gold-300 transition-colors group/link"
              >
                Shop Now
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
            className="relative overflow-hidden rounded-2xl h-96 group"
          >
            <div
              className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-700"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1511396276069-743b2a6e3b8a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="relative h-full flex flex-col justify-end p-8 text-white">
              <h3 className="text-3xl font-serif font-bold mb-2">
                Special Offer
              </h3>
              <p className="text-lg mb-4 text-gray-200">
                Up to 30% off on selected items
              </p>
              <span className="inline-flex items-center text-white font-semibold opacity-80 cursor-default">
                Soon
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}


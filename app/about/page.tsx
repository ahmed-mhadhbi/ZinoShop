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
            About ZinoShop
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
              alt="About ZinoShop"
              className="object-cover w-full h-full"
              style={{ objectFit: 'cover' }}
            />
          </div>

          <div className="space-y-6 text-gray-700">
            <p className="text-xl leading-relaxed">
              Welcome to ZinoShop, where elegance meets craftsmanship. We are
              dedicated to bringing you the finest collection of luxury jewelry,
              each piece carefully selected and crafted with precision.
            </p>

            <h2 className="text-3xl font-serif font-bold mt-8 mb-4">
              Our Story
            </h2>
            <p>
              Founded with a passion for timeless beauty, ZinoShop has been
              curating exquisite jewelry collections for discerning customers
              worldwide. We believe that jewelry is more than an accessory—it's
              a statement of personal style and a celebration of life's special
              moments.
            </p>

            <h2 className="text-3xl font-serif font-bold mt-8 mb-4">
              Our Mission
            </h2>
            <p>
              Our mission is to provide you with exceptional jewelry pieces that
              combine traditional craftsmanship with modern design. We source only
              the finest materials and work with skilled artisans to create
              pieces that will be treasured for generations.
            </p>

            <h2 className="text-3xl font-serif font-bold mt-8 mb-4">
              Quality Promise
            </h2>
            <p>
              Every piece in our collection undergoes rigorous quality
              inspection to ensure it meets our high standards. We stand behind
              every product and are committed to your complete satisfaction.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}


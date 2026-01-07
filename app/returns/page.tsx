'use client'

import { motion } from 'framer-motion'
import { RotateCcw, Clock, CheckCircle, XCircle } from 'lucide-react'

import { redirect } from 'next/navigation'

export default function ReturnsPage() {
  return (
    <div className="pt-24 pb-20">
      <div className="container-custom max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
            Returns & Exchanges
          </h1>
          <p className="text-xl text-gray-600">
            We want you to be completely satisfied with your purchase
          </p>
        </motion.div>

        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-8"
          >
            <div className="flex items-center space-x-4 mb-6">
              <RotateCcw className="w-8 h-8 text-primary-600" />
              <h2 className="text-2xl font-serif font-bold">
                30-Day Return Policy
              </h2>
            </div>
            <p className="text-gray-700 mb-4">
              We offer a 30-day return policy on all items. If you're not
              completely satisfied with your purchase, you can return it for a
              full refund or exchange.
            </p>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Eligible Items</p>
                  <p className="text-gray-600 text-sm">
                    Items must be in original condition with all tags attached
                    and original packaging included.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Non-Returnable Items</p>
                  <p className="text-gray-600 text-sm">
                    Custom or personalized items, items damaged by misuse, and
                    items without original packaging are not eligible for return.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-8"
          >
            <div className="flex items-center space-x-4 mb-6">
              <Clock className="w-8 h-8 text-primary-600" />
              <h2 className="text-2xl font-serif font-bold">
                How to Return
              </h2>
            </div>
            <ol className="space-y-4 text-gray-700">
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold">
                  1
                </span>
                <div>
                  <p className="font-semibold">Contact Us</p>
                  <p className="text-sm">
                    Email us at returns@zinoshop.com or use the contact form to
                    initiate a return.
                  </p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold">
                  2
                </span>
                <div>
                  <p className="font-semibold">Package Your Item</p>
                  <p className="text-sm">
                    Securely package the item in its original packaging with all
                    tags attached.
                  </p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold">
                  3
                </span>
                <div>
                  <p className="font-semibold">Ship It Back</p>
                  <p className="text-sm">
                    We'll provide you with a prepaid return label. Ship the
                    item back to us within 30 days of purchase.
                  </p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold">
                  4
                </span>
                <div>
                  <p className="font-semibold">Receive Refund</p>
                  <p className="text-sm">
                    Once we receive and inspect your return, we'll process your
                    refund within 5-7 business days.
                  </p>
                </div>
              </li>
            </ol>
          </motion.div>
        </div>
      </div>
    </div>
  )
}


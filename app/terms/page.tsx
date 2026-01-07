'use client'

import { motion } from 'framer-motion'
import { FileText } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="pt-24 pb-20">
      <div className="container-custom max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <FileText className="w-16 h-16 text-primary-600 mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
            Terms of Service
          </h1>
          <p className="text-gray-600">Last updated: December 2024</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="prose prose-lg max-w-none space-y-6 text-gray-700"
        >
          <section>
            <h2 className="text-2xl font-serif font-bold mb-4">
              Acceptance of Terms
            </h2>
            <p>
              By accessing and using ZinoShop, you accept and agree to be bound
              by the terms and provision of this agreement. If you do not agree
              to these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold mb-4">
              Use License
            </h2>
            <p>
              Permission is granted to temporarily access the materials on
              ZinoShop's website for personal, non-commercial transitory viewing
              only. This is the grant of a license, not a transfer of title.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold mb-4">
              Product Information
            </h2>
            <p>
              We strive to provide accurate product descriptions and images.
              However, we do not warrant that product descriptions or other
              content on this site is accurate, complete, reliable, current, or
              error-free.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold mb-4">Pricing</h2>
            <p>
              All prices are in TND and are subject to change without notice. We
              reserve the right to modify prices at any time. In the event of a
              pricing error, we reserve the right to cancel the order.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold mb-4">
              Payment Terms
            </h2>
            <p>
              Payment is accepted via Pay on Delivery only. All payments are processed securely.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold mb-4">
              Limitation of Liability
            </h2>
            <p>
              ZinoShop shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages resulting from your
              use or inability to use the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold mb-4">
              Contact Information
            </h2>
            <p>
              If you have any questions about these Terms of Service, please
              contact us at legal@zinoshop.com.
            </p>
          </section>
        </motion.div>
      </div>
    </div>
  )
}


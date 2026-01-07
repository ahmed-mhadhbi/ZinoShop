'use client'

import { motion } from 'framer-motion'
import { Shield } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="pt-24 pb-20">
      <div className="container-custom max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Shield className="w-16 h-16 text-primary-600 mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
            Privacy Policy
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
              Information We Collect
            </h2>
            <p>
              We collect information you provide directly to us, including when
              you create an account, make a purchase, or contact us. This may
              include your name, email address, shipping address, payment
              information, and phone number.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold mb-4">
              How We Use Your Information
            </h2>
            <p>
              We use the information we collect to process your orders, send you
              order confirmations, respond to your inquiries, and improve our
              services. We may also use your information to send you marketing
              communications if you opt-in.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold mb-4">
              Information Sharing
            </h2>
            <p>
              We do not sell your personal information. We may share your
              information with service providers who assist us in operating our
              website and conducting our business, such as payment processors
              and shipping companies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold mb-4">Security</h2>
            <p>
              We implement appropriate security measures to protect your
              personal information. However, no method of transmission over the
              Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold mb-4">
              Your Rights
            </h2>
            <p>
              You have the right to access, update, or delete your personal
              information at any time. You can also opt-out of marketing
              communications by contacting us or using the unsubscribe link in
              our emails.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold mb-4">Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us
              at privacy@zinoshop.com.
            </p>
          </section>
        </motion.div>
      </div>
    </div>
  )
}


'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    question: 'What is your return policy?',
    answer: 'We offer a 30-day return policy on all items. Items must be in their original condition with tags attached. Custom or personalized items are not eligible for return.',
  },
  {
    question: 'How long does shipping take?',
    answer: 'Standard shipping takes 7 business days. Free delivery is available on all orders.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept Pay on Delivery only.',
  },
  {
    question: 'Do you offer international shipping?',
    answer: 'Yes, we ship internationally to most countries. Shipping costs and delivery times vary by location. Please check at checkout for specific rates.',
  },
  {
    question: 'How do I care for my jewelry?',
    answer: 'Store jewelry in a dry place, away from direct sunlight. Clean with a soft cloth and avoid contact with chemicals, perfumes, and lotions. Remove jewelry before swimming or showering.',
  },
  {
    question: 'Can I customize or engrave jewelry?',
    answer: 'Yes, we offer customization and engraving services on select items. Please contact us or check product pages for customization options.',
  },
  {
    question: 'How do I track my order?',
    answer: 'Once your order ships, you will receive a tracking number via email. You can use this number to track your package on the carrier\'s website.',
  },
  {
    question: 'Do you offer gift wrapping?',
    answer: 'Yes, we offer complimentary gift wrapping for all orders. You can add a gift message during checkout.',
  },
]

import { redirect } from 'next/navigation'

export default function FAQPage() {
  redirect('/products')

  return (
    <div className="pt-24 pb-20">
      <div className="container-custom max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600">
            Find answers to common questions about our products and services
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-lg">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    openIndex === index ? 'transform rotate-180' : ''
                  }`}
                />
              </button>
              {openIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-6 pb-6 text-gray-600"
                >
                  {faq.answer}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}


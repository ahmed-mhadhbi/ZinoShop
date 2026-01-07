'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Phone, MapPin, Send } from 'lucide-react'
import toast from 'react-hot-toast'

const contactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(3, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

type ContactFormData = z.infer<typeof contactSchema>

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  })

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true)
    try {
      // In production, this would call your backend API
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success('Message sent successfully! We will get back to you soon.')
      reset()
    } catch (error) {
      toast.error('Failed to send message. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="pt-24 pb-20">
      <div className="container-custom max-w-6xl">
        <h1 className="text-4xl font-serif font-bold mb-4 text-center">
          Contact Us
        </h1>
        <p className="text-xl text-gray-600 text-center mb-12">
          We'd love to hear from you. Send us a message and we'll respond as
          soon as possible.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="space-y-6">
            <div className="card p-6">
              <MapPin className="w-6 h-6 text-primary-600 mb-4" />
              <h3 className="font-semibold mb-2">Address</h3>
              <p className="text-gray-600">
                bouficha,sousse<br />
                
                
              </p>
            </div>

            <div className="card p-6">
              <Phone className="w-6 h-6 text-primary-600 mb-4" />
              <h3 className="font-semibold mb-2">Phone</h3>
              <p className="text-gray-600">+216 23638945</p>
            </div>

            <div className="card p-6">
              <Mail className="w-6 h-6 text-primary-600 mb-4" />
              <h3 className="font-semibold mb-2">Email</h3>
              <p className="text-gray-600">ahmedmha.fd@gmail.com</p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="card p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      {...register('name')}
                      className="input-field"
                      placeholder="Your name"
                    />
                    {errors.name && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      {...register('email')}
                      className="input-field"
                      placeholder="your@email.com"
                    />
                    {errors.email && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    {...register('subject')}
                    className="input-field"
                    placeholder="What's this about?"
                  />
                  {errors.subject && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.subject.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Message *
                  </label>
                  <textarea
                    {...register('message')}
                    className="input-field min-h-[150px] resize-none"
                    placeholder="Your message..."
                  />
                  {errors.message && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.message.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full py-4 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


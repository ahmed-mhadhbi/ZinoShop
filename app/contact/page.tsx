'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Phone, MapPin, Send } from 'lucide-react'
import toast from 'react-hot-toast'

const contactSchema = z.object({
  name: z.string().min(2, 'Le nom est obligatoire'),
  email: z.string().email('Adresse email invalide'),
  subject: z.string().min(3, 'Le sujet est obligatoire'),
  message: z.string().min(10, 'Le message doit contenir au moins 10 caracteres'),
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

  const onSubmit = async () => {
    setIsSubmitting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success('Message envoye avec succes !')
      reset()
    } catch (error) {
      toast.error('Echec de l envoi du message. Veuillez reessayer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="pt-24 pb-20">
      <div className="container-custom max-w-6xl">
        <h1 className="text-4xl font-serif font-bold mb-4 text-center">Contactez-nous</h1>
        <p className="text-xl text-gray-600 text-center mb-12">
          Nous serons ravis de vous aider. Envoyez-nous un message et nous
          repondrons rapidement.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6">
            <div className="card p-6">
              <MapPin className="w-6 h-6 text-primary-600 mb-4" />
              <h3 className="font-semibold mb-2">Adresse</h3>
              <p className="text-gray-600">bouficha,sousse</p>
            </div>

            <div className="card p-6">
              <Phone className="w-6 h-6 text-primary-600 mb-4" />
              <h3 className="font-semibold mb-2">Telephone</h3>
              <p className="text-gray-600">+216 23638945</p>
            </div>

            <div className="card p-6">
              <Mail className="w-6 h-6 text-primary-600 mb-4" />
              <h3 className="font-semibold mb-2">Email</h3>
              <p className="text-gray-600">ahmedmha.fd@gmail.com</p>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="card p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Nom *</label>
                    <input type="text" {...register('name')} className="input-field" placeholder="Votre nom" />
                    {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Email *</label>
                    <input type="email" {...register('email')} className="input-field" placeholder="votre@email.com" />
                    {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Sujet *</label>
                  <input type="text" {...register('subject')} className="input-field" placeholder="Sujet" />
                  {errors.subject && <p className="text-red-600 text-sm mt-1">{errors.subject.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Message *</label>
                  <textarea {...register('message')} className="input-field min-h-[150px] resize-none" placeholder="Votre message..." />
                  {errors.message && <p className="text-red-600 text-sm mt-1">{errors.message.message}</p>}
                </div>

                <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-4 disabled:opacity-50 flex items-center justify-center gap-2">
                  <Send className="w-5 h-5" />
                  {isSubmitting ? 'Envoi...' : 'Envoyer le message'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

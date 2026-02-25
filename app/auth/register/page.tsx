'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import toast from 'react-hot-toast'

const registerSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caracteres'),
  firstName: z.string().min(2, 'Le prenom est obligatoire'),
  lastName: z.string().min(2, 'Le nom est obligatoire'),
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const { login } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    try {
      const response = await api.post('/auth/register', data)
      login(response.data.user, response.data.token)
      toast.success('Compte cree avec succes !')
      router.push('/')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Echec de l inscription')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="pt-24 pb-20 min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full">
        <div className="card p-8">
          <h1 className="text-3xl font-serif font-bold mb-6 text-center">
            Creer un compte
          </h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Prenom
                </label>
                <input
                  type="text"
                  {...register('firstName')}
                  className="input-field"
                  placeholder="John"
                />
                {errors.firstName && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.firstName.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Nom
                </label>
                <input
                  type="text"
                  {...register('lastName')}
                  className="input-field"
                  placeholder="Doe"
                />
                {errors.lastName && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Adresse e-mail
              </label>
              <input
                type="email"
                {...register('email')}
                className="input-field"
                placeholder="your@email.com"
              />
              {errors.email && (
                <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Mot de passe
              </label>
              <input
                type="password"
                {...register('password')}
                className="input-field"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-4 disabled:opacity-50"
            >
              {isLoading ? 'Creation du compte...' : 'Creer le compte'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Vous avez deja un compte ?{' '}
              <Link
                href="/auth/login"
                className="text-primary-600 hover:text-primary-700 font-semibold"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


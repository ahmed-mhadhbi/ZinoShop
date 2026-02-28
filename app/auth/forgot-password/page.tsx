'use client'

import Link from 'next/link'

export default function ForgotPasswordPage() {
  return (
    <div className="pt-24 pb-20 min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full">
        <div className="card p-8 text-center">
          <h1 className="text-3xl font-serif font-bold mb-4">Mot de passe oublie</h1>
          <p className="text-gray-700 mb-6">
            La reinitialisation automatique n est pas encore disponible.
            Contactez le support pour recuperer votre compte.
          </p>
          <Link href="/contact" className="btn-primary inline-block px-6 py-3">
            Contacter le support
          </Link>
        </div>
      </div>
    </div>
  )
}

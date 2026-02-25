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
            Retours et echanges
          </h1>
          <p className="text-xl text-gray-600">
            Nous voulons que vous soyez totalement satisfait de votre achat
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
                Politique de retour sous 30 jours
              </h2>
            </div>
            <p className="text-gray-700 mb-4">
              Nous proposons une politique de retour sous 30 jours sur tous les
              articles. Si vous n etes pas satisfait, vous pouvez retourner
              l article pour remboursement ou echange.
            </p>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Articles eligibles</p>
                  <p className="text-gray-600 text-sm">
                    Les articles doivent etre dans leur etat d origine avec
                    etiquettes et emballage d origine.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Articles non retournables</p>
                  <p className="text-gray-600 text-sm">
                    Les articles personnalises, endommages par mauvaise
                    utilisation, ou sans emballage d origine ne sont pas eligibles.
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
                Comment retourner un article
              </h2>
            </div>
            <ol className="space-y-4 text-gray-700">
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold">
                  1
                </span>
                <div>
                  <p className="font-semibold">Contactez-nous</p>
                  <p className="text-sm">
                    Ecrivez-nous a returns@zinoshop.com ou via le formulaire de
                    contact pour lancer la demande de retour.
                  </p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold">
                  2
                </span>
                <div>
                  <p className="font-semibold">Emballez votre article</p>
                  <p className="text-sm">
                    Emballez l article de facon securisee dans son emballage
                    d origine avec toutes les etiquettes.
                  </p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold">
                  3
                </span>
                <div>
                  <p className="font-semibold">Expediez le retour</p>
                  <p className="text-sm">
                    Nous fournissons une etiquette de retour prepayee.
                    Expediez l article sous 30 jours apres l achat.
                  </p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold">
                  4
                </span>
                <div>
                  <p className="font-semibold">Recevez votre remboursement</p>
                  <p className="text-sm">
                    Apres reception et verification du retour, le remboursement
                    est traite sous 5 a 7 jours ouvrables.
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

